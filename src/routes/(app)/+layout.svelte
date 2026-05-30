<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';

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
      label: 'Dashboard',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`
    },
    {
      href: '/users',
      label: 'Users',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>`
    },
    {
      href: '/token-history',
      label: 'Token History',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`
    }
  ];

  function isActive(href: string) {
    return $page.url.pathname.startsWith(href);
  }
</script>

{#if auth.user}
<div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
  <!-- Sidebar -->
  <aside class="w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shrink-0">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      </div>
      <div>
        <p class="font-bold text-gray-900 dark:text-white text-sm leading-tight">Horo Horo</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1">
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
    <div class="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <!-- Theme toggle -->
      <button
        onclick={toggleTheme}
        class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
      >
        {#if dark}
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          Light Mode
        {:else}
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          Dark Mode
        {/if}
      </button>

      <!-- Admin profile -->
      <div class="relative">
        <button
          onclick={() => showUserMenu = !showUserMenu}
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
        >
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(auth.user?.display_name || auth.user?.email || 'A')[0].toUpperCase()}
          </div>
          <div class="flex-1 text-left overflow-hidden">
            <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
              {auth.user?.display_name || 'Admin'}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{auth.user?.email}</p>
          </div>
          <svg class="w-4 h-4 text-gray-400 shrink-0 transition-transform {showUserMenu ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>

        {#if showUserMenu}
          <!-- Click outside to close -->
          <button
            class="fixed inset-0 z-10"
            onclick={() => showUserMenu = false}
            aria-label="Close menu"
          ></button>
          <div class="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
            <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Signed in as</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{auth.user?.email}</p>
              <span class="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
                {auth.user?.role}
              </span>
            </div>
            <button
              onclick={confirmLogout}
              class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sign out
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
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => showLogoutDialog = false}></div>
    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 mx-auto mb-4">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">Sign out?</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">You'll need to sign in again to access the admin panel.</p>
      <div class="flex gap-3">
        <button
          onclick={() => showLogoutDialog = false}
          class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={logout}
          class="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
{/if}
