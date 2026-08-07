import api from './axios';

export type ShareRole = 'SPOLUMAJITEL' | 'SERVIS';

export const SHARE_ROLE_LABELS: Record<ShareRole, string> = {
  SPOLUMAJITEL: 'Spolumajitel',
  SERVIS: 'Servis',
};

export interface CarShare {
  id: string;
  role: ShareRole;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export async function getShares(carId: string): Promise<CarShare[]> {
  const res = await api.get(`/cars/${carId}/shares`);
  return res.data;
}

export async function createShare(carId: string, email: string, role: ShareRole): Promise<CarShare> {
  const res = await api.post(`/cars/${carId}/shares`, { email, role });
  return res.data;
}

export async function deleteShare(id: string): Promise<void> {
  await api.delete(`/shares/${id}`);
}