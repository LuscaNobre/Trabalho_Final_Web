process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'segredo-somente-para-testes';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Service = require('../src/models/Service');
const Barber = require('../src/models/Barber');
const Appointment = require('../src/models/Appointment');

const ids = { customer: '64b000000000000000000001', admin: '64b000000000000000000002', service: '64b000000000000000000003', barber: '64b000000000000000000004' };
const tokenFor = (id, role) => jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
const loginAs = (role) => {
  const id = role === 'admin' ? ids.admin : ids.customer;
  jest.spyOn(User, 'findById').mockResolvedValue({ _id: id, role, active: true });
  return `Bearer ${tokenFor(id, role)}`;
};

afterEach(() => jest.restoreAllMocks());

describe('API pública', () => {
  test('GET /api/health responde 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('rota inexistente responde 404 em JSON', async () => {
    const res = await request(app).get('/api/nao-existe');
    expect(res.status).toBe(404);
  });
});

describe('Autenticação (AuthN)', () => {
  test('cadastro com dados inválidos é barrado pela validação (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'email-invalido', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((item) => item.field)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('e-mail inválido no cadastro devolve mensagem clara', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Maria', email: 'maria@semponto', password: 'SenhaForte123' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'email', message: 'E-mail inválido. Use o formato nome@exemplo.com.' }]);
  });

  test('celular inválido no cadastro é recusado', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Maria', email: 'maria@teste.com', phone: '123', password: 'SenhaForte123' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('phone');
  });

  test('cadastro ignora o campo role e mantém pontos do e-mail', async () => {
    const create = jest.spyOn(User, 'create').mockResolvedValue({ id: ids.customer, name: 'João Silva', email: 'joao.silva@gmail.com', role: 'customer' });
    const res = await request(app).post('/api/auth/register').send({ name: 'João Silva', email: 'Joao.Silva@Gmail.com', password: 'SenhaForte123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ email: 'joao.silva@gmail.com', role: 'customer' }));
  });

  test('login com senha incorreta responde 401 com mensagem clara', async () => {
    const fakeUser = { active: true, comparePassword: jest.fn().mockResolvedValue(false) };
    jest.spyOn(User, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    const res = await request(app).post('/api/auth/login').send({ email: 'cliente@teste.com', password: 'senhaErrada' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('E-mail ou senha incorretos.');
  });

  test('rota protegida sem token responde 401', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
  });

  test('token inválido responde 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token-falso');
    expect(res.status).toBe(401);
  });
});

describe('Controle de acesso (AuthZ)', () => {
  test('cliente não pode ver o dashboard (403)', async () => {
    const res = await request(app).get('/api/appointments/dashboard').set('Authorization', loginAs('customer'));
    expect(res.status).toBe(403);
  });

  test('cliente não pode cadastrar serviço (403)', async () => {
    const res = await request(app).post('/api/services').set('Authorization', loginAs('customer')).send({});
    expect(res.status).toBe(403);
  });

  test('admin com dados inválidos recebe 400', async () => {
    const res = await request(app).post('/api/services').set('Authorization', loginAs('admin')).send({ name: 'X', price: -5 });
    expect(res.status).toBe(400);
  });

  test('admin cadastra serviço (201) e campos extras são descartados', async () => {
    const create = jest.spyOn(Service, 'create').mockImplementation(async (data) => ({ _id: ids.service, ...data }));
    const res = await request(app).post('/api/services').set('Authorization', loginAs('admin')).send({
      name: 'Corte Teste', category: 'Cortes & Estilos', description: 'Serviço criado no teste.', durationMinutes: 30, price: 35, campoExtra: 'hack'
    });
    expect(res.status).toBe(201);
    expect(create.mock.calls[0][0]).not.toHaveProperty('campoExtra');
  });
});

describe('Validação de barbeiros', () => {
  test('aceita foto com caminho /images/ (201)', async () => {
    jest.spyOn(Barber, 'create').mockImplementation(async (data) => ({ _id: ids.barber, ...data }));
    const res = await request(app).post('/api/barbers').set('Authorization', loginAs('admin')).send({ name: 'Nox', avatarUrl: '/images/barbeiro-nox.webp' });
    expect(res.status).toBe(201);
  });

  test('recusa foto inválida com mensagem clara (400)', async () => {
    const res = await request(app).post('/api/barbers').set('Authorization', loginAs('admin')).send({ name: 'Nox', avatarUrl: 'foto.jpg' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch(/Foto inválida/);
  });
});

describe('Agendamentos (rota crítica)', () => {
  const service = { _id: ids.service, durationMinutes: 45, price: 45 };
  const barber = { _id: ids.barber };
  const mockCatalog = () => {
    jest.spyOn(Service, 'findOne').mockResolvedValue(service);
    jest.spyOn(Barber, 'findOne').mockResolvedValue(barber);
  };

  test('recusa horário fora do expediente (400)', async () => {
    const auth = loginAs('customer'); mockCatalog();
    const res = await request(app).post('/api/appointments').set('Authorization', auth)
      .send({ serviceId: ids.service, barberId: ids.barber, startsAt: '2029-12-31T14:00:00.000Z' }); // segunda-feira
    expect(res.status).toBe(400);
  });

  test('recusa horário já ocupado (409)', async () => {
    const auth = loginAs('customer'); mockCatalog();
    jest.spyOn(Appointment, 'exists').mockResolvedValue({ _id: 'ocupado' });
    const res = await request(app).post('/api/appointments').set('Authorization', auth)
      .send({ serviceId: ids.service, barberId: ids.barber, startsAt: '2030-01-01T14:00:00.000Z' }); // terça, 10h em Boa Vista
    expect(res.status).toBe(409);
  });

  test('cria agendamento em horário livre (201)', async () => {
    const auth = loginAs('customer'); mockCatalog();
    jest.spyOn(Appointment, 'exists').mockResolvedValue(null);
    const create = jest.spyOn(Appointment, 'create').mockImplementation(async (data) => ({ id: 'novo', ...data, populate: jest.fn().mockResolvedValue(undefined) }));
    const res = await request(app).post('/api/appointments').set('Authorization', auth)
      .send({ serviceId: ids.service, barberId: ids.barber, startsAt: '2030-01-01T14:00:00.000Z' });
    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ customer: ids.customer, priceAtBooking: 45 }));
  });
});
