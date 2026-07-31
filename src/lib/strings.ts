/**
 * All user-facing strings, labels, messages, and placeholders.
 * Import from here instead of hardcoding in components.
 */

// ─── App ──────────────────────────────────────────
export const APP_NAME = 'Horo Horo';
export const APP_SUBTITLE = 'Admin Panel';
export const APP_FULL_NAME = 'Horo Horo Admin';

// ─── Navigation ───────────────────────────────────
export const NAV = {
  dashboard: 'Dashboard',
  users: 'Users',
  tokenHistory: 'Token History',
  legal: 'Legal Documents',
  pricing: 'Pricing',
  packages: 'Packages',
} as const;

// ─── Pricing ──────────────────────────────────────
export const PRICING = {
  title: 'Feature Pricing',
  subtitle: 'Set how many tokens each feature costs. Changes apply to new requests within seconds.',
  colFeature: 'Feature',
  colKey: 'Key',
  colCost: 'Token cost',
  colUpdated: 'Last updated',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved',
  loadError: 'Failed to load pricing',
  saveError: 'Failed to save',
  invalidCost: 'Cost must be 0 or more',
} as const;

// ─── Auth / Login ─────────────────────────────────
export const LOGIN = {
  pageTitle: 'Horo Horo Admin',
  pageSubtitle: 'Sign in to your admin account',
  emailLabel: 'Email',
  emailPlaceholder: 'admin@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: '••••••••',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  submitButton: 'Sign in',
  submittingButton: 'Signing in…',
  accessDenied: 'Access denied. Admin or back-office role required.',
  genericError: 'Something went wrong. Please try again.',
  // Tabs
  tabPassword: 'Password',
  tabOtp: 'One-Time Password',
  // OTP flow
  otpSendButton: 'Send OTP',
  otpSendingButton: 'Sending…',
  otpVerifyButton: 'Verify & Sign in',
  otpVerifyingButton: 'Verifying…',
  otpLabel: 'One-Time Password',
  otpPlaceholder: '123456',
  otpResend: 'Resend OTP',
  otpResending: 'Resending…',
} as const;

// ─── Sidebar / User menu ──────────────────────────
export const SIDEBAR = {
  signedInAs: 'Signed in as',
  signOut: 'Sign out',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  adminFallback: 'Admin',
} as const;

// ─── Logout dialog ────────────────────────────────
export const LOGOUT_DIALOG = {
  title: 'Sign out?',
  message: "You'll need to sign in again to access the admin panel.",
  cancel: 'Cancel',
  confirm: 'Sign out',
} as const;

// ─── Dashboard ────────────────────────────────────
export const DASHBOARD = {
  title: 'Dashboard',
  welcomePrefix: 'Welcome back,',
  totalUsers: 'Total Users',
  tokenEvents: 'Token Events',
  adminRole: 'Admin Role',
  recentUsers: 'Recent Users',
  recentTokenActivity: 'Recent Token Activity',
  viewAll: 'View all',
  noUsers: 'No users found',
  noActivity: 'No activity yet',
} as const;

// ─── Users list ───────────────────────────────────
export const USERS = {
  title: 'Users',
  subtitleFallback: 'Manage your users',
  subtitleCount: (n: number) => `${n} total users`,
  searchPlaceholder: 'Search by email or name…',
  searchButton: 'Search',
  colUser: 'User',
  colRole: 'Role',
  colTier: 'Tier',
  colTokens: 'Tokens',
  colJoined: 'Joined',
  viewLink: 'View →',
  noName: 'No name',
  guest: '👤 Guest',
  noResults: (search: string) => `No users found${search ? ` for "${search}"` : ''}`,
  paginationShowing: (from: number, to: number, total: number) =>
    `Showing ${from}–${to} of ${total}`,
  prevPage: '← Prev',
  nextPage: 'Next →',
} as const;

// ─── Token History ────────────────────────────────
export const TOKEN_HISTORY = {
  title: 'Token History',
  subtitleFallback: 'All token transactions',
  subtitleCount: (n: number) => `${n} total events`,
  addTokenButton: 'Add Token',
  colType: 'Type',
  colAmount: 'Amount',
  colUser: 'User',
  colFeature: 'Feature',
  colDescription: 'Description',
  colDate: 'Date',
  typeAdd: '↑ add',
  typeUse: '↓ use',
  noEvents: 'No token events yet',
  prevPage: '← Prev',
  nextPage: 'Next →',
} as const;

// ─── Add Tokens dialog ────────────────────────────
export const ADD_TOKENS_DIALOG = {
  title: 'Add Token',
  selectUserLabel: 'Select User',
  selectUserPlaceholder: 'Search by email or name…',
  selectUserValidation: 'Please select a user',
  selectedPrefix: '✓ Selected:',
  amountLabel: 'Amount',
  amountPlaceholder: 'Custom amount',
  descriptionLabel: 'Description',
  descriptionOptional: '(optional)',
  descriptionPlaceholder: 'e.g. Promotional top-up',
  cancel: 'Cancel',
  submitButton: (n: number) => `Add ${n} tokens`,
  successMessage: (n: number, email: string, balance: number) =>
    `Added ${n} tokens to ${email}. New balance: ${balance}`,
  errorFallback: 'Failed to add tokens',
} as const;

// ─── User detail ──────────────────────────────────
export const USER_DETAIL = {
  breadcrumbParent: 'Users',
  breadcrumbCurrent: 'User Detail',
  addTokensButton: 'Add Tokens',
  editButton: 'Edit',
  deleteButton: 'Delete',
  guestLabel: 'guest',
  guestUser: 'Guest user',
  noDisplayName: 'No display name',
  fieldDisplayName: 'Display Name',
  fieldEmail: 'Email',
  fieldRole: 'Role',
  fieldTier: 'Tier',
  saveButton: 'Save changes',
  savingButton: 'Saving…',
  cancelEdit: 'Cancel',
  saveSuccess: 'Profile updated successfully!',
  saveFallbackError: 'Failed to save changes',
  statBalance: 'Current Balance',
  statAdded: 'Total Added',
  statUsed: 'Total Used',
  statJoined: 'Joined',
  statUnit: 'tokens',
  uidPrefix: 'UID:',
  historyTitle: 'Token History',
  historyEventsLabel: (n: number) => `${n} events`,
  noHistory: 'No token history',
  pageLabel: (current: number, total: number) => `Page ${current} of ${total}`,
  prevPage: '← Prev',
  nextPage: 'Next →',
  loadFallbackError: 'Failed to load user',
  deleteFallbackError: 'Failed to delete user',
  // Onboarding profile section
  profileTitle: 'Onboarding Profile',
  profileDateOfBirth: 'Date of Birth',
  profileTimeOfBirth: 'Time of Birth',
  profilePlaceOfBirth: 'Place of Birth',
  profileGender: 'Gender',
  profileGenderPreference: 'Gender Preference',
  profileElement: 'Element',
  profilePlanet: 'Ruling Planet',
  profileMbti: 'MBTI',
  profileEnneagram: 'Enneagram',
  profileOnboarding: 'Onboarding',
  profileOnboardingComplete: 'Complete',
  profileOnboardingStep: (n: number) => `Step ${n}`,
} as const;

// ─── Delete dialog ────────────────────────────────
export const DELETE_DIALOG = {
  title: 'Delete User?',
  message: 'This will soft-delete the user. This action can be reversed in the database.',
  cancel: 'Cancel',
  confirm: 'Delete',
  deleting: 'Deleting…',
} as const;

// ─── Add Tokens (user detail variant) ────────────
export const ADD_TOKENS_USER_DIALOG = {
  title: 'Add Tokens',
  amountLabel: 'Amount',
  amountPlaceholder: 'Custom amount',
  descriptionLabel: 'Description',
  descriptionOptional: '(optional)',
  descriptionPlaceholder: 'e.g. Promotional top-up',
  cancel: 'Cancel',
  submitButton: (n: number) => `Add ${n} tokens`,
  errorFallback: 'Failed to add tokens',
} as const;

// ─── Legal Documents ──────────────────────────────
export const LEGAL = {
  navLabel: 'Legal Documents',

  // Overview page
  title: 'Legal Documents',
  subtitle: 'Manage privacy policy and terms of use in all languages',
  newDocButton: 'New Document',
  colType: 'Type',
  colLanguage: 'Language',
  colLatestVersion: 'Latest',
  colPublishedVersion: 'Published',
  colPublishedAt: 'Published At',
  colUpdatedAt: 'Last Updated',
  noDocs: 'No legal documents yet. Create the first one.',
  typeLabelPrivacy: 'Privacy Policy',
  typeLabelTerms: 'Terms of Use',

  // History + editor page
  historyTitle: (type: string, lang: string) => `${type} · ${lang.toUpperCase()}`,
  backToOverview: '← Back to Legal Documents',
  newVersionButton: 'New Version',
  colVersion: 'Version',
  colTitle: 'Title',
  colStatus: 'Status',
  colCreatedAt: 'Created',
  statusPublished: 'Published',
  statusDraft: 'Draft',
  publishButton: 'Publish',
  publishing: 'Publishing…',
  viewButton: 'View',
  noHistory: 'No versions yet.',
  publishConfirm: (version: number) =>
    `Publish version ${version}? This will replace the currently published version.`,

  // New version form
  formTitle: 'Create New Version',
  fieldTitle: 'Title',
  fieldTitlePlaceholder: 'e.g. Privacy Policy',
  fieldLanguage: 'Language',
  fieldLanguagePlaceholder: 'en',
  fieldContent: 'Content (HTML)',
  fieldContentPlaceholder: '<h1>Privacy Policy</h1>\n<p>...</p>',
  submitButton: 'Save Draft',
  submitting: 'Saving…',
  cancelButton: 'Cancel',
  saveSuccess: 'New draft saved.',
  saveFallbackError: 'Failed to save draft.',
  publishSuccess: 'Version published successfully.',
  publishFallbackError: 'Failed to publish version.',

  suggestedLanguages: [
    { code: 'en', label: 'English' },
    { code: 'th', label: 'Thai' },
    { code: 'ja', label: 'Japanese' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ko', label: 'Korean' },
  ],
} as const;

// ─── Packages ──────────────────────────────────────
export const PACKAGES = {
  title: 'Packages',
  subtitle: 'Configure the three package types clients can buy — rewarded videos, subscriptions, and token top-ups.',
  loadError: 'Failed to load packages',
  saveError: 'Failed to save',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved',

  videoRewardTitle: 'Video Reward',
  videoRewardSubtitle: 'Tokens granted for watching one rewarded video to completion.',
  videoRewardLabel: 'Tokens per video',
  videoRewardInvalid: 'Tokens must be 0 or more',

  subscribeTitle: 'Subscribe',
  subscribeSubtitle: 'Basic, Pro, and Premium tiers — set the base monthly price and daily token grant for each.',
  colTier: 'Tier',
  colPrice: 'Price / mo',
  colTokensPerDay: 'Tokens / day',
  priceInvalid: 'Price must be 0 or more',
  tokensPerDayInvalid: 'Tokens per day must be 0 or more',

  billingTitle: 'Billing Options',
  billingSubtitle: 'Discount applied to the base monthly price for each payment cadence.',
  colCycle: 'Cycle',
  colDiscount: 'Discount %',
  discountInvalid: 'Discount must be between 0 and 100',

  tokenPackagesTitle: 'Token Packages',
  tokenPackagesSubtitle: 'One-time top-up packs — set the token amount and price for each.',
  colTokens: 'Tokens',
  colPackPrice: 'Price',
  tokensInvalid: 'Tokens must be greater than 0',

  colUpdated: 'Last updated',
} as const;

// ─── Generic ──────────────────────────────────────
export const GENERIC = {
  cancel: 'Cancel',
  empty: '—',
  noName: 'No name',
} as const;
