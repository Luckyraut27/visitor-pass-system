const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/hosts', c.hosts);
router.get('/', authorize('admin'), c.list);
router.post('/', authorize('admin'), c.create);
router.patch('/:id', authorize('admin'), c.update);

module.exports = router;
