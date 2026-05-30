import { API_BASE_URL } from './env';
import type {
  LoginResponse,
  PaginatedUsers,
  User,
  PaginatedHistory,
  AdminUpdateUserRequest
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
