import { useState, type FormEvent } from 'react';
import { createPhoto, PHOTO_CATEGORY_LABELS, type PhotoInput, type PhotoCategory } from '../api/photos';
import FileUpload from './FileUpload';
import { getErrorMessage } from '../api/axios';

interface Props {
  carId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddPhotoModal({ carId, onClose, onCreated }: Props) {
  const [form, setForm] = useState<PhotoInput>({ url: '', category: 'AUTO' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.url) {
      setError('Nejdřív nahraj fotku.');
      return;
    }

    setLoading(true);
    try {
      await createPhoto(carId, form);
      onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Něco se pokazilo.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:px-4 z-50">
      <div className="bg-panel border border-panel-border rounded-t-xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto pb-[max(20px,env(safe-area-inset-bottom))]">
        <h2 className="text-ink font-display font-semibold text-lg mb-4 uppercase tracking-wider">Nová fotka</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <FileUpload
            label="Fotka"
            accept="image/*"
            currentUrl={form.url}
            onUploaded={(url) => setForm({ ...form, url })}
          />

          <div>
            <label className="block label-caps text-xs text-ink-muted mb-1">Kategorie *</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as PhotoCategory })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
            >
              {Object.entries(PHOTO_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block label-caps text-xs text-ink-muted mb-1">Popisek</label>
            <input
              type="text"
              value={form.caption || ''}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
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
              className="flex-1 border border-panel-border text-ink-muted hover:text-ink hover:border-accent py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:brightness-110 text-on-accent py-2 rounded font-mono-gauge font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPhotoModal;
