import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCars, deleteCar, type Car } from '../api/cars';
import AddCarModal from '../components/AddCarModal';

function DashboardPage() {
  const { user, logout } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadCars() {
    setLoading(true);
    try {
      const data = await getCars();
      setCars(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCars();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Opravdu smazat toto auto?')) return;
    await deleteCar(id);
    loadCars();
  }

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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Moje auta</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          >
            + Přidat auto
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Načítám...</p>
        ) : cars.length === 0 ? (
          <p className="text-slate-400">Zatím nemáš přidaná žádná auta.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cars.map((car) => (
              <div key={car.id} className="bg-slate-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {car.make} {car.model}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {car.year && `Rok: ${car.year}`} {car.licensePlate && `• SPZ: ${car.licensePlate}`}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Nájezd: {car.mileage?.toLocaleString('cs-CZ')} km
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(car.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddCarModal
          onClose={() => setShowModal(false)}
          onCreated={loadCars}
        />
      )}
    </div>
  );
}

export default DashboardPage;