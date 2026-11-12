const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  specialty: { type: String, trim: true, maxlength: 100, default: 'Cortes & estilos' },
  bio: { type: String, trim: true, maxlength: 400, default: '' },
  avatarUrl: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Barber', barberSchema);
