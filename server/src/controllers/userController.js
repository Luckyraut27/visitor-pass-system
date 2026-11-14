const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

// Any signed-in user can pick a host to visit
exports.hosts = asyncHandler(async (_req, res) => {
  const hosts = await User.find({ role: { $in: ['host', 'admin'] }, active: true }).select('name department').sort('name');
  res.json(hosts);
});

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  res.json(await User.find(filter).sort('-createdAt'));
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  const user = await User.create({ name, email, password, role, phone, department });
  audit(req.user, 'user.create', 'User', user._id, `${user.email} as ${user.role}`);
  res.status(201).json(user);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (String(user._id) === String(req.user._id) && (req.body.active === false || (req.body.role && req.body.role !== 'admin'))) {
    return res.status(400).json({ message: 'You cannot disable or demote your own account' });
  }
  ['name', 'phone', 'department', 'role', 'active'].forEach((k) => {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  });
  if (req.body.password) user.password = req.body.password;
  await user.save();
  audit(req.user, 'user.update', 'User', user._id, Object.keys(req.body).filter((k) => k !== 'password').join(','));
  res.json(user);
});
