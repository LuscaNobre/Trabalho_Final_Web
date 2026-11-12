import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, o Vite repassa /api e /socket.io para a API (porta 4000).
// Assim o navegador fala só com localhost:5173 e não há problema de CORS.
const API_TARGET = 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': API_TARGET,
      '/socket.io': { target: API_TARGET, ws: true }
    }
  }
});
