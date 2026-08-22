<script lang="ts">
  /**
   * Coupon management — the list, the create/edit form, and the one global
   * setting coupons depend on.
   *
   * The form is a modal rather than its own route because a coupon is short
   * enough to hold in one screen, and creating one is nearly always something
   * you do while looking at the list of what already exists.
   */
  import { onMount } from 'svelte';
  import {
    listCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponSettings,
    updateCouponSettings,
    getPackageConfig,
    ApiError
  } from '$lib/api';
  import { COUPONS } from '$lib/strings';
  import type {
    Coupon,
    CouponInput,
    CouponAppliesTo,
    CouponAudience,
    CouponDiscountType,
    CouponSettings,
    PackageConfig
  } from '$lib/types';
  import { formatMoney, formatCount, formatDateTime } from '$lib/format';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  type StatusFilter = '' | 'active' | 'scheduled' | 'expired' | 'exhausted' | 'inactive';

  let coupons = $state<Coupon[]>([]);
  let packages = $state<PackageConfig | null>(null);
  let settings = $state<CouponSettings | null>(null);
  let loading = $state(true);
  let error = $state('');

  let search = $state('');
  let statusFilter = $state<StatusFilter>('');

  // ── Form state ─────────────────────────────────────────────────────────────
  // Numeric fields are held as strings so an empty box stays empty. `bind:value`
  // on a number input coerces a cleared field to NaN, and NaN !== NaN would
  // leave the form permanently dirty.
  let formOpen = $state(false);
  let editing = $state<Coupon | null>(null);
  let saving = $state(false);
  let formError = $state('');

  let fCode = $state('');
  let fTitle = $state('');
  let fDescription = $state('');
  let fDiscountType = $state<CouponDiscountType>('percent');
  let fPercent = $state('10');
  let fFixedAmount = $state('');
  let fMaxDiscount = $state('');
  let fMinPurchase = $state('0');
  let fCurrency = $state('THB');
  let fAppliesTo = $state<CouponAppliesTo>('both');
  let fPackageKeys = $state<string[]>([]);
  let fTiers = $state<string[]>([]);
  let fCycles = $state<string[]>([]);
  let fStartsAt = $state('');
  let fExpiresAt = $state('');
  let fMaxRedemptions = $state('');
  let fPerUserLimit = $state('1');
  let fAudience = $state<CouponAudience>('code');
  let fFirstPurchaseOnly = $state(false);
  let fActive = $state(true);

  let deleteTarget = $state<Coupon | null>(null);
  let draftMinCharge = $state('');
  let savingSettings = $state(false);

  onMount(async () => {
    // The package config feeds the scope pickers; a failure there must not
    // block the list, so it is fetched alongside rather than awaited first.
    const [config, couponSettings] = await Promise.allSettled([
      getPackageConfig(),
      getCouponSettings()
    ]);
    if (config.status === 'fulfilled') packages = config.value;
    if (couponSettings.status === 'fulfilled') {
      settings = couponSettings.value;
      draftMinCharge = String(couponSettings.value.min_chargeable_amount);
    }
    await load();
  });

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await listCoupons(1, 100, search || undefined, statusFilter || undefined);
      coupons = res.data;
    } catch (e) {
      error = e instanceof Error ? e.message : COUPONS.loadError;
    } finally {
      loading = false;
    }
  }

  function applyFilter(next: StatusFilter) {
    statusFilter = next;
    load();
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  function openCreate() {
    editing = null;
    formError = '';
    fCode = '';
    fTitle = '';
    fDescription = '';
    fDiscountType = 'percent';
    fPercent = '10';
    fFixedAmount = '';
    fMaxDiscount = '';
    fMinPurchase = '0';
    fCurrency = 'THB';
    fAppliesTo = 'both';
    fPackageKeys = [];
    fTiers = [];
    fCycles = [];
    fStartsAt = '';
    fExpiresAt = '';
    fMaxRedemptions = '';
    fPerUserLimit = '1';
    fAudience = 'code';
    fFirstPurchaseOnly = false;
    fActive = true;
    formOpen = true;
  }

  function openEdit(c: Coupon) {
    editing = c;
    formError = '';
    fCode = c.code;
    fTitle = c.title;
    fDescription = c.description ?? '';
    fDiscountType = c.discount_type;
    fPercent = c.discount_percent ? String(c.discount_percent) : '';
    fFixedAmount = c.discount_amount ? String(c.discount_amount) : '';
    fMaxDiscount = c.max_discount != null ? String(c.max_discount) : '';
    fMinPurchase = String(c.min_purchase);
    fCurrency = c.currency;
    fAppliesTo = c.applies_to;
    fPackageKeys = [...c.package_keys];
    fTiers = [...c.subscription_tiers];
    fCycles = [...c.billing_cycles];
    fStartsAt = toLocalInput(c.starts_at);
    fExpiresAt = toLocalInput(c.expires_at);
    fMaxRedemptions = c.max_redemptions != null ? String(c.max_redemptions) : '';
    fPerUserLimit = String(c.per_user_limit);
    fAudience = c.audience;
    fFirstPurchaseOnly = c.first_purchase_only;
    fActive = c.active;
    formOpen = true;
  }

  /** An ISO timestamp as the local value a datetime-local input expects. */
  function toLocalInput(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** A datetime-local value back to ISO, or null when the field is empty. */
  function fromLocalInput(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  function num(value: string, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function optionalNum(value: string): number | null {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function save() {
    saving = true;
    formError = '';
    const input: CouponInput = {
      code: fCode.trim().toUpperCase(),
      title: fTitle.trim(),
      description: fDescription.trim(),
      discount_type: fDiscountType,
      discount_percent: fDiscountType === 'percent' ? num(fPercent) : 0,
      discount_amount: fDiscountType === 'fixed' ? num(fFixedAmount) : 0,
      max_discount: fDiscountType === 'percent' ? optionalNum(fMaxDiscount) : null,
      min_purchase: num(fMinPurchase),
      applies_to: fAppliesTo,
      // A scope list only means something for the kinds in play. Sending tiers
      // on a token-pack-only coupon would silently narrow nothing today and
      // surprise whoever widens applies_to later.
      package_keys: fAppliesTo === 'subscription' ? [] : fPackageKeys,
      subscription_tiers: fAppliesTo === 'token_package' ? [] : fTiers,
      billing_cycles: fAppliesTo === 'token_package' ? [] : fCycles,
      currency: fCurrency.trim().toUpperCase() || 'THB',
      starts_at: fromLocalInput(fStartsAt),
      expires_at: fromLocalInput(fExpiresAt),
      max_redemptions: optionalNum(fMaxRedemptions),
      per_user_limit: num(fPerUserLimit, 1) || 1,
      audience: fAudience,
      first_purchase_only: fFirstPurchaseOnly,
      active: fActive
    };

    try {
      if (editing) {
        await updateCoupon(editing.id, input);
      } else {
        await createCoupon(input);
      }
      formOpen = false;
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'duplicate_code') {
        formError = COUPONS.duplicateCode;
      } else {
        formError = e instanceof Error ? e.message : COUPONS.saveError;
      }
    } finally {
      saving = false;
    }
  }

  async function confirmDelete() {
    const target = deleteTarget;
    deleteTarget = null;
    if (!target) return;
    try {
      await deleteCoupon(target.id);
      await load();
    } catch (e) {
      error = e instanceof Error ? e.message : COUPONS.saveError;
    }
  }

  async function saveSettings() {
    savingSettings = true;
    try {
      settings = await updateCouponSettings(num(draftMinCharge));
    } catch (e) {
      error = e instanceof Error ? e.message : COUPONS.saveError;
    } finally {
      savingSettings = false;
    }
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  function discountLabel(c: Coupon): string {
    if (c.discount_type === 'fixed') return formatMoney(c.discount_amount, c.currency);
    const base = `${c.discount_percent}%`;
    return c.max_discount != null
      ? `${base} · max ${formatMoney(c.max_discount, c.currency)}`
      : base;
  }

  function appliesToLabel(c: Coupon): string {
    if (c.applies_to === 'token_package') return COUPONS.appliesToTokenPackage;
    if (c.applies_to === 'subscription') return COUPONS.appliesToSubscription;
    return COUPONS.appliesToBoth;
  }

  function usesLabel(c: Coupon): string {
    const used = formatCount(c.consumed_count);
    return c.max_redemptions == null
      ? `${used} · ${COUPONS.unlimited}`
      : `${used} ${COUPONS.usesOf} ${formatCount(c.max_redemptions)}`;
  }

  function windowLabel(c: Coupon): string {
    if (!c.expires_at) return COUPONS.noExpiry;
    return formatDateTime(c.expires_at);
  }

  /**
   * The lifecycle state, not the `active` flag alone: an active coupon whose
   * window has passed or whose quota is spent is not working, and a badge that
   * said "Active" would be lying.
   */
  function statusOf(c: Coupon): { label: string; klass: string } {
    if (!c.active) return { label: COUPONS.statusInactive, klass: 'badge-off' };
    if (c.max_redemptions != null && c.redeemed_count >= c.max_redemptions) {
      return { label: COUPONS.statusExhausted, klass: 'badge-amber' };
    }
    const now = Date.now();
    if (c.expires_at && new Date(c.expires_at).getTime() <= now) {
      return { label: COUPONS.statusExpired, klass: 'badge-off' };
    }
    if (c.starts_at && new Date(c.starts_at).getTime() > now) {
      return { label: COUPONS.statusScheduled, klass: 'badge-blue' };
    }
    return { label: COUPONS.statusActive, klass: 'badge-emerald' };
  }

  const filters: { key: StatusFilter; label: string }[] = [
    { key: '', label: COUPONS.filterAll },
    { key: 'active', label: COUPONS.filterActive },
    { key: 'scheduled', label: COUPONS.filterScheduled },
    { key: 'expired', label: COUPONS.filterExpired },
    { key: 'exhausted', label: COUPONS.filterExhausted },
    { key: 'inactive', label: COUPONS.filterInactive }
  ];

  const showPackageScope = $derived(fAppliesTo !== 'subscription');
  const showSubscriptionScope = $derived(fAppliesTo !== 'token_package');
</script>

<div class="p-8">
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="page-title">{COUPONS.title}</h1>
      <p class="page-subtitle">{COUPONS.subtitle}</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="segmented" role="group">
        <span class="segment active">{COUPONS.tabManage}</span>
        <a class="segment" href="/coupons/usage">{COUPONS.tabUsage}</a>
      </div>
      <button type="button" class="btn-primary" onclick={openCreate}>{COUPONS.newCoupon}</button>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="mb-5 flex flex-wrap items-center gap-3">
    <div class="max-w-xs flex-1">
      <input
        class="form-input"
        type="search"
        placeholder={COUPONS.searchPlaceholder}
        bind:value={search}
        onchange={load}
      />
    </div>
    <div class="segmented" role="group">
      {#each filters as f}
        <button
          type="button"
          class="segment"
          class:active={statusFilter === f.key}
          aria-pressed={statusFilter === f.key}
          onclick={() => applyFilter(f.key)}
        >
          {f.label}
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <div class="spinner-center">
      <svg class="animate-spin w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  {:else if error}
    <div class="alert-error flex items-center justify-between gap-4">
      <span>{error}</span>
      <button type="button" class="btn-cancel-sm" onclick={load}>{COUPONS.retry}</button>
    </div>
  {:else}
    <div class="card mb-6">
      {#if coupons.length === 0}
        <div class="table-empty-cell">
          <p class="text-body-medium mb-1">
            {statusFilter || search ? COUPONS.emptyFiltered : COUPONS.emptyTitle}
          </p>
          <p class="text-caption">{COUPONS.emptyBody}</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th class="table-th">{COUPONS.colCode}</th>
                <th class="table-th">{COUPONS.colDiscount}</th>
                <th class="table-th">{COUPONS.colAppliesTo}</th>
                <th class="table-th">{COUPONS.colUses}</th>
                <th class="table-th">{COUPONS.colWindow}</th>
                <th class="table-th">{COUPONS.colStatus}</th>
                <th class="table-th"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              {#each coupons as c (c.id)}
                {@const status = statusOf(c)}
                <tr class="table-row">
                  <td class="table-td-sm">
                    <span class="uid-text">{c.code}</span>
                    <span class="text-caption block">{c.title}</span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-body">{discountLabel(c)}</span>
                    {#if c.min_purchase > 0}
                      <span class="text-caption block">
                        min {formatMoney(c.min_purchase, c.currency)}
                      </span>
                    {/if}
                  </td>
                  <td class="table-td-sm"><span class="text-body">{appliesToLabel(c)}</span></td>
                  <td class="table-td-sm">
                    <span class="text-body">{usesLabel(c)}</span>
                    <span class="text-caption block">
                      {c.per_user_limit} {COUPONS.perCustomer}
                    </span>
                  </td>
                  <td class="table-td-sm"><span class="text-body">{windowLabel(c)}</span></td>
                  <td class="table-td-sm">
                    <span class="badge {status.klass}">{status.label}</span>
                  </td>
                  <td class="table-td-sm text-right whitespace-nowrap">
                    <button type="button" class="btn-action-violet" onclick={() => openEdit(c)}>
                      {COUPONS.edit}
                    </button>
                    <button
                      type="button"
                      class="btn-action-danger"
                      onclick={() => (deleteTarget = c)}
                    >
                      {COUPONS.delete}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- The one global setting coupons depend on. It lives here rather than on
         a settings screen because it is only ever meaningful next to them. -->
    <div class="card-padded max-w-2xl">
      <h2 class="text-heading-sm">{COUPONS.settingsTitle}</h2>
      <p class="text-caption mt-1 mb-4">{COUPONS.settingsBody}</p>
      <div class="flex items-end gap-3">
        <div class="form-group flex-1 max-w-[12rem]">
          <label class="form-label" for="min-charge">{COUPONS.settingsField}</label>
          <input
            id="min-charge"
            class="form-input"
            type="text"
            inputmode="decimal"
            bind:value={draftMinCharge}
          />
        </div>
        <button
          type="button"
          class="btn-save"
          disabled={savingSettings ||
            !settings ||
            num(draftMinCharge) === settings.min_chargeable_amount}
          onclick={saveSettings}
        >
          {savingSettings ? COUPONS.saving : COUPONS.settingsSave}
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- ── Create / edit form ─────────────────────────────────────────────────── -->
{#if formOpen}
  <div class="modal-overlay">
    <button
      type="button"
      class="modal-backdrop"
      aria-label={COUPONS.cancel}
      onclick={() => (formOpen = false)}
    ></button>
    <div class="modal-card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header">
        <h2 class="text-heading-sm">
          {editing ? COUPONS.formEditTitle : COUPONS.formCreateTitle}
        </h2>
      </div>

      <div class="p-6 space-y-7">
        {#if formError}
          <div class="alert-error">{formError}</div>
        {/if}

        <!-- Basics -->
        <section>
          <h3 class="text-caption-medium mb-3">{COUPONS.sectionBasics}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="f-code">{COUPONS.fieldCode}</label>
              <input id="f-code" class="form-input uppercase" bind:value={fCode} />
              <p class="text-caption mt-1">{COUPONS.fieldCodeHint}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-title">{COUPONS.fieldTitle}</label>
              <input id="f-title" class="form-input" bind:value={fTitle} />
              <p class="text-caption mt-1">{COUPONS.fieldTitleHint}</p>
            </div>
          </div>
          <div class="form-group mt-4">
            <label class="form-label" for="f-desc">{COUPONS.fieldDescription}</label>
            <input id="f-desc" class="form-input" bind:value={fDescription} />
            <p class="text-caption mt-1">{COUPONS.fieldDescriptionHint}</p>
          </div>
        </section>

        <!-- Discount -->
        <section>
          <h3 class="text-caption-medium mb-3">{COUPONS.sectionDiscount}</h3>
          <div class="segmented mb-4" role="group">
            <button
              type="button"
              class="segment"
              class:active={fDiscountType === 'percent'}
              onclick={() => (fDiscountType = 'percent')}
            >
              {COUPONS.discountTypePercent}
            </button>
            <button
              type="button"
              class="segment"
              class:active={fDiscountType === 'fixed'}
              onclick={() => (fDiscountType = 'fixed')}
            >
              {COUPONS.discountTypeFixed}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {#if fDiscountType === 'percent'}
              <div class="form-group">
                <label class="form-label" for="f-percent">{COUPONS.fieldPercent}</label>
                <input
                  id="f-percent"
                  class="form-input"
                  type="text"
                  inputmode="decimal"
                  bind:value={fPercent}
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="f-max">{COUPONS.fieldMaxDiscount}</label>
                <input
                  id="f-max"
                  class="form-input"
                  type="text"
                  inputmode="decimal"
                  bind:value={fMaxDiscount}
                />
                <p class="text-caption mt-1">{COUPONS.fieldMaxDiscountHint}</p>
              </div>
            {:else}
              <div class="form-group">
                <label class="form-label" for="f-fixed">{COUPONS.fieldFixedAmount}</label>
                <input
                  id="f-fixed"
                  class="form-input"
                  type="text"
                  inputmode="decimal"
                  bind:value={fFixedAmount}
                />
              </div>
              <div></div>
            {/if}
            <div class="form-group">
              <label class="form-label" for="f-min">{COUPONS.fieldMinPurchase}</label>
              <input
                id="f-min"
                class="form-input"
                type="text"
                inputmode="decimal"
                bind:value={fMinPurchase}
              />
              <p class="text-caption mt-1">{COUPONS.fieldMinPurchaseHint}</p>
            </div>
          </div>
        </section>

        <!-- Scope -->
        <section>
          <h3 class="text-caption-medium mb-3">{COUPONS.sectionScope}</h3>
          <div class="form-group mb-4">
            <label class="form-label" for="f-applies">{COUPONS.fieldAppliesTo}</label>
            <select id="f-applies" class="form-input" bind:value={fAppliesTo}>
              <option value="both">{COUPONS.appliesToBoth}</option>
              <option value="token_package">{COUPONS.appliesToTokenPackage}</option>
              <option value="subscription">{COUPONS.appliesToSubscription}</option>
            </select>
          </div>

          {#if showPackageScope && packages}
            <div class="mb-4">
              <p class="form-label mb-2">{COUPONS.fieldPackageKeys}</p>
              <div class="flex flex-wrap gap-2">
                {#each packages.token_packages as pack (pack.key)}
                  <button
                    type="button"
                    class="chip"
                    class:chip-on={fPackageKeys.includes(pack.key)}
                    onclick={() => (fPackageKeys = toggle(fPackageKeys, pack.key))}
                  >
                    {formatCount(pack.tokens)} · {formatMoney(pack.price, pack.currency)}
                  </button>
                {/each}
              </div>
              <p class="text-caption mt-2">{COUPONS.scopeAllHint}</p>
            </div>
          {/if}

          {#if showSubscriptionScope && packages}
            <div class="mb-4">
              <p class="form-label mb-2">{COUPONS.fieldSubscriptionTiers}</p>
              <div class="flex flex-wrap gap-2">
                {#each packages.subscription_plans as plan (plan.tier)}
                  <button
                    type="button"
                    class="chip"
                    class:chip-on={fTiers.includes(plan.tier)}
                    onclick={() => (fTiers = toggle(fTiers, plan.tier))}
                  >
                    {plan.label}
                  </button>
                {/each}
              </div>
            </div>
            <div>
              <p class="form-label mb-2">{COUPONS.fieldBillingCycles}</p>
              <div class="flex flex-wrap gap-2">
                {#each packages.subscription_billing as option (option.cycle)}
                  <button
                    type="button"
                    class="chip"
                    class:chip-on={fCycles.includes(option.cycle)}
                    onclick={() => (fCycles = toggle(fCycles, option.cycle))}
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
              <p class="text-caption mt-2">{COUPONS.scopeAllHint}</p>
            </div>
          {/if}
        </section>

        <!-- Limits -->
        <section>
          <h3 class="text-caption-medium mb-3">{COUPONS.sectionLimits}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="f-total">{COUPONS.fieldMaxRedemptions}</label>
              <input
                id="f-total"
                class="form-input"
                type="text"
                inputmode="numeric"
                bind:value={fMaxRedemptions}
              />
              <p class="text-caption mt-1">{COUPONS.fieldMaxRedemptionsHint}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-per-user">{COUPONS.fieldPerUserLimit}</label>
              <input
                id="f-per-user"
                class="form-input"
                type="text"
                inputmode="numeric"
                bind:value={fPerUserLimit}
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="f-starts">{COUPONS.fieldStartsAt}</label>
              <input id="f-starts" class="form-input" type="datetime-local" bind:value={fStartsAt} />
              <p class="text-caption mt-1">{COUPONS.fieldStartsAtHint}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-expires">{COUPONS.fieldExpiresAt}</label>
              <input
                id="f-expires"
                class="form-input"
                type="datetime-local"
                bind:value={fExpiresAt}
              />
              <p class="text-caption mt-1">{COUPONS.fieldExpiresAtHint}</p>
            </div>
          </div>
        </section>

        <!-- Availability -->
        <section>
          <h3 class="text-caption-medium mb-3">{COUPONS.sectionAvailability}</h3>
          <div class="form-group">
            <label class="form-label" for="f-audience">{COUPONS.fieldAudience}</label>
            <select id="f-audience" class="form-input" bind:value={fAudience}>
              <option value="code">{COUPONS.audienceCode}</option>
              <option value="public">{COUPONS.audiencePublic}</option>
              <option value="granted">{COUPONS.audienceGranted}</option>
            </select>
            <p class="text-caption mt-1">{COUPONS.audienceHint}</p>
          </div>

          <div class="mt-4 flex flex-wrap gap-6">
            <label class="flex items-center gap-2">
              <input type="checkbox" class="input-toggle" bind:checked={fFirstPurchaseOnly} />
              <span class="text-body">{COUPONS.fieldFirstPurchaseOnly}</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="input-toggle" bind:checked={fActive} />
              <span class="text-body">{COUPONS.fieldActive}</span>
            </label>
          </div>
        </section>
      </div>

      <div class="card-footer flex justify-end gap-3">
        <button type="button" class="btn-cancel" onclick={() => (formOpen = false)}>
          {COUPONS.cancel}
        </button>
        <button type="button" class="btn-submit-dialog" disabled={saving} onclick={save}>
          {saving ? COUPONS.saving : COUPONS.save}
        </button>
      </div>
    </div>
  </div>
{/if}

<ConfirmModal
  open={deleteTarget !== null}
  title={COUPONS.deleteTitle}
  message={COUPONS.deleteMessage}
  confirmLabel={COUPONS.deleteConfirm}
  cancelLabel={COUPONS.cancel}
  danger
  onconfirm={confirmDelete}
  oncancel={() => (deleteTarget = null)}
/>
