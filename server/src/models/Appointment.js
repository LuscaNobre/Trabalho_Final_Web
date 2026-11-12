const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  barber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true, index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ['confirmed', 'completed', 'cancelled'], default: 'confirmed' },
  priceAtBooking: { type: Number, required: true },
  customerNote: { type: String, trim: true, maxlength: 300, default: '' }
}, { timestamps: true });

appointmentSchema.index({ barber: 1, startsAt: 1, endsAt: 1, status: 1 });
module.exports = mongoose.model('Appointment', appointmentSchema);
