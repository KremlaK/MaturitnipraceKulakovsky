import api from './axios';

export type ExpenseCategory =
  | 'PNEUMATIKY' | 'POJISTENI' | 'STK' | 'PARKOVANI'
  | 'DALNICNI_ZNAMKA' | 'TUNING' | 'MYCKA' | 'OSTATNI';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  PNEUMATIKY: 'Pneumatiky',
  POJISTENI: 'Pojištění',
  STK: 'STK',
  PARKOVANI: 'Parkování',
  DALNICNI_ZNAMKA: 'Dálniční známka',
  TUNING: 'Tuning',
  MYCKA: 'Myčka',
  OSTATNI: 'Ostatní',
};

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string | null;
  price: number;
  date: string;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  price: number;
  date: string;
  description?: string;
}

export async function getExpenses(carId: string): Promise<Expense[]> {
  const res = await api.get(`/cars/${carId}/expenses`);
  return res.data;
}

export async function createExpense(carId: string, data: ExpenseInput): Promise<Expense> {
  const res = await api.post(`/cars/${carId}/expenses`, data);
  return res.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}