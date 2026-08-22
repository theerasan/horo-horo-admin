<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getPackageConfig,
    updateVideoReward,
    updateSubscriptionPlan,
    updateBillingOption,
    updateTokenPackage
  } from '$lib/api';
  import { PACKAGES } from '$lib/strings';
  import type { SubscriptionPlan, SubscriptionBillingOption, TokenPackage } from '$lib/types';

  type PlanRow = SubscriptionPlan & {
    draftPrice: number;
    draftCurrency: string;
    draftTokensPerDay: number;
    draftActive: boolean;
    saving: boolean;
    saved: boolean;
    error: string;
  };
  type BillingRow = SubscriptionBillingOption & { draftDiscount: number; saving: boolean; saved: boolean; error: string };
  /**
   * `draftOriginalPrice` is a string, not a number: the field has a meaningful
   * empty state ("not on sale") that a number input models as NaN, and NaN
   * compares unequal to itself, which would make the row permanently dirty.
   */
  type PackRow = TokenPackage & {
    draftTokens: number;
    draftPrice: number;
    draftCurrency: string;
    draftOriginalPrice: string;
    draftPopular: boolean;
    draftActive: boolean;
    saving: boolean;
    saved: boolean;
    error: string;
  };

  let loading = $state(true);
  let error = $state('');

  let videoRewardDraft = $state(0);
  let videoRewardOriginal = $state(0);
  let videoRewardUpdatedAt = $state('');
  let videoRewardSaving = $state(false);
  let videoRewardSaved = $state(false);
  let videoRewardError = $state('');

  let planRows = $state<PlanRow[]>([]);
  let billingRows = $state<BillingRow[]>([]);
  let packRows = $state<PackRow[]>([]);

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      const cfg = await getPackageConfig();

      videoRewardDraft = cfg.video_reward.tokens_per_video;
      videoRewardOriginal = cfg.video_reward.tokens_per_video;
      videoRewardUpdatedAt = cfg.video_reward.updated_at;

      planRows = cfg.subscription_plans.map((p) => ({
        ...p,
        draftPrice: p.price,
        draftCurrency: p.currency ?? 'THB',
        draftTokensPerDay: p.tokens_per_day,
        draftActive: p.active ?? true,
        saving: false,
        saved: false,
        error: ''
      }));

      billingRows = cfg.subscription_billing.map((b) => ({
        ...b,
        draftDiscount: b.discount_percent,
        saving: false,
        saved: false,
        error: ''
      }));

      packRows = cfg.token_packages.map((p) => ({
        ...p,
        draftTokens: p.tokens,
        draftPrice: p.price,
        draftCurrency: p.currency ?? 'THB',
        draftOriginalPrice: p.original_price == null ? '' : String(p.original_price),
        draftPopular: p.popular ?? false,
        draftActive: p.active ?? true,
        saving: false,
        saved: false,
        error: ''
      }));
    } catch (e: any) {
      error = e.message ?? PACKAGES.loadError;
    } finally {
      loading = false;
    }
  }

  /**
   * Shape check only — three A–Z letters. Maintaining a list of every code
   * Xendit supports here would go stale faster than it caught a typo, and the
   * server rejects an unsupported one when it creates the invoice.
   */
  function isValidCurrency(code: string): boolean {
    return /^[A-Za-z]{3}$/.test(code.trim());
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

  // ── Video reward ────────────────────────────────────────────────────────────

  function videoRewardDirty() {
    return videoRewardDraft !== videoRewardOriginal;
  }

  async function saveVideoReward() {
    if (videoRewardDraft == null || videoRewardDraft < 0 || !Number.isInteger(videoRewardDraft)) {
      videoRewardError = PACKAGES.videoRewardInvalid;
      return;
    }
    videoRewardSaving = true;
    videoRewardSaved = false;
    videoRewardError = '';
    try {
      const updated = await updateVideoReward(videoRewardDraft);
      videoRewardDraft = updated.tokens_per_video;
      videoRewardOriginal = updated.tokens_per_video;
      videoRewardUpdatedAt = updated.updated_at;
      videoRewardSaved = true;
      setTimeout(() => (videoRewardSaved = false), 2000);
    } catch (e: any) {
      videoRewardError = e.message ?? PACKAGES.saveError;
    } finally {
      videoRewardSaving = false;
    }
  }

  // ── Subscription plans ───────────────────────────────────────────────────────

  function planDirty(r: PlanRow) {
    return (
      r.draftPrice !== r.price ||
      r.draftCurrency !== (r.currency ?? 'THB') ||
      r.draftTokensPerDay !== r.tokens_per_day ||
      r.draftActive !== (r.active ?? true)
    );
  }

  async function savePlan(r: PlanRow) {
    if (r.draftPrice == null || r.draftPrice < 0) {
      r.error = PACKAGES.priceInvalid;
      return;
    }
    if (r.draftTokensPerDay == null || r.draftTokensPerDay < 0 || !Number.isInteger(r.draftTokensPerDay)) {
      r.error = PACKAGES.tokensPerDayInvalid;
      return;
    }
    if (!isValidCurrency(r.draftCurrency)) {
      r.error = PACKAGES.currencyInvalid;
      return;
    }
    r.saving = true;
    r.saved = false;
    r.error = '';
    try {
      const updated = await updateSubscriptionPlan(r.tier, {
        price: r.draftPrice,
        currency: r.draftCurrency,
        tokens_per_day: r.draftTokensPerDay,
        active: r.draftActive
      });
      r.price = updated.price;
      r.currency = updated.currency;
      r.tokens_per_day = updated.tokens_per_day;
      r.active = updated.active;
      r.updated_at = updated.updated_at;
      r.draftPrice = updated.price;
      r.draftCurrency = updated.currency;
      r.draftTokensPerDay = updated.tokens_per_day;
      r.draftActive = updated.active;
      r.saved = true;
      setTimeout(() => (r.saved = false), 2000);
    } catch (e: any) {
      r.error = e.message ?? PACKAGES.saveError;
    } finally {
      r.saving = false;
    }
  }

  // ── Billing options ──────────────────────────────────────────────────────────

  function billingDirty(r: BillingRow) {
    return r.draftDiscount !== r.discount_percent;
  }

  async function saveBilling(r: BillingRow) {
    if (r.draftDiscount == null || r.draftDiscount < 0 || r.draftDiscount > 100) {
      r.error = PACKAGES.discountInvalid;
      return;
    }
    r.saving = true;
    r.saved = false;
    r.error = '';
    try {
      const updated = await updateBillingOption(r.cycle, r.draftDiscount);
      r.discount_percent = updated.discount_percent;
      r.updated_at = updated.updated_at;
      r.draftDiscount = updated.discount_percent;
      r.saved = true;
      setTimeout(() => (r.saved = false), 2000);
    } catch (e: any) {
      r.error = e.message ?? PACKAGES.saveError;
    } finally {
      r.saving = false;
    }
  }

  // ── Token packages ───────────────────────────────────────────────────────────

  function packDirty(r: PackRow) {
    return (
      r.draftTokens !== r.tokens ||
      r.draftPrice !== r.price ||
      r.draftCurrency !== (r.currency ?? 'THB') ||
      r.draftOriginalPrice !== (r.original_price == null ? '' : String(r.original_price)) ||
      r.draftPopular !== (r.popular ?? false) ||
      r.draftActive !== (r.active ?? true)
    );
  }

  /** The typed "was" price, or null for the empty (not-on-sale) field. */
  function parsedOriginalPrice(r: PackRow): number | null {
    const trimmed = r.draftOriginalPrice.trim();
    if (trimmed === '') return null;
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : NaN;
  }

  /**
   * Savings the app will render for this pack, or null when it is not on sale.
   * Shown next to the field so the effect of a "was" price is visible before
   * saving — the same arithmetic the app's TokenPackage.savingsPercent does.
   */
  function draftSavings(r: PackRow): number | null {
    const original = parsedOriginalPrice(r);
    if (original == null || Number.isNaN(original) || original <= r.draftPrice) return null;
    return Math.round(((original - r.draftPrice) / original) * 100);
  }

  async function savePack(r: PackRow) {
    if (r.draftTokens == null || r.draftTokens <= 0 || !Number.isInteger(r.draftTokens)) {
      r.error = PACKAGES.tokensInvalid;
      return;
    }
    if (r.draftPrice == null || r.draftPrice < 0) {
      r.error = PACKAGES.priceInvalid;
      return;
    }
    if (!isValidCurrency(r.draftCurrency)) {
      r.error = PACKAGES.currencyInvalid;
      return;
    }
    const originalPrice = parsedOriginalPrice(r);
    if (originalPrice !== null && (Number.isNaN(originalPrice) || originalPrice < r.draftPrice)) {
      r.error = PACKAGES.originalPriceInvalid;
      return;
    }
    r.saving = true;
    r.saved = false;
    r.error = '';
    try {
      const updated = await updateTokenPackage(r.key, {
        tokens: r.draftTokens,
        price: r.draftPrice,
        currency: r.draftCurrency,
        original_price: originalPrice,
        popular: r.draftPopular,
        active: r.draftActive
      });
      r.tokens = updated.tokens;
      r.price = updated.price;
      r.currency = updated.currency;
      r.original_price = updated.original_price ?? null;
      r.popular = updated.popular;
      r.active = updated.active;
      r.updated_at = updated.updated_at;
      r.draftTokens = updated.tokens;
      r.draftPrice = updated.price;
      r.draftCurrency = updated.currency;
      r.draftOriginalPrice = updated.original_price == null ? '' : String(updated.original_price);
      r.draftPopular = updated.popular;
      r.draftActive = updated.active;

      // Only one pack may be "Popular", and the server moves the badge rather
      // than rejecting the second one — so the rows that just lost it have to
      // be brought back in line here, or they would sit dirty forever showing
      // a flag the server no longer has.
      if (updated.popular) {
        packRows = packRows.map((other) =>
          other.key === r.key ? other : { ...other, popular: false, draftPopular: false }
        );
      }

      r.saved = true;
      setTimeout(() => (r.saved = false), 2000);
    } catch (e: any) {
      r.error = e.message ?? PACKAGES.saveError;
    } finally {
      r.saving = false;
    }
  }
</script>

<div class="p-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="page-title">{PACKAGES.title}</h1>
    <p class="page-subtitle">{PACKAGES.subtitle}</p>
  </div>

  {#if error}
    <div class="alert-error mb-5">{error}</div>
  {/if}

  {#if loading}
    <div class="card overflow-hidden">
      <div class="spinner-center">
        <svg class="animate-spin w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>
  {:else}
    <div class="space-y-8">
      <!-- ── Video Reward ──────────────────────────────────────────────────── -->
      <section class="card overflow-hidden">
        <div class="card-header">
          <div>
            <h2 class="text-heading-sm">{PACKAGES.videoRewardTitle}</h2>
            <p class="text-muted mt-0.5">{PACKAGES.videoRewardSubtitle}</p>
          </div>
        </div>
        <div class="p-6 flex items-end gap-4">
          <div class="form-group">
            <label class="form-label" for="video-reward-input">{PACKAGES.videoRewardLabel}</label>
            <input
              id="video-reward-input"
              type="number"
              min="0"
              step="1"
              class="form-input w-40"
              bind:value={videoRewardDraft}
            />
            {#if videoRewardError}
              <p class="text-caption text-red-500 mt-1">{videoRewardError}</p>
            {/if}
          </div>
          <p class="text-caption pb-2.5">{PACKAGES.colUpdated}: {formatDate(videoRewardUpdatedAt)}</p>
          <div class="ml-auto pb-0.5">
            {#if videoRewardSaved}
              <span class="text-caption text-green-600 dark:text-green-400">✓ {PACKAGES.saved}</span>
            {:else}
              <button
                class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={videoRewardSaving || !videoRewardDirty()}
                onclick={saveVideoReward}
              >
                {videoRewardSaving ? PACKAGES.saving : PACKAGES.save}
              </button>
            {/if}
          </div>
        </div>
      </section>

      <!-- ── Subscribe: plans + billing options ───────────────────────────── -->
      <section class="space-y-6">
        <div>
          <h2 class="text-heading-lg">{PACKAGES.subscribeTitle}</h2>
        </div>

        <div class="card overflow-hidden">
          <div class="card-header">
            <p class="text-muted">{PACKAGES.subscribeSubtitle}</p>
          </div>
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-800 text-left">
                <th class="px-5 py-3 text-overline">{PACKAGES.colTier}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colPrice}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colCurrency}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colTokensPerDay}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colOnSale}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colUpdated}</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {#each planRows as r (r.tier)}
                <tr class="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td class="px-5 py-4 text-body-medium text-gray-900 dark:text-white">{r.label}</td>
                  <td class="px-5 py-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-input w-28"
                      bind:value={r.draftPrice}
                      aria-label={`${r.label} price`}
                    />
                  </td>
                  <td class="px-5 py-4">
                    <input
                      type="text"
                      maxlength="3"
                      class="form-input w-20 uppercase"
                      bind:value={r.draftCurrency}
                      aria-label={`${r.label} currency`}
                    />
                  </td>
                  <td class="px-5 py-4">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      class="form-input w-28"
                      bind:value={r.draftTokensPerDay}
                      aria-label={`${r.label} tokens per day`}
                    />
                    {#if r.error}
                      <p class="text-caption text-red-500 mt-1">{r.error}</p>
                    {/if}
                  </td>
                  <td class="px-5 py-4">
                    <label class="toggle">
                      <input type="checkbox" bind:checked={r.draftActive} aria-label={`${r.label} on sale`} />
                      <span class="text-caption">{r.draftActive ? PACKAGES.onSale : PACKAGES.withdrawn}</span>
                    </label>
                  </td>
                  <td class="px-5 py-4 text-caption text-gray-500 dark:text-gray-400">
                    {formatDate(r.updated_at)}
                  </td>
                  <td class="px-5 py-4 text-right">
                    {#if r.saved}
                      <span class="text-caption text-green-600 dark:text-green-400">✓ {PACKAGES.saved}</span>
                    {:else}
                      <button
                        class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={r.saving || !planDirty(r)}
                        onclick={() => savePlan(r)}
                      >
                        {r.saving ? PACKAGES.saving : PACKAGES.save}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="card overflow-hidden">
          <div class="card-header">
            <div>
              <h3 class="text-heading-sm">{PACKAGES.billingTitle}</h3>
              <p class="text-muted mt-0.5">{PACKAGES.billingSubtitle}</p>
            </div>
          </div>
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-800 text-left">
                <th class="px-5 py-3 text-overline">{PACKAGES.colCycle}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colDiscount}</th>
                <th class="px-5 py-3 text-overline">{PACKAGES.colUpdated}</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {#each billingRows as r (r.cycle)}
                <tr class="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td class="px-5 py-4 text-body-medium text-gray-900 dark:text-white">{r.label}</td>
                  <td class="px-5 py-4">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      class="form-input w-28"
                      bind:value={r.draftDiscount}
                      aria-label={`${r.label} discount percent`}
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
                      <span class="text-caption text-green-600 dark:text-green-400">✓ {PACKAGES.saved}</span>
                    {:else}
                      <button
                        class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={r.saving || !billingDirty(r)}
                        onclick={() => saveBilling(r)}
                      >
                        {r.saving ? PACKAGES.saving : PACKAGES.save}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Token Packages ────────────────────────────────────────────────── -->
      <section class="card overflow-hidden">
        <div class="card-header">
          <div>
            <h2 class="text-heading-sm">{PACKAGES.tokenPackagesTitle}</h2>
            <p class="text-muted mt-0.5">{PACKAGES.tokenPackagesSubtitle}</p>
          </div>
        </div>
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800 text-left">
              <th class="px-5 py-3 text-overline">{PACKAGES.colTokens}</th>
              <th class="px-5 py-3 text-overline">{PACKAGES.colPackPrice}</th>
              <th class="px-5 py-3 text-overline">{PACKAGES.colCurrency}</th>
              <th class="px-5 py-3 text-overline">{PACKAGES.colOriginalPrice}</th>
              <th class="px-5 py-3 text-overline">{PACKAGES.colPopular}</th>
              <th class="px-5 py-3 text-overline">{PACKAGES.colOnSale}</th>
              <th class="px-5 py-3 text-overline">{PACKAGES.colUpdated}</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {#each packRows as r (r.key)}
              <tr class="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                <td class="px-5 py-4">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    class="form-input w-28"
                    bind:value={r.draftTokens}
                    aria-label={`${r.key} tokens`}
                  />
                </td>
                <td class="px-5 py-4">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-input w-28"
                    bind:value={r.draftPrice}
                    aria-label={`${r.key} price`}
                  />
                  {#if r.error}
                    <p class="text-caption text-red-500 mt-1">{r.error}</p>
                  {/if}
                </td>
                <td class="px-5 py-4">
                  <input
                    type="text"
                    maxlength="3"
                    class="form-input w-20 uppercase"
                    bind:value={r.draftCurrency}
                    aria-label={`${r.key} currency`}
                  />
                </td>
                <td class="px-5 py-4">
                  <!-- type="text" with a decimal inputmode, not type="number":
                       Svelte coerces a bound number input to a number, and the
                       empty "not on sale" state would come back as NaN, which
                       compares unequal to itself and leaves the row forever
                       dirty. The value is parsed and validated on save. -->
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-input w-28"
                    placeholder={PACKAGES.originalPricePlaceholder}
                    bind:value={r.draftOriginalPrice}
                    aria-label={`${r.key} original price`}
                  />
                  <!-- Shows the discount the app will render, before saving. -->
                  {#if draftSavings(r) !== null}
                    <p class="text-caption text-emerald mt-1">−{draftSavings(r)}%</p>
                  {:else}
                    <p class="text-caption mt-1">{PACKAGES.notOnSale}</p>
                  {/if}
                </td>
                <td class="px-5 py-4">
                  <label class="toggle">
                    <input type="checkbox" bind:checked={r.draftPopular} aria-label={`${r.key} popular`} />
                    <span class="text-caption">{PACKAGES.popularHint}</span>
                  </label>
                </td>
                <td class="px-5 py-4">
                  <label class="toggle">
                    <input type="checkbox" bind:checked={r.draftActive} aria-label={`${r.key} on sale`} />
                    <span class="text-caption">{r.draftActive ? PACKAGES.onSale : PACKAGES.withdrawn}</span>
                  </label>
                </td>
                <td class="px-5 py-4 text-caption text-gray-500 dark:text-gray-400">
                  {formatDate(r.updated_at)}
                </td>
                <td class="px-5 py-4 text-right">
                  {#if r.saved}
                    <span class="text-caption text-green-600 dark:text-green-400">✓ {PACKAGES.saved}</span>
                  {:else}
                    <button
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={r.saving || !packDirty(r)}
                      onclick={() => savePack(r)}
                    >
                      {r.saving ? PACKAGES.saving : PACKAGES.save}
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    </div>
  {/if}
</div>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  .toggle input {
    width: 1rem;
    height: 1rem;
    accent-color: #7c3aed;
  }
</style>
