<script lang="ts">
  import { listTokenHistory, listUsers, addTokens } from '$lib/api';
  import type { PaginatedHistory } from '$lib/types';
  import { onMount } from 'svelte';
  import { TOKEN_HISTORY, ADD_TOKENS_DIALOG, GENERIC } from '$lib/strings';

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
      tokenSuccess = ADD_TOKENS_DIALOG.successMessage(tokenAmount, selectedUserEmail, res.current_balance);
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
      <h1 class="page-title">{TOKEN_HISTORY.title}</h1>
      <p class="page-subtitle">
        {data ? TOKEN_HISTORY.subtitleCount(data.total) : TOKEN_HISTORY.subtitleFallback}
      </p>
    </div>
    <button onclick={openDialog} class="btn-primary">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      {TOKEN_HISTORY.addTokenButton}
    </button>
  </div>

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
            <th class="table-th">{TOKEN_HISTORY.colType}</th>
            <th class="table-th">{TOKEN_HISTORY.colAmount}</th>
            <th class="table-th">{TOKEN_HISTORY.colUser}</th>
            <th class="table-th">{TOKEN_HISTORY.colFeature}</th>
            <th class="table-th">{TOKEN_HISTORY.colDescription}</th>
            <th class="table-th">{TOKEN_HISTORY.colDate}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
          {#each (data?.data ?? []) as item}
            <tr class="table-row">
              <td class="table-td">
                <span class="badge
                  {item.type === 'add'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'}">
                  {item.type === 'add' ? TOKEN_HISTORY.typeAdd : TOKEN_HISTORY.typeUse}
                </span>
              </td>
              <td class="table-td">
                <span class="text-sm font-bold {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                  {item.type === 'add' ? '+' : ''}{item.amount}
                </span>
              </td>
              <td class="table-td">
                <a href="/users/{item.user_uid}" class="uid-link">
                  {item.user_uid}
                </a>
              </td>
              <td class="table-td">
                <span class="text-muted-secondary">{item.feature ?? '—'}</span>
              </td>
              <td class="table-td">
                <span class="text-muted-secondary">{item.description ?? '—'}</span>
              </td>
              <td class="table-td">
                <span class="text-muted">{formatDate(item.created_at)}</span>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-16 text-center text-gray-500 dark:text-gray-400 text-sm">{TOKEN_HISTORY.noEvents}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if data && data.total_pages > 1}
        <div class="card-footer">
          <p class="text-muted">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
          </p>
          <div class="flex gap-2">
            <button onclick={() => goPage(page - 1)} disabled={page <= 1} class="btn-pagination">{TOKEN_HISTORY.prevPage}</button>
            <button onclick={() => goPage(page + 1)} disabled={page >= data.total_pages} class="btn-pagination">{TOKEN_HISTORY.nextPage}</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Add Tokens Dialog -->
{#if showAddTokens}
  <div class="modal-overlay">
    <div class="modal-backdrop" onclick={() => showAddTokens = false}></div>
    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6">
      <h3 class="dialog-title mb-5">{ADD_TOKENS_DIALOG.title}</h3>

      {#if tokenError}
        <div class="alert-error mb-4">{tokenError}</div>
      {/if}
      {#if tokenSuccess}
        <div class="alert-success mb-4">{tokenSuccess}</div>
      {/if}

      <div class="space-y-4">
        <!-- User search -->
        <div class="space-y-1.5 relative">
          <label class="form-label">{ADD_TOKENS_DIALOG.selectUserLabel}</label>
          <div class="relative">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              bind:value={userSearchQuery}
              oninput={onUserSearch}
              placeholder={ADD_TOKENS_DIALOG.selectUserPlaceholder}
              class="search-input"
            />
            {#if searchingUsers}
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            {/if}
          </div>
          {#if userSearchResults.length > 0}
            <div class="dropdown-menu">
              {#each userSearchResults as u}
                <button
                  type="button"
                  onclick={() => selectUser(u.uid, u.email)}
                  class="dropdown-item"
                >
                  <div class="user-avatar">
                    {(u.display_name || u.email || 'U')[0].toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <p class="text-body-medium truncate">{u.display_name || GENERIC.noName}</p>
                    <p class="text-caption truncate">{u.email}</p>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
          {#if selectedUserUid}
            <p class="text-xs text-emerald-600 dark:text-emerald-400">{ADD_TOKENS_DIALOG.selectedPrefix} {selectedUserEmail}</p>
          {/if}
        </div>

        <!-- Amount -->
        <div class="space-y-2">
          <label class="form-label">{ADD_TOKENS_DIALOG.amountLabel}</label>
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
            class="form-input"
            placeholder={ADD_TOKENS_DIALOG.amountPlaceholder}
          />
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="form-label">{ADD_TOKENS_DIALOG.descriptionLabel} <span class="text-gray-400">{ADD_TOKENS_DIALOG.descriptionOptional}</span></label>
          <input
            type="text"
            bind:value={tokenDescription}
            class="form-input"
            placeholder={ADD_TOKENS_DIALOG.descriptionPlaceholder}
          />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick={() => showAddTokens = false} class="btn-cancel">{ADD_TOKENS_DIALOG.cancel}</button>
        <button
          onclick={handleAddTokens}
          disabled={addingTokens || !selectedUserUid || tokenAmount < 1}
          class="btn-submit-dialog"
        >
          {#if addingTokens}
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          {/if}
          {ADD_TOKENS_DIALOG.submitButton(tokenAmount)}
        </button>
      </div>
    </div>
  </div>
{/if}
