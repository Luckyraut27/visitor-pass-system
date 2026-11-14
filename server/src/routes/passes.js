const router = require('express').Router();
const c = require('../controllers/passController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/mine', c.mine);
router.get('/', authorize('admin', 'security'), c.list);
router.post('/', authorize('admin', 'security'), c.issue);
router.get('/:id', c.get);
router.get('/:id/pdf', c.pdf);
router.patch('/:id/revoke', authorize('admin', 'security'), c.revoke);

module.exports = router;
