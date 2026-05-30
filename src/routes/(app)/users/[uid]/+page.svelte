<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getUser, updateUser, deleteUser, addTokens, listUserTokenHistory } from '$lib/api';
  import type { User, PaginatedHistory, AdminUpdateUserRequest } from '$lib/types';
  import { onMount } from 'svelte';
  import { ApiError } from '$lib/api';

  const uid = $derived($page.params.uid);

  let user = $state<User | null>(null);
  let history = $state<PaginatedHistory | null>(null);
  let loading = $state(true);
  let error = $state('');

  // Edit state
  let editing = $state(false);
  let editForm = $state<AdminUpdateUserRequest>({});
  let saving = $state(false);
  let saveError = $state('');
  let saveSuccess = $state('');

  // Delete state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);

  // Add tokens state
  let showAddTokens = $state(false);
  let tokenAmount = $state(10);
  let tokenDescription = $state('');
  let addingTokens = $state(false);
  let tokenError = $state('');

  // History pagination
  let histPage = $state(1);
  let histLoading = $state(false);

  onMount(async () => {
    await loadUser();
  });

  async function loadUser() {
    loading = true;
    error = '';
    try {
      [user, history] = await Promise.all([
        getUser(uid),
        listUserTokenHistory(uid, 1)
      ]);
    } catch (e: any) {
      error = e.message ?? 'Failed to load user';
    } finally {
      loading = false;
    }
  }

  function startEdit() {
    if (!user) return;
    editForm = {
      display_name: user.display_name,
      email: user.email,
      role: user.role,
      tier: user.tier
    };
    editing = true;
    saveError = '';
    saveSuccess = '';
  }

  async function saveEdit() {
    saving = true;
    saveError = '';
    saveSuccess = '';
    try {
      user = await updateUser(uid, editForm) as User;
      editing = false;
      saveSuccess = 'Profile updated successfully!';
      setTimeout(() => saveSuccess = '', 3000);
    } catch (e: any) {
      saveError = e.message ?? 'Failed to save changes';
    } finally {
      saving = false;
    }
  }

  async function confirmDelete() {
    deleting = true;
    try {
      await deleteUser(uid);
      goto('/users');
    } catch (e: any) {
      error = e.message ?? 'Failed to delete user';
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }

  async function handleAddTokens() {
    addingTokens = true;
    tokenError = '';
    try {
      await addTokens(uid, tokenAmount, tokenDescription);
      showAddTokens = false;
      tokenAmount = 10;
      tokenDescription = '';
      // Reload to get updated balance + history
      [user, history] = await Promise.all([
        getUser(uid),
        listUserTokenHistory(uid, histPage)
      ]);
    } catch (e: any) {
      tokenError = e.message ?? 'Failed to add tokens';
    } finally {
      addingTokens = false;
    }
  }

  async function loadHistory(p: number) {
    histPage = p;
    histLoading = true;
    try {
      history = await listUserTokenHistory(uid, p);
    } finally {
      histLoading = false;
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  const tierColors: Record<string, string> = {
    premium: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    pro: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
    free: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  };
</script>

<div class="p-8">
  <!-- Breadcrumb -->
  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
    <a href="/users" class="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Users</a>
    <span>/</span>
    <span class="text-gray-900 dark:text-white">User Detail</span>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <svg class="animate-spin w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  {:else if error}
    <div class="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl p-6 text-sm">{error}</div>
  {:else if user}
    <div class="space-y-6">
      <!-- Profile card -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {(user.display_name || user.email || 'G')[0].toUpperCase()}
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">{user.display_name || 'No display name'}</h1>
              <p class="text-gray-500 dark:text-gray-400 text-sm">{user.is_guest ? 'Guest user' : user.email}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                  {user.role.replace('_', ' ')}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium {tierColors[user.tier] ?? tierColors.free}">
                  {user.tier}
                </span>
                {#if user.is_guest}
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    guest
                  </span>
                {/if}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              onclick={() => showAddTokens = true}
              class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Tokens
            </button>
            {#if !editing}
              <button
                onclick={startEdit}
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit
              </button>
              <button
                onclick={() => showDeleteDialog = true}
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            {/if}
          </div>
        </div>

        {#if saveSuccess}
          <div class="mb-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {saveSuccess}
          </div>
        {/if}

        {#if editing}
          <!-- Edit form -->
          <div class="space-y-4">
            {#if saveError}
              <div class="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{saveError}</div>
            {/if}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                <input
                  type="text"
                  bind:value={editForm.display_name}
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  bind:value={editForm.email}
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  bind:value={editForm.role}
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="back_office">back_office</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tier</label>
                <select
                  bind:value={editForm.tier}
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                >
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                  <option value="premium">premium</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button
                onclick={saveEdit}
                disabled={saving}
                class="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {#if saving}
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                {/if}
                Save changes
              </button>
              <button
                onclick={() => editing = false}
                class="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <!-- Info display -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Current Balance</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{user.token}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">tokens</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Added</p>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{user.tokens_added ?? 0}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">tokens</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Used</p>
              <p class="text-2xl font-bold text-red-500 dark:text-red-400">{user.tokens_used ?? 0}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">tokens</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Joined</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p class="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">UID: {user.uid}</p>
          </div>
        {/if}
      </div>

      <!-- Token history -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 dark:text-white">Token History</h2>
          {#if history}
            <span class="text-sm text-gray-500 dark:text-gray-400">{history.total} events</span>
          {/if}
        </div>

        {#if histLoading}
          <div class="flex items-center justify-center py-12">
            <svg class="animate-spin w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        {:else}
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-50 dark:border-gray-800">
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Feature</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
              {#each (history?.data ?? []) as item}
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td class="px-6 py-3.5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                      {item.type === 'add'
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'}">
                      {item.type === 'add' ? '↑ add' : '↓ use'}
                    </span>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="text-sm font-bold {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                      {item.type === 'add' ? '+' : ''}{item.amount}
                    </span>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="text-sm text-gray-600 dark:text-gray-400">{item.feature ?? '—'}</span>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="text-sm text-gray-600 dark:text-gray-400">{item.description ?? '—'}</span>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.created_at)}</span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">No token history</td>
                </tr>
              {/each}
            </tbody>
          </table>

          {#if history && history.total_pages > 1}
            <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <p class="text-sm text-gray-500 dark:text-gray-400">Page {histPage} of {history.total_pages}</p>
              <div class="flex gap-2">
                <button
                  onclick={() => loadHistory(histPage - 1)}
                  disabled={histPage <= 1}
                  class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >← Prev</button>
                <button
                  onclick={() => loadHistory(histPage + 1)}
                  disabled={histPage >= history.total_pages}
                  class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >Next →</button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Add Tokens Dialog -->
{#if showAddTokens}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => showAddTokens = false}></div>
    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Tokens</h3>
      {#if tokenError}
        <div class="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{tokenError}</div>
      {/if}
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
          <div class="flex items-center gap-3">
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
          disabled={addingTokens || tokenAmount < 1}
          class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
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

<!-- Delete confirm -->
{#if showDeleteDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => showDeleteDialog = false}></div>
    <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6">
      <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 mx-auto mb-4">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">Delete User?</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">This will soft-delete the user. This action can be reversed in the database.</p>
      <div class="flex gap-3">
        <button onclick={() => showDeleteDialog = false} class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
        <button onclick={confirmDelete} disabled={deleting} class="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60 transition-colors">
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}
