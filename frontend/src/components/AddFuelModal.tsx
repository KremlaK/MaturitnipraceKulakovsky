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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
      <div className="bg-panel border border-panel-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-display font-semibold text-lg mb-4 uppercase tracking-wider">Tankování</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Datum *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Typ paliva *</label>
              <select
                required
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Litry *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.liters || ''}
                onChange={(e) => setForm({ ...form, liters: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Cena za litr *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={form.pricePerLiter || ''}
                onChange={(e) => setForm({ ...form, pricePerLiter: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
          </div>

          <div className="bg-asphalt-light border border-panel-border rounded px-3 py-2 text-center">
            <span className="text-slate-500 text-xs font-mono-gauge">CELKEM: </span>
            <span className="text-gauge-yellow font-mono-gauge font-bold">{totalPrice} Kč</span>
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Stav tachometru (km) *</label>
            <input
              type="number"
              required
              min={0}
              value={form.mileage || ''}
              onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-400 text-sm font-mono-gauge">
            <input
              type="checkbox"
              checked={form.fullTank}
              onChange={(e) => setForm({ ...form, fullTank: e.target.checked })}
              className="w-4 h-4 accent-gauge-yellow"
            />
            Tankoval jsem do plna
          </label>
          <p className="text-slate-600 text-xs -mt-2 font-mono-gauge">
            Pro přesný výpočet spotřeby je potřeba tankovat vždy do plna.
          </p>

          {error && (
            <p className="text-warning-red text-sm font-mono-gauge border border-warning-red/30 bg-warning-red/10 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-panel-border text-slate-400 hover:text-white hover:border-slate-500 py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gauge-yellow hover:brightness-110 text-black py-2 rounded font-mono-gauge font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFuelModal;