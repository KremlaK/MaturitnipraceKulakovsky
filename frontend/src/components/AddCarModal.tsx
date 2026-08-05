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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Přidat auto</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Značka *</label>
              <select
                required
                value={form.make}
                onChange={(e) => handleMakeChange(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="">Vyber značku</option>
                {CAR_MAKE_NAMES.map((make) => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Model *</label>
              <select
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                disabled={!form.make}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
              <label className="block text-slate-300 text-sm mb-1">Rok výroby</label>
              <select
                value={form.year || ''}
                onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="">Vyber rok</option>
                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Nájezd (km)</label>
              <input
                type="number"
                min={0}
                value={form.mileage || ''}
                onChange={(e) => setForm({ ...form, mileage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">SPZ</label>
            <input
              type="text"
              value={form.licensePlate || ''}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">VIN</label>
            <input
              type="text"
              value={form.vin || ''}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <FileUpload
            label="Fotka auta"
            accept="image/*"
            currentUrl={form.photoUrl}
            onUploaded={(url) => setForm({ ...form, photoUrl: url })}
          />

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
              {loading ? 'Ukládám...' : 'Přidat auto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCarModal;