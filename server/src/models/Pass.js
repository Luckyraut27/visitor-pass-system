const mongoose = require('mongoose');

const passSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    code: { type: String, required: true, unique: true }, // encoded in the QR code
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// active | expired | not_started | revoked
passSchema.virtual('state').get(function () {
  if (this.status === 'revoked') return 'revoked';
  const now = new Date();
  if (now > this.validUntil) return 'expired';
  if (now < this.validFrom) return 'not_started';
  return 'active';
});

passSchema.set('toJSON', { virtuals: true });
passSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Pass', passSchema);
