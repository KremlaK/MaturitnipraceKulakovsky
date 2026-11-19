import api from './axios';

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  emailSent?: boolean;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return (await api.post('/auth/login', { email, password })).data;
}

export async function register(data: { email: string; password: string; name?: string }): Promise<AuthResponse> {
  return (await api.post('/auth/register', data)).data;
}

export async function resendVerification(): Promise<string> {
  return (await api.post('/auth/resend-verification')).data.message;
}

export async function updateProfile(name: string): Promise<User> {
  return (await api.put('/auth/profile', { name })).data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string; token: string }> {
  return (await api.put('/auth/change-password', { currentPassword, newPassword })).data;
}
