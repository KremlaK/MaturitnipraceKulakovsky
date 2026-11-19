import { useState, type FormEvent } from 'react';
import { updateCar, type Car, type CarInput } from '../api/cars';
import { CAR_MAKES, CAR_MAKE_NAMES } from '../data/carMakes';
import CarPhotoField from './CarPhotoField';
import { getErrorMessage } from '../api/axios';
import BodyTypePicker from './BodyTypePicker';

interface Props {
  car: Car;
  onClose: () => void;
  onUpdated: () => void;
}

function EditCarModal({ car, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<CarInput>({
    make: car.make,
    model: car.model,
    vin: car.vin || undefined,
    licensePlate: car.licensePlate || undefined,
    year: car.year || undefined,
    mileage: car.mileage || undefined,
    bodyType: car.bodyType ?? null,
    notes: car.notes || undefined,
    photoUrl: car.photoUrl ?? null,
    photoView: car.photoView ?? 'FRONT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableModels = form.make ? CAR_MAKES[form.make] || [] : [];
  const isKnownMake = CAR_MAKE_NAMES.includes(form.make);

  function handleMakeChange(make: string) {
    setForm({ ...form, make, model: '' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateCar(car.id, form);
      onUpdated();
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
        <h2 className="text-ink font-display font-semibold text-lg mb-4 uppercase tracking-wider">Upravit auto</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Značka *</label>
              {isKnownMake ? (
                <select
                  required
                  value={form.make}
                  onChange={(e) => handleMakeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
                >
                  {CAR_MAKE_NAMES.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
                />
              )}
            </div>
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Model *</label>
              {/* Výběr jen u modelu ze seznamu; vlastní název (např. „Octavia Combi 2.0 TDI“) zůstane v textovém poli */}
              {isKnownMake && availableModels.length > 0 && (availableModels.includes(form.model) || form.model === '') ? (
                <select
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
                >
                  <option value="">Vyber model</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Rok výroby</label>
              <select
                value={form.year || ''}
                onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
              >
                <option value="">Vyber rok</option>
                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Nájezd (km)</label>
              <input
                type="number"
                min={0}
                value={form.mileage || ''}
                onChange={(e) => setForm({ ...form, mileage: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
              />
            </div>
          </div>

          <BodyTypePicker
            value={form.bodyType ?? null}
            onChange={(bodyType) => setForm({ ...form, bodyType })}
            makeModel={`${form.make} ${form.model}`}
          />

          <div>
            <label className="block label-caps text-xs text-ink-muted mb-1">SPZ</label>
            <input
              type="text"
              value={form.licensePlate || ''}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
            />
          </div>

          <div>
            <label className="block label-caps text-xs text-ink-muted mb-1">VIN</label>
            <input
              type="text"
              value={form.vin || ''}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
            />
          </div>

          <div>
            <label className="block label-caps text-xs text-ink-muted mb-1">Poznámky</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge"
            />
          </div>

          <CarPhotoField
            url={form.photoUrl ?? null}
            view={form.photoView ?? 'FRONT'}
            onChange={({ url, view }) => setForm({ ...form, photoUrl: url, photoView: view })}
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
              className="flex-1 border border-panel-border text-ink-muted hover:text-ink hover:border-accent py-2 rounded font-mono-gauge text-sm uppercase tracking-wider"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:brightness-110 text-on-accent py-2 rounded font-mono-gauge font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCarModal;
