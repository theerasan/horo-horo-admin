export type UserRole = 'user' | 'admin' | 'back_office';
export type UserTier = 'free' | 'pro' | 'premium';

export interface UserProfile {
  user_id: string;
  display_name: string;
  birth_date: string | null;
  time_of_birth: string | null;
  gender: string;
  gender_preference: string;
  place_of_birth: string;
  latitude: number;
  longitude: number;
  element: string;
  planet: string;
  mbti: string;
  enneagram: number | null;
  enneagram_wing: number | null;
  onboarding_step: number;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

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
  oauth_provider?: string;
  oauth_id?: string;
  deleted_at?: string | null;
  profile?: UserProfile | null;
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
