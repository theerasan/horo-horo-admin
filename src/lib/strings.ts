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

// ─── Generic ──────────────────────────────────────
export const GENERIC = {
  cancel: 'Cancel',
  empty: '—',
  noName: 'No name',
} as const;
