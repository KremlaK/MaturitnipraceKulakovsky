import api from './axios';

export interface MapPoint {
  id: string;
  type: 'fuel' | 'service';
  latitude: number;
  longitude: number;
  placeName: string | null;
  date: string;
  label: string;
  car: {
    id: string;
    make: string;
    model: string;
  };
}

export async function getMapLocations(): Promise<MapPoint[]> {
  const res = await api.get('/map/locations');
  return res.data;
}