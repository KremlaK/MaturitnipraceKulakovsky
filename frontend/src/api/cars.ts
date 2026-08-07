import api from './axios';

export type MyRole = 'MAJITEL' | 'SPOLUMAJITEL' | 'SERVIS';

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
  isOwner?: boolean;
  myRole?: MyRole | null;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface CarInput {
  make: string;
  model: string;
  vin?: string;
  licensePlate?: string;
  year?: number;
  mileage?: number;
  notes?: string;
  photoUrl?: string;
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

export async function updateCar(id: string, data: Partial<CarInput>): Promise<Car> {
  const res = await api.put(`/cars/${id}`, data);
  return res.data;
}

export async function downloadCarExport(carId: string, format: 'pdf' | 'excel', carName: string): Promise<void> {
  const res = await api.get(`/cars/${carId}/export/${format}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', format === 'pdf' ? `servisni-knizka-${carName}.pdf` : `naklady-${carName}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}