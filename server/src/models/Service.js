const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, enum: ['Cortes & Estilos', 'Barba & Rosto', 'Tratamentos & Rituais'] },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  durationMinutes: { type: Number, required: true, min: 10, max: 360 },
  price: { type: Number, required: true, min: 0, max: 10000 },
  priceNote: { type: String, default: '' },
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
