<script lang="ts">
  /**
   * Payments dashboard — Xendit checkout revenue over 7 days, 30 days, or
   * 12 months.
   *
   * One request per range change: the API returns totals, the series, both
   * breakdowns, and the recent activity list together, so switching periods is
   * a single round trip rather than four racing ones.
   */
  import { onMount } from 'svelte';
  import { getPaymentSummary } from '$lib/api';
  import { PAYMENTS } from '$lib/strings';
  import type { PaymentRange, PaymentSummary, PaymentTransaction } from '$lib/types';
  import { formatMoney, formatCount, formatPercent, percentChange, formatDateTime } from '$lib/format';
  import TimeSeriesChart from '$lib/components/TimeSeriesChart.svelte';
  import BreakdownBars from '$lib/components/BreakdownBars.svelte';

  let range = $state<PaymentRange>('7d');
  let summary = $state<PaymentSummary | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(load);

  async function load() {
    loading = true;
    error = '';
    try {
      summary = await getPaymentSummary(range);
    } catch (e) {
      error = e instanceof Error ? e.message : PAYMENTS.loadError;
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

  /**
   * The headline cards. Deltas compare against the equally-long window before
   * this one; `delta: null` means there was no prior activity to compare with,
   * which the card says outright rather than showing a fictitious +100%.
   */
  const cards = $derived.by(() => {
    if (!summary) return [];
    const t = summary.totals;
    const p = summary.previous_totals;
    return [
      {
        label: PAYMENTS.revenue,
        value: formatMoney(t.revenue, currency),
        delta: percentChange(t.revenue, p.revenue),
        tone: 'violet' as const
      },
      {
        label: PAYMENTS.transactions,
        value: formatCount(t.transactions),
        delta: percentChange(t.transactions, p.transactions),
        tone: 'emerald' as const
      },
      {
        label: PAYMENTS.payingUsers,
        value: formatCount(t.paying_users),
        delta: percentChange(t.paying_users, p.paying_users),
        tone: 'blue' as const
      },
      {
        label: PAYMENTS.averageOrder,
        value: formatMoney(t.average_order_value, currency),
        delta: percentChange(t.average_order_value, p.average_order_value),
        tone: 'amber' as const
      }
    ];
  });

  const statusClass: Record<PaymentTransaction['status'], string> = {
    paid: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    pending: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    failed: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
    expired: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  };

  const statusLabel: Record<PaymentTransaction['status'], string> = {
    paid: PAYMENTS.statusPaid,
    pending: PAYMENTS.statusPending,
    failed: PAYMENTS.statusFailed,
    expired: PAYMENTS.statusExpired
  };

  /** What a transaction bought, as one short phrase for the table. */
  function productLabel(t: PaymentTransaction): string {
    if (t.kind === 'subscription') {
      const tier = t.subscription_tier ?? PAYMENTS.subscriptionLabel;
      return t.billing_cycle ? `${tier} · ${t.billing_cycle}` : tier;
    }
    return t.package_key ?? `${formatCount(t.tokens)} ${PAYMENTS.tokensUnit}`;
  }
</script>

<div class="p-8">
  <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="page-title">{PAYMENTS.title}</h1>
      <p class="page-subtitle">{PAYMENTS.subtitle}</p>
    </div>

    <!-- Filters in one row above the charts. -->
    <div class="flex flex-wrap items-center gap-3">
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

      <!-- A label, not a control. The API scopes every payments read to its
           own deployment's environment, so there is nothing here to choose —
           this just says which set of books is on screen. -->
      {#if summary}
        <span
          class="env-badge"
          class:env-production={summary.environment === 'production'}
          title={PAYMENTS.envHint}
        >
          {summary.environment === 'production' ? PAYMENTS.envProduction : PAYMENTS.envStaging}
        </span>
      {/if}
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
      <button type="button" class="btn-cancel-sm" onclick={load}>{PAYMENTS.retry}</button>
    </div>
  {:else if summary}
    <!-- Headline totals -->
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
              {PAYMENTS.noPrevious}
            {:else}
              <span
                class:text-emerald={card.delta >= 0}
                class:text-danger={card.delta < 0}
                class="font-semibold"
              >
                {card.delta >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(card.delta))}
              </span>
              {PAYMENTS.vsPrevious}
            {/if}
          </p>
        </div>
      {/each}
    </div>

    <!-- Secondary totals: the health of the funnel, not the money. -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div class="stat-card">
        <p class="stat-label">{PAYMENTS.successRate}</p>
        <p class="stat-value">{formatPercent(summary.totals.success_rate)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">{PAYMENTS.tokensSold}</p>
        <p class="stat-value">{formatCount(summary.totals.tokens)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">{PAYMENTS.statusPending}</p>
        <p class="stat-value">{formatCount(summary.totals.pending)}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">{PAYMENTS.statusFailed} / {PAYMENTS.statusExpired}</p>
        <p class="stat-value">{formatCount(summary.totals.failed + summary.totals.expired)}</p>
      </div>
    </div>

    <!-- Revenue over time -->
    <div class="card-padded mb-6">
      <div class="card-section-header">
        <div>
          <h2 class="text-heading-sm">{PAYMENTS.revenueChartTitle}</h2>
          <p class="text-caption mt-0.5">
            {bucket === 'month' ? PAYMENTS.revenueChartSubtitleMonth : PAYMENTS.revenueChartSubtitleDay}
          </p>
        </div>
      </div>
      <TimeSeriesChart
        points={summary.series}
        metric="revenue"
        variant="area"
        {bucket}
        {currency}
        emptyLabel={PAYMENTS.emptyChart}
      />
    </div>

    <!-- Paid transaction count. A second chart rather than a second y-axis on
         the one above: the two measures share a time axis but nothing else. -->
    <div class="card-padded mb-6">
      <div class="card-section-header">
        <div>
          <h2 class="text-heading-sm">{PAYMENTS.volumeChartTitle}</h2>
          <p class="text-caption mt-0.5">
            {bucket === 'month' ? PAYMENTS.volumeChartSubtitleMonth : PAYMENTS.volumeChartSubtitleDay}
          </p>
        </div>
      </div>
      <TimeSeriesChart
        points={summary.series}
        metric="transactions"
        variant="columns"
        {bucket}
        {currency}
        emptyLabel={PAYMENTS.emptyChart}
      />
    </div>

    <!-- Breakdowns -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card-padded">
        <div class="card-section-header">
          <h2 class="text-heading-sm">{PAYMENTS.byProductTitle}</h2>
        </div>
        <BreakdownBars
          items={summary.by_product}
          {currency}
          accent="violet"
          emptyLabel={PAYMENTS.emptyChart}
        />
      </div>

      <div class="card-padded">
        <div class="card-section-header">
          <h2 class="text-heading-sm">{PAYMENTS.byChannelTitle}</h2>
        </div>
        <BreakdownBars
          items={summary.by_channel}
          {currency}
          accent="blue"
          emptyLabel={PAYMENTS.emptyChart}
        />
      </div>
    </div>

    <!-- Recent checkouts. Doubles as the table view the charts' accessibility
         relief depends on: every figure above is readable here as text. -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-heading-sm">{PAYMENTS.recentTitle}</h2>
      </div>

      {#if summary.recent.length === 0}
        <div class="table-empty-cell">
          <p class="text-body-medium mb-1">{PAYMENTS.emptyTitle}</p>
          <p class="text-caption">{PAYMENTS.emptyBody}</p>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th class="table-th">{PAYMENTS.colReference}</th>
                <th class="table-th">{PAYMENTS.colUser}</th>
                <th class="table-th">{PAYMENTS.colProduct}</th>
                <th class="table-th">{PAYMENTS.colAmount}</th>
                <th class="table-th">{PAYMENTS.colStatus}</th>
                <th class="table-th">{PAYMENTS.colChannel}</th>
                <th class="table-th">{PAYMENTS.colCreated}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              {#each summary.recent as txn (txn.id)}
                <tr class="table-row">
                  <td class="table-td-sm">
                    <span class="uid-text">{txn.reference_id}</span>
                  </td>
                  <td class="table-td-sm">
                    {#if txn.user_uid}
                      <a href="/users/{txn.user_uid}" class="uid-link">{txn.user_email || txn.user_uid}</a>
                    {:else}
                      <span class="text-caption">—</span>
                    {/if}
                  </td>
                  <td class="table-td-sm">
                    <span class="text-body">{productLabel(txn)}</span>
                    {#if txn.tokens > 0}
                      <span class="text-caption block">+{formatCount(txn.tokens)} {PAYMENTS.tokensUnit}</span>
                    {/if}
                  </td>
                  <td class="table-td-sm text-body-semibold">{formatMoney(txn.amount, txn.currency)}</td>
                  <td class="table-td-sm">
                    <span class="badge {statusClass[txn.status]}">{statusLabel[txn.status]}</span>
                  </td>
                  <td class="table-td-sm text-caption">{txn.payment_channel || '—'}</td>
                  <td class="table-td-sm text-caption">{formatDateTime(txn.created_at)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .segmented {
    display: inline-flex;
    padding: 3px;
    border-radius: 0.75rem;
    background: #f3f4f6;
    gap: 2px;
  }
  :global(.dark) .segmented {
    background: #1f2937;
  }

  .segment {
    padding: 0.4rem 0.85rem;
    border-radius: 0.55rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #6b7280;
    transition: background 150ms ease, color 150ms ease;
  }
  .segment:hover {
    color: #111827;
  }
  :global(.dark) .segment {
    color: #9ca3af;
  }
  :global(.dark) .segment:hover {
    color: #f9fafb;
  }

  .segment.active {
    background: #ffffff;
    color: #4a3aa7;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
  }
  :global(.dark) .segment.active {
    background: #111827;
    color: #9085e9;
  }

  /* Staging is the quiet default; production gets a warmer badge so it is
     obvious at a glance which site you are looking at. */
  .env-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: #f3f4f6;
    color: #6b7280;
    border: 1px solid #e5e7eb;
  }
  :global(.dark) .env-badge {
    background: #1f2937;
    color: #9ca3af;
    border-color: #374151;
  }
  .env-badge.env-production {
    background: #fef3c7;
    color: #92400e;
    border-color: #fde68a;
  }
  :global(.dark) .env-badge.env-production {
    background: #3b2f0b;
    color: #fbbf24;
    border-color: #574618;
  }

  /* A small colored dot identifies the card without coloring its text. */
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }
  .dot-violet {
    background: #4a3aa7;
  }
  .dot-emerald {
    background: #1baf7a;
  }
  .dot-blue {
    background: #2a78d6;
  }
  .dot-amber {
    background: #eda100;
  }
  :global(.dark) .dot-violet {
    background: #9085e9;
  }
  :global(.dark) .dot-emerald {
    background: #199e70;
  }
  :global(.dark) .dot-blue {
    background: #3987e5;
  }
  :global(.dark) .dot-amber {
    background: #c98500;
  }
</style>
