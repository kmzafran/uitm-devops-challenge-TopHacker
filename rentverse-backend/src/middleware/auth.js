/**
 * Authentication Middleware
 * JWT verification with token blacklist support (OWASP M5-M6)
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { isBlacklisted } = require('../services/tokenBlacklist');
const { securityLogger } = require('./apiLogger');

/**
 * Authenticate user via JWT token
 * Checks token validity and blacklist status
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      securityLogger.logAuthFailure(req, 'No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Check if token is blacklisted (e.g., after logout)
    if (isBlacklisted(token)) {
      securityLogger.logAuthFailure(req, 'Token blacklisted');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token has been invalidated.',
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        securityLogger.logAuthFailure(req, 'Token expired');
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.',
          code: 'TOKEN_EXPIRED',
        });
      }
      throw jwtError;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      securityLogger.logAuthFailure(req, 'User not found');
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
      });
    }

    if (!user.isActive) {
      securityLogger.logAuthFailure(req, 'User account inactive');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is deactivated.',
      });
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    securityLogger.logAuthFailure(req, `Authentication error: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token.',
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      securityLogger.logSuspiciousActivity(req, 'Unauthorized access attempt', {
        requiredRoles: roles,
        userRole: req.user.role,
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

/**
 * Optional auth middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    // Check blacklist
    if (isBlacklisted(token)) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Token invalid, continue without user
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };
