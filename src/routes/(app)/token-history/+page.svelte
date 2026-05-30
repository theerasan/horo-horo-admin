<script lang="ts">
  import { listTokenHistory, listUsers, addTokens } from '$lib/api';
  import type { PaginatedHistory } from '$lib/types';
  import { onMount } from 'svelte';

  let data = $state<PaginatedHistory | null>(null);
  let loading = $state(true);
  let error = $state('');
  let page = $state(1);
  const limit = 20;

  // Add tokens dialog
  let showAddTokens = $state(false);
  let selectedUserEmail = $state('');
  let selectedUserUid = $state('');
  let tokenAmount = $state(10);
  let tokenDescription = $state('');
  let addingTokens = $state(false);
  let tokenError = $state('');
  let tokenSuccess = $state('');

  // User search for add tokens
  let userSearchQuery = $state('');
  let userSearchResults = $state<{ uid: string; email: string; display_name: string }[]>([]);
  let searchingUsers = $state(false);
  let userSearchTimeout: ReturnType<typeof setTimeout>;

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      data = await listTokenHistory(page, limit);
    } catch (e: any) {
      error = e.message ?? 'Failed to load token history';
    } finally {
      loading = false;
    }
  }

  function goPage(p: number) {
    page = p;
    load();
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Search users for the "add tokens" dialog
  function onUserSearch() {
    clearTimeout(userSearchTimeout);
    if (userSearchQuery.length < 2) {
      userSearchResults = [];
      return;
    }
    userSearchTimeout = setTimeout(async () => {
      searchingUsers = true;
      try {
        const res = await listUsers(1, 10, userSearchQuery);
        userSearchResults = res.data.map(u => ({ uid: u.uid, email: u.email, display_name: u.display_name }));
      } finally {
        searchingUsers = false;
      }
    }, 300);
  }

  function selectUser(uid: string, email: string) {
    selectedUserUid = uid;
    selectedUserEmail = email;
    userSearchQuery = email;
    userSearchResults = [];
  }

  async function handleAddTokens() {
    if (!selectedUserUid) {
      tokenError = 'Please select a user';
      return;
    }
    addingTokens = true;
    tokenError = '';
    tokenSuccess = '';
    try {
      const res = await addTokens(selectedUserUid, tokenAmount, tokenDescription);
      tokenSuccess = `Added ${tokenAmount} tokens to ${selectedUserEmail}. New balance: ${res.current_balance}`;
      tokenAmount = 10;
      tokenDescription = '';
      selectedUserUid = '';
      selectedUserEmail = '';
      userSearchQuery = '';
      await load();
    } catch (e: any) {
      tokenError = e.message ?? 'Failed to add tokens';
    } finally {
      addingTokens = false;
    }
  }

  function openDialog() {
    showAddTokens = true;
    tokenError = '';
    tokenSuccess = '';
    selectedUserUid = '';
    selectedUserEmail = '';
    userSearchQuery = '';
    userSearchResults = [];
    tokenAmount = 10;
    tokenDescription = '';
  }
</script>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Token History</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {data ? `${data.total} total events` : 'All token transactions'}
      </p>
    </div>
    <button
      onclick={openDialog}
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Add Token
    </button>
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
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Feature</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
          {#each (data?.data ?? []) as item}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
                  {item.type === 'add'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'}">
                  {item.type === 'add' ? '↑ add' : '↓ use'}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-bold {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                  {item.type === 'add' ? '+' : ''}{item.amount}
                </span>
              </td>
              <td class="px-6 py-4">
                <a href="/users/{item.user_uid}" class="text-sm text-violet-600 dark:text-violet-400 hover:underline font-mono truncate block max-w-[160px]">
                  {item.user_uid}
                </a>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-400">{item.feature ?? '—'}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-400">{item.description ?? '—'}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.created_at)}</span>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-16 text-center text-gray-500 dark:text-gray-400 text-sm">No token events yet</td>
            </tr>
          {/each}
        </tbody>
      </table>

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
            >← Prev</button>
            <button
              onclick={() => goPage(page + 1)}
              disabled={page >= data.total_pages}
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next →</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Add Tokens Dialog -->
{#if showAddTokens}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => showAddTokens = false}></div>
    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-5">Add Token</h3>

      {#if tokenError}
        <div class="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{tokenError}</div>
      {/if}
      {#if tokenSuccess}
        <div class="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm">{tokenSuccess}</div>
      {/if}

      <div class="space-y-4">
        <!-- User search -->
        <div class="space-y-1.5 relative">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Select User</label>
          <div class="relative">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              bind:value={userSearchQuery}
              oninput={onUserSearch}
              placeholder="Search by email or name…"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            />
            {#if searchingUsers}
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            {/if}
          </div>
          {#if userSearchResults.length > 0}
            <div class="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              {#each userSearchResults as u}
                <button
                  type="button"
                  onclick={() => selectUser(u.uid, u.email)}
                  class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(u.display_name || u.email || 'U')[0].toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{u.display_name || 'No name'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
          {#if selectedUserUid}
            <p class="text-xs text-emerald-600 dark:text-emerald-400">✓ Selected: {selectedUserEmail}</p>
          {/if}
        </div>

        <!-- Amount -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
          <div class="flex gap-2">
            {#each [10, 20, 50, 100] as amt}
              <button
                type="button"
                onclick={() => tokenAmount = amt}
                class="flex-1 py-2 rounded-xl border text-sm font-medium transition-colors
                  {tokenAmount === amt
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
              >{amt}</button>
            {/each}
          </div>
          <input
            type="number"
            bind:value={tokenAmount}
            min="1"
            max="10000"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            placeholder="Custom amount"
          />
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span class="text-gray-400">(optional)</span></label>
          <input
            type="text"
            bind:value={tokenDescription}
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            placeholder="e.g. Promotional top-up"
          />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={() => showAddTokens = false}
          class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >Cancel</button>
        <button
          onclick={handleAddTokens}
          disabled={addingTokens || !selectedUserUid || tokenAmount < 1}
          class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-semibold disabled:opacity-60 transition-all flex items-center justify-center gap-2"
        >
          {#if addingTokens}
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          {/if}
          Add {tokenAmount} tokens
        </button>
      </div>
    </div>
  </div>
{/if}
