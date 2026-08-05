import api from './axios';

export type ReminderType =
  | 'VYMENA_OLEJE' | 'STK' | 'EMISE' | 'POJISTENI' | 'VYMENA_PNEUMATIK' | 'VLASTNI';

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  VYMENA_OLEJE: 'Výměna oleje',
  STK: 'STK',
  EMISE: 'Emise',
  POJISTENI: 'Pojištění',
  VYMENA_PNEUMATIK: 'Výměna pneumatik',
  VLASTNI: 'Vlastní připomínka',
};

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  notes: string | null;
  dueDate: string | null;
  dueMileage: number | null;
  emailAlert: boolean;
  completed: boolean;
  carId: string;
}

export interface UpcomingReminder extends Reminder {
  car: { id: string; make: string; model: string; licensePlate: string | null };
}

export interface ReminderInput {
  type: ReminderType;
  title: string;
  notes?: string;
  dueDate?: string;
  dueMileage?: number;
  emailAlert: boolean;
}

export async function getReminders(carId: string): Promise<Reminder[]> {
  const res = await api.get(`/cars/${carId}/reminders`);
  return res.data;
}

export async function getUpcomingReminders(): Promise<UpcomingReminder[]> {
  const res = await api.get('/reminders/upcoming');
  return res.data;
}

export async function createReminder(carId: string, data: ReminderInput): Promise<Reminder> {
  const res = await api.post(`/cars/${carId}/reminders`, data);
  return res.data;
}

export async function toggleReminderComplete(id: string): Promise<Reminder> {
  const res = await api.put(`/reminders/${id}/complete`);
  return res.data;
}

export async function deleteReminder(id: string): Promise<void> {
  await api.delete(`/reminders/${id}`);
}