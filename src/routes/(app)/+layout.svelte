<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';
  import { APP_NAME, APP_SUBTITLE, NAV, SIDEBAR, LOGOUT_DIALOG, LEGAL } from '$lib/strings';

  let { children } = $props();

  let showLogoutDialog = $state(false);
  let showUserMenu = $state(false);
  let dark = $state(false);

  onMount(() => {
    auth.init();
    if (!auth.user) goto('/login');
    dark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  function confirmLogout() {
    showUserMenu = false;
    showLogoutDialog = true;
  }

  function logout() {
    auth.clear();
    showLogoutDialog = false;
    goto('/login');
  }

  const navItems = [
    {
      href: '/dashboard',
      label: NAV.dashboard,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`
    },
    {
      href: '/users',
      label: NAV.users,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>`
    },
    {
      href: '/token-history',
      label: NAV.tokenHistory,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
    },
    {
      href: '/legal',
      label: NAV.legal,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`
    },
    {
      href: '/pricing',
      label: NAV.pricing,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"/>`
    },
    {
      href: '/packages',
      label: NAV.packages,
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>`
    }
  ];

  function isActive(href: string) {
    return $page.url.pathname.startsWith(href);
  }
</script>

{#if auth.user}
<div class="app-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      </div>
      <div>
        <p class="text-body-medium leading-tight">{APP_NAME}</p>
        <p class="text-caption">{APP_SUBTITLE}</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            {isActive(item.href)
              ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {@html item.icon}
          </svg>
          {item.label}
          {#if isActive(item.href)}
            <span class="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500"></span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Bottom: theme toggle + admin user -->
    <div class="sidebar-footer">
      <!-- Theme toggle -->
      <button onclick={toggleTheme} class="sidebar-menu-btn">
        {#if dark}
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          {SIDEBAR.lightMode}
        {:else}
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          {SIDEBAR.darkMode}
        {/if}
      </button>

      <!-- Admin profile -->
      <div class="relative">
        <button
          onclick={() => showUserMenu = !showUserMenu}
          class="sidebar-profile-btn"
        >
          <div class="user-avatar">
            {(auth.user?.display_name || auth.user?.email || 'A')[0].toUpperCase()}
          </div>
          <div class="flex-1 text-left overflow-hidden">
            <p class="text-caption-medium text-gray-900 dark:text-white truncate">
              {auth.user?.display_name || SIDEBAR.adminFallback}
            </p>
            <p class="text-caption truncate">{auth.user?.email}</p>
          </div>
          <svg class="w-4 h-4 text-gray-400 shrink-0 transition-transform {showUserMenu ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>

        {#if showUserMenu}
          <button
            class="fixed inset-0 z-10"
            onclick={() => showUserMenu = false}
            aria-label="Close menu"
          ></button>
          <div class="sidebar-dropdown">
            <div class="sidebar-dropdown-header">
              <p class="text-overline">{SIDEBAR.signedInAs}</p>
              <p class="text-body-medium mt-0.5 truncate">{auth.user?.email}</p>
              <span class="badge mt-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
                {auth.user?.role}
              </span>
            </div>
            <button
              onclick={confirmLogout}
              class="sidebar-logout-btn"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              {SIDEBAR.signOut}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </aside>

  <!-- Main content -->
  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>
</div>
{/if}

<!-- Logout confirm dialog -->
{#if showLogoutDialog}
  <div class="modal-overlay">
    <div class="modal-backdrop" onclick={() => showLogoutDialog = false}></div>
    <div class="modal-card">
      <div class="dialog-icon-danger">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
      </div>
      <h3 class="dialog-title text-center mb-2">{LOGOUT_DIALOG.title}</h3>
      <p class="dialog-body mb-6">{LOGOUT_DIALOG.message}</p>
      <div class="flex gap-3">
        <button onclick={() => showLogoutDialog = false} class="btn-cancel">{LOGOUT_DIALOG.cancel}</button>
        <button
          onclick={logout}
          class="btn-danger"
        >
          {LOGOUT_DIALOG.confirm}
        </button>
      </div>
    </div>
  </div>
{/if}
