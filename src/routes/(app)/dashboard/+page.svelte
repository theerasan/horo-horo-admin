<script lang="ts">
  import { auth } from '$lib/auth.svelte';
  import { listUsers, listTokenHistory } from '$lib/api';
  import { onMount } from 'svelte';
  import type { PaginatedUsers, PaginatedHistory } from '$lib/types';

  let usersData = $state<PaginatedUsers | null>(null);
  let historyData = $state<PaginatedHistory | null>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      [usersData, historyData] = await Promise.all([
        listUsers(1, 5),
        listTokenHistory(1, 5)
      ]);
    } finally {
      loading = false;
    }
  });

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<div class="p-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
    <p class="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {auth.user?.display_name || auth.user?.email}</p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <svg class="animate-spin w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  {:else}
    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Users</span>
          <div class="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
            <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">{usersData?.total ?? '—'}</p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Token Events</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">{historyData?.total ?? '—'}</p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Admin Role</span>
          <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
        </div>
        <p class="text-lg font-bold text-gray-900 dark:text-white capitalize">{auth.user?.role?.replace('_', ' ')}</p>
      </div>
    </div>

    <!-- Recent users -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-semibold text-gray-900 dark:text-white">Recent Users</h2>
          <a href="/users" class="text-sm text-violet-600 dark:text-violet-400 hover:underline">View all</a>
        </div>
        <div class="space-y-3">
          {#each (usersData?.data ?? []) as user}
            <a href="/users/{user.uid}" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(user.display_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{user.display_name || 'No name'}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || 'Guest'}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full
                  {user.tier === 'premium' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' :
                   user.tier === 'pro' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' :
                   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}">
                  {user.tier}
                </span>
              </div>
            </a>
          {:else}
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No users found</p>
          {/each}
        </div>
      </div>

      <!-- Recent token activity -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-semibold text-gray-900 dark:text-white">Recent Token Activity</h2>
          <a href="/token-history" class="text-sm text-violet-600 dark:text-violet-400 hover:underline">View all</a>
        </div>
        <div class="space-y-3">
          {#each (historyData?.data ?? []) as item}
            <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0
                {item.type === 'add' ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}">
                <svg class="w-4 h-4 {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {#if item.type === 'add'}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  {:else}
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                  {/if}
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{item.user_uid}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.created_at)}</p>
              </div>
              <span class="text-sm font-semibold shrink-0 {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                {item.type === 'add' ? '+' : ''}{item.amount}
              </span>
            </div>
          {:else}
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No activity yet</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
