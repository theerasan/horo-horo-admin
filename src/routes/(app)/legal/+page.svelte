<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { listLegalSummaries, deleteAllLegalDocs } from '$lib/api';
  import { LEGAL } from '$lib/strings';
  import type { LegalDocSummary, LegalDocType } from '$lib/types';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let summaries = $state<LegalDocSummary[]>([]);
  let loading = $state(true);
  let error = $state('');

  let deletingKey = $state<string | null>(null);
  let deleteError = $state('');
  let confirmTarget = $state<LegalDocSummary | null>(null);

  let showNewForm = $state(false);
  let newType = $state<LegalDocType>('privacy_policy');
  let newLanguage = $state('en');
  let customLanguage = $state('');

  onMount(async () => {
    await load();
  });

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await listLegalSummaries();
      summaries = res.data ?? [];
    } catch (e: any) {
      error = e.message ?? 'Failed to load documents';
    } finally {
      loading = false;
    }
  }

  function typeLabel(type: string) {
    return type === 'privacy_policy' ? LEGAL.typeLabelPrivacy : LEGAL.typeLabelTerms;
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  async function confirmDeleteAll() {
    if (!confirmTarget) return;
    const s = confirmTarget;
    confirmTarget = null;
    deletingKey = `${s.type}:${s.language}`;
    deleteError = '';
    try {
      await deleteAllLegalDocs(s.type as LegalDocType, s.language);
      summaries = summaries.filter(x => !(x.type === s.type && x.language === s.language));
    } catch (e: any) {
      deleteError = e.message ?? 'Failed to delete';
    } finally {
      deletingKey = null;
    }
  }

  function createNew() {
    const lang = newLanguage === '__custom__' ? customLanguage.trim() : newLanguage;
    if (!lang) return;
    goto(`/legal/${newType}/${lang}?new=1`);
  }
</script>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="page-title">{LEGAL.title}</h1>
      <p class="page-subtitle">{LEGAL.subtitle}</p>
    </div>
    <button class="btn-primary" onclick={() => (showNewForm = !showNewForm)}>
      + {LEGAL.newDocButton}
    </button>
  </div>

  {#if deleteError}
    <div class="alert-error mb-5">{deleteError}</div>
  {/if}

  <!-- New document quick-start -->
  {#if showNewForm}
    <div class="card p-5 mb-6">
      <p class="text-body-medium mb-4">Choose document type and language</p>
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="form-label mb-1.5" for="new-type">{LEGAL.colType}</label>
          <select id="new-type" class="form-input w-48" bind:value={newType}>
            <option value="privacy_policy">{LEGAL.typeLabelPrivacy}</option>
            <option value="terms_of_use">{LEGAL.typeLabelTerms}</option>
          </select>
        </div>
        <div>
          <label class="form-label mb-1.5" for="new-lang">{LEGAL.fieldLanguage}</label>
          <select id="new-lang" class="form-input w-48" bind:value={newLanguage}>
            {#each LEGAL.suggestedLanguages as l}
              <option value={l.code}>{l.label} ({l.code})</option>
            {/each}
            <option value="__custom__">Other…</option>
          </select>
        </div>
        {#if newLanguage === '__custom__'}
          <div>
            <label class="form-label mb-1.5" for="custom-lang">Language code</label>
            <input
              id="custom-lang"
              type="text"
              class="form-input w-24"
              placeholder="e.g. fr"
              bind:value={customLanguage}
            />
          </div>
        {/if}
        <button class="btn-primary" onclick={createNew}>Create →</button>
        <button
          class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onclick={() => (showNewForm = false)}
        >
          Cancel
        </button>
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
    {:else if summaries.length === 0}
      <div class="flex flex-col items-center justify-center h-64 gap-3">
        <svg class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-sm text-gray-500 dark:text-gray-400">{LEGAL.noDocs}</p>
        <button class="btn-primary text-sm" onclick={() => (showNewForm = true)}>+ {LEGAL.newDocButton}</button>
      </div>
    {:else}
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <th class="table-th">{LEGAL.colType}</th>
            <th class="table-th">{LEGAL.colLanguage}</th>
            <th class="table-th text-right">{LEGAL.colLatestVersion}</th>
            <th class="table-th text-right">{LEGAL.colPublishedVersion}</th>
            <th class="table-th">{LEGAL.colPublishedAt}</th>
            <th class="table-th">{LEGAL.colUpdatedAt}</th>
            <th class="px-6 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
          {#each summaries as s}
            <tr class="table-row">
              <td class="table-td">
                <span class="badge {s.type === 'privacy_policy'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'}">
                  {typeLabel(s.type)}
                </span>
              </td>
              <td class="table-td">
                <span class="font-mono text-xs uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {s.language}
                </span>
              </td>
              <td class="table-td text-right text-sm text-gray-600 dark:text-gray-400">
                v{s.latest_version}
              </td>
              <td class="table-td text-right">
                {#if s.published_version != null}
                  <span class="badge bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300">
                    v{s.published_version}
                  </span>
                {:else}
                  <span class="text-gray-400 dark:text-gray-600 text-sm">—</span>
                {/if}
              </td>
              <td class="table-td text-caption">{formatDate(s.published_at)}</td>
              <td class="table-td text-caption">{formatDate(s.updated_at)}</td>
              <td class="table-td">
                <div class="flex items-center gap-3 justify-end">
                  <button
                    class="text-violet-600 dark:text-violet-400 text-sm font-medium hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                    onclick={() => goto(`/legal/${s.type}/${s.language}`)}
                  >
                    Manage →
                  </button>
                  <button
                    class="px-3 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition-colors disabled:opacity-50"
                    onclick={() => (confirmTarget = s)}
                    disabled={deletingKey === `${s.type}:${s.language}`}
                  >
                    {deletingKey === `${s.type}:${s.language}` ? '…' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<ConfirmModal
  open={confirmTarget !== null}
  title="Delete all versions?"
  message={confirmTarget
    ? `This will permanently delete all ${confirmTarget.latest_version} version(s) of ${typeLabel(confirmTarget.type)} (${confirmTarget.language}). This cannot be undone.`
    : ''}
  confirmLabel="Delete"
  danger={true}
  onconfirm={confirmDeleteAll}
  oncancel={() => (confirmTarget = null)}
/>
