import { useCallback, useEffect, useRef, useState } from 'react';
import { addStation, deleteStation, getStations, type RecentPlace, type Station } from '../api/stations';
import { searchPlaces, type PlaceSearchResult } from '../api/map';
import { getErrorMessage } from '../api/axios';
import { fieldClass, shortPlaceName } from '../lib/ui';
import Icon from './Icon';


// Správa oblíbených pump: vyhledání stanice, přidání z nedávných tankování, odebrání
export default function StationManager() {
  const [favorites, setFavorites] = useState<Station[] | null>(null);
  const [recent, setRecent] = useState<RecentPlace[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    () => getStations().then((d) => {
      setFavorites(d.favorites);
      setRecent(d.recent);
    }).catch((e) => setError(getErrorMessage(e, 'Pumpy se nepodařilo načíst.'))),
    [],
  );

  useEffect(() => {
    load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  function onQuery(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    // hledáme až po chvilce bez psaní – šetří veřejnou službu OpenStreetMap
    timer.current = setTimeout(() => {
      searchPlaces(value).then(setResults).catch(() => setResults([]));
    }, 450);
  }

  async function add(place: { name: string; latitude: number | null; longitude: number | null }) {
    setError('');
    try {
      await addStation({ name: shortPlaceName(place.name), latitude: place.latitude, longitude: place.longitude });
      setQuery('');
      setResults([]);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Pumpu se nepodařilo přidat.'));
    }
  }

  async function remove(id: string) {
    setError('');
    try {
      await deleteStation(id);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Pumpu se nepodařilo odebrat.'));
    }
  }

  return (
    <div className="space-y-4">
      {favorites === null ? (
        <p className="text-ink-muted text-sm">Načítám…</p>
      ) : favorites.length === 0 ? (
        <p className="text-ink-muted text-sm">Zatím žádné oblíbené pumpy. Přidej si ty, kde tankuješ nejčastěji – při tankování je pak vybereš jedním ťuknutím.</p>
      ) : (
        <ul className="divide-y divide-panel-border border border-panel-border rounded">
          {favorites.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
              <Icon name="fuel" className="text-accent flex-none" />
              <span className="flex-1 min-w-0 truncate">{s.name}</span>
              <button onClick={() => remove(s.id)} className="text-ink-muted hover:text-warning-red p-1.5 rounded" aria-label={`Odebrat ${s.name} z oblíbených`}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <div>
          <p className="label-caps text-xs text-ink-muted mb-1.5">Nedávno jsi tankoval</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r.name} onClick={() => add(r)} className="h-9 px-3 rounded-full border border-panel-border bg-asphalt-light text-sm inline-flex items-center gap-1.5 hover:border-ink-muted">
                <Icon name="plus" size={14} /> {shortPlaceName(r.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <label htmlFor="station-search" className="block label-caps text-xs text-ink-muted mb-1">Najít pumpu</label>
        <input
          id="station-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="např. Orlen Brno Hradecká"
          className={fieldClass}
          autoComplete="off"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 inset-x-0 mt-1 bg-panel border border-panel-border rounded shadow-lg max-h-64 overflow-auto">
            {results.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button onClick={() => add(r)} className="w-full text-left px-3 py-2.5 hover:bg-asphalt-light text-sm">
                  <span className="font-medium">{shortPlaceName(r.name)}</span>
                  <span className="block text-ink-muted text-xs truncate">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p role="alert" className="text-warning-red text-sm">{error}</p>}
    </div>
  );
}
