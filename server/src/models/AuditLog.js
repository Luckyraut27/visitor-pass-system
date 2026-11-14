const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String },
  entityId: { type: String },
  details: { type: String },
  at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
