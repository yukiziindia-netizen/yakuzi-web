import { z } from 'zod';
import { api } from '../api';

// ─── Schemas ────────────────────────────────────────

export const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  currency: z.string().optional(),
  status: z.string(),
  method: z.string().optional(),
  referenceNumber: z.string().optional(),
  transactionId: z.string().optional(),
  proofUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const CreatePaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  method: z.string(),
  referenceNumber: z.string().optional(),
});

// ─── Types ──────────────────────────────────────────

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// ─── API Functions ──────────────────────────────────

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const response = await api.post('/payments', input);
  return response.data.data ?? response.data;
}

// ─── Razorpay ───────────────────────────────────────

export interface RazorpayOrder {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  /** Public key id, returned by the API so it is configured in one place only. */
  keyId: string;
  orderId: string;
}

/**
 * Starts an online payment. The amount is taken from the order on the server,
 * never sent from here.
 */
export async function createRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  const response = await api.post('/payments/razorpay/order', { orderId });
  return response.data.data ?? response.data;
}

/**
 * Hands the signature from Razorpay's checkout back for verification. Until this
 * succeeds the order is not paid, whatever the browser was shown.
 */
export async function verifyRazorpayPayment(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<unknown> {
  const response = await api.post('/payments/razorpay/verify', input);
  return response.data.data ?? response.data;
}

export async function uploadPaymentProof(paymentId: string, proofUrl: string): Promise<Payment> {
  const response = await api.post(`/payments/${paymentId}/proof`, { proofUrl });
  return response.data.data ?? response.data;
}

export async function uploadPaymentProofByOrder(orderId: string, proofUrl: string): Promise<Payment> {
  const response = await api.post(`/payments/order/${orderId}/proof`, { proofUrl });
  return response.data.data ?? response.data;
}

export async function getPaymentByOrderId(orderId: string): Promise<Payment> {
  const response = await api.get(`/payments/order/${orderId}`);
  return response.data.data ?? response.data;
}

export async function getPaymentHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Payment[]; total: number }> {
  const response = await api.get('/payments', { params });
  return response.data.data ?? response.data;
}
