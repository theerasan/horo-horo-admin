<script lang="ts">
  import { listUsers, deleteUser, purgeUser } from '$lib/api';
  import type { PaginatedUsers } from '$lib/types';
  import { onMount } from 'svelte';
  import { USERS } from '$lib/strings';

  let data = $state<PaginatedUsers | null>(null);
  let loading = $state(true);
  let error = $state('');
  let page = $state(1);
  let search = $state('');
  let searchInput = $state('');
  let showDeleted = $state(true);
  const limit = 20;

  // Bulk selection
  let selected = $state<Set<string>>(new Set());
  let bulkLoading = $state(false);
  let bulkError = $state('');
  let confirmDialog = $state<'soft' | 'hard' | null>(null);

  const visibleUsers = $derived(
    (data?.data ?? []).filter(u => showDeleted || !u.deleted_at)
  );

  const allSelected = $derived(
    visibleUsers.length > 0 && visibleUsers.every(u => selected.has(u.uid))
  );

  const someSelected = $derived(selected.size > 0);

  function toggleAll() {
    if (allSelected) {
      selected = new Set();
    } else {
      selected = new Set(visibleUsers.map(u => u.uid));
    }
  }

  function toggleOne(uid: string) {
    const next = new Set(selected);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    selected = next;
  }

  async function bulkSoftDelete() {
    bulkLoading = true;
    bulkError = '';
    confirmDialog = null;
    try {
      await Promise.all([...selected].map(uid => deleteUser(uid)));
      selected = new Set();
      await load();
    } catch (e: any) {
      bulkError = e.message ?? 'Failed to delete users';
    } finally {
      bulkLoading = false;
    }
  }

  async function bulkPurge() {
    bulkLoading = true;
    bulkError = '';
    confirmDialog = null;
    try {
      await Promise.all([...selected].map(uid => purgeUser(uid)));
      selected = new Set();
      await load();
    } catch (e: any) {
      bulkError = e.message ?? 'Failed to purge users';
    } finally {
      bulkLoading = false;
    }
  }

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
      <h1 class="page-title">{USERS.title}</h1>
      <p class="page-subtitle">
        {data ? USERS.subtitleCount(data.total) : USERS.subtitleFallback}
      </p>
    </div>
    <button
      onclick={() => showDeleted = !showDeleted}
      class="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors
        {showDeleted
          ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
      {showDeleted ? 'Hide deleted' : 'Show deleted'}
    </button>
  </div>

  <!-- Search -->
  <div class="card p-5 mb-5">
    <form onsubmit={handleSearch} class="flex gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          bind:value={searchInput}
          placeholder={USERS.searchPlaceholder}
          class="search-input"
        />
        {#if searchInput}
          <button type="button" onclick={clearSearch} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>
      <button type="submit" class="btn-solid">
        {USERS.searchButton}
      </button>
    </form>
  </div>

  <!-- Bulk action bar -->
  {#if someSelected}
    <div class="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
      <span class="text-sm font-medium text-violet-700 dark:text-violet-300">
        {selected.size} selected
      </span>
      <div class="flex-1" />
      {#if bulkError}
        <span class="text-sm text-red-500">{bulkError}</span>
      {/if}
      <button
        onclick={() => confirmDialog = 'soft'}
        disabled={bulkLoading}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
        </svg>
        Soft delete
      </button>
      <button
        onclick={() => confirmDialog = 'hard'}
        disabled={bulkLoading}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Permanent delete
      </button>
      <button
        onclick={() => { selected = new Set(); }}
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        Cancel
      </button>
    </div>
  {/if}

  <!-- Confirm dialog -->
  {#if confirmDialog}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
        {#if confirmDialog === 'soft'}
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Soft delete {selected.size} user{selected.size > 1 ? 's' : ''}?</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">Users will be marked as deleted but can be restored from the database.</p>
          <div class="flex gap-3 justify-end">
            <button onclick={() => confirmDialog = null} class="btn-outline">Cancel</button>
            <button onclick={bulkSoftDelete} class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors">
              {bulkLoading ? 'Deleting…' : 'Soft delete'}
            </button>
          </div>
        {:else}
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Permanently delete {selected.size} user{selected.size > 1 ? 's' : ''}?</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">This cannot be undone. All user data will be permanently removed.</p>
          <div class="flex gap-3 justify-end">
            <button onclick={() => confirmDialog = null} class="btn-outline">Cancel</button>
            <button onclick={bulkPurge} class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
              {bulkLoading ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Table -->
  <div class="card overflow-hidden">
    {#if loading}
      <div class="spinner-center">
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
            <th class="px-4 py-3.5 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onchange={toggleAll}
                class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
            </th>
            <th class="table-th">{USERS.colUser}</th>
            <th class="table-th">{USERS.colRole}</th>
            <th class="table-th">{USERS.colTier}</th>
            <th class="table-th">{USERS.colTokens}</th>
            <th class="table-th">{USERS.colJoined}</th>
            <th class="px-6 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
          {#each visibleUsers as user}
            {@const isDeleted = !!user.deleted_at}
            <tr class="table-row {isDeleted ? 'opacity-50' : ''} {selected.has(user.uid) ? 'bg-violet-50 dark:bg-violet-950/20' : ''}">
              <td class="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={selected.has(user.uid)}
                  onchange={() => toggleOne(user.uid)}
                  class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
              </td>
              <td class="table-td">
                <div class="flex items-center gap-3">
                  <div class="user-avatar {isDeleted ? 'grayscale' : ''}">
                    {(user.display_name || user.email || 'G')[0].toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <p class="text-body-medium truncate max-w-[180px] {isDeleted ? 'line-through text-gray-400' : ''}">
                      {#if user.display_name}
                        {user.display_name}
                      {:else}
                        <span class="italic text-gray-400">{USERS.noName}</span>
                      {/if}
                    </p>
                    <p class="text-caption truncate max-w-[180px]">
                      {#if isDeleted}
                        <span class="text-red-400 dark:text-red-500">Deleted</span>
                      {:else if user.is_guest}
                        👤 Guest
                      {:else}
                        {user.email}
                      {/if}
                    </p>
                  </div>
                </div>
              </td>
              <td class="table-td">
                <span class="badge {roleColors[user.role] ?? roleColors.user}">
                  {user.role.replace('_', ' ')}
                </span>
              </td>
              <td class="table-td">
                <span class="badge {tierColors[user.tier] ?? tierColors.free}">
                  {user.tier}
                </span>
              </td>
              <td class="table-td">
                <span class="text-body-semibold">{user.token}</span>
              </td>
              <td class="table-td">
                <span class="text-muted">{formatDate(user.created_at)}</span>
              </td>
              <td class="table-td text-right">
                <a href="/users/{user.uid}" class="link-violet">{USERS.viewLink}</a>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="table-empty-cell">
                {USERS.noResults(search)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <!-- Pagination -->
      {#if data && data.total_pages > 1}
        <div class="card-footer">
          <p class="text-muted">
            {USERS.paginationShowing((page - 1) * limit + 1, Math.min(page * limit, data.total), data.total)}
          </p>
          <div class="flex gap-2">
            <button
              onclick={() => goPage(page - 1)}
              disabled={page <= 1}
              class="btn-pagination"
            >{USERS.prevPage}</button>
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
              >{p}</button>
            {/each}
            <button
              onclick={() => goPage(page + 1)}
              disabled={page >= data.total_pages}
              class="btn-pagination"
            >{USERS.nextPage}</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
