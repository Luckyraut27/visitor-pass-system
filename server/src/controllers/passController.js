const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const { issuePass } = require('../services/passService');
const { qrBuffer, qrDataUrl } = require('../utils/qr');
const { generatePassPdf } = require('../utils/pdf');

const populateFull = (q) =>
  q.populate('visitor').populate({ path: 'appointment', populate: { path: 'host', select: 'name email department' } });

async function canView(user, pass) {
  if (['admin', 'security'].includes(user.role)) return true;
  if (user.role === 'host') return String(pass.appointment.host?._id || pass.appointment.host) === String(user._id);
  return pass.visitor.email === user.email;
}

// Security / Admin: issue a pass for an approved appointment
exports.issue = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.body.appointmentId);
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });
  if (appt.status !== 'approved') return res.status(400).json({ message: 'Only approved appointments can get a pass' });
  const pass = await issuePass(appt, req.user);
  audit(req.user, 'pass.issue', 'Pass', pass._id);
  res.status(201).json(pass);
});

exports.list = asyncHandler(async (req, res) => {
  const items = await populateFull(Pass.find().sort('-createdAt').limit(200));
  res.json(items);
});

exports.mine = asyncHandler(async (req, res) => {
  const visitors = await Visitor.find({ email: req.user.email }).select('_id');
  const passes = await populateFull(Pass.find({ visitor: { $in: visitors.map((v) => v._id) } }).sort('-createdAt'));
  const out = await Promise.all(passes.map(async (p) => ({ ...p.toJSON(), qr: await qrDataUrl(p.code) })));
  res.json(out);
});

exports.get = asyncHandler(async (req, res) => {
  const pass = await populateFull(Pass.findById(req.params.id));
  if (!pass) return res.status(404).json({ message: 'Pass not found' });
  if (!(await canView(req.user, pass))) return res.status(403).json({ message: 'Forbidden' });
  res.json({ ...pass.toJSON(), qr: await qrDataUrl(pass.code) });
});

exports.pdf = asyncHandler(async (req, res) => {
  const pass = await populateFull(Pass.findById(req.params.id));
  if (!pass) return res.status(404).json({ message: 'Pass not found' });
  if (!(await canView(req.user, pass))) return res.status(403).json({ message: 'Forbidden' });
  const buf = await generatePassPdf({ pass, visitor: pass.visitor, host: pass.appointment.host, qr: await qrBuffer(pass.code) });
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="visitor-pass-${pass.code.slice(0, 8)}.pdf"` });
  res.send(buf);
});

exports.revoke = asyncHandler(async (req, res) => {
  const pass = await Pass.findById(req.params.id);
  if (!pass) return res.status(404).json({ message: 'Pass not found' });
  pass.status = 'revoked';
  await pass.save();
  audit(req.user, 'pass.revoke', 'Pass', pass._id);
  res.json(pass);
});
