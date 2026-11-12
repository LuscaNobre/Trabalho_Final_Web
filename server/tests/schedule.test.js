const { dateWindow, isWithinBusinessHours, isBusinessDay } = require('../src/utils/schedule');

const at = (iso) => new Date(iso);
const plusMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

describe('Regras da agenda (utils/schedule)', () => {
  test('dateWindow cria a janela do dia no fuso de Boa Vista (UTC-4)', () => {
    const window = dateWindow('2026-11-17');
    expect(window.start.toISOString()).toBe('2026-11-17T04:00:00.000Z');
    expect(window.end.toISOString()).toBe('2026-11-18T04:00:00.000Z');
  });

  test('dateWindow rejeita datas inválidas', () => {
    expect(dateWindow('2026-02-30')).toBeNull();
    expect(dateWindow('17/11/2026')).toBeNull();
    expect(dateWindow(undefined)).toBeNull();
  });

  test('aceita horário dentro do expediente (terça, 9h, 45 min)', () => {
    const start = at('2026-11-17T09:00:00-04:00');
    expect(isWithinBusinessHours(start, plusMinutes(start, 45))).toBe(true);
  });

  test('recusa horário que invade o intervalo das 12h às 13h', () => {
    const start = at('2026-11-17T11:30:00-04:00');
    expect(isWithinBusinessHours(start, plusMinutes(start, 45))).toBe(false);
  });

  test('recusa horário que termina depois das 19h', () => {
    const start = at('2026-11-17T18:30:00-04:00');
    expect(isWithinBusinessHours(start, plusMinutes(start, 45))).toBe(false);
  });

  test('recusa segunda-feira e horários fora dos blocos de 30 min', () => {
    const monday = at('2026-11-16T10:00:00-04:00');
    const quarter = at('2026-11-17T09:15:00-04:00');
    expect(isWithinBusinessHours(monday, plusMinutes(monday, 30))).toBe(false);
    expect(isWithinBusinessHours(quarter, plusMinutes(quarter, 30))).toBe(false);
  });

  test('isBusinessDay: sábado abre, domingo fecha', () => {
    expect(isBusinessDay(at('2026-11-14T10:00:00-04:00'))).toBe(true);
    expect(isBusinessDay(at('2026-11-15T10:00:00-04:00'))).toBe(false);
  });
});
