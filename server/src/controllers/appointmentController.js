const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const Pass = require('../models/Pass');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const notify = require('../utils/notify');
const { issuePass } = require('../services/passService');

async function upsertVisitor(b, file) {
  const email = String(b.email || '').toLowerCase().trim();
  const data = { name: b.name, phone: b.phone, company: b.company };
  if (file) data.photo = `/uploads/${file.filename}`;
  let v = await Visitor.findOne({ email });
  if (v) {
    Object.entries(data).forEach(([k, val]) => val && (v[k] = val));
    await v.save();
  } else {
    v = await Visitor.create({ email, ...data });
  }
  return v;
}

/**
 * Create an appointment.
 *  - visitor  -> pre-registration (status: pending, host must approve)
 *  - host     -> invite           (approved + pass emailed immediately)
 *  - security / admin -> walk-in  (approved + pass issued immediately)
 */
exports.create = asyncHandler(async (req, res) => {
  const u = req.user;
  const b = { ...req.body };
  if (u.role === 'visitor') {
    b.email = u.email;
    b.name = b.name || u.name;
    b.phone = b.phone || u.phone;
  }
  if (!b.email || !b.purpose) return res.status(400).json({ message: 'Visitor email and purpose of visit are required' });

  const hostId = u.role === 'host' ? u._id : b.hostId;
  if (!hostId) return res.status(400).json({ message: 'Please choose a host' });
  const host = await User.findOne({ _id: hostId, role: { $in: ['host', 'admin'] }, active: true });
  if (!host) return res.status(400).json({ message: 'Selected host was not found' });

  const when = b.scheduledAt ? new Date(b.scheduledAt) : new Date();
  if (isNaN(when)) return res.status(400).json({ message: 'Invalid date/time' });

  const visitor = await upsertVisitor(b, req.file);
  const status = u.role === 'visitor' ? 'pending' : 'approved';
  const source = u.role === 'visitor' ? 'pre-registration' : u.role === 'host' ? 'invite' : 'walk-in';

  const appointment = await Appointment.create({
    visitor: visitor._id,
    host: host._id,
    purpose: b.purpose,
    scheduledAt: when,
    status,
    source,
    createdBy: u._id,
  });
  audit(u, `appointment.${source}`, 'Appointment', appointment._id, `${visitor.name} -> ${host.name}`);

  let pass = null;
  if (status === 'approved') pass = await issuePass(appointment, u);
  else notify.hostApprovalRequest(host, visitor, appointment).catch(() => {});

  res.status(201).json({ appointment, pass });
});

exports.list = asyncHandler(async (req, res) => {
  const u = req.user;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) {
    const start = new Date(`${req.query.date}T00:00:00`);
    const end = new Date(`${req.query.date}T23:59:59.999`);
    filter.scheduledAt = { $gte: start, $lte: end };
  }
  if (u.role === 'host') filter.host = u._id;
  if (u.role === 'visitor') {
    const mine = await Visitor.find({ email: u.email }).select('_id');
    filter.$or = [{ createdBy: u._id }, { visitor: { $in: mine.map((v) => v._id) } }];
  }

  const items = await Appointment.find(filter)
    .sort('-scheduledAt')
    .limit(300)
    .populate('visitor', 'name email phone company photo')
    .populate('host', 'name department');

  const passes = await Pass.find({ appointment: { $in: items.map((a) => a._id) } }).sort('createdAt');
  const byAppt = {};
  passes.forEach((p) => (byAppt[p.appointment] = p)); // latest wins
  res.json(items.map((a) => ({ ...a.toJSON(), pass: byAppt[a._id] || null })));
});

exports.setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const u = req.user;
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });

  const isOwnHost = String(appt.host) === String(u._id);
  const canDecide = u.role === 'admin' || (u.role === 'host' && isOwnHost);
  const canCancel = canDecide || u.role === 'security' || (u.role === 'visitor' && String(appt.createdBy) === String(u._id));

  if (['approved', 'rejected'].includes(status)) {
    if (!canDecide) return res.status(403).json({ message: 'Only the host or an admin can approve or reject' });
    if (appt.status !== 'pending') return res.status(400).json({ message: `Appointment is already ${appt.status}` });
  } else if (status === 'cancelled') {
    if (!canCancel) return res.status(403).json({ message: 'You cannot cancel this appointment' });
    if (['rejected', 'cancelled'].includes(appt.status)) return res.status(400).json({ message: `Appointment is already ${appt.status}` });
  } else {
    return res.status(400).json({ message: 'Status must be approved, rejected or cancelled' });
  }

  appt.status = status;
  await appt.save();
  audit(u, `appointment.${status}`, 'Appointment', appt._id);

  const visitor = await Visitor.findById(appt.visitor);
  let pass = null;
  if (status === 'approved') pass = await issuePass(appt, u);
  if (status === 'rejected') notify.visitorRejected(visitor, await User.findById(appt.host), appt).catch(() => {});
  if (status === 'cancelled') await Pass.updateMany({ appointment: appt._id, status: 'active' }, { status: 'revoked' });

  res.json({ appointment: appt, pass });
});
