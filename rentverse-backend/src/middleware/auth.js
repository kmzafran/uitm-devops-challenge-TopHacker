/**
 * Authentication & Authorization Middleware
 * 
 * JWT-based authentication with enhanced security features.
 * OWASP M6 - Insecure Authorization
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with additional options
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // Only allow HS256 algorithm
        complete: true, // Return decoded payload and header
      });
    } catch (jwtError) {
      // Log failed authentication attempts
      console.warn('[AUTH] Token verification failed:', {
        error: jwtError.name,
        message: jwtError.message,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });

      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Access denied. Token has expired.',
          expiredAt: jwtError.expiredAt,
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Access denied. Invalid token.',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'AUTH_ERROR',
        message: 'Access denied. Authentication failed.',
      });
    }

    const payload = decoded.payload;

    // Validate required token claims
    if (!payload.userId || !payload.email) {
      console.warn('[AUTH] Token missing required claims:', {
        hasUserId: !!payload.userId,
        hasEmail: !!payload.email,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN_CLAIMS',
        message: 'Access denied. Token is malformed.',
      });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      console.warn('[AUTH] User not found for token:', {
        userId: payload.userId,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Access denied. User not found.',
      });
    }

    if (!user.isActive) {
      console.warn('[AUTH] Inactive user attempted access:', {
        userId: user.id,
        email: user.email,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        error: 'USER_INACTIVE',
        message: 'Access denied. Account is deactivated.',
      });
    }

    // Attach user and token info to request
    req.user = user;
    req.tokenPayload = payload;

    next();
  } catch (error) {
    console.error('[AUTH] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'An error occurred during authentication.',
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Checks if user has required role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Access denied. User not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      console.warn('[AUTH] Insufficient permissions:', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        timestamp: new Date().toISOString(),
      });

      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        complete: true,
      });

      const payload = decoded.payload;

      if (payload.userId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });

        if (user && user.isActive) {
          req.user = user;
          req.tokenPayload = payload;
        }
      }
    } catch (jwtError) {
      // Token is invalid, but since auth is optional, just continue
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] Optional auth token invalid:', jwtError.message);
      }
    }

    next();
  } catch (error) {
    // Continue without user on any error
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };

