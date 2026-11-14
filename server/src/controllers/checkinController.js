const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const notify = require('../utils/notify');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const day = (s, end) => new Date(s.length === 10 ? `${s}${end ? 'T23:59:59.999' : 'T00:00:00'}` : s);

const POPULATE = [
  { path: 'visitor', select: 'name email phone company photo' },
  { path: 'by', select: 'name' },
  { path: 'appointment', select: 'host purpose', populate: { path: 'host', select: 'name' } },
];

/** Scan a QR code. Toggles between check-in and check-out automatically. */
exports.scan = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim();
  if (!code) return res.status(400).json({ message: 'Pass code is required' });

  const pass = await Pass.findOne({ code })
    .populate('visitor')
    .populate({ path: 'appointment', populate: { path: 'host', select: 'name email phone' } });
  if (!pass) return res.status(404).json({ message: 'Invalid pass - code not recognised' });

  const last = await CheckLog.findOne({ pass: pass._id }).sort('-at');
  const action = last && last.action === 'in' ? 'out' : 'in';

  // Check-out is always allowed; check-in needs a valid pass
  if (action === 'in') {
    if (pass.state === 'revoked') return res.status(400).json({ message: 'This pass has been revoked' });
    if (pass.state === 'expired') return res.status(400).json({ message: 'This pass has expired' });
    if (pass.state === 'not_started') return res.status(400).json({ message: 'This pass is not valid yet' });
  }

  const log = await CheckLog.create({
    pass: pass._id,
    visitor: pass.visitor._id,
    appointment: pass.appointment._id,
    action,
    location: req.body.location || 'Main Gate',
    by: req.user._id,
  });
  audit(req.user, `visitor.check${action}`, 'Pass', pass._id, pass.visitor.name);
  if (action === 'in') notify.hostCheckIn(pass.appointment.host, pass.visitor, log.at).catch(() => {});

  res.json({
    action,
    at: log.at,
    location: log.location,
    visitor: pass.visitor,
    host: pass.appointment.host ? { name: pass.appointment.host.name } : null,
    purpose: pass.appointment.purpose,
  });
});

async function buildFilter(q) {
  const f = {};
  if (q.action) f.action = q.action;
  if (q.location) f.location = new RegExp(escapeRx(q.location), 'i');
  if (q.from || q.to) {
    f.at = {};
    if (q.from) f.at.$gte = day(q.from, false);
    if (q.to) f.at.$lte = day(q.to, true);
  }
  if (q.q) {
    const rx = new RegExp(escapeRx(q.q), 'i');
    const vs = await Visitor.find({ $or: [{ name: rx }, { email: rx }, { company: rx }, { phone: rx }] }).select('_id');
    f.visitor = { $in: vs.map((v) => v._id) };
  }
  return f;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = await buildFilter(req.query);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const [items, total] = await Promise.all([
    CheckLog.find(filter).sort('-at').skip((page - 1) * limit).limit(limit).populate(POPULATE),
    CheckLog.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const filter = await buildFilter(req.query);
  const logs = await CheckLog.find(filter).sort('-at').limit(10000).populate(POPULATE);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Time', 'Action', 'Visitor', 'Email', 'Phone', 'Company', 'Host', 'Purpose', 'Location', 'Recorded by']];
  logs.forEach((l) =>
    rows.push([
      new Date(l.at).toISOString(),
      l.action === 'in' ? 'Check-in' : 'Check-out',
      l.visitor?.name,
      l.visitor?.email,
      l.visitor?.phone,
      l.visitor?.company,
      l.appointment?.host?.name,
      l.appointment?.purpose,
      l.location,
      l.by?.name,
    ])
  );
  res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="visitor-logs.csv"' });
  res.send(rows.map((r) => r.map(esc).join(',')).join('\n'));
});

exports.inside = asyncHandler(async (_req, res) => {
  const logs = await CheckLog.inside();
  await CheckLog.populate(logs, POPULATE);
  res.json(logs);
});
