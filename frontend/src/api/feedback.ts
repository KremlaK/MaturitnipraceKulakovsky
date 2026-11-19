import api from './axios';

export type BugStatus = 'NEW' | 'SEEN' | 'FIXED';

export interface MyBugReport {
  id: string;
  title: string;
  status: BugStatus;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  text: string | null;
  updatedAt: string;
  author: string;
  isMine: boolean;
}

export interface ReviewsData {
  average: number | null;
  total: number;
  counts: number[]; // počet recenzí s 1–5 hvězdičkami
  mine: { rating: number; text: string | null } | null;
  reviews: ReviewItem[];
}

export async function reportBug(data: { title: string; description: string; pageUrl?: string }): Promise<string> {
  return (await api.post('/feedback/bugs', data)).data.message;
}

export async function getMyBugReports(): Promise<MyBugReport[]> {
  return (await api.get('/feedback/bugs/mine')).data;
}

export async function getReviews(): Promise<ReviewsData> {
  return (await api.get('/feedback/reviews')).data;
}

export async function saveReview(rating: number, text: string): Promise<void> {
  await api.put('/feedback/reviews/mine', { rating, text });
}

export async function deleteReview(): Promise<void> {
  await api.delete('/feedback/reviews/mine');
}
