const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { passport, handleAppleSignIn } = require('../config/passport');
const OtpService = require('../services/otp.services');
const activityLogger = require('../services/activityLogger');

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
          mfaEnabled: true,
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

      // Don't generate a token, just return a success message
      // Log registration
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      activityLogger.logRegister(user.id, email, ip);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please log in.',
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
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      const userAgent = req.headers['user-agent'];

      if (!isPasswordValid) {
        // Log failed login attempt
        activityLogger.logLoginFailed(email, ip, userAgent, 'Invalid password');

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // If MFA is enabled, send OTP and require verification
      if (user.mfaEnabled) {
        // Generate and send OTP
        await OtpService.sendOtp(user.id, user.mfaMethod || 'EMAIL');

        return res.json({
          success: true,
          message: 'OTP sent to your email',
          data: {
            requiresMfa: true,
            userId: user.id,
            mfaMethod: user.mfaMethod || 'EMAIL',
          },
        });
      }

      // Generate JWT token for non-MFA users
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Remove password from response
      // eslint-disable-next-line no-unused-vars
      const { password: _, ...userWithoutPassword } = user;

      // Log successful login (non-MFA)
      activityLogger.logLoginSuccess(user.id, user.email, ip, userAgent);

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
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for MFA login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID from MFA login response
 *               otp:
 *                 type: string
 *                 description: OTP code received via email/SMS
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired OTP
 *       401:
 *         description: User not found
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    const isValid = await OtpService.verifyOtp(userId, otp, 'LOGIN');
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // Log successful MFA verification
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    activityLogger.logMfaVerified(user.id, user.email, ip);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/mfa/enable:
 *   post:
 *     summary: Initiate MFA enable process
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [EMAIL, SMS]
 *                 default: EMAIL
 *     responses:
 *       200:
 *         description: OTP sent for MFA setup
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/enable', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { method = 'EMAIL' } = req.body;

    const otp = await OtpService.createOtp(decoded.userId, 'ENABLE_MFA');
    await OtpService.sendOtpEmail(decoded.email, otp.code);

    res.json({
      success: true,
      message: 'OTP sent for MFA setup',
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
 * /api/auth/mfa/enable/verify:
 *   post:
 *     summary: Verify OTP and enable MFA
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: OTP code received
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 *       400:
 *         description: Invalid OTP
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/enable/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { otp } = req.body;

    const isValid = await OtpService.verifyOtp(
      decoded.userId,
      otp,
      'ENABLE_MFA'
    );
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        mfaEnabled: true,
        mfaMethod: 'EMAIL',
        mfaVerifiedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    console.error('MFA enable verify error:', error);
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
 *     summary: Initiate MFA disable process
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent for MFA disable
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/disable', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const otp = await OtpService.createOtp(decoded.userId, 'DISABLE_MFA');
    await OtpService.sendOtpEmail(decoded.email, otp.code);

    res.json({
      success: true,
      message: 'OTP sent for MFA disable',
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/mfa/disable/verify:
 *   post:
 *     summary: Verify OTP and disable MFA
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: OTP code received
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *       400:
 *         description: Invalid OTP
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/disable/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { otp } = req.body;

    const isValid = await OtpService.verifyOtp(
      decoded.userId,
      otp,
      'DISABLE_MFA'
    );
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        mfaEnabled: false,
        mfaMethod: null,
        mfaVerifiedAt: null,
      },
    });

    res.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    console.error('MFA disable verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        mfaMethod: true,
        mfaVerifiedAt: true,
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
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&provider=google`
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`
      );
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

module.exports = router;
