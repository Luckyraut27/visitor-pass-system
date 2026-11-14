const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
  pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  action: { type: String, enum: ['in', 'out'], required: true },
  location: { type: String, default: 'Main Gate' }, // multi-location support
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
});

checkLogSchema.index({ at: -1 });
checkLogSchema.index({ pass: 1, at: -1 });

// Latest log per pass where the visitor is still inside
checkLogSchema.statics.inside = async function () {
  const rows = await this.aggregate([
    { $sort: { at: -1 } },
    { $group: { _id: '$pass', last: { $first: '$$ROOT' } } },
    { $match: { 'last.action': 'in' } },
    { $sort: { 'last.at': -1 } },
  ]);
  return rows.map((r) => r.last);
};

module.exports = mongoose.model('CheckLog', checkLogSchema);
