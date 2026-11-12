const { matchedData } = require('express-validator');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const HttpError = require('../utils/HttpError');

async function list(_req, res) {
  const barbers = await Barber.find({ active: true }).sort({ name: 1 });
  res.json({ barbers });
}
async function listAll(_req, res) {
  const barbers = await Barber.find().sort({ name: 1 });
  res.json({ barbers });
}
async function create(req, res) {
  const barber = await Barber.create(matchedData(req, { locations: ['body'] }));
  res.status(201).json({ message: 'Barbeiro cadastrado.', barber });
}
async function update(req, res) {
  const barber = await Barber.findByIdAndUpdate(req.params.id, matchedData(req, { locations: ['body'] }), { new: true, runValidators: true });
  if (!barber) throw new HttpError(404, 'Barbeiro não encontrado.');
  res.json({ message: 'Barbeiro atualizado.', barber });
}
async function remove(req, res) {
  const barber = await Barber.findById(req.params.id);
  if (!barber) throw new HttpError(404, 'Barbeiro não encontrado.');
  const hasHistory = await Appointment.exists({ barber: barber._id });
  if (hasHistory) {
    barber.active = false;
    await barber.save();
    return res.json({ message: 'Barbeiro desativado: ele tem agendamentos no histórico, então foi mantido para não apagar esses registros.', deleted: false });
  }
  await barber.deleteOne();
  res.json({ message: 'Barbeiro excluído da equipe.', deleted: true });
}

module.exports = { list, listAll, create, update, remove };
