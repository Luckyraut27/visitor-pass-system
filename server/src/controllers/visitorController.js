const Visitor = require('../models/Visitor');
const asyncHandler = require('../utils/asyncHandler');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRx(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { company: rx }];
  }
  res.json(await Visitor.find(filter).sort('-createdAt').limit(200));
});

exports.get = asyncHandler(async (req, res) => {
  const v = await Visitor.findById(req.params.id);
  if (!v) return res.status(404).json({ message: 'Visitor not found' });
  res.json(v);
});
