import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCars, deleteCar, type Car } from '../api/cars';
import { getDashboard, type DashboardData } from '../api/dashboard';
import { getUpcomingReminders, toggleReminderComplete, type UpcomingReminder } from '../api/reminders';
import AppShell from '../components/AppShell';
import AddCarModal from '../components/AddCarModal';
import Icon from '../components/Icon';
import LicensePlate from '../components/LicensePlate';
import { daysLabel, daysUntil, fmtInt, fmtKc, WARN_DAYS } from '../lib/carStatus';

const ROLE_LABELS: Record<string, string> = { SPOLUMAJITEL: 'Spolumajitel', SERVIS: 'Servis' };

function CarsPage() {
  const [cars, setCars] = useState<Car[] | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [now] = useState(() => new Date());

  const loadAll = useCallback(() =>
    Promise.all([getCars(), getDashboard().catch(() => null), getUpcomingReminders().catch(() => [])])
      .then(([c, d, r]) => {
        setCars(c);
        setDashboard(d);
        setReminders(r);
      })
      .catch(() => setCars([])),
  []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleDelete(car: Car) {
    if (!confirm(`Opravdu smazat ${car.make} ${car.model} i se všemi záznamy? Tohle nejde vrátit.`)) return;
    await deleteCar(car.id);
    loadAll();
  }

  async function handleToggle(id: string) {
    await toggleReminderComplete(id);
    loadAll();
  }

  return (
    <AppShell>
      <div className="px-4 md:px-7 py-5 md:py-7">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h1 className="font-display font-bold text-2xl md:text-[30px] uppercase tracking-wide">Moje auta</h1>
          <button onClick={() => setShowAdd(true)} className="h-11 px-4 rounded-lg bg-accent text-on-accent label-caps text-base inline-flex items-center gap-2">
            <Icon name="plus" strokeWidth={2} /> Přidat auto
          </button>
        </div>

        {cars === null ? (
          <p className="text-ink-muted">Načítám…</p>
        ) : cars.length === 0 ? (
          <p className="text-ink-muted">Zatím tu nemáš žádné auto.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
              {cars.map((car) => {
                const summary = dashboard?.cars.find((c) => c.id === car.id);
                const isOwner = car.isOwner !== false;
                return (
                  <li key={car.id} className="bg-panel border border-panel-border rounded-lg overflow-hidden flex flex-col">
                    <Link to={`/dashboard?car=${car.id}`} className="block p-4 hover:bg-asphalt-light flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-display font-bold text-xl tracking-wide truncate">{car.make} {car.model}</h2>
                          <p className="text-ink-muted text-sm">{car.year ? `Rok ${car.year}` : 'Rok neuveden'}</p>
                        </div>
                        {car.licensePlate && <LicensePlate plate={car.licensePlate} size="sm" />}
                      </div>
                      <dl className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                          <dt className="label-caps text-[11px] text-ink-muted">Tachometr</dt>
                          <dd className="font-mono-gauge">{fmtInt(car.mileage ?? 0)} km</dd>
                        </div>
                        {summary && (
                          <div>
                            <dt className="label-caps text-[11px] text-ink-muted">Náklady celkem</dt>
                            <dd className="font-mono-gauge">{fmtKc(summary.totalCost)}</dd>
                          </div>
                        )}
                      </dl>
                    </Link>
                    <div className="flex items-center gap-1 border-t border-panel-border px-2 py-1.5 text-sm">
                      {!isOwner && car.myRole && (
                        <span className="label-caps text-[11px] text-ink-muted border border-panel-border rounded px-1.5 py-0.5 ml-2">
                          {ROLE_LABELS[car.myRole] || car.myRole}
                        </span>
                      )}
                      <Link to={`/cars/${car.id}`} className="ml-auto px-2.5 py-1.5 rounded text-ink hover:bg-asphalt-light inline-flex items-center gap-1.5">
                        <Icon name="file" size={16} /> Kniha údržby
                      </Link>
                      {isOwner && (
                        <button onClick={() => handleDelete(car)} className="px-2.5 py-1.5 rounded text-ink-muted hover:text-warning-red hover:bg-asphalt-light inline-flex items-center gap-1.5">
                          <Icon name="trash" size={16} /> Smazat
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <section className="bg-panel border border-panel-border rounded-lg self-start">
              <div className="flex justify-between items-baseline px-[18px] py-3 border-b border-panel-border label-caps text-sm">
                <h2>Blížící se termíny</h2>
                <span className="text-ink-muted font-medium">všechna auta</span>
              </div>
              {reminders.length === 0 ? (
                <p className="px-[18px] py-4 text-ink-muted text-sm">Nic nehoří. Připomínky přidáš v detailu auta.</p>
              ) : (
                <ul>
                  {reminders.slice(0, 8).map((r) => {
                    const days = r.dueDate ? daysUntil(r.dueDate, now) : null;
                    const urgent = days != null && days <= WARN_DAYS;
                    return (
                      <li key={r.id} className="flex items-center gap-3 px-[18px] py-3 border-b border-panel-border last:border-b-0">
                        <input
                          type="checkbox"
                          checked={r.completed}
                          onChange={() => handleToggle(r.id)}
                          className="w-5 h-5 accent-accent flex-none"
                          aria-label={`Označit „${r.title}“ jako hotové`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{r.title}</p>
                          <p className="text-ink-muted text-[13px] truncate">{r.car.make} {r.car.model}</p>
                        </div>
                        <span className={`font-mono-gauge text-sm whitespace-nowrap ${urgent ? 'text-accent font-semibold' : 'text-ink-muted'}`}>
                          {days != null ? daysLabel(days) : r.dueMileage != null ? `${fmtInt(r.dueMileage)} km` : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
      {showAdd && <AddCarModal onClose={() => setShowAdd(false)} onCreated={loadAll} />}
    </AppShell>
  );
}

export default CarsPage;
