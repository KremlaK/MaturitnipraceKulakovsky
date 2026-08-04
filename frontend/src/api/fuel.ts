import api from './axios';

export interface FuelRecord {
  id: string;
  date: string;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  mileage: number;
  fuelType: string;
  fullTank: boolean;
}

export interface FuelRecordInput {
  date: string;
  liters: number;
  pricePerLiter: number;
  mileage: number;
  fuelType: string;
  fullTank: boolean;
}

export interface FuelStats {
  averageConsumption: number | null;
  averagePricePerLiter: number | null;
  pricePerKm: number | null;
  totalSpent: number;
  totalLiters: number;
  totalKm?: number;
  message?: string;
}

export async function getFuelRecords(carId: string): Promise<FuelRecord[]> {
  const res = await api.get(`/cars/${carId}/fuel`);
  return res.data;
}

export async function createFuelRecord(carId: string, data: FuelRecordInput): Promise<FuelRecord> {
  const res = await api.post(`/cars/${carId}/fuel`, data);
  return res.data;
}

export async function deleteFuelRecord(id: string): Promise<void> {
  await api.delete(`/fuel/${id}`);
}

export async function getFuelStats(carId: string): Promise<FuelStats> {
  const res = await api.get(`/cars/${carId}/fuel-stats`);
  return res.data;
}