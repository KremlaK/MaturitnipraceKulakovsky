import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMapLocations, type MapPoint } from '../api/map';

delete (L.Icon.Default.prototype as any)._getIconUrl;
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
    <div className="min-h-screen bg-asphalt p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="text-slate-500 hover:text-gauge-yellow text-sm font-mono-gauge">
          ← Zpět do garáže
        </Link>

        <div className="flex justify-between items-center mt-4 mb-4">
          <h1 className="text-2xl font-display font-bold text-white">🗺️ Mapa</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded font-mono-gauge text-xs font-semibold uppercase border ${
                filter === 'all' ? 'bg-gauge-yellow text-black border-gauge-yellow' : 'bg-panel text-slate-400 border-panel-border'
              }`}
            >
              Vše
            </button>
            <button
              onClick={() => setFilter('fuel')}
              className={`px-3 py-1.5 rounded font-mono-gauge text-xs font-semibold uppercase border ${
                filter === 'fuel' ? 'bg-gauge-yellow text-black border-gauge-yellow' : 'bg-panel text-slate-400 border-panel-border'
              }`}
            >
              ⛽ Tankování
            </button>
            <button
              onClick={() => setFilter('service')}
              className={`px-3 py-1.5 rounded font-mono-gauge text-xs font-semibold uppercase border ${
                filter === 'service' ? 'bg-gauge-yellow text-black border-gauge-yellow' : 'bg-panel text-slate-400 border-panel-border'
              }`}
            >
              🔧 Servis
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500 font-mono-gauge">Načítám...</p>
        ) : filteredPoints.length === 0 ? (
          <div className="bg-panel border border-panel-border rounded-xl p-8 text-center">
            <p className="text-slate-500 font-mono-gauge">
              Zatím žádná místa s polohou. Přidej tankování nebo servis s povolenou GPS polohou.
            </p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-panel-border" style={{ height: '70vh' }}>
            <MapContainer center={center} zoom={filteredPoints.length > 0 ? 11 : 7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredPoints.map((point) => (
                <Marker key={`${point.type}-${point.id}`} position={[point.latitude, point.longitude]}>
                  <Popup>
                    <div className="font-sans">
                      <strong>{point.type === 'fuel' ? '⛽' : '🔧'} {point.label}</strong>
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
    </div>
  );
}

export default MapPage;