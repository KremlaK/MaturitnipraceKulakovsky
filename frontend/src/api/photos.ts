import api from './axios';

export type PhotoCategory = 'AUTO' | 'OPRAVA' | 'TUNING' | 'OSTATNI';

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  AUTO: 'Auto',
  OPRAVA: 'Oprava',
  TUNING: 'Tuning',
  OSTATNI: 'Ostatní',
};

export interface Photo {
  id: string;
  url: string;
  category: PhotoCategory;
  caption: string | null;
  createdAt: string;
}

export interface PhotoInput {
  url: string;
  category: PhotoCategory;
  caption?: string;
}

export async function getPhotos(carId: string): Promise<Photo[]> {
  const res = await api.get(`/cars/${carId}/photos`);
  return res.data;
}

export async function createPhoto(carId: string, data: PhotoInput): Promise<Photo> {
  const res = await api.post(`/cars/${carId}/photos`, data);
  return res.data;
}

export async function deletePhoto(id: string): Promise<void> {
  await api.delete(`/photos/${id}`);
}