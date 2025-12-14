const session = require('express-session');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
});

module.exports = sessionMiddleware;
