import { API_BASE_URL } from './env';
import type {
  LoginResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  PaginatedUsers,
  User,
  PaginatedHistory,
  AdminUpdateUserRequest,
  LegalDocument,
  LegalDocSummary,
  PaginatedLegalHistory,
  CreateLegalDocRequest,
  LegalDocType,
  FeaturePricing,
  PackageConfig,
  VideoRewardConfig,
  SubscriptionPlan,
  SubscriptionBillingOption,
  TokenPackage,
  PaymentSummary,
  PaymentRange,
  PaginatedPayments,
  PaymentStatus,
  PaymentEnvironment
} from './types';

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText, body.error);
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

// Auth
export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function sendOtp(email: string): Promise<SendOtpResponse> {
  return request<SendOtpResponse>('/api/v1/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function verifyOtp(
  email: string,
  otp: string,
  ref: string
): Promise<VerifyOtpResponse> {
  return request<VerifyOtpResponse>('/api/v1/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp, ref })
  });
}

// Fetch the logged-in admin's own full user record (requires token already set in localStorage)
export async function getAdminSelf(uid: string): Promise<User> {
  return request<User>(`/api/v1/admin/users/${uid}`);
}

// Users
export async function listUsers(
  page = 1,
  limit = 20,
  search = ''
): Promise<PaginatedUsers> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  return request<PaginatedUsers>(`/api/v1/admin/users?${params}`);
}

export async function getUser(uid: string): Promise<User> {
  return request<User>(`/api/v1/admin/users/${uid}`);
}

export async function updateUser(uid: string, data: AdminUpdateUserRequest): Promise<User> {
  return request<User>(`/api/v1/admin/users/${uid}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteUser(uid: string): Promise<void> {
  await request(`/api/v1/admin/users/${uid}`, { method: 'DELETE' });
}

export async function purgeUser(uid: string): Promise<void> {
  await request(`/api/v1/admin/users/${uid}/purge`, { method: 'DELETE' });
}

// Token management
export async function addTokens(
  uid: string,
  amount: number,
  description: string
): Promise<{ message: string; current_balance: number }> {
  return request(`/api/v1/admin/users/${uid}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ amount, description })
  });
}

// Token history
export async function listTokenHistory(page = 1, limit = 20): Promise<PaginatedHistory> {
  return request<PaginatedHistory>(`/api/v1/admin/token-history?page=${page}&limit=${limit}`);
}

export async function listUserTokenHistory(
  uid: string,
  page = 1,
  limit = 20
): Promise<PaginatedHistory> {
  return request<PaginatedHistory>(
    `/api/v1/admin/users/${uid}/token-history?page=${page}&limit=${limit}`
  );
}

// ── Legal documents ───────────────────────────────────────────────────────────

export async function listLegalSummaries(): Promise<{ data: LegalDocSummary[] }> {
  return request<{ data: LegalDocSummary[] }>('/api/v1/admin/legal');
}

export async function listLegalHistory(
  type: LegalDocType,
  language: string,
  page = 1,
  limit = 20
): Promise<PaginatedLegalHistory> {
  return request<PaginatedLegalHistory>(
    `/api/v1/admin/legal/${type}/${language}?page=${page}&limit=${limit}`
  );
}

export async function getLegalVersion(id: string): Promise<LegalDocument> {
  return request<LegalDocument>(`/api/v1/admin/legal/versions/${id}`);
}

export async function createLegalDoc(
  type: LegalDocType,
  language: string,
  data: CreateLegalDocRequest
): Promise<LegalDocument> {
  return request<LegalDocument>(`/api/v1/admin/legal/${type}/${language}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function publishLegalDoc(id: string): Promise<LegalDocument> {
  return request<LegalDocument>(`/api/v1/admin/legal/versions/${id}/publish`, {
    method: 'POST'
  });
}

export async function deleteLegalDoc(id: string): Promise<void> {
  return request<void>(`/api/v1/admin/legal/versions/${id}`, { method: 'DELETE' });
}

export async function deleteAllLegalDocs(type: LegalDocType, language: string): Promise<void> {
  return request<void>(`/api/v1/admin/legal/${type}/${language}`, { method: 'DELETE' });
}

// ── Feature pricing ─────────────────────────────────────────────────────────

export async function listPricing(): Promise<{ pricing: FeaturePricing[] }> {
  return request<{ pricing: FeaturePricing[] }>('/api/v1/admin/pricing');
}

export async function updatePricing(
  feature: string,
  tokenCost: number
): Promise<FeaturePricing> {
  return request<FeaturePricing>(`/api/v1/admin/pricing/${feature}`, {
    method: 'PUT',
    body: JSON.stringify({ token_cost: tokenCost })
  });
}

// ── Packages ─────────────────────────────────────────────────────────────────

export async function getPackageConfig(): Promise<PackageConfig> {
  return request<PackageConfig>('/api/v1/admin/packages');
}

export async function updateVideoReward(tokensPerVideo: number): Promise<VideoRewardConfig> {
  return request<VideoRewardConfig>('/api/v1/admin/packages/video-reward', {
    method: 'PUT',
    body: JSON.stringify({ tokens_per_video: tokensPerVideo })
  });
}

/**
 * Rewrites a tier's commercial terms. The whole row is submitted, not a patch —
 * omitting `active` would read as "leave on sale", which is the safe default
 * but not the same as "don't change it".
 */
export async function updateSubscriptionPlan(
  tier: string,
  update: {
    price: number;
    currency: string;
    tokens_per_day: number;
    active: boolean;
  }
): Promise<SubscriptionPlan> {
  return request<SubscriptionPlan>(`/api/v1/admin/packages/subscription-plans/${tier}`, {
    method: 'PUT',
    body: JSON.stringify(update)
  });
}

export async function updateBillingOption(
  cycle: string,
  discountPercent: number
): Promise<SubscriptionBillingOption> {
  return request<SubscriptionBillingOption>(`/api/v1/admin/packages/billing-options/${cycle}`, {
    method: 'PUT',
    body: JSON.stringify({ discount_percent: discountPercent })
  });
}

/**
 * Rewrites a token pack's commercial terms. `original_price: null` explicitly
 * takes the pack off sale pricing — there is no "leave unchanged" for it.
 *
 * Setting `popular: true` moves the badge: the server clears it from whichever
 * pack held it, so the caller must refresh the other rows afterwards.
 */
export async function updateTokenPackage(
  key: string,
  update: {
    tokens: number;
    price: number;
    currency: string;
    original_price: number | null;
    popular: boolean;
    active: boolean;
  }
): Promise<TokenPackage> {
  return request<TokenPackage>(`/api/v1/admin/packages/token-packages/${key}`, {
    method: 'PUT',
    body: JSON.stringify(update)
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────

/**
 * The payments dashboard's entire payload for one range — totals, the time
 * series, both breakdowns, and the recent activity list. One request per range
 * change rather than four.
 */
export async function getPaymentSummary(
  range: PaymentRange,
  environment?: PaymentEnvironment
): Promise<PaymentSummary> {
  const params = new URLSearchParams({ range });
  if (environment) params.set('environment', environment);
  return request<PaymentSummary>(`/api/v1/admin/payments/summary?${params}`);
}

export async function listPaymentTransactions(
  page = 1,
  limit = 20,
  status?: PaymentStatus,
  environment?: PaymentEnvironment
): Promise<PaginatedPayments> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (environment) params.set('environment', environment);
  return request<PaginatedPayments>(`/api/v1/admin/payments/transactions?${params}`);
}

// Public (no auth) — used to preview
export async function getPublishedLegal(
  type: LegalDocType,
  language: string
): Promise<LegalDocument> {
  const res = await fetch(`${API_BASE_URL}/api/v1/legal/${type}?lang=${language}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText, body.error);
  }
  return res.json();
}
