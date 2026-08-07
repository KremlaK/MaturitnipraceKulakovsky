import api from './axios';

export interface VinResult {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  fuelType: string | null;
  engineCylinders: string | null;
  bodyClass: string | null;
}

export async function decodeVin(vin: string): Promise<VinResult> {
  const res = await api.get(`/vin/${vin}`);
  return res.data;
}
