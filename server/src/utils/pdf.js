const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const fmt = (d) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Builds a printable visitor badge (PDF) and resolves with a Buffer.
 * @param {{pass, visitor, host, qr: Buffer}} data
 */
exports.generatePassPdf = ({ pass, visitor, host, qr }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [300, 470], margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header band
    doc.rect(0, 0, 300, 72).fill('#14213d');
    doc.rect(0, 72, 300, 6).fill('#f59e0b');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('VISITOR PASS', 0, 18, { width: 300, align: 'center' });
    doc.font('Helvetica').fontSize(9).text(process.env.ORG_NAME || 'Visitor Management System', 0, 46, { width: 300, align: 'center' });

    // Photo (optional)
    let y = 92;
    if (visitor.photo) {
      const file = path.join(__dirname, '../..', visitor.photo);
      if (fs.existsSync(file)) {
        try {
          doc.image(file, 105, y, { fit: [90, 90], align: 'center' });
          y += 98;
        } catch (_) {
          /* unsupported image - skip */
        }
      }
    }

    doc.fillColor('#14213d').font('Helvetica-Bold').fontSize(17).text(visitor.name, 10, y, { width: 280, align: 'center' });
    y += 24;
    doc.fillColor('#475569').font('Helvetica').fontSize(10);
    if (visitor.company) {
      doc.text(visitor.company, 10, y, { width: 280, align: 'center' });
      y += 15;
    }
    if (host) {
      doc.text(`Host: ${host.name}${host.department ? ' (' + host.department + ')' : ''}`, 10, y, { width: 280, align: 'center' });
      y += 15;
    }
    doc.fontSize(8.5).text(`Valid: ${fmt(pass.validFrom)} - ${fmt(pass.validUntil)}`, 10, y, { width: 280, align: 'center' });

    // QR
    doc.image(qr, 85, 322, { fit: [130, 130] });
    doc.fillColor('#64748b').fontSize(7).text(`ID: ${pass.code}`, 0, 455, { width: 300, align: 'center' });
    doc.end();
  });
