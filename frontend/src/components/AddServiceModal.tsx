import { useState, type FormEvent } from 'react';
import { createServiceRecord, type ServiceRecordInput } from '../api/service';

const SERVICE_TYPES = [
  'Výměna oleje', 'STK', 'Emise', 'Pneumatiky', 'Brzdy', 'Filtry',
  'Klimatizace', 'Baterie', 'Karoserie', 'Elektrika', 'Jiná oprava',
];

interface Props {
  carId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddServiceModal({ carId, onClose, onCreated }: Props) {
  const [form, setForm] = useState<ServiceRecordInput>({
    type: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createServiceRecord(carId, form);
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
        <h2 className="text-xl font-bold text-white mb-4">Přidat servisní záznam</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Typ opravy *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="">Vyber typ</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

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
              <label className="block text-slate-300 text-sm mb-1">Cena (Kč)</label>
              <input
                type="number"
                min={0}
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Stav tachometru (km)</label>
            <input
              type="number"
              min={0}
              value={form.mileage || ''}
              onChange={(e) => setForm({ ...form, mileage: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Poznámka</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

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
              {loading ? 'Ukládám...' : 'Přidat záznam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddServiceModal;