<script lang="ts">
  import { listUsers } from '$lib/api';
  import type { PaginatedUsers } from '$lib/types';
  import { onMount } from 'svelte';

  let data = $state<PaginatedUsers | null>(null);
  let loading = $state(true);
  let error = $state('');
  let page = $state(1);
  let search = $state('');
  let searchInput = $state('');
  const limit = 20;

  async function load() {
    loading = true;
    error = '';
    try {
      data = await listUsers(page, limit, search);
    } catch (e: any) {
      error = e.message ?? 'Failed to load users';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function handleSearch(e: Event) {
    e.preventDefault();
    search = searchInput;
    page = 1;
    load();
  }

  function clearSearch() {
    searchInput = '';
    search = '';
    page = 1;
    load();
  }

  function goPage(p: number) {
    page = p;
    load();
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const tierColors: Record<string, string> = {
    premium: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    pro: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
    free: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300',
    back_office: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
    user: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  };
</script>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {data ? `${data.total} total users` : 'Manage your users'}
      </p>
    </div>
  </div>

  <!-- Search -->
  <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-5">
    <form onsubmit={handleSearch} class="flex gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          bind:value={searchInput}
          placeholder="Search by email or name…"
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition"
        />
        {#if searchInput}
          <button type="button" onclick={clearSearch} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>
      <button type="submit" class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
        Search
      </button>
    </form>
  </div>

  <!-- Table -->
  <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
    {#if loading}
      <div class="flex items-center justify-center h-64">
        <svg class="animate-spin w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    {:else if error}
      <div class="flex items-center justify-center h-64 text-red-500 dark:text-red-400 text-sm">{error}</div>
    {:else}
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tier</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tokens</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Joined</th>
            <th class="px-6 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
          {#each (data?.data ?? []) as user}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(user.display_name || user.email || 'G')[0].toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                      {#if user.display_name}
                        {user.display_name}
                      {:else}
                        <span class="italic text-gray-400">No name</span>
                      {/if}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {user.is_guest ? '👤 Guest' : user.email}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium {roleColors[user.role] ?? roleColors.user}">
                  {user.role.replace('_', ' ')}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium {tierColors[user.tier] ?? tierColors.free}">
                  {user.tier}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{user.token}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">{formatDate(user.created_at)}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <a
                  href="/users/{user.uid}"
                  class="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                >
                  View →
                </a>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-16 text-center text-gray-500 dark:text-gray-400 text-sm">
                No users found{search ? ` for "${search}"` : ''}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <!-- Pagination -->
      {#if data && data.total_pages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
          </p>
          <div class="flex gap-2">
            <button
              onclick={() => goPage(page - 1)}
              disabled={page <= 1}
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {#each Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, data.total_pages - 4));
              return start + i;
            }) as p}
              <button
                onclick={() => goPage(p)}
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  {p === page
                    ? 'bg-violet-600 text-white'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
              >
                {p}
              </button>
            {/each}
            <button
              onclick={() => goPage(page + 1)}
              disabled={page >= data.total_pages}
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
