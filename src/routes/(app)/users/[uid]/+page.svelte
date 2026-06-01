<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getUser, updateUser, deleteUser, purgeUser, addTokens, listUserTokenHistory } from '$lib/api';
  import type { User, UserProfile, PaginatedHistory, AdminUpdateUserRequest } from '$lib/types';
  import { onMount } from 'svelte';
  import { ApiError } from '$lib/api';
  import { USER_DETAIL, DELETE_DIALOG, ADD_TOKENS_USER_DIALOG, TOKEN_HISTORY, GENERIC } from '$lib/strings';

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

  // Purge state
  let showPurgeDialog = $state(false);
  let purging = $state(false);

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
      error = e.message ?? USER_DETAIL.loadFallbackError;
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
      saveSuccess = USER_DETAIL.saveSuccess;
      setTimeout(() => saveSuccess = '', 3000);
    } catch (e: any) {
      saveError = e.message ?? USER_DETAIL.saveFallbackError;
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
      error = e.message ?? USER_DETAIL.deleteFallbackError;
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }

  async function confirmPurge() {
    purging = true;
    try {
      await purgeUser(uid);
      goto('/users');
    } catch (e: any) {
      error = e.message ?? 'Failed to permanently delete user';
      showPurgeDialog = false;
    } finally {
      purging = false;
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
      [user, history] = await Promise.all([
        getUser(uid),
        listUserTokenHistory(uid, histPage)
      ]);
    } catch (e: any) {
      tokenError = e.message ?? ADD_TOKENS_USER_DIALOG.errorFallback;
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
  <div class="breadcrumb">
    <a href="/users" class="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{USER_DETAIL.breadcrumbParent}</a>
    <span>/</span>
    <span class="text-gray-900 dark:text-white">{USER_DETAIL.breadcrumbCurrent}</span>
  </div>

  {#if loading}
    <div class="spinner-center">
      <svg class="animate-spin w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  {:else if error}
    <div class="alert-error">{error}</div>
  {:else if user}
    <div class="space-y-6">
      <!-- Profile card -->
      <div class="card-padded">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="user-avatar-lg">
              {(user.display_name || user.email || 'G')[0].toUpperCase()}
            </div>
            <div>
              <h1 class="text-heading-xl">{user.display_name || USER_DETAIL.noDisplayName}</h1>
              <p class="text-muted">{user.is_guest ? USER_DETAIL.guestUser : user.email}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="badge bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                  {user.role.replace('_', ' ')}
                </span>
                <span class="badge {tierColors[user.tier] ?? tierColors.free}">
                  {user.tier}
                </span>
                {#if user.is_guest}
                  <span class="badge bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{USER_DETAIL.guestLabel}</span>
                {/if}
                {#if user.oauth_provider}
                  <span class="badge bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 capitalize">{user.oauth_provider}</span>
                {/if}
                {#if user.deleted_at}
                  <span class="badge bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">Deleted</span>
                {/if}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              onclick={() => showAddTokens = true}
              class="btn-action-emerald"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {USER_DETAIL.addTokensButton}
            </button>
            {#if !editing}
              <button
                onclick={startEdit}
                class="btn-action-violet"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                {USER_DETAIL.editButton}
              </button>
              {#if user.deleted_at}
                <button
                  onclick={() => showPurgeDialog = true}
                  class="btn-action-danger"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Permanently Delete
                </button>
              {:else}
                <button
                  onclick={() => showDeleteDialog = true}
                  class="btn-action-danger"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  {USER_DETAIL.deleteButton}
                </button>
              {/if}
            {/if}
          </div>
        </div>

        {#if saveSuccess}
          <div class="alert-success flex items-center gap-2 mb-4">
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
              <div class="alert-error">{saveError}</div>
            {/if}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="form-label">{USER_DETAIL.fieldDisplayName}</label>
                <input type="text" bind:value={editForm.display_name} class="form-input" />
              </div>
              <div class="space-y-1.5">
                <label class="form-label">{USER_DETAIL.fieldEmail}</label>
                <input type="email" bind:value={editForm.email} class="form-input" />
              </div>
              <div class="space-y-1.5">
                <label class="form-label">{USER_DETAIL.fieldRole}</label>
                <select bind:value={editForm.role} class="form-input">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="back_office">back_office</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="form-label">{USER_DETAIL.fieldTier}</label>
                <select bind:value={editForm.tier} class="form-input">
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
                class="btn-save"
              >
                {#if saving}
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                {/if}
                {USER_DETAIL.saveButton}
              </button>
              <button onclick={() => editing = false} class="btn-cancel-sm">
                {USER_DETAIL.cancelEdit}
              </button>
            </div>
          </div>
        {:else}
          <!-- Info display -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="stat-card">
              <p class="stat-label">{USER_DETAIL.statBalance}</p>
              <p class="stat-value">{user.token}</p>
              <p class="stat-unit">{USER_DETAIL.statUnit}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">{USER_DETAIL.statAdded}</p>
              <p class="stat-value-emerald">{user.tokens_added ?? 0}</p>
              <p class="stat-unit">{USER_DETAIL.statUnit}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">{USER_DETAIL.statUsed}</p>
              <p class="stat-value-danger">{user.tokens_used ?? 0}</p>
              <p class="stat-unit">{USER_DETAIL.statUnit}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">{USER_DETAIL.statJoined}</p>
              <p class="text-body-semibold">{formatDate(user.created_at)}</p>
            </div>
          </div>

          <div class="uid-section space-y-1">
            <p class="uid-text">{USER_DETAIL.uidPrefix} {user.uid}</p>
            {#if user.email}
              <p class="uid-text">Email: {user.email}</p>
            {/if}
            {#if user.oauth_provider && user.oauth_id}
              <p class="uid-text">Auth: {user.oauth_provider} · {user.oauth_id}</p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Onboarding Profile -->
      {#if user.profile}
        {@const p = user.profile}
        <div class="card-padded">
          <h2 class="text-heading-sm mb-4">Onboarding Profile</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {#if p.birth_date}
              <div class="stat-card">
                <p class="stat-label">Date of Birth</p>
                <p class="text-body-semibold">{new Date(p.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            {/if}
            {#if p.time_of_birth}
              <div class="stat-card">
                <p class="stat-label">Time of Birth</p>
                <p class="text-body-semibold">{p.time_of_birth}</p>
              </div>
            {/if}
            {#if p.place_of_birth}
              <div class="stat-card">
                <p class="stat-label">Place of Birth</p>
                <p class="text-body-semibold">{p.place_of_birth}</p>
              </div>
            {/if}
            {#if p.gender}
              <div class="stat-card">
                <p class="stat-label">Gender</p>
                <p class="text-body-semibold capitalize">{p.gender}</p>
              </div>
            {/if}
            {#if p.gender_preference}
              <div class="stat-card">
                <p class="stat-label">Gender Preference</p>
                <p class="text-body-semibold capitalize">{p.gender_preference}</p>
              </div>
            {/if}
            {#if p.element}
              <div class="stat-card">
                <p class="stat-label">Element</p>
                <p class="text-body-semibold capitalize">{p.element}</p>
              </div>
            {/if}
            {#if p.planet}
              <div class="stat-card">
                <p class="stat-label">Ruling Planet</p>
                <p class="text-body-semibold capitalize">{p.planet}</p>
              </div>
            {/if}
            {#if p.mbti}
              <div class="stat-card">
                <p class="stat-label">MBTI</p>
                <p class="text-body-semibold">{p.mbti}</p>
              </div>
            {/if}
            {#if p.enneagram != null}
              <div class="stat-card">
                <p class="stat-label">Enneagram</p>
                <p class="text-body-semibold">{p.enneagram}{p.enneagram_wing != null ? `w${p.enneagram_wing}` : ''}</p>
              </div>
            {/if}
            <div class="stat-card">
              <p class="stat-label">Onboarding</p>
              <p class="text-body-semibold">{p.onboarding_complete ? 'Complete' : `Step ${p.onboarding_step}`}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Token history -->
      <div class="card overflow-hidden">
        <div class="card-header">
          <h2 class="text-heading-sm">{USER_DETAIL.historyTitle}</h2>
          {#if history}
            <span class="text-muted">{USER_DETAIL.historyEventsLabel(history.total)}</span>
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
                <th class="table-th">{TOKEN_HISTORY.colType}</th>
                <th class="table-th">{TOKEN_HISTORY.colAmount}</th>
                <th class="table-th">{TOKEN_HISTORY.colFeature}</th>
                <th class="table-th">{TOKEN_HISTORY.colDescription}</th>
                <th class="table-th">{TOKEN_HISTORY.colDate}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
              {#each (history?.data ?? []) as item}
                <tr class="table-row">
                  <td class="table-td-sm">
                    <span class="badge
                      {item.type === 'add'
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'}">
                      {item.type === 'add' ? TOKEN_HISTORY.typeAdd : TOKEN_HISTORY.typeUse}
                    </span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-sm font-bold {item.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
                      {item.type === 'add' ? '+' : ''}{item.amount}
                    </span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-muted-secondary">{item.feature ?? '—'}</span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-muted-secondary">{item.description ?? '—'}</span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-muted">{formatDate(item.created_at)}</span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="5" class="table-empty-cell">{USER_DETAIL.noHistory}</td>
                </tr>
              {/each}
            </tbody>
          </table>

          {#if history && history.total_pages > 1}
            <div class="card-footer">
              <p class="text-muted">{USER_DETAIL.pageLabel(histPage, history.total_pages)}</p>
              <div class="flex gap-2">
                <button onclick={() => loadHistory(histPage - 1)} disabled={histPage <= 1} class="btn-pagination">{USER_DETAIL.prevPage}</button>
                <button onclick={() => loadHistory(histPage + 1)} disabled={histPage >= history.total_pages} class="btn-pagination">{USER_DETAIL.nextPage}</button>
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
  <div class="modal-overlay">
    <div class="modal-backdrop" onclick={() => showAddTokens = false}></div>
    <div class="modal-card">
      <h3 class="dialog-title mb-4">{ADD_TOKENS_USER_DIALOG.title}</h3>
      {#if tokenError}
        <div class="alert-error mb-4">{tokenError}</div>
      {/if}
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="form-label">{ADD_TOKENS_USER_DIALOG.amountLabel}</label>
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
            class="form-input"
            placeholder={ADD_TOKENS_USER_DIALOG.amountPlaceholder}
          />
        </div>
        <div class="space-y-1.5">
          <label class="form-label">{ADD_TOKENS_USER_DIALOG.descriptionLabel} <span class="text-gray-400">{ADD_TOKENS_USER_DIALOG.descriptionOptional}</span></label>
          <input type="text" bind:value={tokenDescription} class="form-input" placeholder={ADD_TOKENS_USER_DIALOG.descriptionPlaceholder} />
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick={() => showAddTokens = false} class="btn-cancel">{ADD_TOKENS_USER_DIALOG.cancel}</button>
        <button
          onclick={handleAddTokens}
          disabled={addingTokens || tokenAmount < 1}
          class="btn-emerald"
        >
          {#if addingTokens}
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          {/if}
          {ADD_TOKENS_USER_DIALOG.submitButton(tokenAmount)}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Purge confirm -->
{#if showPurgeDialog}
  <div class="modal-overlay">
    <div class="modal-backdrop" onclick={() => showPurgeDialog = false}></div>
    <div class="modal-card">
      <div class="dialog-icon-danger">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </div>
      <h3 class="dialog-title text-center mb-2">Permanently Delete User</h3>
      <p class="dialog-body mb-6">This will <strong>permanently</strong> remove the user and all associated data from the database. This action <strong>cannot be undone</strong>.</p>
      <div class="flex gap-3">
        <button onclick={() => showPurgeDialog = false} class="btn-cancel">Cancel</button>
        <button onclick={confirmPurge} disabled={purging} class="btn-danger">
          {purging ? 'Deleting...' : 'Permanently Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete confirm -->
{#if showDeleteDialog}
  <div class="modal-overlay">
    <div class="modal-backdrop" onclick={() => showDeleteDialog = false}></div>
    <div class="modal-card">
      <div class="dialog-icon-danger">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </div>
      <h3 class="dialog-title text-center mb-2">{DELETE_DIALOG.title}</h3>
      <p class="dialog-body mb-6">{DELETE_DIALOG.message}</p>
      <div class="flex gap-3">
        <button onclick={() => showDeleteDialog = false} class="btn-cancel">{DELETE_DIALOG.cancel}</button>
        <button onclick={confirmDelete} disabled={deleting} class="btn-danger">
          {deleting ? DELETE_DIALOG.deleting : DELETE_DIALOG.confirm}
        </button>
      </div>
    </div>
  </div>
{/if}
