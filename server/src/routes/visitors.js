const router = require('express').Router();
const c = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'security'));
router.get('/', c.list);
router.get('/:id', c.get);

module.exports = router;
