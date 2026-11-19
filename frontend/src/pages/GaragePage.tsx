import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getCars, type Car } from '../api/cars';
import { getDashboard, type DashboardData } from '../api/dashboard';
import { getUpcomingReminders, toggleReminderComplete, type UpcomingReminder } from '../api/reminders';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';
import Panel from '../components/Panel';
import CarFront from '../components/CarFront';
import LicensePlate from '../components/LicensePlate';
import AddCarModal from '../components/AddCarModal';
import AddFuelModal from '../components/AddFuelModal';
import { daysLabel, daysUntil, drawingBodyType, fmtInt, fmtKc, OIL_WARN_KM, WARN_DAYS } from '../lib/carStatus';

const BAYS_PER_FLOOR = 4;

interface Alert {
  id: string;
  title: string;
  when: string;
  warn: boolean;
}

/** Blížící se termíny jednoho auta (z připomínek) – podle nich svítí kontrolka nad stáním. */
function alertsFor(car: Car, reminders: UpcomingReminder[], now: Date): Alert[] {
  return reminders
    .filter((r) => r.car.id === car.id && !r.completed)
    .map((r) => {
      if (r.dueDate) {
        const d = daysUntil(r.dueDate, now);
        return { id: r.id, title: r.title, when: daysLabel(d), warn: d <= WARN_DAYS };
      }
      const left = (r.dueMileage ?? 0) - (car.mileage ?? 0);
      return { id: r.id, title: r.title, when: left <= 0 ? 'Po termínu' : `Za ${fmtInt(left)} km`, warn: left <= OIL_WARN_KM };
    });
}

function Bay({ car, index, alerts, onFuel }: { car: Car; index: number; alerts: Alert[]; onFuel: () => void }) {
  const warn = alerts.filter((a) => a.warn);
  const hasPhoto = !!car.photoUrl;
  return (
    <li className="relative flex flex-col border-panel-border">
      {/* označení stání a kontrolka */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="font-mono-gauge text-xs text-ink-muted tracking-[0.15em]">P{index}</span>
        <span
          className={`inline-flex items-center gap-1.5 label-caps text-[11px] ${warn.length ? 'text-accent' : 'text-ok'}`}
          title={warn.length ? warn.map((a) => `${a.title}: ${a.when}`).join('\n') : 'Nic nehoří'}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${warn.length ? 'bg-accent shadow-[0_0_0_3px_var(--c-accent-soft)]' : 'bg-ok'}`} aria-hidden="true" />
          {warn.length ? `${warn.length} ${warn.length === 1 ? 'termín' : 'termíny'}` : 'v pořádku'}
        </span>
      </div>

      <Link to={`/cars/${car.id}`} className="group flex-1 flex flex-col items-center px-3 pt-2 pb-3 text-center rounded focus-visible:outline-offset-[-4px]">
        <div className="w-full aspect-[4/3] flex items-end justify-center">
          {hasPhoto ? (
            <img
              src={car.photoUrl!}
              alt=""
              className={`w-full h-full rounded border border-panel-border bg-asphalt-light ${car.photoView === 'SIDE' ? 'object-contain' : 'object-cover'} group-hover:border-ink-muted transition-colors`}
            />
          ) : (
            <CarFront bodyType={drawingBodyType(car)} className="w-[88%] text-ink group-hover:text-accent transition-colors" />
          )}
        </div>
        {/* podlaha stání: stop čára */}
        <span className="block w-full h-[3px] bg-ink mt-1" aria-hidden="true" />
        <span className="mt-2.5">{car.licensePlate ? <LicensePlate plate={car.licensePlate} size="sm" /> : <span className="text-xs text-ink-muted">bez SPZ</span>}</span>
        <span className="mt-1.5 font-display font-semibold text-lg leading-tight group-hover:underline underline-offset-2">{car.make} {car.model}</span>
        <span className="font-mono-gauge text-xs text-ink-muted">{fmtInt(car.mileage ?? 0)} km</span>
      </Link>

      <button
        onClick={onFuel}
        className="mx-3 mb-3 h-10 rounded border border-panel-border bg-asphalt-light hover:border-accent hover:text-accent inline-flex items-center justify-center gap-2 label-caps text-sm"
        aria-label={`Tankovat – ${car.make} ${car.model}`}
      >
        <Icon name="fuel" size={16} strokeWidth={2} /> Tankovat
      </button>
    </li>
  );
}

function EmptyBay({ index, first, onAdd }: { index: number; first: boolean; onAdd: () => void }) {
  return (
    <li className="relative flex flex-col border-panel-border">
      <div className="px-3 pt-2.5">
        <span className="font-mono-gauge text-xs text-ink-muted tracking-[0.15em]">P{index}</span>
      </div>
      {first ? (
        <button onClick={onAdd} className="flex-1 m-3 mt-2 min-h-[180px] rounded border-2 border-dashed border-ink-muted/60 hover:border-accent hover:text-accent text-ink-muted flex flex-col items-center justify-center gap-2">
          <Icon name="plus" size={28} />
          <span className="label-caps text-sm">Zaparkovat auto</span>
        </button>
      ) : (
        <div className="flex-1 m-3 mt-2 min-h-[180px] rounded border border-dashed border-panel-border flex items-center justify-center text-ink-muted/70 text-xs label-caps">
          Volné stání
        </div>
      )}
    </li>
  );
}

export default function GaragePage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [cars, setCars] = useState<Car[] | null>(null);
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [adding, setAdding] = useState(false);
  const [fuelCar, setFuelCar] = useState<string | null>(null);
  const [picking, setPicking] = useState(() => !!(location.state as { openFuel?: boolean } | null)?.openFuel);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [now] = useState(() => new Date());
  const welcome = (location.state as { welcome?: boolean; emailSent?: boolean } | null)?.welcome;
  // Tankovat ze spodní lišty na jiné stránce: po načtení aut rozhodneme, co otevřít
  const wantsFuel = useRef(picking);

  const load = useCallback(
    () => Promise.all([getCars(), getUpcomingReminders().catch(() => []), getDashboard().catch(() => null)])
      .then(([c, r, d]) => {
        setCars(c);
        setReminders(r);
        setSummary(d);
        if (wantsFuel.current) {
          wantsFuel.current = false;
          if (c.length <= 1) setPicking(false);
          if (c.length === 1) setFuelCar(c[0].id);
          if (c.length === 0) setAdding(true);
        }
      })
      .catch(() => setCars([])),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const floors = Math.max(1, Math.ceil((cars?.length ?? 0) / BAYS_PER_FLOOR));
  const floor = Math.min(floors, Math.max(1, Number(params.get('patro')) || 1));
  const onFloor = (cars ?? []).slice((floor - 1) * BAYS_PER_FLOOR, floor * BAYS_PER_FLOOR);
  const freeBays = BAYS_PER_FLOOR - onFloor.length;

  const alerts = useMemo(() => new Map((cars ?? []).map((c) => [c.id, alertsFor(c, reminders, now)])), [cars, reminders, now]);

  function goFloor(next: number) {
    if (next < 1 || next > floors) return;
    setDirection(next > floor ? 'up' : 'down');
    setParams(next === 1 ? {} : { patro: String(next) });
  }

  // Tankovat ze spodní lišty: jedno auto rovnou, víc aut = výběr
  function startFuel() {
    if (!cars?.length) return setAdding(true);
    if (cars.length === 1) return setFuelCar(cars[0].id);
    setPicking(true);
  }

  function closePicker() {
    setPicking(false);
    if (location.state) navigate('/dashboard', { replace: true, state: null });
  }

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = summary?.monthlyStats.find((m) => m.month === monthKey)?.total ?? 0;
  const upcoming = reminders.slice(0, 6);
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <AppShell onFuel={startFuel}>
      <div className="px-4 md:px-7 py-5 md:py-7">
        <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="label-caps text-sm text-ink-muted">{firstName ? `Ahoj, ${firstName}` : 'Tvoje garáž'}</p>
            <h1 className="font-display font-bold text-2xl md:text-[32px] uppercase tracking-wide leading-none mt-1">Garáž</h1>
          </div>
          <button onClick={() => setAdding(true)} className="h-11 px-4 rounded-lg bg-accent text-on-accent label-caps text-base inline-flex items-center gap-2">
            <Icon name="plus" strokeWidth={2} /> Přidat auto
          </button>
        </div>

        {welcome && (
          <p role="status" className="mb-4 bg-panel border border-panel-border rounded-lg px-4 py-3 text-sm">
            <b>Vítej v AutoApp!</b> Zaparkuj první auto do garáže.{' '}
            {(location.state as { emailSent?: boolean }).emailSent === false
              ? 'Ověřovací e-mail se teď nepodařilo odeslat – pošli si ho znovu v liště nahoře.'
              : 'Na e-mail jsme ti poslali odkaz na ověření.'}
          </p>
        )}

        {cars === null ? (
          <p className="text-ink-muted">Otevírám vrata…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_88px] gap-3 md:gap-4">
            {/* Budova garáže */}
            <section aria-label={`Garáž, patro ${floor} z ${floors}`} className="bg-panel border-2 border-ink rounded-t-xl rounded-b-sm overflow-hidden">
              {/* štít a vytažená rolovací vrata */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b-2 border-ink">
                <span className="label-caps text-sm">Garáž · patro {floor}</span>
                <span className="font-mono-gauge text-xs text-ink-muted">{fmtInt(cars.length)} {cars.length === 1 ? 'auto' : cars.length >= 2 && cars.length <= 4 ? 'auta' : 'aut'}</span>
              </div>
              <div className="garage-door h-6 border-b border-panel-border" aria-hidden="true" />

              <ul
                key={floor}
                className={`grid grid-cols-2 lg:grid-cols-4 bg-asphalt [&>li]:border-panel-border [&>li:nth-child(odd)]:border-r lg:[&>li]:border-r lg:[&>li:last-child]:border-r-0 [&>li:nth-child(-n+2)]:border-b lg:[&>li]:border-b-0 ${direction === 'up' ? 'floor-up' : 'floor-down'}`}
              >
                {onFloor.map((car, i) => (
                  <Bay key={car.id} car={car} index={i + 1} alerts={alerts.get(car.id) ?? []} onFuel={() => setFuelCar(car.id)} />
                ))}
                {Array.from({ length: freeBays }, (_, i) => (
                  <EmptyBay key={`free-${i}`} index={onFloor.length + i + 1} first={i === 0} onAdd={() => setAdding(true)} />
                ))}
              </ul>
              {/* podlaha */}
              <div className="h-3 border-t-2 border-ink bg-[repeating-linear-gradient(135deg,var(--c-panel-border)_0_2px,transparent_2px_10px)]" aria-hidden="true" />
            </section>

            {/* Ovladač pater jako ve výtahu */}
            <nav aria-label="Patra garáže" className="flex md:flex-col items-center justify-center md:justify-start gap-2 md:pt-12">
              <button onClick={() => goFloor(floor + 1)} disabled={floor >= floors} aria-label="O patro výš"
                className="w-12 h-12 rounded-full border-2 border-ink grid place-items-center disabled:opacity-30 hover:bg-asphalt-light">
                <Icon name="chevronUp" size={22} strokeWidth={2.2} />
              </button>
              <div className="w-16 h-16 rounded-lg bg-ink text-panel grid place-items-center" aria-live="polite">
                <span className="font-mono-gauge text-3xl font-semibold leading-none">{floor}</span>
                <span className="sr-only">. patro z {floors}</span>
              </div>
              <button onClick={() => goFloor(floor - 1)} disabled={floor <= 1} aria-label="O patro níž"
                className="w-12 h-12 rounded-full border-2 border-ink grid place-items-center disabled:opacity-30 hover:bg-asphalt-light">
                <Icon name="chevronDown" size={22} strokeWidth={2.2} />
              </button>
              <span className="label-caps text-[11px] text-ink-muted md:mt-1">{floors > 1 ? `${floors} patra` : 'patro'}</span>
            </nav>
          </div>
        )}

        {cars && cars.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 md:gap-5 mt-5 md:mr-[104px]">
            <Panel title="Blížící se termíny" aside="všechna auta">
              {upcoming.length === 0 ? (
                <p className="px-[18px] py-4 text-ink-muted text-sm">Nic nehoří. Připomínky STK, oleje a pojištění přidáš v přehledu auta.</p>
              ) : (
                <ul>
                  {upcoming.map((r) => {
                    const car = cars.find((c) => c.id === r.car.id);
                    const a = car ? alertsFor(car, [r], now)[0] : null;
                    return (
                      <li key={r.id} className="flex items-center gap-3 px-[18px] py-3 border-b border-panel-border last:border-b-0">
                        <input
                          type="checkbox"
                          checked={r.completed}
                          onChange={() => toggleReminderComplete(r.id).then(load)}
                          className="w-5 h-5 accent-accent flex-none"
                          aria-label={`Označit „${r.title}“ jako hotové`}
                        />
                        <Link to={`/cars/${r.car.id}`} className="min-w-0 flex-1 hover:underline underline-offset-2">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-ink-muted text-[13px] truncate">{r.car.make} {r.car.model}</p>
                        </Link>
                        {a && <span className={`font-mono-gauge text-sm whitespace-nowrap ${a.warn ? 'text-accent font-semibold' : 'text-ink-muted'}`}>{a.when}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Celá garáž" aside={now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}>
              <dl className="grid grid-cols-2">
                <div className="px-[18px] py-3.5 border-r border-b border-panel-border">
                  <dt className="label-caps text-[11px] text-ink-muted">Tento měsíc</dt>
                  <dd className="font-mono-gauge text-2xl font-semibold mt-0.5">{fmtKc(thisMonth)}</dd>
                </div>
                <div className="px-[18px] py-3.5 border-b border-panel-border">
                  <dt className="label-caps text-[11px] text-ink-muted">Celkem</dt>
                  <dd className="font-mono-gauge text-2xl font-semibold mt-0.5">{fmtKc(summary?.totalCost ?? 0)}</dd>
                </div>
                <div className="px-[18px] py-3.5 border-r border-panel-border">
                  <dt className="label-caps text-[11px] text-ink-muted">Palivo</dt>
                  <dd className="font-mono-gauge mt-0.5">{fmtKc(summary?.totalFuelCost ?? 0)}</dd>
                </div>
                <div className="px-[18px] py-3.5">
                  <dt className="label-caps text-[11px] text-ink-muted">Servis a výdaje</dt>
                  <dd className="font-mono-gauge mt-0.5">{fmtKc((summary?.totalServiceCost ?? 0) + (summary?.totalExpensesCost ?? 0))}</dd>
                </div>
              </dl>
              <p className="px-[18px] py-2.5 border-t border-panel-border text-xs text-ink-muted">Počítají se tvoje auta a auta, kde jsi spolumajitel.</p>
            </Panel>
          </div>
        )}
      </div>

      {/* Výběr auta pro tankování (víc aut v garáži) */}
      {picking && cars && cars.length > 1 && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:px-4 z-50" onClick={closePicker}>
          <div role="dialog" aria-label="Které auto tankuješ?" onClick={(e) => e.stopPropagation()}
            className="bg-panel border border-panel-border rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            <h2 className="label-caps text-lg mb-3">Které auto tankuješ?</h2>
            <ul className="space-y-2">
              {cars.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => { closePicker(); setFuelCar(c.id); }}
                    className="w-full h-14 px-3 rounded border border-panel-border hover:border-accent flex items-center gap-3 text-left"
                  >
                    <Icon name="fuel" className="text-accent" />
                    <span className="flex-1 font-medium">{c.make} {c.model}</span>
                    {c.licensePlate && <LicensePlate plate={c.licensePlate} size="sm" />}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={closePicker} className="mt-3 w-full h-11 rounded border border-panel-border text-ink-muted">Zrušit</button>
          </div>
        </div>
      )}

      {adding && <AddCarModal onClose={() => setAdding(false)} onCreated={load} />}
      {fuelCar && <AddFuelModal carId={fuelCar} onClose={() => setFuelCar(null)} onCreated={load} />}
    </AppShell>
  );
}
