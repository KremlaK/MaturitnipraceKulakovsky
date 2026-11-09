import { useState, type FormEvent } from 'react';
import { createExpense, EXPENSE_CATEGORY_LABELS, type ExpenseInput, type ExpenseCategory } from '../api/expenses';

interface Props {
  carId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddExpenseModal({ carId, onClose, onCreated }: Props) {
  const [form, setForm] = useState<ExpenseInput>({
    category: 'POJISTENI',
    price: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createExpense(carId, form);
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
        <h2 className="text-ink font-display font-semibold text-lg mb-4 uppercase tracking-wider">Nový výdaj</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-ink-muted text-xs uppercase tracking-wider mb-1 font-mono-gauge">Kategorie *</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
            >
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-ink-muted text-xs uppercase tracking-wider mb-1 font-mono-gauge">Datum *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
            <div>
              <label className="block text-ink-muted text-xs uppercase tracking-wider mb-1 font-mono-gauge">Cena (Kč) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
              />
            </div>
          </div>

          <div>
            <label className="block text-ink-muted text-xs uppercase tracking-wider mb-1 font-mono-gauge">Poznámka</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge"
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
              className="flex-1 border border-panel-border text-ink-muted hover:text-ink hover:border-gauge-yellow py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
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

export default AddExpenseModal;
