export type UserRole = 'user' | 'admin' | 'back_office';
export type UserTier = 'free' | 'pro' | 'premium';

export interface User {
  uid: string;
  email: string;
  display_name: string;
  is_guest: boolean;
  role: UserRole;
  tier: UserTier;
  token: number;
  created_at: string;
  updated_at: string;
  tokens_added?: number;
  tokens_used?: number;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TokenHistory {
  id: number;
  user_id: number;
  user_uid: string;
  amount: number;
  type: 'add' | 'use';
  feature: string | null;
  description: string | null;
  created_at: string;
}

export interface PaginatedHistory {
  data: TokenHistory[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuthUser {
  uid: string;
  email: string;
  display_name: string;
  role: UserRole;
  tier: UserTier;
  token: number;
}

export interface LoginResponse {
  token: string;
  uid: string;
  email: string;
  expires_in: number;
}

export interface AdminUpdateUserRequest {
  display_name?: string;
  email?: string;
  role?: UserRole;
  tier?: UserTier;
  gender?: string;
  gender_preference?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  place_latitude?: number;
  place_longitude?: number;
}
