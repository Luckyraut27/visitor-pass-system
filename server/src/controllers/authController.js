const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Public self-registration always creates a "visitor" account.
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' });
  const user = await User.create({ name, email, password, phone, role: 'visitor' });
  res.status(201).json({ token: sign(user), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
  if (!user.active) return res.status(403).json({ message: 'This account has been disabled' });
  res.json({ token: sign(user), user });
});

exports.me = (req, res) => res.json({ user: req.user });
