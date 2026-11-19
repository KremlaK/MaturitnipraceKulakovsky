import api from './axios';

export interface Station {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RecentPlace {
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export async function getStations(): Promise<{ favorites: Station[]; recent: RecentPlace[] }> {
  return (await api.get('/stations')).data;
}

export async function addStation(data: { name: string; latitude?: number | null; longitude?: number | null }): Promise<Station> {
  return (await api.post('/stations', data)).data;
}

export async function deleteStation(id: string): Promise<void> {
  await api.delete(`/stations/${id}`);
}
