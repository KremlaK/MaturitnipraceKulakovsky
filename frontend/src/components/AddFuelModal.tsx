import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createFuelRecord, getFuelRecords, type FuelRecordInput } from '../api/fuel';
import { getCar } from '../api/cars';
import LocationPicker from './LocationPicker';
import { getErrorMessage } from '../api/axios';

const FUEL_TYPES = ['Natural 95', 'Natural 98', 'Nafta', 'LPG', 'CNG', 'Elektřina'];

interface Props {
  carId: string;
  onClose: () => void;
  onCreated: () => void;
}

// Dnešní datum v místním čase (toISOString by po půlnoci UTC vrátil včerejšek)
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Přijme desetinnou čárku i tečku („45,5“ i „45.5“)
function parseDecimal(text: string) {
  const n = Number(text.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
const DECIMAL_PATTERN = '[0-9]+([.,][0-9]{1,3})?';

const inputClass = 'w-full h-12 px-3 rounded bg-asphalt-light text-ink border border-panel-border focus:outline-none focus:border-accent font-mono-gauge text-lg';

function AddFuelModal({ carId, onClose, onCreated }: Props) {
  // Co víme z minula: poslední stav tachometru a poslední tankování
  const [previous, setPrevious] = useState<{ mileage: number | null; pricePerLiter: number | null } | null>(null);
  const touched = useRef({ mileage: false, fuelType: false });
  const [form, setForm] = useState<FuelRecordInput>({
    date: today(),
    liters: 0,
    pricePerLiter: 0,
    mileage: 0,
    fuelType: 'Natural 95',
    fullTank: true,
    latitude: null,
    longitude: null,
  });
  const [litersText, setLitersText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getCar(carId), getFuelRecords(carId)])
      .then(([car, records]) => {
        if (!active) return;
        const last = [...records].sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
        const mileage = Math.max(car.mileage ?? 0, last?.mileage ?? 0) || null;
        setPrevious({ mileage, pricePerLiter: last?.pricePerLiter ?? null });
        // předvyplnit jen to, na co uživatel ještě nesáhl
        setForm((f) => ({
          ...f,
          mileage: touched.current.mileage || !mileage ? f.mileage : mileage,
          fuelType: touched.current.fuelType || !last ? f.fuelType : last.fuelType,
        }));
      })
      .catch(() => active && setPrevious({ mileage: null, pricePerLiter: null }));
    return () => {
      active = false;
    };
  }, [carId]);

  const total = form.liters && form.pricePerLiter ? form.liters * form.pricePerLiter : 0;
  const totalPrice = total.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const driven = previous?.mileage && form.mileage ? form.mileage - previous.mileage : null;

  function handleLocationChange(lat: number, lng: number, placeName?: string) {
    setForm((current) => ({ ...current, latitude: lat, longitude: lng, placeName }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createFuelRecord(carId, form);
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
        <h2 className="text-ink font-display font-semibold text-lg mb-4 uppercase tracking-wider">Tankování</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Datum *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Typ paliva *</label>
              <select
                required
                value={form.fuelType}
                onChange={(e) => {
                  touched.current.fuelType = true;
                  setForm({ ...form, fuelType: e.target.value });
                }}
                className={inputClass}
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Litry *</label>
              <input
                type="text"
                required
                inputMode="decimal"
                pattern={DECIMAL_PATTERN}
                title="Číslo, např. 45,5"
                autoFocus
                value={litersText}
                onChange={(e) => {
                  setLitersText(e.target.value);
                  setForm({ ...form, liters: parseDecimal(e.target.value) });
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block label-caps text-xs text-ink-muted mb-1">Cena za litr *</label>
              <input
                type="text"
                required
                inputMode="decimal"
                pattern={DECIMAL_PATTERN}
                title="Číslo, např. 38,90"
                placeholder={previous?.pricePerLiter ? `minule ${previous.pricePerLiter.toLocaleString('cs-CZ')}` : undefined}
                value={priceText}
                onChange={(e) => {
                  setPriceText(e.target.value);
                  setForm({ ...form, pricePerLiter: parseDecimal(e.target.value) });
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div className="bg-asphalt-light border border-panel-border rounded px-3 py-2 flex justify-between items-baseline" aria-live="polite">
            <span className="label-caps text-xs text-ink-muted">Celkem</span>
            <span className="text-accent font-mono-gauge font-bold text-lg">{totalPrice} Kč</span>
          </div>

          <div>
            <label className="block label-caps text-xs text-ink-muted mb-1">Stav tachometru (km) *</label>
            <input
              type="number"
              required
              min={0}
              inputMode="numeric"
              value={form.mileage || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                touched.current.mileage = true;
                setForm({ ...form, mileage: Number(e.target.value) });
              }}
              className={inputClass}
              aria-describedby="mileage-hint"
            />
            <p id="mileage-hint" className={`text-xs mt-1 tnum ${driven != null && driven < 0 ? 'text-warning-red' : 'text-ink-muted'}`}>
              {previous?.mileage == null
                ? 'Zadej aktuální stav tachometru.'
                : driven == null || driven === 0
                  ? `Minule ${previous.mileage.toLocaleString('cs-CZ')} km — přepiš na dnešní stav.`
                  : driven > 0
                    ? `+ ${driven.toLocaleString('cs-CZ')} km od minula (${previous.mileage.toLocaleString('cs-CZ')} km)`
                    : `Méně než minule (${previous.mileage.toLocaleString('cs-CZ')} km) — zkontroluj, jestli je to správně.`}
            </p>
          </div>

          <label className="flex items-center gap-2 text-ink-muted text-sm font-mono-gauge">
            <input
              type="checkbox"
              checked={form.fullTank}
              onChange={(e) => setForm({ ...form, fullTank: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
            Tankoval jsem do plna
          </label>
          <p className="text-ink-muted text-xs -mt-2 font-mono-gauge opacity-70">
            Pro přesný výpočet spotřeby je potřeba tankovat vždy do plna.
          </p>

          <LocationPicker
            latitude={form.latitude ?? null}
            longitude={form.longitude ?? null}
            onChange={handleLocationChange}
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
              {loading ? 'Ukládám...' : 'Přidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFuelModal;
