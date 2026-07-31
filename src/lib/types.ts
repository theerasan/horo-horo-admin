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

export interface SendOtpResponse {
  ref: string;
  expires_in: number;
  message: string;
}

export interface VerifyOtpResponse {
  token: string;
  uid: string;
  email: string;
  expires_in: number;
  is_new_user: boolean;
}

// ── Legal documents ───────────────────────────────────────────────────────────

export type LegalDocType = 'privacy_policy' | 'terms_of_use';

export interface LegalDocument {
  id: string;
  type: LegalDocType;
  language: string;
  version: number;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalDocSummary {
  type: LegalDocType;
  language: string;
  latest_version: number;
  published_version: number | null;
  published_at: string | null;
  updated_at: string;
}

export interface PaginatedLegalHistory {
  data: LegalDocument[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateLegalDocRequest {
  title: string;
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface FeaturePricing {
  feature: string;
  token_cost: number;
  label: string;
  updated_at: string;
}

// ── Packages ─────────────────────────────────────────────────────────────────

export interface VideoRewardConfig {
  tokens_per_video: number;
  updated_at: string;
}

export type SubscriptionTier = 'basic' | 'pro' | 'premium';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  label: string;
  price: number;
  tokens_per_day: number;
  sort_order: number;
  updated_at: string;
}

export type BillingCycle = 'monthly' | 'quarterly' | 'annually';

export interface SubscriptionBillingOption {
  cycle: BillingCycle;
  label: string;
  discount_percent: number;
  sort_order: number;
  updated_at: string;
}

export interface TokenPackage {
  key: string;
  tokens: number;
  price: number;
  sort_order: number;
  updated_at: string;
}

export interface PackageConfig {
  video_reward: VideoRewardConfig;
  subscription_plans: SubscriptionPlan[];
  subscription_billing: SubscriptionBillingOption[];
  token_packages: TokenPackage[];
}

// ─────────────────────────────────────────────────────────────────────────────

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
