import { useState, type FormEvent } from 'react';
import { createReminder, REMINDER_TYPE_LABELS, type ReminderInput, type ReminderType } from '../api/reminders';

interface Props {
  carId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddReminderModal({ carId, onClose, onCreated }: Props) {
  const [form, setForm] = useState<ReminderInput>({
    type: 'STK',
    title: '',
    emailAlert: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleTypeChange(type: ReminderType) {
    setForm({ ...form, type, title: type !== 'VLASTNI' ? REMINDER_TYPE_LABELS[type] : '' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.dueDate && !form.dueMileage) {
      setError('Zadej alespoň datum nebo nájezd.');
      return;
    }

    setLoading(true);
    try {
      await createReminder(carId, form);
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
        <h2 className="text-white font-display font-semibold text-lg mb-4 uppercase tracking-wider">Nová kontrolka</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Typ *</label>
            <select
              required
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value as ReminderType)}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            >
              {Object.entries(REMINDER_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Název *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Termín (datum)</label>
              <input
                type="date"
                value={form.dueDate || ''}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Nebo nájezd (km)</label>
              <input
                type="number"
                min={0}
                value={form.dueMileage || ''}
                onChange={(e) => setForm({ ...form, dueMileage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
          </div>
          <p className="text-slate-600 text-xs -mt-2 font-mono-gauge">Vyplň alespoň jedno z polí výše.</p>

          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">Poznámka</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-400 text-sm font-mono-gauge">
            <input
              type="checkbox"
              checked={form.emailAlert}
              onChange={(e) => setForm({ ...form, emailAlert: e.target.checked })}
              className="w-4 h-4 accent-gauge-yellow"
            />
            Poslat e-mailové upozornění
          </label>

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

export default AddReminderModal;