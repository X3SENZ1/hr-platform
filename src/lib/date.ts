export const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export const MONTHS_NOM_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export const MONTHS_SHORT_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function offsetISO(daysFromToday: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return toISODate(d);
}

export function offsetMonthDay(daysFromToday: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export const TODAY_ISO = toISODate(new Date());

export function parseISODate(iso: string): Date | null {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDateFull(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return '—';
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  const s = parseISODate(startIso);
  const e = parseISODate(endIso);
  if (!s || !e) return '—';
  const sStr = `${s.getDate()} ${MONTHS_SHORT_RU[s.getMonth()]}`;
  if (startIso === endIso) return sStr;
  return `${sStr} – ${e.getDate()} ${MONTHS_SHORT_RU[e.getMonth()]}`;
}

export function countCalendarDays(startIso: string, endIso: string): number {
  const s = parseISODate(startIso);
  const e = parseISODate(endIso);
  if (!s || !e || e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

export function pluralize(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

export function getInitials(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatTenure(startIso: string, now = new Date()): string {
  const s = parseISODate(startIso);
  if (!s) return '—';
  const diffDays = Math.max(0, Math.floor((now.getTime() - s.getTime()) / 86_400_000));
  if (diffDays < 30) {
    const d = Math.max(1, diffDays);
    return `${d} ${pluralize(d, ['день', 'дня', 'дней'])}`;
  }
  const months = Math.floor(diffDays / 30.4);
  if (months < 12) return `${months} ${pluralize(months, ['месяц', 'месяца', 'месяцев'])}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return `${years} ${pluralize(years, ['год', 'года', 'лет'])}${rem > 0 ? ` ${rem} мес.` : ''}`;
}
