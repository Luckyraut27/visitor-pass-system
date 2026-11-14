const router = require('express').Router();
const c = require('../controllers/appointmentController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.list);
router.post('/', upload.single('photo'), c.create);
router.patch('/:id/status', c.setStatus);

module.exports = router;
