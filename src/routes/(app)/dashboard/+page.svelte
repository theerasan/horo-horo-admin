<script lang="ts">
  import { auth } from '$lib/auth.svelte';
  import { listUsers, listTokenHistory } from '$lib/api';
  import { onMount } from 'svelte';
  import type { PaginatedUsers, PaginatedHistory } from '$lib/types';
  import { DASHBOARD } from '$lib/strings';

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
    <h1 class="page-title">{DASHBOARD.title}</h1>
    <p class="page-subtitle">{DASHBOARD.welcomePrefix} {auth.user?.display_name || auth.user?.email}</p>
  </div>

  {#if loading}
    <div class="spinner-center">
      <svg class="animate-spin w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  {:else}
    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
      <div class="card-padded">
        <div class="stat-header">
          <span class="text-caption-medium">{DASHBOARD.totalUsers}</span>
          <div class="icon-box bg-violet-100 dark:bg-violet-950/50">
            <svg class="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>
        <p class="stat-number">{usersData?.total ?? '—'}</p>
      </div>

      <div class="card-padded">
        <div class="stat-header">
          <span class="text-caption-medium">{DASHBOARD.tokenEvents}</span>
          <div class="icon-box bg-emerald-100 dark:bg-emerald-950/50">
            <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <p class="stat-number">{historyData?.total ?? '—'}</p>
      </div>

      <div class="card-padded">
        <div class="stat-header">
          <span class="text-caption-medium">{DASHBOARD.adminRole}</span>
          <div class="icon-box bg-amber-100 dark:bg-amber-950/50">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
        </div>
        <p class="text-heading-lg capitalize">{auth.user?.role?.replace('_', ' ')}</p>
      </div>
    </div>

    <!-- Recent users -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card-padded">
        <div class="card-section-header">
          <h2 class="text-heading-sm">{DASHBOARD.recentUsers}</h2>
          <a href="/users" class="link-more">{DASHBOARD.viewAll}</a>
        </div>
        <div class="space-y-3">
          {#each (usersData?.data ?? []) as user}
            <a href="/users/{user.uid}" class="list-item">
              <div class="user-avatar">
                {(user.display_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-body-medium truncate">{user.display_name || DASHBOARD.noUsers}</p>
                <p class="text-caption truncate">{user.email || 'Guest'}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="badge
                  {user.tier === 'premium' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' :
                   user.tier === 'pro' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' :
                   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}">
                  {user.tier}
                </span>
              </div>
            </a>
          {:else}
            <p class="empty-list-text">{DASHBOARD.noUsers}</p>
          {/each}
        </div>
      </div>

      <!-- Recent token activity -->
      <div class="card-padded">
        <div class="card-section-header">
          <h2 class="text-heading-sm">{DASHBOARD.recentTokenActivity}</h2>
          <a href="/token-history" class="text-sm text-violet-600 dark:text-violet-400 hover:underline">{DASHBOARD.viewAll}</a>
        </div>
        <div class="space-y-3">
          {#each (historyData?.data ?? []) as item}
            <div class="activity-item">
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
                <p class="text-caption truncate">{item.user_uid}</p>
                <p class="text-caption">{formatDate(item.created_at)}</p>
              </div>
              <span class="text-sm font-semibold shrink-0 {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                {item.type === 'add' ? '+' : ''}{item.amount}
              </span>
            </div>
          {:else}
            <p class="empty-list-text">{DASHBOARD.noActivity}</p>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
