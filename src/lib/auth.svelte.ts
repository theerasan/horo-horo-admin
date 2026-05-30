import type { AuthUser } from './types';

function createAuthStore() {
  let user = $state<AuthUser | null>(null);
  let initialized = $state(false);

  function init() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      try {
        user = JSON.parse(raw);
      } catch {
        user = null;
      }
    }
    initialized = true;
  }

  function setUser(u: AuthUser, token: string, refreshToken = '') {
    user = u;
    localStorage.setItem('auth_token', token);
    if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(u));
  }

  function clear() {
    user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  }

  return {
    get user() { return user; },
    get initialized() { return initialized; },
    init,
    setUser,
    clear
  };
}

export const auth = createAuthStore();
