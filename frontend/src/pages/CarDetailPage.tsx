import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Icon, { type IconName } from '../components/Icon';
import LicensePlate from '../components/LicensePlate';
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
import ShareCarModal from '../components/ShareCarModal';
import CarCharts from '../components/CarCharts';
import PhotoGallery from '../components/PhotoGallery';

type Tab = 'service' | 'fuel' | 'expenses' | 'stats' | 'reminders' | 'gallery';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'service', label: 'Servis', icon: 'wrench' },
  { id: 'fuel', label: 'Tankování', icon: 'fuel' },
  { id: 'expenses', label: 'Výdaje', icon: 'receipt' },
  { id: 'stats', label: 'Statistiky', icon: 'chart' },
  { id: 'reminders', label: 'Připomínky', icon: 'bell' },
  { id: 'gallery', label: 'Galerie', icon: 'camera' },
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
  const [showShareModal, setShowShareModal] = useState(false);

  // Stav se nastavuje až v callbacku po načtení, ne synchronně v efektu
  const loadData = useCallback(() => {
    if (!id) return Promise.resolve();
    return Promise.all([
      getCar(id),
      getServiceRecords(id),
      getFuelRecords(id),
      getFuelStats(id),
      getExpenses(id),
      getCarStats(id),
      getReminders(id),
      getPhotos(id),
    ]).then(([carData, recordsData, fuelData, statsData, expensesData, chartStats, remindersData, photosData]) => {
      setCar(carData);
      setRecords(recordsData);
      setFuelRecords(fuelData);
      setFuelStats(statsData);
      setExpenses(expensesData);
      setCarStats(chartStats);
      setReminders(remindersData);
      setPhotos(photosData);
    })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading || !car) {
    return (
      <AppShell>
        <p className="px-4 md:px-7 py-10 text-ink-muted">{loading ? 'Načítám…' : 'Auto nenalezeno.'}</p>
      </AppShell>
    );
  }

  const actionClass = 'h-9 px-3 rounded-lg border border-panel-border bg-panel text-ink hover:border-ink-muted text-sm inline-flex items-center gap-1.5';

  return (
    <AppShell onFuel={() => setShowFuelModal(true)}>
    <div className="px-4 md:px-7 py-5 md:py-7">
      <div className="max-w-5xl">
        <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
          <Link to={`/cars/${id}`} className="text-ink-muted hover:text-ink text-sm inline-flex items-center gap-1.5">
            <Icon name="arrowLeft" size={16} /> Přehled auta
          </Link>
          <div className="flex gap-3 items-center flex-wrap justify-end">
            {car.isOwner === false && car.myRole && (
              <span className="text-ink-muted text-xs font-mono-gauge border border-panel-border rounded px-2 py-1">
                Sdíleno jako: {car.myRole === 'SPOLUMAJITEL' ? 'Spolumajitel' : 'Servis'}
              </span>
            )}
            <button
              onClick={() => handleExport('pdf')}
              className={actionClass}
            >
              <Icon name="file" size={16} /> Servisní knížka PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className={actionClass}
            >
              <Icon name="table" size={16} /> Náklady Excel
            </button>
            {car.isOwner !== false && (
              <>
                <button
                  onClick={() => setShowShareModal(true)}
                  className={actionClass}
                >
                  <Icon name="share" size={16} /> Sdílet
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className={actionClass}
                >
                  <Icon name="edit" size={16} /> Upravit
                </button>
              </>
            )}
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
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <p className="label-caps text-xs text-ink-muted mb-1">Kniha údržby</p>
                <h1 className="font-display font-bold text-2xl md:text-[32px] leading-none tracking-wide">{car.make} {car.model}</h1>
              </div>
              {car.licensePlate && <LicensePlate plate={car.licensePlate} />}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-panel-border">
              <div>
                <p className="text-ink-muted text-xs uppercase tracking-wider">Rok</p>
                <p className="font-mono-gauge text-ink">{car.year || '—'}</p>
              </div>
              <div>
                <p className="text-ink-muted text-xs uppercase tracking-wider">Nájezd</p>
                <p className="font-mono-gauge text-ink">{car.mileage?.toLocaleString('cs-CZ')} km</p>
              </div>
              <div>
                <p className="text-ink-muted text-xs uppercase tracking-wider">VIN</p>
                <p className="font-mono-gauge text-ink text-sm">{car.vin || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-panel border border-panel-border rounded-lg p-3 text-center">
            <p className="text-ink-muted text-xs uppercase tracking-wider">Spotřeba</p>
            <p className="font-mono-gauge text-accent font-bold text-lg">
              {fuelStats?.averageConsumption !== null && fuelStats?.averageConsumption !== undefined
                ? fuelStats.averageConsumption.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}
              <span className="text-xs text-ink-muted ml-1">l/100</span>
            </p>
          </div>
          <div className="bg-panel border border-panel-border rounded-lg p-3 text-center">
            <p className="text-ink-muted text-xs uppercase tracking-wider">Palivo</p>
            <p className="font-mono-gauge text-ink font-bold text-lg">
              {Math.round(fuelStats?.totalSpent || 0).toLocaleString('cs-CZ')} Kč
            </p>
          </div>
          <div className="bg-panel border border-panel-border rounded-lg p-3 text-center">
            <p className="text-ink-muted text-xs uppercase tracking-wider">Servis+Výd.</p>
            <p className="font-mono-gauge text-ink font-bold text-lg">
              {Math.round(totalServiceCost + totalExpensesCost).toLocaleString('cs-CZ')} Kč
            </p>
          </div>
          <div className="bg-panel border border-accent/40 rounded-lg p-3 text-center">
            <p className="text-ink-muted text-xs uppercase tracking-wider">Celkem</p>
            <p className="font-mono-gauge text-accent font-bold text-lg">
              {Math.round(totalOverallCost).toLocaleString('cs-CZ')} Kč
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 h-10 rounded-lg label-caps text-sm whitespace-nowrap border transition inline-flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-panel text-ink-muted border-panel-border hover:border-accent/50'
              }`}
            >
              <Icon name={tab.icon} size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'service' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-ink font-display font-semibold uppercase tracking-wider text-sm">Servisní knížka</h2>
              <button
                onClick={() => setShowServiceModal(true)}
                className="bg-accent hover:brightness-110 text-on-accent px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {records.length === 0 ? (
              <p className="text-ink-muted font-mono-gauge text-sm">Zatím žádné servisní záznamy.</p>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <div key={record.id} className="bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-ink font-display font-semibold">{record.type}</h3>
                      <p className="text-ink-muted text-xs font-mono-gauge mt-1">
                        {new Date(record.date).toLocaleDateString('cs-CZ')}
                        {record.mileage && ` • ${record.mileage.toLocaleString('cs-CZ')} km`}
                      </p>
                      {record.description && (
                        <p className="text-ink-muted text-sm mt-1">{record.description}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {record.invoiceUrl && (
                          <a href={record.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs font-mono-gauge">
                            <Icon name="file" size={14} className="inline -mt-0.5 mr-1" />Faktura
                          </a>
                        )}
                        {record.photoUrl && (
                          <a href={record.photoUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs font-mono-gauge">
                            <Icon name="camera" size={14} className="inline -mt-0.5 mr-1" />Foto
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {record.price && (
                        <p className="text-ink font-mono-gauge font-semibold">{record.price.toLocaleString('cs-CZ')} Kč</p>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-ink-muted hover:text-warning-red text-xs mt-1"
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
              <h2 className="text-ink font-display font-semibold uppercase tracking-wider text-sm">Tankování</h2>
              <button
                onClick={() => setShowFuelModal(true)}
                className="bg-accent hover:brightness-110 text-on-accent px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {fuelRecords.length === 0 ? (
              <p className="text-ink-muted font-mono-gauge text-sm">Zatím žádné záznamy tankování.</p>
            ) : (
              <div className="space-y-2">
                {fuelRecords.map((record) => (
                  <div key={record.id} className="bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-ink font-display font-semibold">
                        {record.fuelType} {!record.fullTank && <span className="text-ink-muted text-xs">(částečné)</span>}
                      </h3>
                      <p className="text-ink-muted text-xs font-mono-gauge mt-1">
                        {new Date(record.date).toLocaleDateString('cs-CZ')} • {record.mileage.toLocaleString('cs-CZ')} km
                      </p>
                      <p className="text-ink-muted text-xs font-mono-gauge">
                        {record.liters} l × {record.pricePerLiter} Kč/l
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-ink font-mono-gauge font-semibold">{record.totalPrice.toLocaleString('cs-CZ')} Kč</p>
                      <button
                        onClick={() => handleDeleteFuel(record.id)}
                        className="text-ink-muted hover:text-warning-red text-xs mt-1"
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
              <h2 className="text-ink font-display font-semibold uppercase tracking-wider text-sm">Výdaje</h2>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-accent hover:brightness-110 text-on-accent px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-ink-muted font-mono-gauge text-sm">Zatím žádné výdaje.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="bg-panel border border-panel-border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-ink font-display font-semibold">{EXPENSE_CATEGORY_LABELS[expense.category]}</h3>
                      <p className="text-ink-muted text-xs font-mono-gauge mt-1">
                        {new Date(expense.date).toLocaleDateString('cs-CZ')}
                      </p>
                      {expense.description && (
                        <p className="text-ink-muted text-sm mt-1">{expense.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-ink font-mono-gauge font-semibold">{expense.price.toLocaleString('cs-CZ')} Kč</p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-ink-muted hover:text-warning-red text-xs mt-1"
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
              <h2 className="text-ink font-display font-semibold uppercase tracking-wider text-sm">Kontrolky</h2>
              <button
                onClick={() => setShowReminderModal(true)}
                className="bg-accent hover:brightness-110 text-on-accent px-4 py-2 rounded font-mono-gauge text-sm font-bold"
              >
                + Přidat
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className="text-ink-muted font-mono-gauge text-sm">Zatím žádné připomínky.</p>
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
                          className="w-5 h-5 mt-1 accent-accent"
                        />
                        <div>
                          <h3 className="text-ink font-display font-semibold">
                            {reminder.title}
                            <span className="text-ink-muted text-xs ml-2 font-mono-gauge">({REMINDER_TYPE_LABELS[reminder.type]})</span>
                          </h3>
                          <div className="flex gap-3 text-xs font-mono-gauge mt-1">
                            {reminder.dueDate && (
                              <span className={dateInfo.urgent && !reminder.completed ? 'text-warning-red font-semibold' : 'text-ink-muted'}>
                                {new Date(reminder.dueDate).toLocaleDateString('cs-CZ')} {!reminder.completed && `(${dateInfo.text})`}
                              </span>
                            )}
                            {reminder.dueMileage && (
                              <span className="text-ink-muted">při {reminder.dueMileage.toLocaleString('cs-CZ')} km</span>
                            )}
                          </div>
                          {reminder.notes && <p className="text-ink-muted text-sm mt-1">{reminder.notes}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-ink-muted hover:text-warning-red text-xs"
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
              <h2 className="text-ink font-display font-semibold uppercase tracking-wider text-sm">Galerie</h2>
              <button
                onClick={() => setShowPhotoModal(true)}
                className="bg-accent hover:brightness-110 text-on-accent px-4 py-2 rounded font-mono-gauge text-sm font-bold"
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
      {showShareModal && id && (
        <ShareCarModal carId={id} onClose={() => setShowShareModal(false)} />
      )}
    </div>
    </AppShell>
  );
}

export default CarDetailPage;