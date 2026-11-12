require('dotenv').config();
const app = require('./app');
const http = require('http');
const connectDatabase = require('./config/database');
const { initializeSocket } = require('./config/socket');

if (!process.env.JWT_SECRET) {
  console.error('Configure JWT_SECRET no arquivo server/.env antes de iniciar a API.');
  process.exit(1);
}

const port = Number(process.env.PORT) || 4000;
const server = http.createServer(app);
initializeSocket(server);
connectDatabase().then(() => {
  server.listen(port, () => console.log(`Street 095 API disponível em http://localhost:${port}`));
}).catch((error) => {
  console.error(`Não foi possível iniciar a API: ${error.message}`);
  process.exit(1);
});
