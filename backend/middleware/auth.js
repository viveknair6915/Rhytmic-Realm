const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { memoryUsers } = require('../models/memoryStore');

const JWT_SECRET = process.env.JWT_SECRET || 'rhytmic-realm-secret-key-2026';

const findUserById = async (id) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(id).select('-password');
      if (user) return user;
    } catch (_) {}
  }
  const memUser = memoryUsers.find(u => String(u._id) === String(id) || String(u.id) === String(id));
  if (memUser) {
    const { password, ...safe } = memUser;
    return safe;
  }
  return null;
};

// Middleware for Express REST endpoints
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token: User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token has expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};

// Optional auth (populates req.user if valid token present, otherwise proceeds as guest)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await findUserById(decoded.id);
      if (user) req.user = user;
    }
  } catch (_) {
    // Ignore invalid token for optional auth
  }
  next();
};

// Helper for Socket.IO token verification
const verifySocketToken = async (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    return user || null;
  } catch (_) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  verifySocketToken,
  JWT_SECRET
};
