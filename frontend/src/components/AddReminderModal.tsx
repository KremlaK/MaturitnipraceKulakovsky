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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Přidat připomínku</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Typ *</label>
            <select
              required
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value as ReminderType)}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              {Object.entries(REMINDER_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Název *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Termín (datum)</label>
              <input
                type="date"
                value={form.dueDate || ''}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Nebo nájezd (km)</label>
              <input
                type="number"
                min={0}
                value={form.dueMileage || ''}
                onChange={(e) => setForm({ ...form, dueMileage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-slate-500 text-xs -mt-2">Vyplň alespoň jedno z polí výše.</p>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Poznámka</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input
              type="checkbox"
              checked={form.emailAlert}
              onChange={(e) => setForm({ ...form, emailAlert: e.target.checked })}
              className="w-4 h-4"
            />
            Poslat e-mailové upozornění, až se termín přiblíží
          </label>

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
              {loading ? 'Ukládám...' : 'Přidat připomínku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddReminderModal;