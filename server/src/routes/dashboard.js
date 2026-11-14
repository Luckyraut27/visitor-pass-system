const router = require('express').Router();
const c = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin', 'security'), c.stats);

module.exports = router;
