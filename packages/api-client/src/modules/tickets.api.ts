import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const TicketMessageSchema = z.object({
  id: z.string(),
  message: z.string(),
  sender: z.enum(['user', 'admin']),
  createdAt: z.string(),
});

export const TicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  description: z.string(),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  messages: z.array(TicketMessageSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const TicketListResponseSchema = z.object({
  data: z.array(TicketSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const CreateTicketSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
});

// ─── Types ──────────────────────────────────────────

export type TicketMessage = z.infer<typeof TicketMessageSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketListResponse = z.infer<typeof TicketListResponseSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

// ─── API Functions ──────────────────────────────────

function normalizeTicket(ticket: any) {
  if (!ticket || typeof ticket !== 'object') return ticket;
  if (!ticket.id && ticket._id) ticket.id = ticket._id;
  if (!ticket.description && ticket.message) ticket.description = ticket.message;
  if (!ticket.messages) ticket.messages = [];
  return ticket;
}

function normalizeTicketListResponse(response: any): TicketListResponse {
  const raw = response?.data ?? response;
  const tickets = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.tickets)
    ? raw.tickets
    : Array.isArray(response?.data)
    ? response.data
    : [];

  const normalizedTickets = tickets.map(normalizeTicket);

  return {
    data: normalizedTickets,
    total: raw?.total ?? normalizedTickets.length,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? normalizedTickets.length,
  };
}

export async function getTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<TicketListResponse> {
  try {
    const { data } = await api.get('/buyers/tickets', { params });
    return normalizeTicketListResponse(data);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const { data } = await api.get('/tickets', { params });
      return normalizeTicketListResponse(data);
    }
    throw error;
  }
}

export async function getTicketById(id: string): Promise<Ticket> {
  try {
    const { data } = await api.get(`/buyers/tickets/${id}`);
    return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const { data } = await api.get(`/tickets/${id}`);
      return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
    }
    throw error;
  }
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  try {
    const { data } = await api.post('/buyers/tickets', input);
    return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const { data } = await api.post('/tickets', input);
      return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
    }
    throw error;
  }
}

export async function addTicketMessage(ticketId: string, message: string): Promise<TicketMessage> {
  try {
    const { data } = await api.post(`/buyers/tickets/${ticketId}/messages`, { message });
    return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const { data } = await api.post(`/tickets/${ticketId}/messages`, { message });
      return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
    }
    throw error;
  }
}

export async function closeTicket(ticketId: string): Promise<Ticket> {
  try {
    const { data } = await api.patch(`/buyers/tickets/${ticketId}/close`);
    return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const { data } = await api.patch(`/tickets/${ticketId}/close`);
      return normalizeTicket(data.data?.ticket ?? data.ticket ?? data.data ?? data);
    }
    throw error;
  }
}
