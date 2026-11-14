const crypto = require('crypto');
const Pass = require('../models/Pass');
const { notifyPassIssued } = require('../utils/notify');

/**
 * Issues (or returns the existing) pass for an approved appointment.
 * A pass is valid for the whole day of the appointment.
 */
exports.issuePass = async (appointment, issuedBy) => {
  const existing = await Pass.findOne({
    appointment: appointment._id,
    status: 'active',
    validUntil: { $gt: new Date() },
  });
  if (existing) return existing;

  const day = new Date(appointment.scheduledAt);
  const validFrom = new Date(day);
  validFrom.setHours(0, 0, 0, 0);
  const validUntil = new Date(day);
  validUntil.setHours(23, 59, 59, 999);

  const pass = await Pass.create({
    appointment: appointment._id,
    visitor: appointment.visitor,
    code: crypto.randomBytes(12).toString('hex'),
    validFrom,
    validUntil,
    issuedBy: issuedBy?._id,
  });

  // Send email/SMS in background; failures never block the API
  Pass.findById(pass._id)
    .populate('visitor')
    .populate({ path: 'appointment', populate: { path: 'host', select: 'name email phone department' } })
    .then(notifyPassIssued)
    .catch((e) => console.error('Pass notification failed:', e.message));

  return pass;
};
