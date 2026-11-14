const QRCode = require('qrcode');

exports.qrBuffer = (text) => QRCode.toBuffer(text, { width: 320, margin: 1, errorCorrectionLevel: 'M' });
exports.qrDataUrl = (text) => QRCode.toDataURL(text, { width: 320, margin: 1, errorCorrectionLevel: 'M' });
