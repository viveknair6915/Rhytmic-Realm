const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  vibe: {
    type: String,
    default: 'Chill Lo-Fi',
    trim: true,
    maxlength: [50, 'Vibe description is too long']
  },
  genre: {
    type: String,
    default: 'Pop / Indie',
    trim: true,
    maxlength: [50, 'Genre name is too long']
  },
  avatar: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helper to return safe public object
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    _id: this._id,
    username: this.username,
    email: this.email,
    vibe: this.vibe,
    genre: this.genre,
    avatar: this.avatar,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
