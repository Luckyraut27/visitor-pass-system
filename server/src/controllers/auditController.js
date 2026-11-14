const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (_req, res) => {
  res.json(await AuditLog.find().sort('-at').limit(200).populate('user', 'name role'));
});
