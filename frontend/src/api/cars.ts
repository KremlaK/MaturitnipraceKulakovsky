import api from './axios';

export interface Car {
  id: string;
  vin: string | null;
  licensePlate: string | null;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface CarInput {
  make: string;
  model: string;
  vin?: string;
  licensePlate?: string;
  year?: number;
  mileage?: number;
  notes?: string;
}

export async function getCars(): Promise<Car[]> {
  const res = await api.get('/cars');
  return res.data;
}

export async function createCar(data: CarInput): Promise<Car> {
  const res = await api.post('/cars', data);
  return res.data;
}

export async function deleteCar(id: string): Promise<void> {
  await api.delete(`/cars/${id}`);
}

export async function getCar(id: string): Promise<Car> {
  const res = await api.get(`/cars/${id}`);
  return res.data;
}