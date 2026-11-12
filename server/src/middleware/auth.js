const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) return res.status(401).json({ message: 'Entre na sua conta para continuar.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return res.status(401).json({ message: 'Sessão inválida ou conta inativa.' });
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Sua sessão expirou. Entre novamente.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Você não tem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
