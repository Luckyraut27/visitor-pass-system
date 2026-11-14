const router = require('express').Router();
const c = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), c.list);

module.exports = router;
