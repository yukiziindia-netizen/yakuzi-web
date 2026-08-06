import { z } from 'zod';
import { api, setAccessToken } from '../api';

// ─── Schemas ────────────────────────────────────────

export const SendOtpRequestSchema = z.object({
  contact: z.string().min(3, 'Contact must be valid email or phone number'),
});

export const SendOtpResponseSchema = z.object({
  message: z.string(),
});

export const VerifyOtpRequestSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const RegisterBuyerRequestSchema = z.object({
  username: z.string().optional(),
  contact: z.string(),
  otp: z.string(),
  realName: z.string(),
  password: z.string(),
  dob: z.string().optional(),
  gender: z.string().optional(),
});

export const ResetPasswordRequestSchema = z.object({
  contact: z.string(),
  otp: z.string(),
  newPassword: z.string(),
});

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
});

export const VerifyOtpResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    phone: z.string().nullable().optional(),
    role: z.string(),
    email: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    status: z.string().optional(),
    verificationStatus: z.string().optional(),
    buyerProfile: z.any().optional(),
  }).passthrough(),
  isNewUser: z.boolean().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  phone: z.string().nullable().optional(),
  role: z.string(),
  email: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  verificationStatus: z.string().optional(),
  creditTier: z.string().optional(),
  gstPanResponse: z.any().optional(),
  buyerProfile: z.any().optional(),
}).passthrough();

// ─── Types ──────────────────────────────────────────

export type SendOtpRequest = z.infer<typeof SendOtpRequestSchema>;
export type SendOtpResponse = z.infer<typeof SendOtpResponseSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;
export type RegisterBuyerRequest = z.infer<typeof RegisterBuyerRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
export type User = z.infer<typeof UserSchema>;

// ─── API Functions ──────────────────────────────────

export async function sendOtp(contact: string): Promise<SendOtpResponse> {
  const body = SendOtpRequestSchema.parse({ contact });
  const { data } = await api.post('/auth/send-otp', body);
  return SendOtpResponseSchema.parse(data);
}

export async function registerBuyer(params: RegisterBuyerRequest): Promise<VerifyOtpResponse> {
  const body = RegisterBuyerRequestSchema.parse(params);
  const { data } = await api.post('/auth/buyer/register', body);
  const raw = data?.data ?? data;
  const parsed = VerifyOtpResponseSchema.parse(raw);
  setAccessToken(parsed.accessToken, parsed.refreshToken);
  return parsed;
}

export async function loginWithSimplePassword(password: string): Promise<VerifyOtpResponse> {
  const { data } = await api.post('/auth/login-simple', { password });
  const raw = data?.data ?? data;
  const parsed = VerifyOtpResponseSchema.parse(raw);
  setAccessToken(parsed.accessToken, parsed.refreshToken);
  return parsed;
}

export async function loginWithPassword(params: { contact: string; password: string }): Promise<VerifyOtpResponse> {
  const { data } = await api.post('/auth/login-password', params);
  const raw = data?.data ?? data;
  const parsed = VerifyOtpResponseSchema.parse(raw);
  setAccessToken(parsed.accessToken, parsed.refreshToken);
  return parsed;
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const body = VerifyOtpRequestSchema.parse({ phone, otp });
  const { data } = await api.post('/auth/verify-otp', body);
  // Backend may return response directly or wrapped in { data: { accessToken, ... } }
  const raw = data?.data ?? data;
  const parsed = VerifyOtpResponseSchema.parse(raw);
  // Store tokens in persistent storage
  setAccessToken(parsed.accessToken, parsed.refreshToken);
  return parsed;
}

/**
 * Exchanges the ID token from Google Identity Services for our own token pair.
 * The response is the same shape as every other login path.
 */
export async function loginWithGoogle(idToken: string): Promise<VerifyOtpResponse> {
  const { data } = await api.post('/auth/google', { idToken });
  const raw = data?.data ?? data;
  const parsed = VerifyOtpResponseSchema.parse(raw);
  setAccessToken(parsed.accessToken, parsed.refreshToken);
  return parsed;
}

export async function resetPassword(params: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const body = ResetPasswordRequestSchema.parse(params);
  const { data } = await api.post('/auth/reset-password', body);
  return ResetPasswordResponseSchema.parse(data);
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
  setAccessToken(null);
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get('/auth/me');
  // Backend may return the user directly or wrapped in { data: user }
  const raw = data?.data ?? data;
  return UserSchema.parse(raw);
}
