import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, downloadCarExport, type Car } from '../api/cars';
import { getServiceRecords, deleteServiceRecord, type ServiceRecord } from '../api/service';
import { getFuelRecords, deleteFuelRecord, getFuelStats, type FuelRecord, type FuelStats } from '../api/fuel';
import { getExpenses, deleteExpense, EXPENSE_CATEGORY_LABELS, type Expense } from '../api/expenses';
import { getCarStats, type CarStats } from '../api/stats';
import { getReminders, deleteReminder, toggleReminderComplete, REMINDER_TYPE_LABELS, type Reminder } from '../api/reminders';
import { getPhotos, deletePhoto, type Photo } from '../api/photos';
import AddServiceModal from '../components/AddServiceModal';
import AddFuelModal from '../components/AddFuelModal';
import AddExpenseModal from '../components/AddExpenseModal';
import AddReminderModal from '../components/AddReminderModal';
import AddPhotoModal from '../components/AddPhotoModal';
import EditCarModal from '../components/EditCarModal';
import CarCharts from '../components/CarCharts';
import PhotoGallery from '../components/PhotoGallery';

type Tab = 'service' | 'fuel' | 'expenses' | 'stats' | 'reminders' | 'gallery';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'service', label: 'Servis', icon: '🔧' },
  { id: 'fuel', label: 'Tankování', icon: '⛽' },
  { id: 'expenses', label: 'Výdaje', icon: '💰' },
  { id: 'stats', label: 'Statistiky', icon: '📈' },
  { id: 'reminders', label: 'Kontrolky', icon: '⏰' },
  { id: 'gallery', label: 'Galerie', icon: '🖼️' },
];

function formatDaysUntil(dueDate: string | null): { text: string; urgent: boolean } {
  if (!dueDate) return { text: '', urgent: false };
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `Po termínu`, urgent: true };
  if (days === 0) return { text: 'Dnes!', urgent: true };
  if (days <= 30) return { text: `Za ${days} dní`, urgent: true };
  return { text: `Za ${days} dní`, urgent: false };
}

function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [fuelStats, setFuelStats] = useState<FuelStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [carStats, setCarStats] = useState<CarStats | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('service');

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    try {
      const [carData, recordsData, fuelData, statsData, expensesData, chartStats, remindersData, photosData] = await Promise.all([
        getCar(id),
        getServiceRecords(id),
        getFuelRecords(id),
        getFuelStats(id),
        getExpenses(id),
        getCarStats(id),
        getReminders(id),
        getPhotos(id),
      ]);
      setCar(carData);
      setRecords(recordsData);
      setFuelRecords(fuelData);
      setFuelStats(statsData);
      setExpenses(expensesData);
      setCarStats(chartStats);
      setReminders(remindersData);
      setPhotos(photosData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleDeleteRecord(recordId: string) {
    if (!confirm('Opravdu smazat tento záznam?')) return;
    await deleteServiceRecord(recordId);
    loadData();
  }

  async function handleDeleteFuel(recordId: string) {
    if (!confirm('Opravdu smazat toto tankování?')) return;
    await deleteFuelRecord(recordId);
    loadData();
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm('Opravdu smazat tento výdaj?')) return;
    await deleteExpense(expenseId);
    loadData();
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!confirm('Opravdu smazat tuto připomínku?')) return;
    await deleteReminder(reminderId);
    loadData();
  }

  async function handleToggleReminder(reminderId: string) {
    await toggleReminderComplete(reminderId);
    loadData();
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Opravdu smazat tuto fotku?')) return;
    await deletePhoto(photoId);
    loadData();
  }

  async function handleExport(format: 'pdf' | 'excel') {
    if (!id || !car) return;
    try {
      await downloadCarExport(id, format, `${car.make}-${car.model}`);
    } catch (err) {
      console.error(err);
      alert('Export se nezdařil.');
    }
  }

  const totalServiceCost = records.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalExpensesCost = expenses.reduce((sum, e) => sum + e.price, 0);
  const totalOverallCost = totalServiceCost + totalExpensesCost + (fuelStats?.totalSpent || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-asphalt flex items-center justify-center">
        <p className="text-slate-500 font-mono-gauge">Načítám...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-asphalt flex items-center justify-center">
        <p className="text-white font-mono-gauge">Auto nenalezeno.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-asphalt p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link to="/dashboard" className="text-slate-500 hover:text-gauge-yellow text-sm font-mono-gauge">
            ← Zpět do garáže
          </Link>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => handleExport('pdf')}
              className="text-slate-500 hover:text-gauge-yellow text-sm font-mono-gauge"
            >
              📄 PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="text-slate-500 hover:text-gauge-yellow text-sm font-mono-gauge"
            >
              📊 Excel
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-slate-500 hover:text-white text-sm font-mono-gauge"
            >
              ✏️ Upravit
            </button>
          </div>
        </div>

        <div className="bg-panel border border-panel-border rounded-xl overflow-hidden mb-6">
          {car.photoUrl && (
            <img
              src={car.photoUrl}
              alt={`${car.make} ${car.model}`}
              className="w-full h-48 object-cover object-center"
            />
          )}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gauge-yellow text-xs uppercase tracking-widest font-mono-gauge mb-1">
                  Technický průkaz
                </p>
                <h1 className="text-2xl font-display font-bold text-white">{car.make} {car.model}</h1>
              </div>
              {car.licensePlate && (
                <div className="border-2 border-panel-border rounded px-3 py-1.5 font-mono-gauge text-white font-bold tracking-wider">
                  {car.licensePlate}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-panel-border">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Rok</p>
                <p className="font-mono-gauge text-white">{car.year || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Nájezd</p>
                <p className="font-mono-gauge text-white">{car.mileage?.toLocaleString('cs-CZ')} km</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">VIN</p>
                <p className="font-mono-gauge text-white text-sm">{car.vin || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-panel border border-panel-border rounded-lg p-3 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider">Spotřeba</p>
            <p className="font-mono-gauge text-gauge-yellow font-bold text-lg">
              {fuelStats?.averageConsumption !== null && fuelStats?.averageConsumption !== undefined
                ? `${fuelStats.averageConsumption}` : '—'}
              <span className="text-xs text-slate-500 ml-1">l/100</span>
            </p>
          </div>
          <div className="bg-panel border border-panel-border rounded-lg p-3 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider">Palivo</p>
            <p className="font-mono-gauge text-white font-bold text-lg">
              {(fuelStats?.totalSpent || 0).toLocaleString('cs-CZ')}
            </p>
          </div>
          <div className="bg-panel border border-panel-border rounded-lg p-3 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider">Servis+Výd.</p>
            <p className="font-mono-gauge text-white font-bold text-lg">
              {(totalServiceCost + totalExpensesCost).toLocaleString('cs-CZ')}
            </p>
          </div>
          <div className="bg-panel border border-gauge-yellow/40 rounded-lg p-3 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider">Celkem</p>
            <p className="font-mono-gauge text-gauge-orange font-bold text-lg">
              {totalOverallCost.toLocaleString('cs-CZ')}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded font-mono-gauge text-sm font-semibold uppercase tracking-wide whitespace-nowrap border transition ${
                activeTab === tab.id
                  ? 'bg-gauge-yellow text-black border-gauge-yellow'
                  : 'bg-panel text-slate-400 border-panel-border hover:border-slate-500'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'service' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-display font-semibold uppercase tracking-wider text-sm">Servisní knížka</h2>
              <button
                onClick={() => setShowServiceModal(true)}
                className="bg-gauge-yellow hover:brightness-110 text-black px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {records.length === 0 ? (
              <p className="text-slate-500 font-mono-gauge text-sm">Zatím žádné servisní záznamy.</p>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <div key={record.id} className="bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-display font-semibold">{record.type}</h3>
                      <p className="text-slate-500 text-xs font-mono-gauge mt-1">
                        {new Date(record.date).toLocaleDateString('cs-CZ')}
                        {record.mileage && ` • ${record.mileage.toLocaleString('cs-CZ')} km`}
                      </p>
                      {record.description && (
                        <p className="text-slate-400 text-sm mt-1">{record.description}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {record.invoiceUrl && (
                          <a href={record.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-gauge-yellow hover:underline text-xs font-mono-gauge">
                            📎 Faktura
                          </a>
                        )}
                        {record.photoUrl && (
                          <a href={record.photoUrl} target="_blank" rel="noopener noreferrer" className="text-gauge-yellow hover:underline text-xs font-mono-gauge">
                            📷 Foto
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {record.price && (
                        <p className="text-white font-mono-gauge font-semibold">{record.price.toLocaleString('cs-CZ')} Kč</p>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-slate-600 hover:text-warning-red text-xs mt-1"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'fuel' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-display font-semibold uppercase tracking-wider text-sm">Tankování</h2>
              <button
                onClick={() => setShowFuelModal(true)}
                className="bg-gauge-yellow hover:brightness-110 text-black px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {fuelRecords.length === 0 ? (
              <p className="text-slate-500 font-mono-gauge text-sm">Zatím žádné záznamy tankování.</p>
            ) : (
              <div className="space-y-2">
                {fuelRecords.map((record) => (
                  <div key={record.id} className="bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-display font-semibold">
                        {record.fuelType} {!record.fullTank && <span className="text-slate-500 text-xs">(částečné)</span>}
                      </h3>
                      <p className="text-slate-500 text-xs font-mono-gauge mt-1">
                        {new Date(record.date).toLocaleDateString('cs-CZ')} • {record.mileage.toLocaleString('cs-CZ')} km
                      </p>
                      <p className="text-slate-500 text-xs font-mono-gauge">
                        {record.liters} l × {record.pricePerLiter} Kč/l
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono-gauge font-semibold">{record.totalPrice.toLocaleString('cs-CZ')} Kč</p>
                      <button
                        onClick={() => handleDeleteFuel(record.id)}
                        className="text-slate-600 hover:text-warning-red text-xs mt-1"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-display font-semibold uppercase tracking-wider text-sm">Výdaje</h2>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-gauge-yellow hover:brightness-110 text-black px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-slate-500 font-mono-gauge text-sm">Zatím žádné výdaje.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-display font-semibold">{EXPENSE_CATEGORY_LABELS[expense.category]}</h3>
                      <p className="text-slate-500 text-xs font-mono-gauge mt-1">
                        {new Date(expense.date).toLocaleDateString('cs-CZ')}
                      </p>
                      {expense.description && (
                        <p className="text-slate-400 text-sm mt-1">{expense.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono-gauge font-semibold">{expense.price.toLocaleString('cs-CZ')} Kč</p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-slate-600 hover:text-warning-red text-xs mt-1"
                      >
                        Smazat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'stats' && carStats && (
          <CarCharts stats={carStats} />
        )}

        {activeTab === 'reminders' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-display font-semibold uppercase tracking-wider text-sm">Kontrolky</h2>
              <button
                onClick={() => setShowReminderModal(true)}
                className="bg-gauge-yellow hover:brightness-110 text-black px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className="text-slate-500 font-mono-gauge text-sm">Zatím žádné připomínky.</p>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => {
                  const dateInfo = formatDaysUntil(reminder.dueDate);
                  return (
                    <div
                      key={reminder.id}
                      className={`bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start ${
                        reminder.completed ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <input
                          type="checkbox"
                          checked={reminder.completed}
                          onChange={() => handleToggleReminder(reminder.id)}
                          className="w-5 h-5 mt-1 accent-gauge-yellow"
                        />
                        <div>
                          <h3 className="text-white font-display font-semibold">
                            {reminder.title}
                            <span className="text-slate-600 text-xs ml-2 font-mono-gauge">({REMINDER_TYPE_LABELS[reminder.type]})</span>
                          </h3>
                          <div className="flex gap-3 text-xs font-mono-gauge mt-1">
                            {reminder.dueDate && (
                              <span className={dateInfo.urgent && !reminder.completed ? 'text-warning-red font-semibold' : 'text-slate-500'}>
                                📅 {new Date(reminder.dueDate).toLocaleDateString('cs-CZ')} {!reminder.completed && `(${dateInfo.text})`}
                              </span>
                            )}
                            {reminder.dueMileage && (
                              <span className="text-slate-500">🔧 {reminder.dueMileage.toLocaleString('cs-CZ')} km</span>
                            )}
                          </div>
                          {reminder.notes && <p className="text-slate-400 text-sm mt-1">{reminder.notes}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-slate-600 hover:text-warning-red text-xs"
                      >
                        Smazat
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'gallery' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-display font-semibold uppercase tracking-wider text-sm">Galerie</h2>
              <button
                onClick={() => setShowPhotoModal(true)}
                className="bg-gauge-yellow hover:brightness-110 text-black px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat fotku
              </button>
            </div>
            <PhotoGallery photos={photos} onDelete={handleDeletePhoto} />
          </>
        )}
      </div>

      {showServiceModal && id && (
        <AddServiceModal carId={id} onClose={() => setShowServiceModal(false)} onCreated={loadData} />
      )}
      {showFuelModal && id && (
        <AddFuelModal carId={id} onClose={() => setShowFuelModal(false)} onCreated={loadData} />
      )}
      {showExpenseModal && id && (
        <AddExpenseModal carId={id} onClose={() => setShowExpenseModal(false)} onCreated={loadData} />
      )}
      {showReminderModal && id && (
        <AddReminderModal carId={id} onClose={() => setShowReminderModal(false)} onCreated={loadData} />
      )}
      {showPhotoModal && id && (
        <AddPhotoModal carId={id} onClose={() => setShowPhotoModal(false)} onCreated={loadData} />
      )}
      {showEditModal && car && (
        <EditCarModal car={car} onClose={() => setShowEditModal(false)} onUpdated={loadData} />
      )}
    </div>
  );
}

export default CarDetailPage;