const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const User = require('../models/User');
const HttpError = require('../utils/HttpError');
const { dateWindow, isWithinBusinessHours, isBusinessDay, OPEN_MINUTE, CLOSE_MINUTE, BREAK_START, BREAK_END } = require('../utils/schedule');
const { getIO } = require('../config/socket');

const populate = [{ path: 'customer', select: 'name email phone' }, { path: 'barber', select: 'name specialty' }, { path: 'service', select: 'name category durationMinutes price' }];

async function available(req, res) {
  const { barberId, serviceId, date } = req.query;
  const window = dateWindow(date);
  if (!window) throw new HttpError(400, 'Informe uma data válida no formato AAAA-MM-DD.');
  if (!isBusinessDay(window.start)) return res.json({ date, slots: [] });
  const [barber, service] = await Promise.all([Barber.findOne({ _id: barberId, active: true }), Service.findOne({ _id: serviceId, active: true })]);
  if (!barber || !service) throw new HttpError(404, 'Barbeiro ou serviço não encontrado.');
  const existing = await Appointment.find({ barber: barberId, startsAt: { $gte: window.start, $lt: window.end }, status: { $ne: 'cancelled' } }).select('startsAt endsAt');
  const busy = existing.map((item) => [item.startsAt.getTime(), item.endsAt.getTime()]);
  const durationMs = service.durationMinutes * 60 * 1000;
  const slots = [];
  for (let minute = OPEN_MINUTE; minute + service.durationMinutes <= CLOSE_MINUTE; minute += 30) {
    if (minute < BREAK_END && minute + service.durationMinutes > BREAK_START) continue;
    const startsAt = new Date(window.start.getTime() + minute * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + durationMs);
    if (startsAt <= new Date()) continue;
    if (busy.some(([busyStart, busyEnd]) => startsAt.getTime() < busyEnd && endsAt.getTime() > busyStart)) continue;
    slots.push({ startsAt, label: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Boa_Vista', hour: '2-digit', minute: '2-digit' }).format(startsAt) });
  }
  res.json({ date, slots });
}

async function list(req, res) {
  const filter = req.user.role === 'admin' ? {} : { customer: req.user._id };
  if (['confirmed', 'completed', 'cancelled'].includes(req.query.status)) filter.status = req.query.status;
  const appointments = await Appointment.find(filter).populate(populate).sort({ startsAt: 1 });
  res.json({ appointments });
}

async function create(req, res) {
  const { barberId, serviceId, startsAt, customerNote = '' } = req.body;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) throw new HttpError(400, 'Data e horário inválidos.');
  const service = await Service.findOne({ _id: serviceId, active: true });
  const barber = await Barber.findOne({ _id: barberId, active: true });
  if (!service || !barber) throw new HttpError(404, 'Serviço ou barbeiro indisponível.');
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);
  if (!isWithinBusinessHours(start, end)) throw new HttpError(400, 'Escolha um horário dentro do funcionamento: terça a sábado, das 9h às 19h, com intervalo das 12h às 13h.');
  if (start <= new Date()) throw new HttpError(400, 'Escolha um horário futuro.');
  const conflict = await Appointment.exists({ barber: barberId, status: { $ne: 'cancelled' }, startsAt: { $lt: end }, endsAt: { $gt: start } });
  if (conflict) throw new HttpError(409, 'Esse horário acabou de ser reservado. Escolha outro disponível.');
  const appointment = await Appointment.create({ customer: req.user._id, barber: barber._id, service: service._id, startsAt: start, endsAt: end, priceAtBooking: service.price, customerNote });
  await appointment.populate(populate);
  getIO()?.to('admins').emit('appointment:created', { id: appointment.id });
  res.status(201).json({ message: 'Horário reservado! Esperamos você no Estúdio Street 095.', appointment });
}

async function updateStatus(req, res) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new HttpError(404, 'Agendamento não encontrado.');
  if (req.user.role !== 'admin' && String(appointment.customer) !== String(req.user._id)) throw new HttpError(403, 'Você só pode alterar seus próprios agendamentos.');
  const { status } = req.body;
  if (req.user.role !== 'admin' && status !== 'cancelled') throw new HttpError(403, 'Cliente pode apenas cancelar o próprio horário.');
  if (appointment.status === 'cancelled' || appointment.status === 'completed') throw new HttpError(400, 'Este agendamento não pode mais ser alterado.');
  appointment.status = status;
  await appointment.save();
  await appointment.populate(populate);
  getIO()?.to('admins').emit('appointment:updated', { id: appointment.id });
  getIO()?.to(`user:${appointment.customer._id || appointment.customer}`).emit('appointment:updated', { id: appointment.id });
  res.json({ message: 'Agendamento atualizado.', appointment });
}

async function remove(req, res) {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new HttpError(404, 'Agendamento não encontrado.');
  if (req.user.role !== 'admin' && String(appointment.customer) !== String(req.user._id)) throw new HttpError(403, 'Você só pode remover seus próprios agendamentos.');
  appointment.status = 'cancelled';
  await appointment.save();
  getIO()?.to('admins').emit('appointment:updated', { id: appointment.id });
  getIO()?.to(`user:${appointment.customer}`).emit('appointment:updated', { id: appointment.id });
  res.json({ message: 'Agendamento cancelado.' });
}

async function dashboard(_req, res) {
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Boa_Vista', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const localDate = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
  const todayWindow = dateWindow(`${localDate.year}-${localDate.month}-${localDate.day}`);
  const [todayAppointments, upcomingCount, customerCount, completedCount] = await Promise.all([
    Appointment.find({ startsAt: { $gte: todayWindow.start, $lt: todayWindow.end }, status: { $ne: 'cancelled' } }).populate(populate).sort({ startsAt: 1 }),
    Appointment.countDocuments({ startsAt: { $gte: now }, status: 'confirmed' }),
    User.countDocuments({ role: 'customer', active: true }),
    Appointment.countDocuments({ status: 'completed' })
  ]);
  res.json({ stats: { today: todayAppointments.length, upcoming: upcomingCount, customers: customerCount, completed: completedCount }, todayAppointments });
}

module.exports = { available, list, create, updateStatus, remove, dashboard };
