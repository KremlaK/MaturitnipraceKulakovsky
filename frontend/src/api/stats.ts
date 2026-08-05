import api from './axios';

export interface MonthlyStat {
  month: string;
  service: number;
  fuel: number;
  expenses: number;
  total: number;
}

export interface CategoryStat {
  name: string;
  value: number;
}

export interface ConsumptionTrend {
  date: string;
  consumption: number;
}

export interface CarStats {
  monthlyStats: MonthlyStat[];
  categoryStats: CategoryStat[];
  consumptionTrend: ConsumptionTrend[];
}

export async function getCarStats(carId: string): Promise<CarStats> {
  const res = await api.get(`/cars/${carId}/stats`);
  return res.data;
}