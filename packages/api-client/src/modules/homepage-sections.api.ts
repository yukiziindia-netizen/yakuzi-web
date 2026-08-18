import { api } from '../api';
import type { Product } from './products.api';

export interface HomepageSectionCategory {
  id: string;
  name: string;
  slug: string;
}

export interface HomepageSectionSubCategory {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  order: number;
  category: HomepageSectionCategory | null;
  subCategory: HomepageSectionSubCategory | null;
  products: Product[];
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const { data } = await api.get('/homepage-sections');
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.warn('[HomepageSections] Failed to fetch homepage sections:', (err as any)?.response?.status);
    return [];
  }
}
