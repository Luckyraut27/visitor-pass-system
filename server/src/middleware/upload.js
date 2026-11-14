const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dir = path.join(__dirname, '../../uploads');
fs.mkdirSync(dir, { recursive: true });

module.exports = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(null, true);
    cb(new Error('Photo must be a JPG or PNG image'));
  },
});
