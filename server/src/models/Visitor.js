const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    photo: { type: String }, // public path, e.g. /uploads/abc.jpg
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
