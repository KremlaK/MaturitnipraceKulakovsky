import api from './axios';

export interface DashboardCarSummary {
  id: string;
  make: string;
  model: string;
  mileage: number | null;
  licensePlate: string | null;
  totalCost: number;
}

export interface DashboardMonthlyStat {
  month: string;
  service: number;
  fuel: number;
  expenses: number;
  total: number;
}

export interface DashboardData {
  carCount: number;
  totalCost: number;
  totalServiceCost: number;
  totalFuelCost: number;
  totalExpensesCost: number;
  monthlyStats: DashboardMonthlyStat[];
  cars: DashboardCarSummary[];
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await api.get('/dashboard');
  return res.data;
}