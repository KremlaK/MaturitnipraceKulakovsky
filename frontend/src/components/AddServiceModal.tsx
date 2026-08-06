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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
      <div className="bg-panel border border-panel-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-display font-semibold text-lg mb-4 uppercase tracking-wider">Servisní záznam</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Typ opravy *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            >
              <option value="">Vyber typ</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

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
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Cena (Kč)</label>
              <input
                type="number"
                min={0}
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Stav tachometru (km)</label>
            <input
              type="number"
              min={0}
              value={form.mileage || ''}
              onChange={(e) => setForm({ ...form, mileage: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Poznámka</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

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

export default AddServiceModal;