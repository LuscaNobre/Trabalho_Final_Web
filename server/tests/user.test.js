const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

describe('Model User', () => {
  test('comparePassword confere a senha com o hash bcrypt', async () => {
    const user = new User({ name: 'Cliente Teste', email: 'cliente@teste.com', password: 'qualquer' });
    user.password = await bcrypt.hash('SenhaForte123', 4);
    expect(user.password).not.toBe('SenhaForte123');
    await expect(user.comparePassword('SenhaForte123')).resolves.toBe(true);
    await expect(user.comparePassword('senhaErrada')).resolves.toBe(false);
  });

  test('toJSON nunca devolve a senha', () => {
    const user = new User({ name: 'Cliente Teste', email: 'cliente@teste.com', password: 'hash' });
    const json = JSON.parse(JSON.stringify(user));
    expect(json.password).toBeUndefined();
    expect(json.role).toBe('customer');
  });
});
