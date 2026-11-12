const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

function initializeSocket(httpServer) {
  const origins = process.env.CLIENT_URL?.split(',').map((url) => url.trim()) || ['http://localhost:5173'];
  io = new Server(httpServer, { cors: { origin: origins, methods: ['GET', 'POST'] } });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Autenticação necessária.'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('_id role active');
      if (!user || !user.active) return next(new Error('Sessão inválida.'));
      socket.data.userId = String(user._id);
      socket.data.role = user.role;
      next();
    } catch (_error) { next(new Error('Sessão inválida.')); }
  });
  io.on('connection', (socket) => {
    if (socket.data.role === 'admin') socket.join('admins');
    socket.join(`user:${socket.data.userId}`);
  });
  return io;
}

function getIO() { return io; }

module.exports = { initializeSocket, getIO };
