const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/HttpError');

function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function register(req, res) {
  const { name, email, phone, password } = req.body;
  const user = await User.create({ name, email, phone, password, role: 'customer' });
  res.status(201).json({ message: 'Conta criada com sucesso.', token: tokenFor(user), user });
}

async function login(req, res) {
  const user = await User.findOne({ email: String(req.body.email) }).select('+password');
  if (!user || !user.active || !(await user.comparePassword(req.body.password))) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }
  res.json({ message: 'Bem-vindo de volta.', token: tokenFor(user), user });
}

function me(req, res) { res.json({ user: req.user }); }

async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
}

module.exports = { register, login, me, listUsers };
