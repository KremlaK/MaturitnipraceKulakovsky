import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getCars, getCar, type Car } from '../api/cars';
import { getServiceRecords, type ServiceRecord } from '../api/service';
import { getFuelRecords, getFuelStats, type FuelRecord, type FuelStats } from '../api/fuel';
import { getExpenses, type Expense } from '../api/expenses';
import { getCarStats, type CarStats } from '../api/stats';
import { getReminders, type Reminder } from '../api/reminders';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';
import CarDrawing from '../components/CarDrawing';
import LicensePlate from '../components/LicensePlate';
import OdometerRuler from '../components/OdometerRuler';
import CostChart from '../components/CostChart';
import AddCarModal from '../components/AddCarModal';
import AddFuelModal from '../components/AddFuelModal';
import AddServiceModal from '../components/AddServiceModal';
import AddExpenseModal from '../components/AddExpenseModal';
import AddReminderModal from '../components/AddReminderModal';
import {
  buildCosts, buildRecent, buildRuler, buildStatus, fmtDate, fmtDayMonth, fmtInt, fmtKc,
  drawingBodyType, kmPerDay, paceLabel, stkStickerYear, sumLastDays,
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

type Modal = 'car' | 'fuel' | 'service' | 'expense' | 'reminder' | null;

function readSavedCar() {
  try {
    return localStorage.getItem('selectedCar');
  } catch {
    return null;
  }
}

function Panel({ title, aside, children, className = '' }: { title: string; aside?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-panel border border-panel-border rounded-lg ${className}`}>
      <div className="flex justify-between items-baseline gap-3 px-[18px] py-3 border-b border-panel-border label-caps text-sm">
        <h2>{title}</h2>
        {aside && <span className="text-ink-muted font-medium text-right">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [cars, setCars] = useState<Car[] | null>(null);
  const [data, setData] = useState<CarData | null>(null);
  const [modal, setModal] = useState<Modal>(() => ((location.state as { openFuel?: boolean } | null)?.openFuel ? 'fuel' : null));
  const [now] = useState(() => new Date());

  const selectedId = useMemo(() => {
    if (!cars?.length) return null;
    const wanted = params.get('car') ?? readSavedCar();
    return cars.some((c) => c.id === wanted) ? wanted : cars[0].id;
  }, [cars, params]);

  const loadCars = useCallback(() => getCars().then(setCars).catch(() => setCars([])), []);

  const loadCar = useCallback((id: string) =>
    Promise.all([
      getCar(id), getServiceRecords(id), getFuelRecords(id), getFuelStats(id).catch(() => null),
      getExpenses(id), getCarStats(id).catch(() => null), getReminders(id),
    ]).then(([car, services, fuel, fuelStats, expenses, stats, reminders]) => {
      setData({ car, services, fuel, fuelStats, expenses, stats, reminders });
    }).catch(console.error),
  []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  useEffect(() => {
    if (!selectedId) return;
    try {
      localStorage.setItem('selectedCar', selectedId);
    } catch {
      // jen se nezapamatuje
    }
    loadCar(selectedId);
  }, [selectedId, loadCar]);

  function closeModal() {
    setModal(null);
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }

  function refresh() {
    loadCars();
    if (selectedId) loadCar(selectedId);
  }

  const view = useMemo(() => {
    if (!data) return null;
    const mileage = data.car.mileage ?? 0;
    const status = buildStatus({
      mileage, reminders: data.reminders, services: data.services, fuel: data.fuel,
      averageConsumption: data.fuelStats?.averageConsumption ?? null, now,
    });
    const ruler = buildRuler(mileage, data.fuel, data.services, data.reminders);
    const costs = buildCosts(data.stats?.monthlyStats ?? [], now);
    const recent = buildRecent(data.fuel, data.services, data.expenses);
    const nextKm = ruler.future[0];
    return {
      status, ruler, costs, recent,
      warnCount: status.filter((s) => s.warn).length,
      pace: nextKm ? paceLabel(nextKm.km - mileage, kmPerDay(data.fuel, now)) : null,
      nextKm,
      last30: sumLastDays(recent, 30, now),
      stkYear: stkStickerYear(data.reminders),
      bodyType: drawingBodyType(data.car),
    };
  }, [data, now]);

  const loading = cars === null || (cars.length > 0 && (!data || data.car.id !== selectedId));

  return (
    <AppShell onFuel={() => (selectedId ? setModal('fuel') : setModal('car'))}>
      {loading ? (
        <p className="px-7 py-10 text-ink-muted">Načítám…</p>
      ) : cars!.length === 0 ? (
        <div className="px-4 md:px-7 py-10">
          <section className="bg-panel border border-panel-border rounded-lg p-8 max-w-xl">
            <p className="label-caps text-sm text-ink-muted">Začínáme</p>
            <h1 className="font-display font-bold text-3xl uppercase tracking-wide mt-1">Přidej své první auto</h1>
            <p className="text-ink-muted mt-3">Pak tu uvidíš jeho výkres, blížící se servis a STK, spotřebu i náklady.</p>
            <button onClick={() => setModal('car')} className="mt-6 h-12 px-6 rounded-lg bg-accent text-on-accent label-caps text-lg inline-flex items-center gap-2">
              <Icon name="plus" /> Přidat auto
            </button>
          </section>
        </div>
      ) : data && view && (
        <>
          {/* Hlavička vozu */}
          <section className="flex items-center gap-3 md:gap-5 flex-wrap px-4 md:px-7 pt-4 md:pt-6 pb-3 md:pb-5">
            {data.car.licensePlate && <LicensePlate plate={data.car.licensePlate} stkYear={view.stkYear} />}
            <div className="min-w-0">
              <h1 className="font-display font-bold text-2xl md:text-[32px] leading-none tracking-wide">
                {data.car.make} {data.car.model}
              </h1>
              <p className="text-ink-muted text-sm mt-1.5">
                {[data.car.year && `Rok ${data.car.year}`, data.car.vin && `VIN ${data.car.vin}`].filter(Boolean).join(' · ') || 'Doplň rok a VIN v detailu auta'}
              </p>
            </div>
            {cars!.length > 1 && (
              <label className="md:ml-auto w-full md:w-auto flex flex-col border border-panel-border bg-panel rounded-lg px-3 py-1.5">
                <span className="label-caps text-[11px] text-ink-muted">Vozidlo</span>
                <select
                  value={selectedId ?? ''}
                  onChange={(e) => setParams({ car: e.target.value })}
                  className="bg-transparent text-ink font-medium focus:outline-none pr-2"
                >
                  {cars!.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.make} {c.model}{c.licensePlate ? ` · ${c.licensePlate}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 md:gap-5 px-4 md:px-7 pb-8">
            {/* Výkres a stav */}
            <Panel title="Obr. 1 — Bokorys a stav vozu" aside={view.warnCount ? `${view.warnCount} ${view.warnCount === 1 ? 'položka vyžaduje' : 'položky vyžadují'} pozornost` : 'vše v pořádku'}>
              <div className="px-3.5 pt-2">
                <CarDrawing bodyType={view.bodyType} items={view.status} label={`Výkres vozu ${data.car.make} ${data.car.model} s očíslovanými místy`} />
              </div>
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
                  ['Tachometr', `${fmtInt(data.car.mileage ?? 0)} km`],
                  ['Poslední záznam', view.recent[0] ? fmtDate(view.recent[0].date) : '—'],
                  ['Záznamů celkem', fmtInt(view.recent.length)],
                  ['Přístup', ROLE_LABELS[data.car.myRole ?? (data.car.isOwner === false ? '' : 'MAJITEL')] ?? '—'],
                ].map(([k, v], i) => (
                  <div key={k} className={`px-[18px] py-2.5 border-panel-border ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} md:last:border-r-0`}>
                    <dt className="label-caps text-[11px] text-ink-muted">{k}</dt>
                    <dd className="font-mono-gauge text-sm">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <div className="flex flex-col gap-4 md:gap-5 min-w-0">
              {/* Akce – na mobilu je Tankovat ve spodní liště */}
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
                    <b className="font-mono-gauge text-[28px] font-semibold">{fmtInt(data.car.mileage ?? 0)} km</b>
                    {view.recent[0] && <span className="text-ink-muted text-[13px]">stav k {fmtDate(view.recent[0].date)}</span>}
                  </div>
                  <OdometerRuler data={view.ruler} />
                  <p className="mt-2 text-[13px] text-ink-muted tnum">
                    {view.nextKm ? (
                      <>Do {view.nextKm.label === 'OLEJ' ? 'výměny oleje' : 'další připomínky'} zbývá{' '}
                        <b className={view.nextKm.warn ? 'text-accent' : 'text-ink'}>{fmtInt(view.nextKm.km - (data.car.mileage ?? 0))} km</b>
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
                <Link to={`/cars/${data.car.id}`} className="text-ink font-semibold underline underline-offset-2 inline-flex items-center gap-1">
                  Všechny záznamy <Icon name="arrowRight" size={14} />
                </Link>
              </div>
            </Panel>
          </div>
        </>
      )}

      {modal === 'car' && <AddCarModal onClose={closeModal} onCreated={refresh} />}
      {selectedId && modal === 'fuel' && <AddFuelModal carId={selectedId} onClose={closeModal} onCreated={refresh} />}
      {selectedId && modal === 'service' && <AddServiceModal carId={selectedId} onClose={closeModal} onCreated={refresh} />}
      {selectedId && modal === 'expense' && <AddExpenseModal carId={selectedId} onClose={closeModal} onCreated={refresh} />}
      {selectedId && modal === 'reminder' && <AddReminderModal carId={selectedId} onClose={closeModal} onCreated={refresh} />}
    </AppShell>
  );
}

export default DashboardPage;
