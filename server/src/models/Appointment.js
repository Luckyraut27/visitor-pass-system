const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    source: { type: String, enum: ['pre-registration', 'invite', 'walk-in'], default: 'pre-registration' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

appointmentSchema.index({ scheduledAt: -1 });
appointmentSchema.index({ host: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
