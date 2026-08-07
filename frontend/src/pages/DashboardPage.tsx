import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCars, deleteCar, type Car } from '../api/cars';
import { getDashboard, type DashboardData } from '../api/dashboard';
import { getUpcomingReminders, toggleReminderComplete, type UpcomingReminder } from '../api/reminders';
import AddCarModal from '../components/AddCarModal';
import Gauge from '../components/Gauge';

const ROLE_LABELS: Record<string, string> = {
  SPOLUMAJITEL: 'Spolumajitel',
  SERVIS: 'Servis',
};

function DashboardPage() {
  const { user, logout } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [carsData, dashboardData, remindersData] = await Promise.all([
        getCars(),
        getDashboard(),
        getUpcomingReminders(),
      ]);
      setCars(carsData);
      setDashboard(dashboardData);
      setReminders(remindersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Opravdu smazat toto auto?')) return;
    await deleteCar(id);
    loadAll();
  }

  async function handleToggleReminder(id: string) {
    await toggleReminderComplete(id);
    loadAll();
  }

  function formatDaysUntil(dueDate: string | null): { text: string; urgent: boolean } {
    if (!dueDate) return { text: '', urgent: false };
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: `Po termínu`, urgent: true };
    if (days === 0) return { text: 'Dnes!', urgent: true };
    if (days <= 14) return { text: `Za ${days} dní`, urgent: true };
    return { text: `Za ${days} dní`, urgent: false };
  }

  const monthlyValues = dashboard?.monthlyStats.map((m) => m.total) || [];
  const avgMonthly = monthlyValues.length > 0
    ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
    : 5000;
  const currentMonth = monthlyValues[monthlyValues.length - 1] || 0;
  const gaugeMax = Math.max(avgMonthly * 1.5, currentMonth * 1.1, 5000);

  return (
    <div className="min-h-screen bg-asphalt p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-mono-gauge">Palubní deska</p>
            <h1 className="text-2xl font-bold text-white font-display">
              {user?.name || user?.email}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/map"
              className="border border-panel-border text-slate-400 hover:text-gauge-yellow hover:border-gauge-yellow px-4 py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
            >
              🗺️ Mapa
            </Link>
            <button
              onClick={logout}
              className="border border-panel-border text-slate-400 hover:text-white hover:border-slate-500 px-4 py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
            >
              Odhlásit
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500 font-mono-gauge">Načítám...</p>
        ) : (
          <>
            {dashboard && dashboard.carCount > 0 && (
              <div className="bg-panel border border-panel-border rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <Gauge value={currentMonth} max={gaugeMax} label="Tento měsíc" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Aut celkem</p>
                      <p className="font-mono-gauge text-3xl font-bold text-gauge-yellow">{dashboard.carCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Palivo celkem</p>
                      <p className="font-mono-gauge text-3xl font-bold text-white">
                        {dashboard.totalFuelCost.toLocaleString('cs-CZ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Servis + výdaje</p>
                      <p className="font-mono-gauge text-3xl font-bold text-white">
                        {(dashboard.totalServiceCost + dashboard.totalExpensesCost).toLocaleString('cs-CZ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Celkem najeto</p>
                      <p className="font-mono-gauge text-3xl font-bold text-white">
                        {cars.reduce((sum, c) => sum + (c.mileage || 0), 0).toLocaleString('cs-CZ')}
                        <span className="text-sm text-slate-500 ml-1">km</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-l border-panel-border pl-6 hidden md:block">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Celkové náklady</p>
                    <p className="font-mono-gauge text-4xl font-extrabold text-gauge-orange">
                      {dashboard.totalCost.toLocaleString('cs-CZ')}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">Kč napříč všemi auty</p>
                  </div>
                </div>
              </div>
            )}

            {reminders.length > 0 && (
              <div className="bg-panel border border-panel-border rounded-xl p-4 mb-6">
                <h3 className="text-gauge-yellow font-display font-semibold mb-3 text-sm uppercase tracking-wider">
                  ⏰ Kontrolky
                </h3>
                <div className="space-y-2">
                  {reminders.slice(0, 5).map((reminder) => {
                    const dateInfo = formatDaysUntil(reminder.dueDate);
                    return (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between bg-asphalt-light border border-panel-border rounded px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={reminder.completed}
                            onChange={() => handleToggleReminder(reminder.id)}
                            className="w-4 h-4 accent-gauge-yellow"
                          />
                          <div>
                            <span className="text-white text-sm font-medium">{reminder.title}</span>
                            <span className="text-slate-500 text-xs ml-2">
                              ({reminder.car.make} {reminder.car.model})
                            </span>
                          </div>
                        </div>
                        {reminder.dueDate && (
                          <span className={`font-mono-gauge text-xs font-semibold ${dateInfo.urgent ? 'text-warning-red' : 'text-slate-500'}`}>
                            {dateInfo.text}
                          </span>
                        )}
                        {reminder.dueMileage && !reminder.dueDate && (
                          <span className="font-mono-gauge text-xs text-slate-500">
                            {reminder.dueMileage.toLocaleString('cs-CZ')} km
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-display font-semibold text-lg uppercase tracking-wider">🏁 Garáž</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gauge-yellow hover:brightness-110 text-black px-4 py-2 rounded font-mono-gauge text-sm font-bold uppercase tracking-wider"
              >
                + Přidat auto
              </button>
            </div>

            {cars.length === 0 ? (
              <p className="text-slate-500 font-mono-gauge">Garáž je prázdná.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cars.map((car) => {
                  const carSummary = dashboard?.cars.find((c) => c.id === car.id);
                  const isOwner = car.isOwner !== false;
                  return (
                    <div key={car.id} className="bg-panel border border-panel-border rounded-xl overflow-hidden hover:border-gauge-yellow/50 transition-colors">
                      {car.photoUrl && (
                        <img
                          src={car.photoUrl}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-32 object-cover object-center"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/cars/${car.id}`}
                                className="text-lg font-display font-semibold text-white hover:text-gauge-yellow"
                              >
                                {car.make} {car.model}
                              </Link>
                              {!isOwner && car.myRole && (
                                <span className="text-[10px] font-mono-gauge text-slate-400 border border-panel-border rounded px-1.5 py-0.5 uppercase">
                                  {ROLE_LABELS[car.myRole] || car.myRole}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs font-mono-gauge mt-1">
                              {car.licensePlate && `${car.licensePlate} • `}
                              {car.mileage?.toLocaleString('cs-CZ')} km
                            </p>
                            {carSummary && (
                              <p className="text-gauge-yellow text-sm font-mono-gauge font-semibold mt-2">
                                {carSummary.totalCost.toLocaleString('cs-CZ')} Kč
                              </p>
                            )}
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(car.id)}
                              className="text-slate-600 hover:text-warning-red text-xs"
                            >
                              Smazat
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddCarModal
          onClose={() => setShowModal(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}

export default DashboardPage;