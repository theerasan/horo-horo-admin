<script lang="ts">
  import { onMount } from 'svelte';
  import { listPricing, updatePricing } from '$lib/api';
  import { PRICING } from '$lib/strings';
  import type { FeaturePricing } from '$lib/types';

  type Row = FeaturePricing & { draft: number; saving: boolean; saved: boolean; error: string };

  let rows = $state<Row[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await listPricing();
      rows = (res.pricing ?? []).map((p) => ({
        ...p,
        draft: p.token_cost,
        saving: false,
        saved: false,
        error: ''
      }));
    } catch (e: any) {
      error = e.message ?? PRICING.loadError;
    } finally {
      loading = false;
    }
  }

  function dirty(r: Row) {
    return r.draft !== r.token_cost;
  }

  async function save(r: Row) {
    if (r.draft == null || r.draft < 0 || !Number.isInteger(r.draft)) {
      r.error = PRICING.invalidCost;
      return;
    }
    r.saving = true;
    r.saved = false;
    r.error = '';
    try {
      const updated = await updatePricing(r.feature, r.draft);
      r.token_cost = updated.token_cost;
      r.updated_at = updated.updated_at;
      r.draft = updated.token_cost;
      r.saved = true;
      setTimeout(() => (r.saved = false), 2000);
    } catch (e: any) {
      r.error = e.message ?? PRICING.saveError;
    } finally {
      r.saving = false;
    }
  }

  function formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="p-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="page-title">{PRICING.title}</h1>
    <p class="page-subtitle">{PRICING.subtitle}</p>
  </div>

  {#if error}
    <div class="alert-error mb-5">{error}</div>
  {/if}

  <div class="card overflow-hidden">
    {#if loading}
      <div class="spinner-center">
        <svg class="animate-spin w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    {:else if rows.length === 0}
      <div class="p-8 text-center text-gray-500 dark:text-gray-400">No features found.</div>
    {:else}
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800 text-left">
            <th class="px-5 py-3 text-overline">{PRICING.colFeature}</th>
            <th class="px-5 py-3 text-overline">{PRICING.colKey}</th>
            <th class="px-5 py-3 text-overline">{PRICING.colCost}</th>
            <th class="px-5 py-3 text-overline">{PRICING.colUpdated}</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.feature)}
            <tr class="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
              <td class="px-5 py-4 text-body-medium text-gray-900 dark:text-white">{r.label}</td>
              <td class="px-5 py-4">
                <code class="text-caption text-gray-500 dark:text-gray-400">{r.feature}</code>
              </td>
              <td class="px-5 py-4">
                <input
                  type="number"
                  min="0"
                  step="1"
                  class="form-input w-28"
                  bind:value={r.draft}
                  aria-label={`${r.label} token cost`}
                />
                {#if r.error}
                  <p class="text-caption text-red-500 mt-1">{r.error}</p>
                {/if}
              </td>
              <td class="px-5 py-4 text-caption text-gray-500 dark:text-gray-400">
                {formatDate(r.updated_at)}
              </td>
              <td class="px-5 py-4 text-right">
                {#if r.saved}
                  <span class="text-caption text-green-600 dark:text-green-400">✓ {PRICING.saved}</span>
                {:else}
                  <button
                    class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={r.saving || !dirty(r)}
                    onclick={() => save(r)}
                  >
                    {r.saving ? PRICING.saving : PRICING.save}
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
