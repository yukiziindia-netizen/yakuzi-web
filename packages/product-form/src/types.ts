import type { Suggestion } from "@yukizi/utils";

export interface ProductFormAdapter {
  createProduct: (payload: Record<string, any>) => Promise<any>;
  updateProduct?: (productId: string, payload: Record<string, any>) => Promise<any>;
  getCategories: () => Promise<any[]>;
  searchSuggestions: (query: string, type?: "product" | "master") => Promise<Suggestion[]>;
  getSuggestionDetails?: (id: string) => Promise<any>;
  onDone?: () => void;
}
