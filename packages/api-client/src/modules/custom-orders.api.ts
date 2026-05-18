import { api } from '../api';

export async function createCustomOrder(payload: { message: string; productId?: string }) {
  const { data } = await api.post('/custom-orders', payload);
  return data.data || data;
}

export async function getAdminCustomOrders(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get('/custom-orders/admin', { params });
  return data.data || data;
}

export async function updateCustomOrderStatus(id: string, status: string) {
  const { data } = await api.patch(`/custom-orders/${id}/status`, { status });
  return data.data || data;
}
