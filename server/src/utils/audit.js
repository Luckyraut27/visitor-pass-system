const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit trail entry. Never throws.
module.exports = function audit(user, action, entity, entityId, details) {
  AuditLog.create({
    user: user?._id || user,
    action,
    entity,
    entityId: entityId ? String(entityId) : undefined,
    details,
  }).catch((e) => console.error('Audit failed:', e.message));
};
