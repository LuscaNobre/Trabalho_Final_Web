const { matchedData } = require('express-validator');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const HttpError = require('../utils/HttpError');

async function list(_req, res) {
  const services = await Service.find({ active: true }).sort({ category: 1, name: 1 });
  res.json({ services });
}
async function listAll(_req, res) {
  const services = await Service.find().sort({ category: 1, name: 1 });
  res.json({ services });
}
async function create(req, res) {
  const service = await Service.create(matchedData(req, { locations: ['body'] }));
  res.status(201).json({ message: 'Serviço cadastrado.', service });
}
async function update(req, res) {
  const service = await Service.findByIdAndUpdate(req.params.id, matchedData(req, { locations: ['body'] }), { new: true, runValidators: true });
  if (!service) throw new HttpError(404, 'Serviço não encontrado.');
  res.json({ message: 'Serviço atualizado.', service });
}
async function remove(req, res) {
  const service = await Service.findById(req.params.id);
  if (!service) throw new HttpError(404, 'Serviço não encontrado.');
  const hasHistory = await Appointment.exists({ service: service._id });
  if (hasHistory) {
    service.active = false;
    await service.save();
    return res.json({ message: 'Serviço desativado: ele tem agendamentos no histórico, então foi mantido para não apagar esses registros.', deleted: false });
  }
  await service.deleteOne();
  res.json({ message: 'Serviço excluído do catálogo.', deleted: true });
}

module.exports = { list, listAll, create, update, remove };
