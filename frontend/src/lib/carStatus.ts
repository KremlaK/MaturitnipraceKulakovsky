// Čisté výpočty pro Přehled auta – bez Reactu, ať jdou snadno ověřit.
// Všechno vychází jen z dat, která aplikace opravdu má (připomínky, záznamy, statistiky).
import type { Reminder, ReminderType } from '../api/reminders';
import type { ServiceRecord } from '../api/service';
import type { FuelRecord } from '../api/fuel';
import { EXPENSE_CATEGORY_LABELS, type Expense } from '../api/expenses';
import type { MonthlyStat } from '../api/stats';

const DAY = 24 * 60 * 60 * 1000;
export const OIL_WARN_KM = 2000;
export const WARN_DAYS = 30;

export const fmtInt = (n: number) => Math.round(n).toLocaleString('cs-CZ');
export const fmtDec = (n: number, digits = 1) =>
  n.toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('cs-CZ');
export const fmtDayMonth = (d: string | Date) => {
  const x = new Date(d);
  return `${x.getDate()}. ${x.getMonth() + 1}.`;
};
export const fmtKc = (n: number) => `${fmtInt(n)} Kč`;

/** Počet kalendářních dní do data (dnes = 0, včera = −1). */
export function daysUntil(date: string, now: Date) {
  const a = new Date(date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / DAY);
}

export function daysLabel(days: number) {
  if (days < 0) return 'Po termínu';
  if (days === 0) return 'Dnes';
  if (days === 1) return 'Zítra';
  if (days < 5) return `Za ${days} dny`;
  return `Za ${days} dní`;
}

function openReminders(reminders: Reminder[], types: ReminderType[]) {
  return reminders
    .filter((r) => !r.completed && types.includes(r.type))
    .sort((a, b) => {
      // nejdřív ta, která přijde dřív (km se porovnávají jen mezi sebou)
      if (a.dueMileage != null && b.dueMileage != null) return a.dueMileage - b.dueMileage;
      if (a.dueDate && b.dueDate) return +new Date(a.dueDate) - +new Date(b.dueDate);
      return a.dueMileage != null ? -1 : 1;
    });
}

function lastService(records: ServiceRecord[], pattern: RegExp) {
  return [...records]
    .filter((r) => pattern.test(`${r.type} ${r.description ?? ''}`))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
}

export type StatusKey = 'oil' | 'fuel' | 'tires' | 'brakes' | 'stk';

export interface StatusItem {
  n: number;
  key: StatusKey;
  label: string;
  value: string;
  sub: string;
  warn: boolean;
}

interface StatusInput {
  mileage: number;
  reminders: Reminder[];
  services: ServiceRecord[];
  fuel: FuelRecord[];
  averageConsumption: number | null;
  now: Date;
}

function reminderStatus(r: Reminder, mileage: number, now: Date, warnKm: number) {
  if (r.dueMileage != null) {
    const left = r.dueMileage - mileage;
    return {
      value: left <= 0 ? 'Po termínu' : `Za ${fmtInt(left)} km`,
      sub: `Při ${fmtInt(r.dueMileage)} km`,
      warn: left <= warnKm,
    };
  }
  if (r.dueDate) {
    const d = daysUntil(r.dueDate, now);
    return { value: daysLabel(d), sub: `Do ${fmtDate(r.dueDate)}`, warn: d <= WARN_DAYS };
  }
  return { value: r.title, sub: 'Bez termínu', warn: false };
}

export function buildStatus({ mileage, reminders, services, fuel, averageConsumption, now }: StatusInput): StatusItem[] {
  const items: StatusItem[] = [];

  // 1 – olej
  const oil = openReminders(reminders, ['VYMENA_OLEJE'])[0];
  if (oil) {
    const s = reminderStatus(oil, mileage, now, OIL_WARN_KM);
    items.push({ n: 1, key: 'oil', label: 'Motorový olej', ...s, sub: oil.dueMileage != null ? `Výměna při ${fmtInt(oil.dueMileage)} km` : s.sub });
  } else {
    const last = lastService(services, /olej/i);
    items.push({
      n: 1, key: 'oil', label: 'Motorový olej', warn: false,
      value: 'Bez připomínky',
      sub: last ? `Naposledy ${fmtDate(last.date)}` : 'Nastav si připomínku výměny',
    });
  }

  // 2 – nádrž a spotřeba
  const lastFuel = [...fuel].sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
  items.push({
    n: 2, key: 'fuel', label: 'Nádrž · spotřeba', warn: false,
    value: averageConsumption != null ? `${fmtDec(averageConsumption)} l / 100 km` : 'Zatím nespočítáno',
    sub: lastFuel
      ? `Naposledy ${fmtDec(lastFuel.liters)} l · ${fmtDayMonth(lastFuel.date)}`
      : 'Spotřeba se spočítá ze 2 tankování do plna',
  });

  // 3 – pneumatiky
  const tireRem = openReminders(reminders, ['VYMENA_PNEUMATIK'])[0];
  const tireSvc = lastService(services, /pneu|přez|prez|kola/i);
  if (tireRem) {
    const s = reminderStatus(tireRem, mileage, now, OIL_WARN_KM);
    items.push({ n: 3, key: 'tires', label: 'Pneumatiky', ...s, sub: tireSvc ? `${s.sub} · naposledy ${fmtDate(tireSvc.date)}` : s.sub });
  } else {
    items.push({
      n: 3, key: 'tires', label: 'Pneumatiky', warn: false,
      value: tireSvc ? tireSvc.type : '—',
      sub: tireSvc ? fmtDate(tireSvc.date) : 'Žádný záznam',
    });
  }

  // 4 – brzdy
  const brake = lastService(services, /brzd/i);
  items.push({
    n: 4, key: 'brakes', label: 'Brzdy', warn: false,
    value: brake ? brake.type : '—',
    sub: brake ? `${fmtDate(brake.date)}${brake.mileage ? ` · ${fmtInt(brake.mileage)} km` : ''}` : 'Žádný záznam',
  });

  // 5 – STK (případně emise)
  const stk = openReminders(reminders, ['STK'])[0] ?? openReminders(reminders, ['EMISE'])[0];
  if (stk?.dueDate) {
    const d = daysUntil(stk.dueDate, now);
    items.push({ n: 5, key: 'stk', label: stk.type === 'STK' ? 'STK' : 'Emise', value: daysLabel(d), sub: `Platí do ${fmtDate(stk.dueDate)}`, warn: d <= WARN_DAYS });
  } else {
    items.push({ n: 5, key: 'stk', label: 'STK', value: '—', sub: 'Nastav si připomínku STK', warn: false });
  }

  return items;
}

/** Rok platnosti STK pro nálepku na SPZ (poslední dvojčíslí), pokud ho známe. */
export function stkStickerYear(reminders: Reminder[]): string | null {
  const stk = openReminders(reminders, ['STK'])[0];
  return stk?.dueDate ? String(new Date(stk.dueDate).getFullYear() % 100).padStart(2, '0') : null;
}

// ---------- tempo jízdy ----------

/** Průměrný nájezd za den z tankování za posledních 120 dní (potřeba aspoň 14 dní dat). */
export function kmPerDay(fuel: FuelRecord[], now: Date): number | null {
  const recent = fuel
    .filter((r) => now.getTime() - +new Date(r.date) <= 120 * DAY)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  if (recent.length < 2) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const days = (+new Date(last.date) - +new Date(first.date)) / DAY;
  const km = last.mileage - first.mileage;
  if (days < 14 || km <= 0) return null;
  return km / days;
}

export function paceLabel(kmLeft: number, perDay: number | null): string | null {
  if (!perDay || kmLeft <= 0) return null;
  const days = kmLeft / perDay;
  if (days < 14) return `zhruba za ${Math.max(1, Math.round(days))} ${Math.round(days) < 5 ? 'dny' : 'dní'}`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `zhruba za ${weeks} ${weeks < 5 ? 'týdny' : 'týdnů'}`;
  const months = Math.round(days / 30);
  return `zhruba za ${months} ${months < 5 ? 'měsíce' : 'měsíců'}`;
}

// ---------- kilometrovník ----------

const SHORT_LABEL: Partial<Record<ReminderType, string>> = {
  VYMENA_OLEJE: 'OLEJ', VYMENA_PNEUMATIK: 'PNEU', STK: 'STK', EMISE: 'EMISE', POJISTENI: 'POJIŠT.',
};

export interface RulerData {
  start: number;
  end: number;
  step: number;
  labelEvery: number;
  now: number;
  past: number[];
  future: { km: number; label: string; warn: boolean }[];
}

export function buildRuler(mileage: number, fuel: FuelRecord[], services: ServiceRecord[], reminders: Reminder[]): RulerData {
  const future = reminders
    .filter((r) => !r.completed && r.dueMileage != null && r.dueMileage > mileage)
    .map((r) => ({
      km: r.dueMileage as number,
      label: SHORT_LABEL[r.type] ?? 'PŘIP.',
      warn: (r.dueMileage as number) - mileage <= OIL_WARN_KM,
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
  const nextDue = future.length ? future[future.length - 1].km : mileage;
  const start = Math.max(0, Math.floor((mileage - 2500) / 1000) * 1000);
  const end = Math.ceil(Math.max(mileage + 3000, nextDue + 1000) / 1000) * 1000;
  const span = end - start;
  const step = [100, 250, 500, 1000, 2000, 2500, 5000, 10000].find((s) => span / s <= 20) ?? 20000;
  const labelEvery = span / step > 12 ? 4 : 2;
  const past = [...new Set([...fuel.map((r) => r.mileage), ...services.map((r) => r.mileage ?? -1)])]
    .filter((km) => km >= start && km < mileage);
  return { start, end, step, labelEvery, now: mileage, past, future };
}

// ---------- náklady ----------

export interface CostSeries {
  months: { key: string; label: string; total: number }[];
  current: number;
  average: number | null;
}

const MONTH_ABBR = ['LED', 'ÚNO', 'BŘE', 'DUB', 'KVĚ', 'ČVN', 'ČVC', 'SRP', 'ZÁŘ', 'ŘÍJ', 'LIS', 'PRO'];

export function buildCosts(stats: MonthlyStat[], now: Date): CostSeries {
  const byKey = new Map(stats.map((m) => [m.month, m.total]));
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: MONTH_ABBR[d.getMonth()], total: byKey.get(key) ?? 0 });
  }
  const previous = months.slice(0, -1).filter((m) => m.total > 0);
  return {
    months,
    current: months[months.length - 1].total,
    average: previous.length ? previous.reduce((s, m) => s + m.total, 0) / previous.length : null,
  };
}

// ---------- poslední záznamy ----------

export type RecordKind = 'fuel' | 'service' | 'expense';

export interface RecentRecord {
  id: string;
  kind: RecordKind;
  date: string;
  place: string | null;
  title: string;
  detail: string | null;
  mileage: number | null;
  amount: number;
}

export function buildRecent(fuel: FuelRecord[], services: ServiceRecord[], expenses: Expense[]): RecentRecord[] {
  const all: RecentRecord[] = [
    ...fuel.map((r) => ({
      id: `f-${r.id}`, kind: 'fuel' as const, date: r.date, place: r.placeName,
      title: `Tankování · ${r.fuelType.toLowerCase()}`,
      detail: `${fmtDec(r.liters)} l · ${fmtDec(r.pricePerLiter, 2)} Kč/l${r.fullTank ? ' · do plna' : ''}`,
      mileage: r.mileage, amount: r.totalPrice,
    })),
    ...services.map((r) => ({
      id: `s-${r.id}`, kind: 'service' as const, date: r.date, place: r.placeName,
      title: `Servis · ${r.type}`, detail: r.description, mileage: r.mileage, amount: r.price ?? 0,
    })),
    ...expenses.map((r) => ({
      id: `e-${r.id}`, kind: 'expense' as const, date: r.date, place: null,
      title: EXPENSE_CATEGORY_LABELS[r.category] ?? r.category, detail: r.description, mileage: null, amount: r.price,
    })),
  ];
  return all.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function sumLastDays(records: RecentRecord[], days: number, now: Date) {
  return records
    .filter((r) => now.getTime() - +new Date(r.date) <= days * DAY)
    .reduce((s, r) => s + r.amount, 0);
}

// ---------- typ karoserie pro výkres ----------

export type BodyType = 'hatch' | 'combi' | 'suv';

const SUV = /kodiaq|karoq|kamiq|enyaq|elroq|yeti|tucson|kona|santa|bayon|duster|bigster|qashqai|juke|x-trail|tiguan|t-roc|t-cross|taigo|touareg|id\.?4|sportage|sorento|niro|stonic|ev6|rav4|c-hr|yaris cross|corolla cross|captur|kadjar|austral|arkana|2008|3008|5008|mokka|grandland|crossland|frontera|kuga|puma|ecosport|x[1-7]\b|q[2-8]\b|gla|glb|glc|gle|xc40|xc60|xc90|cx-[3-9]|vitara|s-cross|jimny|ateca|arona|tarraco|formentor|outlander|asx|forester|outback|tivoli|korando|suv|4x4/i;
const COMBI = /combi|kombi|estate|variant|touring|avant|break|\bsw\b|sports? ?tourer|sportswagon|wagon|caravan|scout|alltrack/i;

export function guessBodyType(model: string): BodyType {
  if (SUV.test(model)) return 'suv';
  if (COMBI.test(model)) return 'combi';
  return 'hatch';
}
