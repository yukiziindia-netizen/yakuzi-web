import { api } from '../api';

export interface Banner {
  id: string;
  title: string | null;
  link: string | null;
  imageUrl: string;
  isActive: boolean;
  order: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function getBanners(): Promise<Banner[]> {
  const { data } = await api.get('/banners');
  return data.data;
}
