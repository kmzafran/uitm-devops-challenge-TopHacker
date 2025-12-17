const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { passport, handleAppleSignIn } = require('../config/passport');

// Security imports (OWASP M5-M6)
const { authLimiter, strictLimiter, otpLimiter, createAccountLimiter } = require('../middleware/rateLimit');
const { blacklistToken } = require('../services/tokenBlacklist');
const { securityLogger } = require('../middleware/apiLogger');
const { auth } = require('../middleware/auth');

// Smart Notification System imports (Module 3)
const suspiciousActivityService = require('../services/suspiciousActivity.service');
const securityAlertService = require('../services/securityAlert.service');

const router = express.Router();

// Initialize Passport
router.use(passport.initialize());

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: User's date of birth (YYYY-MM-DD)
 *         phone:
 *           type: string
 *           description: User's phone number
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 name:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 phone:
 *                   type: string
 *                 role:
 *                   type: string
 *             token:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid date'),
    body('phone').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password, firstName, lastName, dateOfBirth, phone } =
        req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create full name for backward compatibility
      const fullName = `${firstName} ${lastName}`;

      // Create user with USER role
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          name: fullName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone || null,
          role: 'USER',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          dateOfBirth: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });


      // Don't auto-login - require user to go through login flow for MFA
      // This ensures all users go through MFA verification after signup
      res.status(201).json({
        success: true,
        message: 'Account created successfully! Please login to continue.',
        data: {
          user,
          // Note: No token returned - user must login to get one (and verify MFA if enabled)
          requiresLogin: true,
        },
      });
    } catch (error) {
      console.error('User registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        securityLogger.logAuthFailure(req, !user ? 'User not found' : 'Account inactive');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if account is locked
      const otpService = require('../services/otp.service');
      const lockStatus = await otpService.checkAccountLock(user.id);

      if (lockStatus.locked) {
        const remainingMinutes = Math.ceil(
          (lockStatus.lockedUntil - new Date()) / (1000 * 60)
        );
        securityLogger.logAuthFailure(req, `Account locked (${remainingMinutes} min remaining)`);
        return res.status(423).json({
          success: false,
          message: `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`,
          lockedUntil: lockStatus.lockedUntil,
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Record failed attempt
        const attemptResult = await otpService.recordFailedAttempt(user.id);

        // Record failed login in history
        await suspiciousActivityService.recordLoginAttempt({
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          success: false,
          failReason: 'Invalid password',
        });

        if (attemptResult.locked) {
          securityLogger.logAuthFailure(req, 'Account locked after failed attempts');

          // Send account locked alert
          await securityAlertService.alertAccountLocked(user.id, req.ip);

          return res.status(423).json({
            success: false,
            message: 'Too many failed attempts. Account is temporarily locked for 15 minutes.',
          });
        }

        // Check for multiple failures and send alert
        const { hasSuspiciousActivity, alerts } = await suspiciousActivityService.checkSuspiciousPatterns(user.id, req.ip);
        if (hasSuspiciousActivity && alerts.some(a => a.type === 'MULTIPLE_FAILURES')) {
          await securityAlertService.alertMultipleFailures(user.id, attemptResult.attempts, req.ip);
        }

        securityLogger.logAuthFailure(req, `Wrong password (${attemptResult.attemptsRemaining} attempts remaining)`);
        return res.status(401).json({
          success: false,
          message: `Invalid credentials. ${attemptResult.attemptsRemaining} attempt(s) remaining.`,
        });
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // Generate OTP and create session token for MFA flow
        const { otp, expiresAt } = await otpService.createOtp(user.id, 'LOGIN');

        // Create a short-lived session token for MFA verification
        const mfaSessionToken = jwt.sign(
          { userId: user.id, type: 'mfa_pending' },
          process.env.JWT_SECRET,
          { expiresIn: '10m' }
        );

        // Send OTP via email
        const emailService = require('../services/email.service');
        await emailService.sendOtpEmail(user.email, otp, 5);
        console.log(`[MFA] OTP sent to ${user.email}`);

        // Remove password from response
        // eslint-disable-next-line no-unused-vars
        const { password: _, ...userWithoutPassword } = user;

        return res.json({
          success: true,
          message: 'MFA verification required',
          data: {
            mfaRequired: true,
            sessionToken: mfaSessionToken,
            expiresAt,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            },
          },
        });
      }

      // Reset login attempts on successful login
      await otpService.resetLoginAttempts(user.id);

      // Record successful login in history
      await suspiciousActivityService.recordLoginAttempt({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
        failReason: null,
      });

      // Check if this is a new device and send alert
      const { isNewDevice, device } = await suspiciousActivityService.checkDevice(
        user.id,
        req.headers['user-agent'],
        req.ip
      );
      if (isNewDevice && device) {
        await securityAlertService.alertNewDevice(user.id, device, req.ip);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password and sensitive fields from response
      // eslint-disable-next-line no-unused-vars
      const { password: _, mfaSecret: __, ...userWithoutPassword } = user;

      // Log successful login
      securityLogger.logAuthSuccess(req, user.id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Verify MFA OTP and complete login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionToken
 *               - otp
 *             properties:
 *               sessionToken:
 *                 type: string
 *                 description: MFA session token from login
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP code
 *     responses:
 *       200:
 *         description: MFA verification successful
 *       400:
 *         description: Invalid OTP
 *       401:
 *         description: Invalid session token
 */
router.post(
  '/mfa/verify',
  otpLimiter, // Rate limit: 5 attempts per 5 minutes
  [
    body('sessionToken').notEmpty().withMessage('Session token is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionToken, otp } = req.body;
      const otpService = require('../services/otp.service');

      // Verify session token
      let decoded;
      try {
        decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

        if (decoded.type !== 'mfa_pending') {
          return res.status(401).json({
            success: false,
            message: 'Invalid session token type',
          });
        }
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session token. Please login again.',
        });
      }

      // Verify OTP
      const verifyResult = await otpService.verifyOtp(decoded.userId, otp, 'LOGIN');

      if (!verifyResult.success) {
        securityLogger.logMfaEvent(req, 'VERIFY', false, decoded.userId);
        return res.status(400).json({
          success: false,
          message: verifyResult.message,
        });
      }

      // Reset login attempts on successful MFA
      await otpService.resetLoginAttempts(decoded.userId);

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Generate full JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove sensitive fields
      // eslint-disable-next-line no-unused-vars
      const { password: _, mfaSecret: __, ...userWithoutPassword } = user;

      // Record successful login and check for new device
      const deviceInfo = suspiciousActivityService.parseUserAgent(req.headers['user-agent']);
      const deviceCheck = await suspiciousActivityService.checkDevice(user.id, req.headers['user-agent'], req.ip);

      // Record login in history
      await suspiciousActivityService.recordLoginAttempt({
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });

      // Send new device alert if applicable
      if (deviceCheck.isNew) {
        await securityAlertService.alertNewDevice(user.id, {
          ...deviceInfo,
          ipAddress: req.ip,
        });
      }

      // Log successful MFA verification
      securityLogger.logMfaEvent(req, 'VERIFY', true, user.id);
      securityLogger.logAuthSuccess(req, user.id);

      res.json({
        success: true,
        message: 'MFA verification successful',
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('MFA verify error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/mfa/enable:
 *   post:
 *     summary: Enable MFA for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/enable', strictLimiter, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    const otpService = require('../services/otp.service');
    await otpService.enableMfa(decoded.userId);

    res.json({
      success: true,
      message: 'MFA has been enabled for your account. You will need to enter an OTP code on your next login.',
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/mfa/disable:
 *   post:
 *     summary: Disable MFA for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for verification
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/mfa/disable',
  strictLimiter, // Rate limit: 3 requests per minute
  [body('password').notEmpty().withMessage('Password is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      // Verify password before disabling MFA
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const { password } = req.body;
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password',
        });
      }

      const otpService = require('../services/otp.service');
      await otpService.disableMfa(decoded.userId);

      res.json({
        success: true,
        message: 'MFA has been disabled for your account.',
      });
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/mfa/resend:
 *   post:
 *     summary: Resend MFA OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionToken
 *             properties:
 *               sessionToken:
 *                 type: string
 *                 description: MFA session token from login
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       401:
 *         description: Invalid session token
 */
router.post(
  '/mfa/resend',
  strictLimiter, // Rate limit: 3 requests per minute
  [body('sessionToken').notEmpty().withMessage('Session token is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { sessionToken } = req.body;
      const otpService = require('../services/otp.service');

      // Verify session token
      let decoded;
      try {
        decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

        if (decoded.type !== 'mfa_pending') {
          return res.status(401).json({
            success: false,
            message: 'Invalid session token type',
          });
        }
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session token. Please login again.',
        });
      }

      // Get user email for logging
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { email: true },
      });

      // Generate new OTP
      const { otp, expiresAt } = await otpService.createOtp(decoded.userId, 'LOGIN');

      // Send OTP via email
      const emailService = require('../services/email.service');
      if (user?.email) {
        await emailService.sendOtpEmail(user.email, otp, 5);
        console.log(`[MFA] Resent OTP to ${user.email}`);
      }

      res.json({
        success: true,
        message: 'A new OTP has been sent to your email.',
        data: {
          expiresAt,
        },
      });
    } catch (error) {
      console.error('MFA resend error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate token
 *     description: Logs out the user and blacklists the current JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       401:
 *         description: No token provided or invalid token
 */
router.post('/logout', auth, async (req, res) => {
  try {
    const token = req.token;

    if (token) {
      // Decode token to get expiration time
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + (7 * 24 * 60 * 60 * 1000);

      // Blacklist the token
      blacklistToken(token, expiresAt);

      // Log the logout event
      securityLogger.logTokenBlacklisted(req, 'User logout');
    }

    // Update last login timestamp  
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Logged out successfully. Token has been invalidated.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        dateOfBirth: true,
        phone: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
});

/**
 * @swagger
 * /api/auth/check-email:
 *   post:
 *     summary: Check if email exists in the system
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to check
 *     responses:
 *       200:
 *         description: Email check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       description: Whether the email exists in the system
 *                     isActive:
 *                       type: boolean
 *                       description: Whether the account is active (only returned if exists is true)
 *                     role:
 *                       type: string
 *                       description: User role (only returned if exists is true)
 *       400:
 *         description: Bad request - Invalid email format
 */
router.post(
  '/check-email',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      });

      if (!user) {
        return res.json({
          success: true,
          data: {
            exists: false,
          },
        });
      }

      res.json({
        success: true,
        data: {
          exists: true,
          isActive: user.isActive,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Check email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ============= OAuth Routes =============

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth login failed
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        const isMobile = req.query.state === 'mobile' || req.headers['user-agent']?.includes('Android');
        if (isMobile) {
          return res.redirect('rentverseclarity://auth/callback?error=oauth_failed');
        }
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Record login for security dashboard (async - don't wait)
      const suspiciousActivity = require('../services/suspiciousActivity.service');
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || '::1';
      suspiciousActivity.recordLoginAttempt({
        userId: req.user.id,
        ipAddress,
        userAgent,
        success: true,
        loginMethod: 'google',
      }).catch(err => console.error('Failed to record OAuth login:', err));

      // Send login notification email (async - don't wait)
      const emailService = require('../services/email.service');
      const isMobileDevice = userAgent.includes('Android') || userAgent.includes('iPhone');
      emailService.sendOAuthLoginNotification(
        req.user.email,
        'google',
        req.user.name || req.user.firstName,
        { device: isMobileDevice ? 'Mobile App' : 'Web Browser' }
      ).catch(err => console.error('Failed to send login notification email:', err));

      // Check if request is from mobile app
      const isMobile = req.query.state === 'mobile' || req.headers['user-agent']?.includes('Android');

      if (isMobile) {
        // Redirect to mobile app using custom URL scheme
        res.redirect(`rentverseclarity://auth/callback?token=${token}&provider=google`);
      } else {
        // Redirect to web frontend
        res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&provider=google`
        );
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const isMobile = req.query.state === 'mobile' || req.headers['user-agent']?.includes('Android');
      if (isMobile) {
        res.redirect('rentverseclarity://auth/callback?error=oauth_error');
      } else {
        res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`
        );
      }
    }
  }
);

/**
 * @swagger
 * /api/auth/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Facebook OAuth consent screen
 */
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['email'],
  })
);

/**
 * @swagger
 * /api/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth login failed
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&provider=facebook`
      );
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth consent screen
 */
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
  })
);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth login failed
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&provider=github`
      );
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/twitter:
 *   get:
 *     summary: Initiate Twitter OAuth login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Twitter OAuth consent screen
 */
router.get('/twitter', passport.authenticate('twitter'));

/**
 * @swagger
 * /api/auth/twitter/callback:
 *   get:
 *     summary: Twitter OAuth callback
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       401:
 *         description: OAuth login failed
 */
router.get(
  '/twitter/callback',
  passport.authenticate('twitter', { session: false }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&provider=twitter`
      );
    } catch (error) {
      console.error('Twitter OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`
      );
    }
  }
);

/**
 * @swagger
 * /api/auth/apple:
 *   post:
 *     summary: Apple Sign In authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identityToken
 *             properties:
 *               identityToken:
 *                 type: string
 *                 description: Apple ID token from the client
 *               user:
 *                 type: object
 *                 description: User information (only provided on first sign in)
 *                 properties:
 *                   email:
 *                     type: string
 *                   name:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *     responses:
 *       200:
 *         description: Apple Sign In successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid Apple token
 */
router.post('/apple', async (req, res) => {
  try {
    const { identityToken, user: userInfo } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: 'Identity token is required',
      });
    }

    // Handle Apple Sign In
    const user = await handleAppleSignIn(identityToken, userInfo);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Apple Sign In successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Apple Sign In error:', error);
    res.status(401).json({
      success: false,
      message: 'Apple Sign In failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/link:
 *   post:
 *     summary: Link OAuth account to existing user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - providerId
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook, apple, github, twitter]
 *               providerId:
 *                 type: string
 *                 description: ID from the OAuth provider
 *     responses:
 *       200:
 *         description: OAuth account linked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: OAuth account already linked to another user
 */
router.post('/oauth/link', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { provider, providerId } = req.body;

    if (!provider || !providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider and providerId are required',
      });
    }

    if (
      !['google', 'facebook', 'apple', 'github', 'twitter'].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider',
      });
    }

    // Check if OAuth account is already linked to another user
    const fieldName = `${provider}Id`;
    const existingUser = await prisma.user.findFirst({
      where: {
        [fieldName]: providerId,
        id: { not: decoded.userId },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `This ${provider} account is already linked to another user`,
      });
    }

    // Link OAuth account to current user
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { [fieldName]: providerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        googleId: true,
        facebookId: true,
        appleId: true,
        githubId: true,
        twitterId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: `${provider} account linked successfully`,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('OAuth link error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/oauth/unlink:
 *   post:
 *     summary: Unlink OAuth account from user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook, apple, github, twitter]
 *     responses:
 *       200:
 *         description: OAuth account unlinked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/oauth/unlink', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider is required',
      });
    }

    if (
      !['google', 'facebook', 'apple', 'github', 'twitter'].includes(provider)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider',
      });
    }

    // Unlink OAuth account from current user
    const fieldName = `${provider}Id`;
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { [fieldName]: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        googleId: true,
        facebookId: true,
        appleId: true,
        githubId: true,
        twitterId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('OAuth unlink error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      // Get token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Find user with password
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      // Send password changed notification
      await securityAlertService.alertPasswordChanged(decoded.userId, req.ip);
      securityLogger.logPasswordChange(req, decoded.userId);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// =====================================================
// FORGOT PASSWORD ENDPOINTS
// =====================================================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent if email exists
 */
router.post(
  '/forgot-password',
  strictLimiter, // 3 requests per minute
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const { email } = req.body;

      // Always respond with success to prevent email enumeration
      const genericResponse = {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset code.',
      };

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        // Log attempt but return generic response
        console.log(`[FORGOT_PASSWORD] Reset requested for non-existent email: ${email}`);
        return res.json(genericResponse);
      }

      // Check if account is locked
      const otpService = require('../services/otp.service');
      const lockStatus = await otpService.checkAccountLock(user.id);
      if (lockStatus.locked) {
        // Still return generic response but log it
        console.log(`[FORGOT_PASSWORD] Reset requested for locked account: ${email}`);
        return res.json(genericResponse);
      }

      // Generate OTP for password reset
      const { otp, expiresAt } = await otpService.createOtp(user.id, 'PASSWORD_RESET');

      // Send password reset OTP email
      const emailService = require('../services/email.service');
      await emailService.sendPasswordResetOtp(email, otp, 5);

      console.log(`[FORGOT_PASSWORD] OTP sent to ${email}`);

      // Log this security event
      securityLogger.logSecurityEvent(req, 'PASSWORD_RESET_REQUESTED', { email });

      res.json({
        ...genericResponse,
        data: {
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/forgot-password/verify:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, reset token returned
 */
router.post(
  '/forgot-password/verify',
  strictLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: errors.array(),
        });
      }

      const { email, otp } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset code',
        });
      }

      // Verify OTP
      const otpService = require('../services/otp.service');
      const verifyResult = await otpService.verifyOtp(user.id, otp, 'PASSWORD_RESET');

      if (!verifyResult.success) {
        securityLogger.logSecurityEvent(req, 'PASSWORD_RESET_OTP_FAILED', { email });
        return res.status(400).json({
          success: false,
          message: verifyResult.message,
        });
      }

      // Generate short-lived reset token (5 minutes)
      const resetToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          type: 'password_reset',
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      console.log(`[FORGOT_PASSWORD] OTP verified for ${email}`);
      securityLogger.logSecurityEvent(req, 'PASSWORD_RESET_OTP_VERIFIED', { email });

      res.json({
        success: true,
        message: 'Code verified successfully',
        data: {
          resetToken,
          expiresIn: 300, // 5 minutes in seconds
        },
      });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/forgot-password/reset:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/forgot-password/reset',
  strictLimiter,
  [
    body('resetToken').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain a lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: errors.array(),
        });
      }

      const { resetToken, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } catch (jwtError) {
        return res.status(400).json({
          success: false,
          message: 'Reset link has expired. Please request a new one.',
        });
      }

      // Check token type
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token',
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and reset login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Blacklist all existing tokens for this user (security measure)
      const { blacklistToken } = require('../services/tokenBlacklist');
      // Note: In production, you'd want to track and blacklist all user tokens

      // Send password changed confirmation email
      const emailService = require('../services/email.service');
      const userName = user.firstName || user.name || 'User';
      await emailService.sendPasswordChangedEmail(user.email, userName);

      // Create security alert
      await securityAlertService.alertPasswordChanged(user.id, req.ip);

      console.log(`[FORGOT_PASSWORD] Password reset successful for ${user.email}`);
      securityLogger.logPasswordChange(req, user.id);

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

module.exports = router;
