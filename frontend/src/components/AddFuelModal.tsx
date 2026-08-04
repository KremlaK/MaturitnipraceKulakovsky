import { useState, type FormEvent } from 'react';
import { createFuelRecord, type FuelRecordInput } from '../api/fuel';

const FUEL_TYPES = ['Natural 95', 'Natural 98', 'Nafta', 'LPG', 'CNG', 'Elektřina'];

interface Props {
  carId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddFuelModal({ carId, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FuelRecordInput>({
    date: new Date().toISOString().split('T')[0],
    liters: 0,
    pricePerLiter: 0,
    mileage: 0,
    fuelType: 'Natural 95',
    fullTank: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPrice = form.liters && form.pricePerLiter
    ? (form.liters * form.pricePerLiter).toFixed(2)
    : '0.00';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createFuelRecord(carId, form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Něco se pokazilo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Přidat tankování</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Datum *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Typ paliva *</label>
              <select
                required
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Litry *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.liters || ''}
                onChange={(e) => setForm({ ...form, liters: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Cena za litr *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.pricePerLiter || ''}
                onChange={(e) => setForm({ ...form, pricePerLiter: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-700/50 rounded px-3 py-2 text-center">
            <span className="text-slate-400 text-sm">Celková cena: </span>
            <span className="text-white font-semibold">{totalPrice} Kč</span>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Stav tachometru (km) *</label>
            <input
              type="number"
              required
              min={0}
              value={form.mileage || ''}
              onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input
              type="checkbox"
              checked={form.fullTank}
              onChange={(e) => setForm({ ...form, fullTank: e.target.checked })}
              className="w-4 h-4"
            />
            Tankoval jsem do plna
          </label>
          <p className="text-slate-500 text-xs -mt-2">
            Pro přesný výpočet spotřeby je potřeba tankovat vždy do plna.
          </p>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded font-semibold"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Přidat tankování'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFuelModal;