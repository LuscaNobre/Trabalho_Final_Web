function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Os dados informados são inválidos.', errors: Object.values(error.errors).map((item) => item.message) });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Identificador inválido.' });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'Ocorreu um erro interno. Tente novamente.' : error.message });
}

module.exports = errorHandler;
