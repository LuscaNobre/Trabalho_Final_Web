const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI não configurada.');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB conectado: ${mongoose.connection.name}`);
}

module.exports = connectDatabase;
