import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getCars, deleteCar, type Car } from '../api/cars';
import { getDashboard, type DashboardData } from '../api/dashboard';
import AddCarModal from '../components/AddCarModal';
import { getUpcomingReminders, toggleReminderComplete, type UpcomingReminder } from '../api/reminders';

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-');
  const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
  return `${months[Number(month) - 1]} ${year}`;
}

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

  const monthlyData = dashboard?.monthlyStats.map((m) => ({
    ...m,
    monthLabel: formatMonth(m.month),
  })) || [];

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Vítej, {user?.name || user?.email}! 👋
          </h1>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Odhlásit se
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Načítám...</p>
        ) : (
          <>
            {/* Celkový přehled */}
            {dashboard && dashboard.carCount > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-slate-400 text-xs">Počet aut</p>
                    <p className="text-white font-bold text-lg">{dashboard.carCount}</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-slate-400 text-xs">Palivo celkem</p>
                    <p className="text-white font-bold text-lg">{dashboard.totalFuelCost.toLocaleString('cs-CZ')} Kč</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center">
                    <p className="text-slate-400 text-xs">Servis + výdaje</p>
                    <p className="text-white font-bold text-lg">
                      {(dashboard.totalServiceCost + dashboard.totalExpensesCost).toLocaleString('cs-CZ')} Kč
                    </p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg text-center border border-blue-600">
                    <p className="text-slate-400 text-xs">Celkem za všechna auta</p>
                    <p className="text-white font-bold text-lg">{dashboard.totalCost.toLocaleString('cs-CZ')} Kč</p>
                  </div>
                </div>

                {/* Graf měsíčních nákladů */}
                {monthlyData.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg mb-6">
                    <h3 className="text-white font-semibold mb-4">Náklady podle měsíců (všechna auta)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value) => `${Number(value).toLocaleString('cs-CZ')} Kč`}
                        />
                        <Legend />
                        <Bar dataKey="fuel" name="Palivo" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="service" name="Servis" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="expenses" name="Výdaje" stackId="a" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                )}
                {/* Nadcházející připomínky */}
                {reminders.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg mb-6">
                    <h3 className="text-white font-semibold mb-3">⏰ Nadcházející připomínky</h3>
                    <div className="space-y-2">
                      {reminders.slice(0, 5).map((reminder) => {
                        const dateInfo = formatDaysUntil(reminder.dueDate);
                        return (
                          <div
                            key={reminder.id}
                            className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={reminder.completed}
                                onChange={() => handleToggleReminder(reminder.id)}
                                className="w-4 h-4"
                              />
                              <div>
                                <span className="text-white text-sm font-medium">{reminder.title}</span>
                                <span className="text-slate-500 text-xs ml-2">
                                  ({reminder.car.make} {reminder.car.model})
                                </span>
                              </div>
                            </div>
                            {reminder.dueDate && (
                              <span className={`text-xs font-semibold ${dateInfo.urgent ? 'text-red-400' : 'text-slate-400'}`}>
                                {dateInfo.text}
                              </span>
                            )}
                            {reminder.dueMileage && !reminder.dueDate && (
                              <span className="text-xs text-slate-400">
                                při {reminder.dueMileage.toLocaleString('cs-CZ')} km
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {reminders.length > 5 && (
                      <p className="text-slate-500 text-xs mt-2">
                        + dalších {reminders.length - 5} připomínek (viz detail konkrétního auta)
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Seznam aut */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Moje auta</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
              >
                + Přidat auto
              </button>
            </div>

            {cars.length === 0 ? (
              <p className="text-slate-400">Zatím nemáš přidaná žádná auta.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cars.map((car) => {
                  const carSummary = dashboard?.cars.find((c) => c.id === car.id);
                  return (
                    <div key={car.id} className="bg-slate-800 rounded-lg shadow overflow-hidden">
                    {car.photoUrl && (
                        <img
                          src={car.photoUrl}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-32 object-cover object-center"
                        />
                      )}
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <Link
                            to={`/cars/${car.id}`}
                            className="text-lg font-semibold text-white hover:text-blue-400"
                          >
                            {car.make} {car.model}
                          </Link>
                          <p className="text-slate-400 text-sm">
                            {car.year && `Rok: ${car.year}`} {car.licensePlate && `• SPZ: ${car.licensePlate}`}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Nájezd: {car.mileage?.toLocaleString('cs-CZ')} km
                          </p>
                          {carSummary && (
                            <p className="text-blue-400 text-sm font-semibold mt-1">
                              Celkem: {carSummary.totalCost.toLocaleString('cs-CZ')} Kč
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(car.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Smazat
                        </button>
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