const TIME_ZONE = 'America/Boa_Vista';
const OPEN_MINUTE = 9 * 60;
const CLOSE_MINUTE = 19 * 60;
const BREAK_START = 12 * 60;
const BREAK_END = 13 * 60;

function localParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function dateWindow(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return null;
  const start = new Date(`${day}T00:00:00-04:00`);
  if (Number.isNaN(start.getTime()) || localParts(start).year !== day.slice(0, 4) || localParts(start).month !== day.slice(5, 7) || localParts(start).day !== day.slice(8, 10)) return null;
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function isWithinBusinessHours(start, end) {
  const a = localParts(start);
  const b = localParts(end);
  const weekday = a.weekday;
  const allowed = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(weekday);
  const startMinute = Number(a.hour) * 60 + Number(a.minute);
  const endMinute = Number(b.hour) * 60 + Number(b.minute);
  const sameDay = a.year === b.year && a.month === b.month && a.day === b.day;
  const avoidsBreak = endMinute <= BREAK_START || startMinute >= BREAK_END;
  return allowed && sameDay && startMinute >= OPEN_MINUTE && endMinute <= CLOSE_MINUTE && avoidsBreak && Number(a.minute) % 30 === 0 && Number(a.second || 0) === 0;
}

function isBusinessDay(date) {
  return ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].includes(localParts(date).weekday);
}

module.exports = { TIME_ZONE, dateWindow, isWithinBusinessHours, isBusinessDay, OPEN_MINUTE, CLOSE_MINUTE, BREAK_START, BREAK_END };
