import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMapLocations, type MapPoint } from '../api/map';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [49.8175, 15.4730]; // střed ČR

function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [filter, setFilter] = useState<'all' | 'fuel' | 'service'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMapLocations()
      .then(setPoints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPoints = points.filter((p) => filter === 'all' || p.type === filter);

  const center: [number, number] = filteredPoints.length > 0
    ? [filteredPoints[0].latitude, filteredPoints[0].longitude]
    : DEFAULT_CENTER;

  return (
    <AppShell>
      <div className="px-4 md:px-7 py-5 md:py-7">
        <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
          <h1 className="font-display font-bold text-2xl md:text-[30px] uppercase tracking-wide">Mapa míst</h1>
          <div className="flex gap-2" role="group" aria-label="Filtr">
            <button
              onClick={() => setFilter('all')}
className={`px-3 h-9 rounded-lg label-caps text-sm border inline-flex items-center gap-1.5 ${
                filter === 'all' ? 'bg-accent text-on-accent border-accent' : 'bg-panel text-ink border-panel-border hover:border-ink-muted'
              }`}
            >
              Vše
            </button>
            <button
              onClick={() => setFilter('fuel')}
className={`px-3 h-9 rounded-lg label-caps text-sm border inline-flex items-center gap-1.5 ${
                filter === 'fuel' ? 'bg-accent text-on-accent border-accent' : 'bg-panel text-ink border-panel-border hover:border-ink-muted'
              }`}
              aria-pressed={filter === 'fuel'}
            >
              <Icon name="fuel" size={16} /> Tankování
            </button>
            <button
              onClick={() => setFilter('service')}
className={`px-3 h-9 rounded-lg label-caps text-sm border inline-flex items-center gap-1.5 ${
                filter === 'service' ? 'bg-accent text-on-accent border-accent' : 'bg-panel text-ink border-panel-border hover:border-ink-muted'
              }`}
              aria-pressed={filter === 'service'}
            >
              <Icon name="wrench" size={16} /> Servis
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-ink-muted">Načítám…</p>
        ) : filteredPoints.length === 0 ? (
          <div className="bg-panel border border-panel-border rounded-lg p-8 text-center">
            <p className="text-ink-muted">
              Zatím žádná místa s polohou. Přidej tankování nebo servis s povolenou GPS polohou.
            </p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden border border-panel-border h-[calc(100dvh-230px)] md:h-[70vh] min-h-[320px]">
            <MapContainer center={center} zoom={filteredPoints.length > 0 ? 11 : 7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredPoints.map((point) => (
                <Marker key={`${point.type}-${point.id}`} position={[point.latitude, point.longitude]}>
                  <Popup>
                    <div className="font-sans">
                      <strong>{point.type === 'fuel' ? 'Tankování' : 'Servis'}: {point.label}</strong>
                      <br />
                      {point.car.make} {point.car.model}
                      <br />
                      {new Date(point.date).toLocaleDateString('cs-CZ')}
                      {point.placeName && <><br />{point.placeName}</>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default MapPage;
