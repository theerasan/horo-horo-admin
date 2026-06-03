<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';
  import { login, sendOtp, verifyOtp, getAdminSelf, ApiError } from '$lib/api';
  import { LOGIN } from '$lib/strings';

  // ── Shared state ──────────────────────────────────────────────
  let activeTab: 'password' | 'otp' = $state('password');
  let email = $state('');
  let error = $state('');
  let loading = $state(false);

  // ── Password tab ──────────────────────────────────────────────
  let password = $state('');
  let showPassword = $state(false);

  // ── OTP tab ───────────────────────────────────────────────────
  let otpStep: 'send' | 'verify' = $state('send');
  let otp = $state('');
  let otpRef = $state('');
  let otpMessage = $state('');

  onMount(() => {
    auth.init();
    if (auth.user) goto('/dashboard');
  });

  function switchTab(tab: 'password' | 'otp') {
    activeTab = tab;
    error = '';
  }

  // ── Helpers ───────────────────────────────────────────────────
  async function finalizeLogin(token: string, uid: string) {
    localStorage.setItem('auth_token', token);
    let userDetail;
    try {
      userDetail = await getAdminSelf(uid);
    } catch (profileErr) {
      if (profileErr instanceof ApiError && (profileErr.status === 403 || profileErr.status === 401)) {
        localStorage.removeItem('auth_token');
        error = LOGIN.accessDenied;
        return;
      }
      throw profileErr;
    }
    auth.setUser({
      uid: userDetail.uid,
      email: userDetail.email,
      display_name: userDetail.display_name,
      role: userDetail.role,
      tier: userDetail.tier,
      token: userDetail.token
    }, token, '');
    goto('/dashboard');
  }

  // ── Password login ────────────────────────────────────────────
  async function handlePasswordLogin(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const res = await login(email, password);
      await finalizeLogin(res.token, res.uid);
    } catch (err) {
      localStorage.removeItem('auth_token');
      error = err instanceof ApiError ? err.message : LOGIN.genericError;
    } finally {
      loading = false;
    }
  }

  // ── OTP: send ─────────────────────────────────────────────────
  async function handleSendOtp(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const res = await sendOtp(email);
      otpRef = res.ref;
      otpMessage = res.message;
      otpStep = 'verify';
    } catch (err) {
      error = err instanceof ApiError ? err.message : LOGIN.genericError;
    } finally {
      loading = false;
    }
  }

  // ── OTP: verify ───────────────────────────────────────────────
  async function handleVerifyOtp(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const res = await verifyOtp(email, otp, otpRef);
      await finalizeLogin(res.token, res.uid);
    } catch (err) {
      localStorage.removeItem('auth_token');
      error = err instanceof ApiError ? err.message : LOGIN.genericError;
    } finally {
      loading = false;
    }
  }

  async function handleResendOtp() {
    error = '';
    otp = '';
    loading = true;
    try {
      const res = await sendOtp(email);
      otpRef = res.ref;
      otpMessage = res.message;
    } catch (err) {
      error = err instanceof ApiError ? err.message : LOGIN.genericError;
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-page">
  <div class="w-full max-w-md">
    <!-- Logo / Brand -->
    <div class="text-center mb-10">
      <div class="login-brand-icon">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      </div>
      <h1 class="page-title">{LOGIN.pageTitle}</h1>
      <p class="page-subtitle">{LOGIN.pageSubtitle}</p>
    </div>

    <!-- Card -->
    <div class="card-padded shadow-xl p-8">

      <!-- Tabs -->
      <div class="flex rounded-lg overflow-hidden border border-[var(--border)] mb-6">
        <button
          type="button"
          onclick={() => switchTab('password')}
          class="flex-1 py-2.5 text-sm font-medium transition-colors
            {activeTab === 'password'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'}"
        >
          {LOGIN.tabPassword}
        </button>
        <button
          type="button"
          onclick={() => switchTab('otp')}
          class="flex-1 py-2.5 text-sm font-medium transition-colors border-l border-[var(--border)]
            {activeTab === 'otp'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'}"
        >
          {LOGIN.tabOtp}
        </button>
      </div>

      <!-- Error -->
      {#if error}
        <div class="alert-error flex items-start gap-3 mb-5">
          <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <!-- ── Password tab ── -->
      {#if activeTab === 'password'}
        <form onsubmit={handlePasswordLogin} class="space-y-5">
          <div class="space-y-1.5">
            <label for="email-pw" class="form-label">{LOGIN.emailLabel}</label>
            <input
              id="email-pw"
              type="email"
              bind:value={email}
              required
              autocomplete="email"
              placeholder={LOGIN.emailPlaceholder}
              class="form-input"
            />
          </div>

          <div class="space-y-1.5">
            <label for="password" class="form-label">{LOGIN.passwordLabel}</label>
            <div class="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                bind:value={password}
                required
                autocomplete="current-password"
                placeholder={LOGIN.passwordPlaceholder}
                class="form-input pr-11"
              />
              <button
                type="button"
                onclick={() => showPassword = !showPassword}
                class="input-toggle"
                aria-label={showPassword ? LOGIN.hidePassword : LOGIN.showPassword}
              >
                {#if showPassword}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                {:else}
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} class="btn-submit">
            {#if loading}
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {LOGIN.submittingButton}
            {:else}
              {LOGIN.submitButton}
            {/if}
          </button>
        </form>

      <!-- ── OTP tab ── -->
      {:else}
        {#if otpStep === 'send'}
          <form onsubmit={handleSendOtp} class="space-y-5">
            <div class="space-y-1.5">
              <label for="email-otp" class="form-label">{LOGIN.emailLabel}</label>
              <input
                id="email-otp"
                type="email"
                bind:value={email}
                required
                autocomplete="email"
                placeholder={LOGIN.emailPlaceholder}
                class="form-input"
              />
            </div>

            <button type="submit" disabled={loading} class="btn-submit">
              {#if loading}
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {LOGIN.otpSendingButton}
              {:else}
                {LOGIN.otpSendButton}
              {/if}
            </button>
          </form>

        {:else}
          <form onsubmit={handleVerifyOtp} class="space-y-5">
            {#if otpMessage}
              <p class="text-sm text-[var(--text-muted)]">{otpMessage} (Ref: <span class="font-mono font-medium text-[var(--text)]">{otpRef}</span>)</p>
            {/if}

            <div class="space-y-1.5">
              <label for="otp" class="form-label">{LOGIN.otpLabel}</label>
              <input
                id="otp"
                type="text"
                inputmode="numeric"
                bind:value={otp}
                required
                autocomplete="one-time-code"
                placeholder={LOGIN.otpPlaceholder}
                maxlength={6}
                class="form-input tracking-widest text-center text-lg"
              />
            </div>

            <button type="submit" disabled={loading} class="btn-submit">
              {#if loading}
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {LOGIN.otpVerifyingButton}
              {:else}
                {LOGIN.otpVerifyButton}
              {/if}
            </button>

            <div class="text-center">
              <button
                type="button"
                onclick={handleResendOtp}
                disabled={loading}
                class="text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
              >
                {loading ? LOGIN.otpResending : LOGIN.otpResend}
              </button>
            </div>
          </form>
        {/if}
      {/if}

    </div>
  </div>
</div>
