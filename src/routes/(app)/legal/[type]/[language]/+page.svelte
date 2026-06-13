<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { listLegalHistory, createLegalDoc, publishLegalDoc, deleteLegalDoc } from '$lib/api';
  import { LEGAL } from '$lib/strings';
  import type { LegalDocument, LegalDocType } from '$lib/types';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  const docType = $derived($page.params.type as LegalDocType);
  const language = $derived($page.params.language);
  const openNewForm = $derived($page.url.searchParams.get('new') === '1');

  let docs = $state<LegalDocument[]>([]);
  let total = $state(0);
  let currentPage = $state(1);
  let totalPages = $state(1);
  const limit = 20;

  let loading = $state(true);
  let error = $state('');

  let showForm = $state(false);
  let formTitle = $state('');
  let formContent = $state('');
  let formSubmitting = $state(false);
  let formError = $state('');
  let formSuccess = $state('');

  let publishingId = $state<string | null>(null);
  let publishError = $state('');
  let publishSuccess = $state('');

  let deletingId = $state<string | null>(null);
  let deleteError = $state('');

  let previewId = $state<string | null>(null);

  // Modal state — one modal serves both publish and delete confirmations
  type ModalAction = { kind: 'publish'; doc: LegalDocument } | { kind: 'delete'; doc: LegalDocument };
  let pendingAction = $state<ModalAction | null>(null);

  const modalTitle = $derived(
    pendingAction?.kind === 'publish' ? 'Publish this version?' : 'Delete this version?'
  );
  const modalMessage = $derived(
    pendingAction?.kind === 'publish'
      ? `v${pendingAction.doc.version} "${pendingAction.doc.title}" will become the live public document.`
      : `v${pendingAction.doc.version} "${pendingAction.doc.title}" will be permanently deleted.`
  );
  const modalConfirmLabel = $derived(pendingAction?.kind === 'publish' ? 'Publish' : 'Delete');
  const modalDanger = $derived(pendingAction?.kind === 'delete');

  onMount(async () => {
    await load();
    if (openNewForm) showForm = true;
  });

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await listLegalHistory(docType, language, currentPage, limit);
      docs = res.data;
      total = res.total;
      totalPages = res.total_pages;
    } catch (e: any) {
      error = e.message ?? 'Failed to load history';
    } finally {
      loading = false;
    }
  }

  async function submitNewVersion() {
    if (!formTitle.trim() || !formContent.trim()) return;
    formSubmitting = true;
    formError = '';
    formSuccess = '';
    try {
      const doc = await createLegalDoc(docType, language, {
        title: formTitle.trim(),
        content: formContent.trim()
      });
      formSuccess = LEGAL.saveSuccess;
      formTitle = '';
      formContent = '';
      showForm = false;
      docs = [doc, ...docs];
      total += 1;
    } catch (e: any) {
      formError = e.message ?? LEGAL.saveFallbackError;
    } finally {
      formSubmitting = false;
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const action = pendingAction;
    pendingAction = null;

    if (action.kind === 'publish') {
      publishingId = action.doc.id;
      publishError = '';
      publishSuccess = '';
      try {
        await publishLegalDoc(action.doc.id);
        publishSuccess = LEGAL.publishSuccess;
        await load();
      } catch (e: any) {
        publishError = e.message ?? LEGAL.publishFallbackError;
      } finally {
        publishingId = null;
      }
    } else {
      deletingId = action.doc.id;
      deleteError = '';
      try {
        await deleteLegalDoc(action.doc.id);
        docs = docs.filter(d => d.id !== action.doc.id);
        total -= 1;
      } catch (e: any) {
        deleteError = e.message ?? 'Failed to delete version';
      } finally {
        deletingId = null;
      }
    }
  }

  function typeLabel(type: string) {
    return type === 'privacy_policy' ? LEGAL.typeLabelPrivacy : LEGAL.typeLabelTerms;
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="p-8">
  <!-- Header -->
  <div class="flex items-start justify-between mb-8">
    <div>
      <a
        href="/legal"
        class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 font-medium transition-colors mb-2 inline-block"
      >
        {LEGAL.backToOverview}
      </a>
      <h1 class="page-title">{typeLabel(docType)}</h1>
      <div class="flex items-center gap-2 mt-1">
        <span class="font-mono text-xs uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {language}
        </span>
        <span class="text-caption">Version history</span>
        <a
          href="/p/{docType}/{language}"
          target="_blank"
          rel="noopener"
          class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 font-medium transition-colors"
        >
          Public page ↗
        </a>
      </div>
    </div>
    <button
      class="btn-primary"
      onclick={() => { showForm = !showForm; formError = ''; formSuccess = ''; }}
    >
      + {LEGAL.newVersionButton}
    </button>
  </div>

  <!-- Feedback banners -->
  {#if publishSuccess}
    <div class="alert-success mb-5">{publishSuccess}</div>
  {/if}
  {#if publishError}
    <div class="alert-error mb-5">{publishError}</div>
  {/if}
  {#if deleteError}
    <div class="alert-error mb-5">{deleteError}</div>
  {/if}

  <!-- New version form -->
  {#if showForm}
    <div class="card p-6 mb-6">
      <p class="text-body-medium mb-5">{LEGAL.formTitle}</p>

      {#if formError}
        <div class="alert-error mb-4">{formError}</div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="form-label mb-1.5" for="form-title">{LEGAL.fieldTitle}</label>
          <input
            id="form-title"
            type="text"
            class="form-input"
            placeholder={LEGAL.fieldTitlePlaceholder}
            bind:value={formTitle}
          />
        </div>

        <div>
          <label class="form-label mb-1.5" for="form-content">
            {LEGAL.fieldContent}
            <span class="text-caption ml-1">(rendered as HTML)</span>
          </label>
          <textarea
            id="form-content"
            class="form-input font-mono text-sm"
            rows="16"
            placeholder={LEGAL.fieldContentPlaceholder}
            bind:value={formContent}
          ></textarea>
        </div>

        <!-- Live preview -->
        {#if formContent.trim()}
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800/60 text-caption border-b border-gray-200 dark:border-gray-700">
              Preview
            </div>
            <div class="p-5 text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-64 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1">
              {@html formContent}
            </div>
          </div>
        {/if}

        <div class="flex gap-3 pt-1">
          <button
            class="btn-primary"
            onclick={submitNewVersion}
            disabled={formSubmitting || !formTitle.trim() || !formContent.trim()}
          >
            {formSubmitting ? LEGAL.submitting : LEGAL.submitButton}
          </button>
          <button
            class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onclick={() => (showForm = false)}
          >
            {LEGAL.cancelButton}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- History table -->
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
    {:else if docs.length === 0}
      <div class="flex flex-col items-center justify-center h-48 gap-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">{LEGAL.noHistory}</p>
        <button class="btn-primary text-sm" onclick={() => (showForm = true)}>+ {LEGAL.newVersionButton}</button>
      </div>
    {:else}
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <th class="table-th w-20">{LEGAL.colVersion}</th>
            <th class="table-th">{LEGAL.colTitle}</th>
            <th class="table-th">{LEGAL.colStatus}</th>
            <th class="table-th">{LEGAL.colCreatedAt}</th>
            <th class="px-6 py-3.5"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
          {#each docs as doc}
            <tr class="table-row {doc.is_published ? 'bg-green-50/40 dark:bg-green-950/10' : ''}">
              <td class="table-td font-mono text-sm text-gray-600 dark:text-gray-400">v{doc.version}</td>
              <td class="table-td text-body-medium">{doc.title || '—'}</td>
              <td class="table-td">
                {#if doc.is_published}
                  <span class="badge bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300">
                    ✓ {LEGAL.statusPublished}
                  </span>
                {:else}
                  <span class="badge bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {LEGAL.statusDraft}
                  </span>
                {/if}
              </td>
              <td class="table-td text-caption">{formatDate(doc.created_at)}</td>
              <td class="table-td">
                <div class="flex items-center gap-3 justify-end">
                  <button
                    class="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 font-medium transition-colors"
                    onclick={() => (previewId = previewId === doc.id ? null : doc.id)}
                  >
                    {previewId === doc.id ? 'Hide' : LEGAL.viewButton}
                  </button>
                  {#if !doc.is_published}
                    <button
                      class="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      onclick={() => (pendingAction = { kind: 'publish', doc })}
                      disabled={publishingId === doc.id}
                    >
                      {publishingId === doc.id ? LEGAL.publishing : LEGAL.publishButton}
                    </button>
                    <button
                      class="px-3 py-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition-colors disabled:opacity-50"
                      onclick={() => (pendingAction = { kind: 'delete', doc })}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? '…' : 'Delete'}
                    </button>
                  {/if}
                </div>
              </td>
            </tr>

            <!-- Inline preview -->
            {#if previewId === doc.id}
              <tr>
                <td colspan="5" class="p-0 border-t border-gray-100 dark:border-gray-800">
                  <div class="px-8 py-6 bg-gray-50/50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-96 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1">
                    {@html doc.content}
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <span class="text-caption">{total} versions · page {currentPage} of {totalPages}</span>
          <div class="flex gap-2">
            <button
              class="btn-pagination"
              onclick={async () => { currentPage--; await load(); }}
              disabled={currentPage <= 1}
            >← Prev</button>
            <button
              class="btn-pagination"
              onclick={async () => { currentPage++; await load(); }}
              disabled={currentPage >= totalPages}
            >Next →</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<ConfirmModal
  open={pendingAction !== null}
  title={modalTitle}
  message={modalMessage}
  confirmLabel={modalConfirmLabel}
  danger={modalDanger}
  onconfirm={confirmAction}
  oncancel={() => (pendingAction = null)}
/>
