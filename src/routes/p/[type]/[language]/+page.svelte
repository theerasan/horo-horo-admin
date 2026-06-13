<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { API_BASE_URL } from '$lib/env';
  import type { LegalDocument } from '$lib/types';

  const docType = $derived($page.params.type);
  const language = $derived($page.params.language);

  let doc = $state<LegalDocument | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/legal/${docType}?lang=${language}`);
      if (!res.ok) throw new Error('Document not found');
      doc = await res.json();
    } catch (e: any) {
      error = e.message ?? 'Failed to load document';
    } finally {
      loading = false;
    }
  });

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
</script>

<svelte:head>
  {#if doc}
    <title>{doc.title}</title>
  {:else}
    <title>Legal Document</title>
  {/if}
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="legal-page">
  {#if loading}
    <div class="legal-loading">
      <div class="legal-spinner"></div>
    </div>
  {:else if error}
    <div class="legal-error">
      <p>{error}</p>
    </div>
  {:else if doc}
    <article class="legal-article">
      <!-- Meta -->
      <header class="legal-header">
        <h1 class="legal-title">{doc.title}</h1>
        <div class="legal-meta">
          {#if doc.published_at}
            <span>Effective: {formatDate(doc.published_at)}</span>
          {/if}
          <span>Version {doc.version}</span>
          <span class="legal-lang">{doc.language.toUpperCase()}</span>
        </div>
      </header>

      <!-- Content (HTML) -->
      <div class="legal-content">
        {@html doc.content}
      </div>
    </article>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    background: #ffffff;
    color: #1a1a2e;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :global(body) {
      background: #0f0f1a;
      color: #e8e8f0;
    }
  }

  .legal-page {
    min-height: 100vh;
    padding: 24px 16px 64px;
  }

  .legal-loading,
  .legal-error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    color: #888;
  }

  .legal-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e0e0e0;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .legal-article {
    max-width: 680px;
    margin: 0 auto;
  }

  .legal-header {
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  @media (prefers-color-scheme: dark) {
    .legal-header {
      border-bottom-color: #2d2d40;
    }
  }

  .legal-title {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 12px;
    color: #111827;
  }

  @media (prefers-color-scheme: dark) {
    .legal-title {
      color: #f3f4f6;
    }
  }

  .legal-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .legal-lang {
    background: #f3f4f6;
    border-radius: 4px;
    padding: 1px 6px;
    font-family: monospace;
    font-weight: 600;
  }

  @media (prefers-color-scheme: dark) {
    .legal-lang {
      background: #1f2937;
      color: #d1d5db;
    }
  }

  /* Prose styles for the HTML content */
  .legal-content :global(h1),
  .legal-content :global(h2),
  .legal-content :global(h3),
  .legal-content :global(h4) {
    font-weight: 600;
    line-height: 1.3;
    margin: 1.5em 0 0.5em;
    color: #111827;
  }

  @media (prefers-color-scheme: dark) {
    .legal-content :global(h1),
    .legal-content :global(h2),
    .legal-content :global(h3),
    .legal-content :global(h4) {
      color: #f3f4f6;
    }
  }

  .legal-content :global(h1) { font-size: 1.5rem; }
  .legal-content :global(h2) { font-size: 1.25rem; }
  .legal-content :global(h3) { font-size: 1.1rem; }

  .legal-content :global(p) {
    margin: 0 0 1em;
    line-height: 1.7;
    font-size: 0.95rem;
    color: #374151;
  }

  @media (prefers-color-scheme: dark) {
    .legal-content :global(p) {
      color: #d1d5db;
    }
  }

  .legal-content :global(ul),
  .legal-content :global(ol) {
    margin: 0 0 1em;
    padding-left: 1.5em;
    font-size: 0.95rem;
    line-height: 1.7;
    color: #374151;
  }

  @media (prefers-color-scheme: dark) {
    .legal-content :global(ul),
    .legal-content :global(ol) {
      color: #d1d5db;
    }
  }

  .legal-content :global(li) {
    margin-bottom: 0.25em;
  }

  .legal-content :global(a) {
    color: #7c3aed;
    text-decoration: underline;
  }

  .legal-content :global(strong) {
    font-weight: 600;
  }

  .legal-content :global(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 2em 0;
  }

  @media (prefers-color-scheme: dark) {
    .legal-content :global(hr) {
      border-top-color: #2d2d40;
    }
  }
</style>
