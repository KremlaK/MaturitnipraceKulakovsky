import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCar, type Car } from '../api/cars';
import { getServiceRecords, type ServiceRecord } from '../api/service';
import { getFuelRecords, getFuelStats, type FuelRecord, type FuelStats } from '../api/fuel';
import { getExpenses, type Expense } from '../api/expenses';
import { getCarStats, type CarStats } from '../api/stats';
import { getReminders, type Reminder } from '../api/reminders';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import CarDrawing from '../components/CarDrawing';
import LicensePlate from '../components/LicensePlate';
import OdometerRuler from '../components/OdometerRuler';
import CostChart from '../components/CostChart';
import AddFuelModal from '../components/AddFuelModal';
import AddServiceModal from '../components/AddServiceModal';
import AddExpenseModal from '../components/AddExpenseModal';
import AddReminderModal from '../components/AddReminderModal';
import EditCarModal from '../components/EditCarModal';
import {
  buildCosts, buildExpenseSummary, buildRecent, buildRuler, buildStatus, drawingBodyType, fmtDate, fmtDayMonth,
  fmtDec, fmtInt, fmtKc, kmPerDay, paceLabel, stkStickerYear, sumLastDays,
} from '../lib/carStatus';

const ROLE_LABELS: Record<string, string> = { MAJITEL: 'Majitel', SPOLUMAJITEL: 'Spolumajitel', SERVIS: 'Servis' };

interface CarData {
  car: Car;
  services: ServiceRecord[];
  fuel: FuelRecord[];
  fuelStats: FuelStats | null;
  expenses: Expense[];
  stats: CarStats | null;
  reminders: Reminder[];
}

type Modal = 'fuel' | 'service' | 'expense' | 'reminder' | 'edit' | null;

export default function CarOverviewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<CarData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [modal, setModal] = useState<Modal>(() => ((location.state as { openFuel?: boolean } | null)?.openFuel ? 'fuel' : null));
  const [hero, setHero] = useState<'photo' | 'drawing' | null>(null);
  const [now] = useState(() => new Date());

  const load = useCallback((carId: string) =>
    Promise.all([
      getCar(carId), getServiceRecords(carId), getFuelRecords(carId), getFuelStats(carId).catch(() => null),
      getExpenses(carId), getCarStats(carId).catch(() => null), getReminders(carId),
    ]).then(([car, services, fuel, fuelStats, expenses, stats, reminders]) => {
      setData({ car, services, fuel, fuelStats, expenses, stats, reminders });
    }).catch(() => setNotFound(true)),
  []);

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  function closeModal() {
    setModal(null);
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }

  const refresh = () => id && load(id);

  const view = useMemo(() => {
    if (!data) return null;
    const mileage = data.car.mileage ?? 0;
    const status = buildStatus({
      mileage, reminders: data.reminders, services: data.services, fuel: data.fuel,
      averageConsumption: data.fuelStats?.averageConsumption ?? null, now,
    });
    const ruler = buildRuler(mileage, data.fuel, data.services, data.reminders);
    const recent = buildRecent(data.fuel, data.services, data.expenses);
    const nextKm = ruler.future[0];
    return {
      status, ruler, recent, nextKm,
      costs: buildCosts(data.stats?.monthlyStats ?? [], now),
      summary: buildExpenseSummary(data.fuel, data.services, data.expenses),
      warnCount: status.filter((s) => s.warn).length,
      pace: nextKm ? paceLabel(nextKm.km - mileage, kmPerDay(data.fuel, now)) : null,
      last30: sumLastDays(recent, 30, now),
      stkYear: stkStickerYear(data.reminders),
      bodyType: drawingBodyType(data.car),
    };
  }, [data, now]);

  if (notFound) {
    return (
      <AppShell>
        <div className="px-4 md:px-7 py-10">
          <p className="text-ink">Tohle auto jsme nenašli nebo k němu nemáš přístup.</p>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 mt-3 underline underline-offset-2"><Icon name="arrowLeft" size={16} /> Zpět do garáže</Link>
        </div>
      </AppShell>
    );
  }

  if (!data || !view || data.car.id !== id) {
    return <AppShell><p className="px-4 md:px-7 py-10 text-ink-muted">Načítám…</p></AppShell>;
  }

  const { car } = data;
  const isOwner = car.isOwner !== false;
  const hasPhoto = !!car.photoUrl;
  const showPhoto = hasPhoto && (hero ?? 'photo') === 'photo';
  const mileage = car.mileage ?? 0;

  return (
    <AppShell onFuel={() => setModal('fuel')}>
      {/* Hlavička vozu */}
      <section className="px-4 md:px-7 pt-4 md:pt-6 pb-3 md:pb-5">
        <Link to="/dashboard" className="text-ink-muted hover:text-ink text-sm inline-flex items-center gap-1.5 mb-3">
          <Icon name="arrowLeft" size={16} /> Garáž
        </Link>
        <div className="flex items-center gap-3 md:gap-5 flex-wrap">
          {car.licensePlate && <LicensePlate plate={car.licensePlate} stkYear={view.stkYear} />}
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl md:text-[32px] leading-none tracking-wide">{car.make} {car.model}</h1>
            <p className="text-ink-muted text-sm mt-1.5">
              {[car.year && `Rok ${car.year}`, car.vin && `VIN ${car.vin}`].filter(Boolean).join(' · ') || 'Doplň rok a VIN přes Upravit'}
            </p>
          </div>
          <div className="md:ml-auto flex gap-2">
            <Link to={`/cars/${car.id}/kniha`} className="h-10 px-3 rounded-lg border border-panel-border bg-panel hover:border-ink-muted text-sm inline-flex items-center gap-1.5">
              <Icon name="file" size={16} /> Kniha údržby
            </Link>
            {isOwner && (
              <button onClick={() => setModal('edit')} className="h-10 px-3 rounded-lg border border-panel-border bg-panel hover:border-ink-muted text-sm inline-flex items-center gap-1.5">
                <Icon name="edit" size={16} /> Upravit
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 md:gap-5 px-4 md:px-7 pb-8">
        {/* Výkres nebo fotka + stav */}
        <Panel
          title={showPhoto ? `Obr. 1 — Fotografie ${car.photoView === 'SIDE' ? 'z boku' : 'zepředu'}` : 'Obr. 1 — Bokorys a stav vozu'}
          aside={hasPhoto ? (
            <span role="group" aria-label="Zobrazení" className="inline-flex border border-panel-border rounded overflow-hidden normal-case tracking-normal font-sans text-xs">
              {(['photo', 'drawing'] as const).map((h) => (
                <button key={h} onClick={() => setHero(h)} aria-pressed={(hero ?? 'photo') === h}
                  className={`px-2.5 py-1 ${(hero ?? 'photo') === h ? 'bg-ink text-panel' : 'text-ink-muted hover:text-ink'}`}>
                  {h === 'photo' ? 'Fotka' : 'Výkres'}
                </button>
              ))}
            </span>
          ) : view.warnCount ? `${view.warnCount} ${view.warnCount === 1 ? 'položka vyžaduje' : 'položky vyžadují'} pozornost` : 'vše v pořádku'}
        >
          {showPhoto ? (
            <figure className="m-3.5 border border-panel-border rounded bg-asphalt-light">
              <img src={car.photoUrl!} alt={`${car.make} ${car.model}`} className="w-full max-h-[380px] object-contain" />
            </figure>
          ) : (
            <div className="px-3.5 pt-2">
              <CarDrawing bodyType={view.bodyType} items={view.status} label={`Výkres vozu ${car.make} ${car.model} s očíslovanými místy`} />
            </div>
          )}
          <ol className="grid grid-cols-1 md:grid-cols-3 border-t border-panel-border">
            {view.status.map((s) => (
              <li key={s.key} className={`grid grid-cols-[26px_1fr] gap-x-2.5 gap-y-1 px-[18px] py-3.5 border-b border-panel-border md:border-r md:[&:nth-child(3n)]:border-r-0 ${s.warn ? 'bg-accent-soft' : ''}`}>
                <span className={`w-6 h-6 rounded-full border-[1.4px] grid place-items-center font-mono-gauge text-xs font-semibold ${s.warn ? 'bg-accent border-accent text-on-accent' : 'border-ink'}`}>{s.n}</span>
                <span className={`label-caps text-[13px] ${s.warn ? 'text-accent' : 'text-ink-muted'}`}>{s.label}</span>
                <span className={`col-start-2 font-display font-semibold text-[21px] leading-tight tnum ${s.warn ? 'text-accent' : ''}`}>{s.value}</span>
                <span className="col-start-2 text-ink-muted text-[13px] tnum">{s.sub}</span>
              </li>
            ))}
            <li className="hidden md:flex items-center px-[18px] py-3.5 border-b border-panel-border text-ink-muted">
              <span>Chybí tu něco?{' '}
                <button onClick={() => setModal('reminder')} className="text-ink font-semibold underline underline-offset-2">+ Připomínka</button>
              </span>
            </li>
          </ol>
          <dl className="grid grid-cols-2 md:grid-cols-4 text-[13px]">
            {[
              ['Tachometr', `${fmtInt(mileage)} km`],
              ['Poslední záznam', view.recent[0] ? fmtDate(view.recent[0].date) : '—'],
              ['Záznamů celkem', fmtInt(view.recent.length)],
              ['Přístup', ROLE_LABELS[car.myRole ?? (isOwner ? 'MAJITEL' : '')] ?? '—'],
            ].map(([k, v], i) => (
              <div key={k} className={`px-[18px] py-2.5 border-panel-border ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} md:last:border-r-0`}>
                <dt className="label-caps text-[11px] text-ink-muted">{k}</dt>
                <dd className="font-mono-gauge text-sm">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <div className="flex flex-col gap-4 md:gap-5 min-w-0">
          {/* Rychlé zápisy – na mobilu je Tankovat ve spodní liště */}
          <div className="hidden md:grid grid-cols-[1.6fr_1fr_1fr] gap-2.5">
            <button onClick={() => setModal('fuel')} className="h-14 rounded-lg bg-accent text-on-accent label-caps text-[21px] font-bold flex items-center justify-center gap-2.5">
              <Icon name="fuel" size={22} strokeWidth={2} /> Tankovat
            </button>
            <button onClick={() => setModal('service')} className="h-14 rounded-lg border-[1.5px] border-ink bg-panel label-caps text-lg font-bold flex items-center justify-center gap-2">
              <Icon name="wrench" strokeWidth={2} /> Servis
            </button>
            <button onClick={() => setModal('expense')} className="h-14 rounded-lg border-[1.5px] border-ink bg-panel label-caps text-lg font-bold flex items-center justify-center gap-2">
              <Icon name="receipt" strokeWidth={2} /> Výdaj
            </button>
          </div>
          <div className="grid md:hidden grid-cols-2 gap-2.5">
            <button onClick={() => setModal('service')} className="h-12 rounded-lg border-[1.5px] border-ink bg-panel label-caps text-base font-bold flex items-center justify-center gap-2">
              <Icon name="wrench" strokeWidth={2} /> Servis
            </button>
            <button onClick={() => setModal('expense')} className="h-12 rounded-lg border-[1.5px] border-ink bg-panel label-caps text-base font-bold flex items-center justify-center gap-2">
              <Icon name="receipt" strokeWidth={2} /> Výdaj
            </button>
          </div>

          <Panel title="Kilometrovník" aside="historie a plán">
            <div className="px-[18px] pt-3.5 pb-4">
              <div className="flex justify-between items-baseline gap-3 mb-1.5">
                <b className="font-mono-gauge text-[28px] font-semibold">{fmtInt(mileage)} km</b>
                {view.recent[0] && <span className="text-ink-muted text-[13px]">stav k {fmtDate(view.recent[0].date)}</span>}
              </div>
              <OdometerRuler data={view.ruler} />
              <p className="mt-2 text-[13px] text-ink-muted tnum">
                {view.nextKm ? (
                  <>Do {view.nextKm.label === 'OLEJ' ? 'výměny oleje' : 'další připomínky'} zbývá{' '}
                    <b className={view.nextKm.warn ? 'text-accent' : 'text-ink'}>{fmtInt(view.nextKm.km - mileage)} km</b>
                    {view.pace && <> — při tvém tempu {view.pace}</>}.</>
                ) : (
                  <>Žádná připomínka podle kilometrů.{' '}
                    <button onClick={() => setModal('reminder')} className="text-ink font-semibold underline underline-offset-2">Přidat</button></>
                )}
              </p>
            </div>
          </Panel>

          <Panel title="Náklady" aside="posledních 6 měsíců">
            <div className="px-[18px] pt-3.5 pb-4">
              <div className="flex justify-between items-baseline gap-3 flex-wrap">
                <span className="font-mono-gauge text-[28px] font-semibold">{fmtKc(view.costs.current)}</span>
                <span className="text-ink-muted text-[13px] tnum">
                  {now.toLocaleDateString('cs-CZ', { month: 'long' })} zatím
                  {view.costs.average != null && <> · průměr {fmtKc(view.costs.average)} / měsíc</>}
                </span>
              </div>
              <CostChart series={view.costs} />
            </div>
          </Panel>

          <Panel title="Výdaje celkem" aside={view.summary.since ? `od ${fmtDate(view.summary.since)}` : undefined}>
            <div className="px-[18px] pt-3.5 pb-4">
              {view.summary.total === 0 ? (
                <p className="text-ink-muted text-sm">Zatím žádné výdaje. Až zapíšeš tankování nebo servis, uvidíš tu, kam peníze jdou.</p>
              ) : (
                <>
                  <div className="flex justify-between items-baseline gap-3 flex-wrap">
                    <span className="font-mono-gauge text-[28px] font-semibold">{fmtKc(view.summary.total)}</span>
                    {view.summary.perKm != null && <span className="text-ink-muted text-[13px] tnum">{fmtDec(view.summary.perKm, 2)} Kč na ujetý km</span>}
                  </div>
                  {/* Podíly jako jeden pruh – nejvýraznější je největší položka */}
                  <div className="flex h-3 rounded-sm overflow-hidden mt-3 border border-panel-border" aria-hidden="true">
                    {view.summary.parts.map((p, i) => (
                      <span key={p.key} style={{ width: `${(p.amount / view.summary.total) * 100}%` }}
                        className={i === 0 ? 'bg-accent' : i === 1 ? 'bg-ink' : i === 2 ? 'bg-ink-muted' : 'bg-panel-border'} />
                    ))}
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {view.summary.parts.map((p, i) => (
                      <li key={p.key} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-[2px] flex-none ${i === 0 ? 'bg-accent' : i === 1 ? 'bg-ink' : i === 2 ? 'bg-ink-muted' : 'bg-panel-border'}`} aria-hidden="true" />
                        <span className="flex-1">{p.label}</span>
                        <span className="text-ink-muted tnum w-12 text-right">{Math.round((p.amount / view.summary.total) * 100)} %</span>
                        <span className="font-mono-gauge w-28 text-right">{fmtKc(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Panel>
        </div>

        {/* Poslední záznamy přes celou šířku */}
        <Panel title="Poslední záznamy" aside={`${Math.min(5, view.recent.length)} z ${fmtInt(view.recent.length)}`} className="lg:col-span-2">
          {view.recent.length === 0 ? (
            <p className="px-[18px] py-4 text-ink-muted">Zatím žádné záznamy. Začni prvním tankováním.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="label-caps text-xs text-ink-muted text-left border-b border-panel-border">
                  <th className="px-3.5 md:px-[18px] py-2.5 font-semibold">Datum</th>
                  <th className="hidden md:table-cell px-[18px] py-2.5 font-semibold">Místo</th>
                  <th className="px-3.5 md:px-[18px] py-2.5 font-semibold">Záznam</th>
                  <th className="hidden md:table-cell px-[18px] py-2.5 font-semibold text-right">Tachometr</th>
                  <th className="px-3.5 md:px-[18px] py-2.5 font-semibold text-right">Částka</th>
                </tr>
              </thead>
              <tbody>
                {view.recent.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-b border-panel-border last:border-b-0 align-top">
                    <td className="px-3.5 md:px-[18px] py-3 font-mono-gauge whitespace-nowrap">{fmtDayMonth(r.date)}</td>
                    <td className="hidden md:table-cell px-[18px] py-3 text-ink-muted">{r.place || '—'}</td>
                    <td className="px-3.5 md:px-[18px] py-3">
                      <span className={`inline-block w-2 h-2 mr-1.5 rounded-[2px] align-[1px] ${r.kind === 'fuel' ? 'bg-accent' : r.kind === 'service' ? 'bg-ink' : 'border-[1.5px] border-ink'}`} aria-hidden="true" />
                      {r.title}
                      {r.detail && <small className="block text-ink-muted text-xs mt-0.5 tnum">{r.detail}</small>}
                    </td>
                    <td className="hidden md:table-cell px-[18px] py-3 font-mono-gauge text-ink-muted text-right whitespace-nowrap">{r.mileage != null ? fmtInt(r.mileage) : '—'}</td>
                    <td className="px-3.5 md:px-[18px] py-3 font-mono-gauge font-semibold text-right whitespace-nowrap">{fmtKc(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex justify-between px-[18px] py-3 border-t border-panel-border text-[13px] text-ink-muted">
            <span>Za 30 dní <b className="font-mono-gauge text-ink">{fmtKc(view.last30)}</b></span>
            <Link to={`/cars/${car.id}/kniha`} className="text-ink font-semibold underline underline-offset-2 inline-flex items-center gap-1">
              Všechny záznamy <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        </Panel>
      </div>

      {modal === 'fuel' && <AddFuelModal carId={car.id} onClose={closeModal} onCreated={refresh} />}
      {modal === 'service' && <AddServiceModal carId={car.id} onClose={closeModal} onCreated={refresh} />}
      {modal === 'expense' && <AddExpenseModal carId={car.id} onClose={closeModal} onCreated={refresh} />}
      {modal === 'reminder' && <AddReminderModal carId={car.id} onClose={closeModal} onCreated={refresh} />}
      {modal === 'edit' && <EditCarModal car={car} onClose={closeModal} onUpdated={refresh} />}
    </AppShell>
  );
}
