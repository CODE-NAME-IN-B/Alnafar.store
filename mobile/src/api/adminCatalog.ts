import { api } from './client';
import type { Category, Game, Service, StorePackage } from './types';

/* --- إدارة الألعاب + الرفع + الذكاء الاصطناعي (Gemini) --- */

export interface GameInput {
  title: string;
  image: string;
  description?: string;
  price: number;
  price_ps5: number | null;
  size_gb?: number | null;
  category_id: number | null;
  genre?: string | null;
  series?: string | null;
  features?: string | null;
}

export async function createGame(payload: GameInput): Promise<Game> {
  const { data } = await api.post<Game>('/games', payload);
  return data;
}

export async function updateGame(id: number, payload: GameInput): Promise<void> {
  await api.put(`/games/${id}`, payload);
}

export async function deleteGame(id: number): Promise<void> {
  await api.delete(`/games/${id}`);
}

export async function uploadBase64Image(filename: string, dataBase64: string): Promise<string> {
  const clean = dataBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  const { data } = await api.post<{ url: string }>('/uploads', {
    filename,
    data: clean,
  });
  return data.url;
}

export async function recognizeGameByImage(imageBase64OrUrl: string): Promise<{
  title?: string;
  confidence?: string;
}> {
  const isBase64 = imageBase64OrUrl.length > 260 && !imageBase64OrUrl.startsWith('http');
  const body = isBase64
    ? { imageBase64: imageBase64OrUrl.replace(/^data:image\/[^;]+;base64,/, '') }
    : { imageUrl: imageBase64OrUrl };
  const { data } = await api.post<{ title?: string; confidence?: string }>(
    '/recognize-game',
    body
  );
  return data;
}

export async function classifyGameByTitle(title: string): Promise<{
  summary?: string;
  series?: string;
  genre?: string;
}> {
  const { data } = await api.post<{
    summary?: string;
    series?: string;
    genre?: string;
  }>('/classify-by-title', { title });
  return data;
}

export async function analyzeGameGenreAi(title: string): Promise<{
  arabicGenre?: string;
  features?: string;
}> {
  const { data } = await api.post<{
    arabicGenre?: string;
    features?: string;
  }>('/analyze-game-genre', { title });
  return data;
}

/* --- الباقات، الفئات، الخدمات، الأنواع والسلاسل --- */

export interface AdminPackage extends Omit<StorePackage, 'packageGames'> {
  games?: Array<{ id: number; title: string; image: string; price: number }>;
  packageGames?: Array<{ id: number; title: string; image: string; price: number }>;
}

export async function fetchAdminPackages(): Promise<AdminPackage[]> {
  const { data } = await api.get<{ packages?: AdminPackage[] }>('/packages');
  return Array.isArray(data?.packages) ? data.packages : [];
}

export async function createPackage(payload: {
  name: string;
  price: number;
  category_id: number;
  is_active: boolean;
  gameIds: number[];
}): Promise<void> {
  await api.post('/packages', payload);
}

export async function updatePackage(
  id: number,
  payload: {
    name: string;
    price: number;
    category_id: number;
    is_active: boolean;
    gameIds: number[];
  }
): Promise<void> {
  await api.put(`/packages/${id}`, payload);
}

export async function deletePackage(id: number): Promise<void> {
  await api.delete(`/packages/${id}`);
}

export async function createCategory(name: string, isVisible = true): Promise<Category> {
  const { data } = await api.post<Category>('/categories', {
    name,
    is_visible: isVisible,
  });
  return data;
}

export async function updateCategory(
  id: number,
  payload: { name?: string; is_visible?: boolean }
): Promise<void> {
  await api.put(`/categories/${id}`, payload);
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export async function fetchAllServices(): Promise<Service[]> {
  const { data } = await api.get<Service[]>('/services', { params: { active: 'false' } });
  return Array.isArray(data) ? data : [];
}

export async function createService(payload: {
  title: string;
  price: number;
  is_active?: boolean;
}): Promise<Service> {
  const { data } = await api.post<Service>('/services', payload);
  return data;
}

export async function updateService(
  id: number,
  payload: { title?: string; price?: number; is_active?: boolean }
): Promise<void> {
  await api.put(`/services/${id}`, payload);
}

export async function deleteService(id: number): Promise<void> {
  await api.delete(`/services/${id}`);
}

export async function createGenre(name: string): Promise<void> {
  await api.post('/genres', { name });
}

export async function renameGenre(oldName: string, newName: string): Promise<void> {
  await api.put(`/genres/${encodeURIComponent(oldName)}`, { newName });
}

export async function deleteGenre(name: string): Promise<void> {
  await api.delete(`/genres/${encodeURIComponent(name)}`);
}

export async function createSeries(name: string): Promise<void> {
  await api.post('/series', { name });
}

export async function renameSeries(oldName: string, newName: string): Promise<void> {
  await api.put(`/series/${encodeURIComponent(oldName)}`, { newName });
}

export async function deleteSeries(name: string): Promise<void> {
  await api.delete(`/series/${encodeURIComponent(name)}`);
}
