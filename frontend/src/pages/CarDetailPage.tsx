import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, type Car } from '../api/cars';
import { getServiceRecords, deleteServiceRecord, type ServiceRecord } from '../api/service';
import { getFuelRecords, deleteFuelRecord, getFuelStats, type FuelRecord, type FuelStats } from '../api/fuel';
import { getExpenses, deleteExpense, EXPENSE_CATEGORY_LABELS, type Expense } from '../api/expenses';
import AddServiceModal from '../components/AddServiceModal';
import AddFuelModal from '../components/AddFuelModal';
import AddExpenseModal from '../components/AddExpenseModal';

function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [fuelStats, setFuelStats] = useState<FuelStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'service' | 'fuel' | 'expenses'>('service');

  async function loadData() {
    if (!id) return;
    setLoading(true);
    try {
      const [carData, recordsData, fuelData, statsData, expensesData] = await Promise.all([
        getCar(id),
        getServiceRecords(id),
        getFuelRecords(id),
        getFuelStats(id),
        getExpenses(id),
      ]);
      setCar(carData);
      setRecords(recordsData);
      setFuelRecords(fuelData);
      setFuelStats(statsData);
      setExpenses(expensesData);
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

  const totalServiceCost = records.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalExpensesCost = expenses.reduce((sum, e) => sum + e.price, 0);
  const totalOverallCost = totalServiceCost + totalExpensesCost + (fuelStats?.totalSpent || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Načítám...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Auto nenalezeno.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-blue-400 hover:underline text-sm">
          ← Zpět na dashboard
        </Link>

        <div className="bg-slate-800 p-6 rounded-lg shadow-xl mt-4 mb-6">
          <h1 className="text-2xl font-bold text-white">{car.make} {car.model}</h1>
          <p className="text-slate-400 mt-1">
            {car.year && `Rok: ${car.year}`} {car.licensePlate && `• SPZ: ${car.licensePlate}`}
          </p>
          <p className="text-slate-400">
            Aktuální nájezd: {car.mileage?.toLocaleString('cs-CZ')} km
          </p>
        </div>

        {/* Statistiky */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <p className="text-slate-400 text-xs">Průměrná spotřeba</p>
            <p className="text-white font-bold text-lg">
              {fuelStats?.averageConsumption !== null && fuelStats?.averageConsumption !== undefined
                ? `${fuelStats.averageConsumption} l/100km` : '—'}
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <p className="text-slate-400 text-xs">Palivo celkem</p>
            <p className="text-white font-bold text-lg">{(fuelStats?.totalSpent || 0).toLocaleString('cs-CZ')} Kč</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <p className="text-slate-400 text-xs">Servis + výdaje</p>
            <p className="text-white font-bold text-lg">
              {(totalServiceCost + totalExpensesCost).toLocaleString('cs-CZ')} Kč
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg text-center border border-blue-600">
            <p className="text-slate-400 text-xs">Celkem za auto</p>
            <p className="text-white font-bold text-lg">{totalOverallCost.toLocaleString('cs-CZ')} Kč</p>
          </div>
        </div>

        {/* Přepínač záložek */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('service')}
            className={`px-4 py-2 rounded font-semibold ${
              activeTab === 'service' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            🔧 Servis
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-4 py-2 rounded font-semibold ${
              activeTab === 'fuel' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            ⛽ Tankování
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded font-semibold ${
              activeTab === 'expenses' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            💰 Výdaje
          </button>
        </div>

        {/* Servisní historie */}
        {activeTab === 'service' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Servisní historie</h2>
              <button
                onClick={() => setShowServiceModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
              >
                + Přidat záznam
              </button>
            </div>

            {records.length === 0 ? (
              <p className="text-slate-400">Zatím žádné servisní záznamy.</p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="bg-slate-800 p-4 rounded-lg shadow flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{record.type}</h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(record.date).toLocaleDateString('cs-CZ')}
                        {record.mileage && ` • ${record.mileage.toLocaleString('cs-CZ')} km`}
                      </p>
                      {record.description && (
                        <p className="text-slate-400 text-sm mt-1">{record.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {record.price && (
                        <p className="text-white font-semibold">{record.price.toLocaleString('cs-CZ')} Kč</p>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-400 hover:text-red-300 text-sm mt-1"
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

        {/* Tankování */}
        {activeTab === 'fuel' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Tankování</h2>
              <button
                onClick={() => setShowFuelModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
              >
                + Přidat tankování
              </button>
            </div>

            {fuelRecords.length === 0 ? (
              <p className="text-slate-400">Zatím žádné záznamy tankování.</p>
            ) : (
              <div className="space-y-3">
                {fuelRecords.map((record) => (
                  <div key={record.id} className="bg-slate-800 p-4 rounded-lg shadow flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">
                        {record.fuelType} {!record.fullTank && '(částečné)'}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(record.date).toLocaleDateString('cs-CZ')} • {record.mileage.toLocaleString('cs-CZ')} km
                      </p>
                      <p className="text-slate-400 text-sm">
                        {record.liters} l × {record.pricePerLiter} Kč/l
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{record.totalPrice.toLocaleString('cs-CZ')} Kč</p>
                      <button
                        onClick={() => handleDeleteFuel(record.id)}
                        className="text-red-400 hover:text-red-300 text-sm mt-1"
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

        {/* Výdaje */}
        {activeTab === 'expenses' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Výdaje</h2>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
              >
                + Přidat výdaj
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-slate-400">Zatím žádné výdaje.</p>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="bg-slate-800 p-4 rounded-lg shadow flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{EXPENSE_CATEGORY_LABELS[expense.category]}</h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(expense.date).toLocaleDateString('cs-CZ')}
                      </p>
                      {expense.description && (
                        <p className="text-slate-400 text-sm mt-1">{expense.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{expense.price.toLocaleString('cs-CZ')} Kč</p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-400 hover:text-red-300 text-sm mt-1"
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
    </div>
  );
}

export default CarDetailPage;