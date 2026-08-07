import api from './axios';

export interface ServiceRecord {
  id: string;
  type: string;
  description: string | null;
  price: number | null;
  date: string;
  mileage: number | null;
  invoiceUrl: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  placeName: string | null;
}

export interface ServiceRecordInput {
  type: string;
  date: string;
  description?: string;
  price?: number;
  mileage?: number;
  invoiceUrl?: string;
  photoUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  placeName?: string;
}

export async function getServiceRecords(carId: string): Promise<ServiceRecord[]> {
  const res = await api.get(`/cars/${carId}/service`);
  return res.data;
}

export async function createServiceRecord(carId: string, data: ServiceRecordInput): Promise<ServiceRecord> {
  const res = await api.post(`/cars/${carId}/service`, data);
  return res.data;
}

export async function deleteServiceRecord(id: string): Promise<void> {
  await api.delete(`/service/${id}`);
}