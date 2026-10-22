const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const { memoryUsers } = require('../models/memoryStore');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup (and /api/signup)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (username.trim().length < 2) {
      return res.status(400).json({ message: 'Username must be at least 2 characters long.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Check if email already registered in Mongo
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      // Check if username taken in Mongo
      const existingUsername = await User.findOne({ username: cleanUsername });
      if (existingUsername) {
        return res.status(400).json({ message: 'This username is already taken. Please choose another.' });
      }

      // Create new user in Mongo
      const newUser = new User({
        username: cleanUsername,
        email: cleanEmail,
        password
      });

      await newUser.save();
      const token = generateToken(newUser);

      return res.status(201).json({
        message: 'User created successfully',
        token,
        user: newUser.toSafeObject()
      });
    }

    // Fallback: In-memory store (when MongoDB is not connected in cloud)
    const existingMemEmail = memoryUsers.find(u => u.email === cleanEmail);
    if (existingMemEmail) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const existingMemUsername = memoryUsers.find(u => u.username === cleanUsername);
    if (existingMemUsername) {
      return res.status(400).json({ message: 'This username is already taken. Please choose another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const fallbackId = new mongoose.Types.ObjectId();

    const newMemUser = {
      id: fallbackId,
      _id: fallbackId,
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      vibe: 'Chill Lo-Fi',
      genre: 'Pop / Indie',
      createdAt: new Date()
    };

    memoryUsers.push(newMemUser);
    const token = generateToken(newMemUser);

    const { password: _, ...safeUser } = newMemUser;
    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
});

// POST /api/auth/login (and /api/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let user = null;
    let isMatch = false;

    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        isMatch = await user.comparePassword(password);
      }
    }

    // Fallback to memory store if not found in Mongo or Mongo not connected
    if (!user) {
      const memUser = memoryUsers.find(u => u.email === cleanEmail);
      if (memUser) {
        isMatch = await bcrypt.compare(password, memUser.password);
        if (isMatch) {
          const { password: _, ...safe } = memUser;
          user = { ...safe, toSafeObject: () => safe };
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken(user);
    const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const safeUser = typeof req.user.toSafeObject === 'function' ? req.user.toSafeObject() : req.user;
  res.json({ user: safeUser });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, vibe, genre, avatar } = req.body;
    const user = req.user;

    if (user.save) {
      // Mongoose document
      if (username && username.trim().length >= 2) {
        if (username.trim() !== user.username) {
          const taken = await User.findOne({ username: username.trim(), _id: { $ne: user._id } });
          if (taken) {
            return res.status(400).json({ message: 'This username is already taken.' });
          }
          user.username = username.trim();
        }
      }

      if (vibe !== undefined) user.vibe = vibe.trim();
      if (genre !== undefined) user.genre = genre.trim();
      if (avatar !== undefined) user.avatar = avatar.trim();

      await user.save();
      return res.json({
        message: 'Profile updated successfully',
        user: user.toSafeObject()
      });
    }

    // In-memory update
    const memUser = memoryUsers.find(u => String(u._id) === String(user.id || user._id));
    if (memUser) {
      if (username) memUser.username = username.trim();
      if (vibe) memUser.vibe = vibe.trim();
      if (genre) memUser.genre = genre.trim();
      const { password: _, ...safe } = memUser;
      return res.json({
        message: 'Profile updated successfully',
        user: safe
      });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Google authentication payload missing email.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        user = new User({
          username: username || cleanEmail.split('@')[0],
          email: cleanEmail,
          password: randomPassword
        });
        await user.save();
      }
      return res.json({
        message: 'Google login successful',
        token: generateToken(user),
        user: user.toSafeObject()
      });
    }

    // In-memory fallback
    user = memoryUsers.find(u => u.email === cleanEmail);
    if (!user) {
      user = {
        id: `google-${Date.now()}`,
        _id: `google-${Date.now()}`,
        username: username || cleanEmail.split('@')[0],
        email: cleanEmail,
        vibe: 'Chill Lo-Fi',
        genre: 'Pop / Indie',
        createdAt: new Date()
      };
      memoryUsers.push(user);
    }

    res.json({
      message: 'Google login successful',
      token: generateToken(user),
      user
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Google authentication failed.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    res.json({
      message: 'If that email exists in our system, a password reset link has been dispatched.',
      devResetToken: resetToken
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error processing password reset request.' });
  }
});

module.exports = router;
