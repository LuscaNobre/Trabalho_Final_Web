require('dotenv').config();
const connectDatabase = require('../config/database');
const Service = require('../models/Service');
const Barber = require('../models/Barber');
const User = require('../models/User');

const services = [
  { name: 'Fade de Rua', category: 'Cortes & Estilos', description: 'O clássico corte na tesoura ou máquina com o degradê impecável, finalizado com navalha e pigmentação leve se necessário.', durationMinutes: 45, price: 45, featured: true },
  { name: 'Tag & Cut', category: 'Cortes & Estilos', description: 'O combo completo de corte e barba para renovar o visual da cabeça aos pés.', durationMinutes: 75, price: 75, featured: true },
  { name: 'Corte Clandestino', category: 'Cortes & Estilos', description: 'Manutenção rápida para quem mantém o corte em dia toda semana.', durationMinutes: 25, price: 30 },
  { name: 'Crew Cut', category: 'Cortes & Estilos', description: 'Corte infantil com cuidado e estilo para a nova geração da cultura urbana.', durationMinutes: 40, price: 40 },
  { name: 'Barba de Concreto', category: 'Barba & Rosto', description: 'Modelagem na navalha, toalha quente com essência e óleos hidratantes para alinhar os fios.', durationMinutes: 40, price: 40, featured: true },
  { name: 'Contorno e Piche', category: 'Barba & Rosto', description: 'Acabamento rápido para manter o alinhamento da barba ou do pezinho afiado.', durationMinutes: 15, price: 20 },
  { name: 'Bigode & Estilo', category: 'Barba & Rosto', description: 'Modelagem e aparagem exclusiva para quem ostenta bigode de respeito.', durationMinutes: 20, price: 20 },
  { name: 'Banho de Lata', category: 'Tratamentos & Rituais', description: 'Lavagem profunda com shampoo refrescante, massagem capilar e tônico revitalizante.', durationMinutes: 20, price: 25 },
  { name: 'Máscara Negra', category: 'Tratamentos & Rituais', description: 'Limpeza facial para remoção de cravos e impurezas e controle da oleosidade.', durationMinutes: 30, price: 40 },
  { name: 'Drop of Ink', category: 'Tratamentos & Rituais', description: 'Correção de falhas e realce do contorno com pigmento específico para efeito marcado.', durationMinutes: 30, price: 30 },
  { name: 'Splash Color', category: 'Tratamentos & Rituais', description: 'Luzes e descoloração para platinado, reflexo ou cor fantasia. Valor varia conforme cabelo e técnica.', durationMinutes: 120, price: 120, priceNote: 'A partir de R$ 120', featured: true }
];

const barbers = [
  { name: 'Nox', specialty: 'Fade & degradê', bio: 'Especialista em degradês limpos e acabamento na navalha.' },
  { name: 'Kruz', specialty: 'Barba & visagismo', bio: 'Precisão nos detalhes, desenho de barba e cuidado facial.' },
  { name: 'Luan', specialty: 'Cortes clássicos & infantis', bio: 'Cortes clássicos com atitude urbana para todas as idades.' }
];

async function seed() {
  await connectDatabase();
  for (const item of services) await Service.updateOne({ name: item.name }, { $setOnInsert: item }, { upsert: true });
  for (const item of barbers) await Barber.updateOne({ name: item.name }, { $setOnInsert: item }, { upsert: true });
  const email = process.env.ADMIN_EMAIL || 'admin@street095.com';
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({ name: process.env.ADMIN_NAME || 'Administrador Street 095', email, password: process.env.ADMIN_PASSWORD || 'Street095@2026', role: 'admin' });
    console.log(`Administrador criado: ${email}`);
  } else console.log(`Administrador já existe: ${email}`);
  console.log('Catálogo e equipe de demonstração cadastrados.');
  process.exit(0);
}

seed().catch((error) => { console.error(error); process.exit(1); });
