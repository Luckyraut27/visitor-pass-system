const router = require('express').Router();
const c = require('../controllers/checkinController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'security'));
router.post('/scan', c.scan);
router.get('/inside', c.inside);
router.get('/export', c.exportCsv);
router.get('/', c.list);

module.exports = router;
