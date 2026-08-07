import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Oprava výchozích ikon markerů (Leaflet + bundler mají známý problém s cestami k ikonám)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
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

function LocationPicker({ latitude, longitude, onChange }: Props) {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'done' | 'denied' | 'unavailable'>('loading');
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

  return (
    <div>
      <label className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-mono-gauge">
        Poloha {gpsStatus === 'loading' && '(zjišťuji GPS...)'}
        {gpsStatus === 'denied' && '(GPS nedostupné, klikni na mapu)'}
        {gpsStatus === 'unavailable' && '(GPS nepodporováno, klikni na mapu)'}
      </label>
      <div className="rounded overflow-hidden border border-panel-border" style={{ height: 200 }}>
        <MapContainer center={position} zoom={latitude !== null ? 14 : 6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {latitude !== null && longitude !== null && <Marker position={[latitude, longitude]} />}
          <ClickHandler onChange={onChange} />
        </MapContainer>
      </div>
      <p className="text-slate-600 text-xs mt-1 font-mono-gauge">Klikni na mapu pro úpravu polohy.</p>
    </div>
  );
}

export default LocationPicker;