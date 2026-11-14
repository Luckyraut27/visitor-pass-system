const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const asyncHandler = require('../utils/asyncHandler');

exports.stats = asyncHandler(async (_req, res) => {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const weekAgo = new Date(start);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [pending, appointmentsToday, activePasses, checkInsToday, inside, daily, byStatus] = await Promise.all([
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ scheduledAt: { $gte: start, $lt: end } }),
    Pass.countDocuments({ status: 'active', validFrom: { $lte: now }, validUntil: { $gte: now } }),
    CheckLog.countDocuments({ action: 'in', at: { $gte: start, $lt: end } }),
    CheckLog.inside(),
    CheckLog.aggregate([
      { $match: { action: 'in', at: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$at', timezone: tz } }, count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  // Fill in days with zero visits
  const map = Object.fromEntries(daily.map((d) => [d._id, d.count]));
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA', { timeZone: tz });
    last7.push({ date: key, count: map[key] || 0 });
  }

  const insideNow = inside.slice(0, 10);
  await CheckLog.populate(insideNow, [
    { path: 'visitor', select: 'name company photo' },
    { path: 'appointment', select: 'host', populate: { path: 'host', select: 'name' } },
  ]);

  res.json({
    pending,
    appointmentsToday,
    activePasses,
    checkInsToday,
    insideCount: inside.length,
    insideNow,
    last7,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
  });
});
