<script lang="ts">
  /**
   * Coupon usage dashboard — what discounts cost, and what came in anyway.
   *
   * Same windows and buckets as the payments dashboard, so the two pages can be
   * read side by side: "revenue was up 12%" and "coupons cost ฿4,300" only mean
   * something together if they cover the same days.
   */
  import { onMount } from 'svelte';
  import { getCouponSummary } from '$lib/api';
  import { COUPON_USAGE, COUPONS, PAYMENTS } from '$lib/strings';
  import type { CouponSummary, CouponRedemption, PaymentRange } from '$lib/types';
  import { formatMoney, formatCount, formatPercent, percentChange, formatDateTime } from '$lib/format';
  import TimeSeriesChart from '$lib/components/TimeSeriesChart.svelte';
  import BreakdownBars from '$lib/components/BreakdownBars.svelte';

  let range = $state<PaymentRange>('7d');
  let summary = $state<CouponSummary | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      summary = await getCouponSummary(range);
    } catch (e) {
      error = e instanceof Error ? e.message : COUPON_USAGE.loadError;
    } finally {
      loading = false;
    }
  }

  function selectRange(next: PaymentRange) {
    if (next === range) return;
    range = next;
    load();
  }

  const currency = $derived(summary?.currency ?? 'THB');
  const bucket = $derived(summary?.bucket ?? 'day');

  const cards = $derived.by(() => {
    if (!summary) return [];
    const t = summary.totals;
    const p = summary.previous_totals;
    return [
      {
        label: COUPON_USAGE.discountGiven,
        value: formatMoney(t.discount, currency),
        delta: percentChange(t.discount, p.discount),
        tone: 'violet' as const
      },
      {
        label: COUPON_USAGE.redemptions,
        value: formatCount(t.redemptions),
        delta: percentChange(t.redemptions, p.redemptions),
        tone: 'emerald' as const
      },
      {
        label: COUPON_USAGE.revenueOnDiscounted,
        value: formatMoney(t.revenue, currency),
        delta: percentChange(t.revenue, p.revenue),
        tone: 'blue' as const
      },
      {
        label: COUPON_USAGE.uniqueUsers,
        value: formatCount(t.unique_users),
        delta: percentChange(t.unique_users, p.unique_users),
        tone: 'amber' as const
      }
    ];
  });

  const discountPoints = $derived(
    (summary?.series ?? []).map((p) => ({
      bucket: p.bucket,
      value: p.discount,
      meta: p.redemptions
    }))
  );
  const redemptionPoints = $derived(
    (summary?.series ?? []).map((p) => ({
      bucket: p.bucket,
      value: p.redemptions,
      meta: p.discount
    }))
  );

  const redemptionsMeta = (n: number) =>
    `${formatCount(n)} ${n === 1 ? COUPON_USAGE.redemptionOne : COUPON_USAGE.redemptionMany}`;
  const discountMeta = (v: number) => formatMoney(v, currency);

  /**
   * The leaderboard reuses the payments breakdown bars: same question ("which
   * of these is biggest"), same answer shape, so it gets the same mark.
   */
  const topItems = $derived(
    (summary?.top_coupons ?? []).map((c) => ({
      key: c.coupon_id,
      label: c.code,
      revenue: c.discount,
      transactions: c.redemptions
    }))
  );

  const statusClass: Record<CouponRedemption['status'], string> = {
    consumed: 'badge-emerald',
    reserved: 'badge-amber',
    released: 'badge-off'
  };

  const statusLabel: Record<CouponRedemption['status'], string> = {
    consumed: COUPON_USAGE.statusConsumed,
    reserved: COUPON_USAGE.statusReserved,
    released: COUPON_USAGE.statusReleased
  };
</script>

<div class="p-8">
  <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="page-title">{COUPON_USAGE.title}</h1>
      <p class="page-subtitle">{COUPON_USAGE.subtitle}</p>
    </div>

    <div class="flex items-center gap-3">
      <div class="segmented" role="group">
        <a class="segment" href="/coupons">{COUPONS.tabManage}</a>
        <span class="segment active">{COUPONS.tabUsage}</span>
      </div>
      <div class="segmented" role="group" aria-label={PAYMENTS.rangeLabel}>
        {#each PAYMENTS.ranges as option}
          <button
            type="button"
            class="segment"
            class:active={range === option.key}
            aria-pressed={range === option.key}
            onclick={() => selectRange(option.key as PaymentRange)}
          >
            {option.label}
          </button>
        {/each}
      </div>
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
      <button type="button" class="btn-cancel-sm" onclick={load}>{COUPON_USAGE.retry}</button>
    </div>
  {:else if summary}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
      {#each cards as card}
        <div class="card-padded">
          <div class="stat-header">
            <span class="text-caption-medium">{card.label}</span>
            <span class="dot dot-{card.tone}" aria-hidden="true"></span>
          </div>
          <p class="stat-number">{card.value}</p>
          <p class="text-caption mt-1.5">
            {#if card.delta === null}
              {COUPON_USAGE.noPrevious}
            {:else}
              <span
                class:text-emerald={card.delta >= 0}
                class:text-danger={card.delta < 0}
                class="font-semibold"
              >
                {card.delta >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(card.delta))}
              </span>
              {COUPON_USAGE.vsPrevious}
            {/if}
          </p>
        </div>
      {/each}
    </div>

    <!-- Funnel health rather than money: how many applied coupons turn into
         paid orders, and how much of the business they touch at all. -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div class="stat-card">
        <p class="stat-label">{COUPON_USAGE.conversionRate}</p>
        <p class="stat-value">{formatPercent(summary.totals.conversion_rate)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">{COUPON_USAGE.couponShare}</p>
        <p class="stat-value">{formatPercent(summary.totals.coupon_share)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">{COUPON_USAGE.averageDiscount}</p>
        <p class="stat-value">{formatMoney(summary.totals.average_discount, currency)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">{COUPON_USAGE.stillOpen}</p>
        <p class="stat-value">{formatCount(summary.totals.reserved)}</p>
      </div>
    </div>

    <div class="card-padded mb-6">
      <div class="card-section-header">
        <div>
          <h2 class="text-heading-sm">{COUPON_USAGE.discountChartTitle}</h2>
          <p class="text-caption mt-0.5">
            {bucket === 'month'
              ? COUPON_USAGE.discountChartSubtitleMonth
              : COUPON_USAGE.discountChartSubtitleDay}
          </p>
        </div>
      </div>
      <TimeSeriesChart
        points={discountPoints}
        metric="money"
        variant="area"
        {bucket}
        {currency}
        seriesLabel={COUPON_USAGE.discountGiven}
        metaLabel={redemptionsMeta}
        emptyLabel={COUPON_USAGE.emptyChart}
      />
    </div>

    <!-- A second chart rather than a second axis on the one above: value
         discounted and number of redemptions share only their time axis. -->
    <div class="card-padded mb-6">
      <div class="card-section-header">
        <div>
          <h2 class="text-heading-sm">{COUPON_USAGE.redemptionChartTitle}</h2>
          <p class="text-caption mt-0.5">
            {bucket === 'month'
              ? COUPON_USAGE.redemptionChartSubtitleMonth
              : COUPON_USAGE.redemptionChartSubtitleDay}
          </p>
        </div>
      </div>
      <TimeSeriesChart
        points={redemptionPoints}
        metric="count"
        variant="columns"
        {bucket}
        {currency}
        seriesLabel={COUPON_USAGE.redemptions}
        metaLabel={discountMeta}
        emptyLabel={COUPON_USAGE.emptyChart}
      />
    </div>

    <div class="card-padded mb-6">
      <div class="card-section-header">
        <h2 class="text-heading-sm">{COUPON_USAGE.topCouponsTitle}</h2>
      </div>
      <BreakdownBars
        items={topItems}
        {currency}
        accent="violet"
        emptyLabel={COUPON_USAGE.emptyChart}
      />
    </div>

    <!-- Recent redemptions. Also the text relief for the charts above: every
         figure they plot is legible here as a number. -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-heading-sm">{COUPON_USAGE.recentTitle}</h2>
      </div>

      {#if summary.recent.length === 0}
        <div class="table-empty-cell">
          <p class="text-body-medium mb-1">{COUPON_USAGE.emptyTitle}</p>
          <p class="text-caption">{COUPON_USAGE.emptyBody}</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th class="table-th">{COUPON_USAGE.colCoupon}</th>
                <th class="table-th">{COUPON_USAGE.colUser}</th>
                <th class="table-th">{COUPON_USAGE.colDiscount}</th>
                <th class="table-th">{COUPON_USAGE.colPaid}</th>
                <th class="table-th">{COUPON_USAGE.colStatus}</th>
                <th class="table-th">{COUPON_USAGE.colWhen}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              {#each summary.recent as red (red.id)}
                <tr class="table-row">
                  <td class="table-td-sm"><span class="uid-text">{red.coupon_code}</span></td>
                  <td class="table-td-sm">
                    {#if red.user_uid}
                      <a href="/users/{red.user_uid}" class="uid-link">
                        {red.user_email || red.user_uid}
                      </a>
                    {:else}
                      <span class="text-caption">—</span>
                    {/if}
                  </td>
                  <td class="table-td-sm">
                    <span class="text-body">−{formatMoney(red.discount_amount, red.currency)}</span>
                    <span class="text-caption block">
                      {formatMoney(red.original_amount, red.currency)}
                    </span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-body">{formatMoney(red.final_amount, red.currency)}</span>
                  </td>
                  <td class="table-td-sm">
                    <span class="badge {statusClass[red.status]}">{statusLabel[red.status]}</span>
                  </td>
                  <td class="table-td-sm">
                    <span class="text-caption">
                      {formatDateTime(red.consumed_at ?? red.created_at)}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>
