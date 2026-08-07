import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { searchPlaces, type PlaceSearchResult } from '../api/map';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number, placeName?: string) => void;
}

const DEFAULT_CENTER: [number, number] = [50.0755, 14.4378]; // Praha

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1]]);
  return null;
}

function LocationPicker({ latitude, longitude, onChange }: Props) {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'done' | 'denied' | 'unavailable'>('loading');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const position: [number, number] = latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER;

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setGpsStatus('done');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setGpsStatus('done');
      },
      () => {
        setGpsStatus('denied');
      },
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchPlaces(value);
        setResults(found);
        setShowResults(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
  }

  function handleSelectResult(result: PlaceSearchResult) {
    onChange(result.latitude, result.longitude, result.name);
    setQuery(result.name);
    setShowResults(false);
  }

  return (
    <div>
      <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">
        Poloha {gpsStatus === 'loading' && '(zjišťuji GPS...)'}
        {gpsStatus === 'denied' && '(GPS nedostupné)'}
      </label>

      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Hledej čerpací stanici, servis, adresu..."
          className="w-full px-3 py-2 rounded bg-asphalt-light text-white border border-panel-border focus:outline-none focus:border-gauge-yellow font-mono-gauge text-sm"
        />
        {searching && (
          <span className="absolute right-3 top-2.5 text-slate-500 text-xs font-mono-gauge">...</span>
        )}
        {showResults && results.length > 0 && (
          <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-panel border border-panel-border rounded max-h-48 overflow-y-auto">
            {results.map((result, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-3 py-2 text-slate-300 hover:bg-asphalt-light text-xs font-mono-gauge border-b border-panel-border last:border-b-0"
              >
                {result.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded overflow-hidden border border-panel-border" style={{ height: 200 }}>
        <MapContainer center={position} zoom={latitude !== null ? 14 : 6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latitude !== null && longitude !== null && <Marker position={[latitude, longitude]} />}
          <ClickHandler onChange={onChange} />
          <RecenterMap position={position} />
        </MapContainer>
      </div>
      <p className="text-slate-600 text-xs mt-1 font-mono-gauge">Nebo klikni přímo na mapu pro úpravu polohy.</p>
    </div>
  );
}

export default LocationPicker;