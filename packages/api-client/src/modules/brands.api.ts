import { api } from '../api';

export interface Brand {
  id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  order: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function getBrands(): Promise<Brand[]> {
  const { data } = await api.get('/brands');
  return data.data;
}
