import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCar, type Car } from '../api/cars';
import { getServiceRecords, deleteServiceRecord, type ServiceRecord } from '../api/service';
import AddServiceModal from '../components/AddServiceModal';

function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    try {
      const [carData, recordsData] = await Promise.all([
        getCar(id),
        getServiceRecords(id),
      ]);
      setCar(carData);
      setRecords(recordsData);
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

  const totalCost = records.reduce((sum, r) => sum + (r.price || 0), 0);

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
          {car.vin && <p className="text-slate-500 text-sm mt-1">VIN: {car.vin}</p>}
        </div>

        <div className="bg-slate-800 p-4 rounded-lg mb-6 flex justify-between items-center">
          <span className="text-slate-300">Celkové náklady na servis</span>
          <span className="text-white text-xl font-bold">{totalCost.toLocaleString('cs-CZ')} Kč</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Servisní historie</h2>
          <button
            onClick={() => setShowModal(true)}
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
      </div>

      {showModal && id && (
        <AddServiceModal
          carId={id}
          onClose={() => setShowModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}

export default CarDetailPage;