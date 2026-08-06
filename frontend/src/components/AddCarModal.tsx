import { useState, type FormEvent } from 'react';
import { createCar, type CarInput } from '../api/cars';
import { CAR_MAKES, CAR_MAKE_NAMES } from '../data/carMakes';
import FileUpload from './FileUpload';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function AddCarModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CarInput>({ make: '', model: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableModels = form.make ? CAR_MAKES[form.make] || [] : [];

  function handleMakeChange(make: string) {
    setForm({ ...form, make, model: '' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createCar(form);
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
      <div className="bg-panel border border-panel-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-display font-semibold text-lg mb-4 uppercase tracking-wider">Přidat auto</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Značka *</label>
              <select
                required
                value={form.make}
                onChange={(e) => handleMakeChange(e.target.value)}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              >
                <option value="">Vyber značku</option>
                {CAR_MAKE_NAMES.map((make) => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Model *</label>
              <select
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                disabled={!form.make}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge disabled:opacity-50"
              >
                <option value="">{form.make ? 'Vyber model' : 'Nejdřív vyber značku'}</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Rok výroby</label>
              <select
                value={form.year || ''}
                onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              >
                <option value="">Vyber rok</option>
                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Nájezd (km)</label>
              <input
                type="number"
                min={0}
                value={form.mileage || ''}
                onChange={(e) => setForm({ ...form, mileage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">SPZ</label>
            <input
              type="text"
              value={form.licensePlate || ''}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">VIN</label>
            <input
              type="text"
              value={form.vin || ''}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <FileUpload
            label="Fotka auta"
            accept="image/*"
            currentUrl={form.photoUrl}
            onUploaded={(url) => setForm({ ...form, photoUrl: url })}
          />

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

export default AddCarModal;