const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Sign a JWT that expires in 7 days
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id:       user._id,
      name:      user.name,
      email:     user.email,
      dailyGoal: user.dailyGoal,
      token:     generateToken(user._id),
    });
  } catch (error) {
    // Surface Mongoose validation errors cleanly
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Re-select password — it is excluded from queries by default (see User model)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      // Deliberately vague — don't reveal which field is wrong
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id:       user._id,
      name:      user.name,
      email:     user.email,
      dailyGoal: user.dailyGoal,
      token:     generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const { name, dailyGoal, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name.trim();
    if (typeof dailyGoal === 'number' && dailyGoal >= 1) user.dailyGoal = dailyGoal;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, dailyGoal: user.dailyGoal });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = { registerUser, loginUser, updateProfile };
