<script lang="ts">
  /**
   * Horizontal magnitude bars for a "revenue by X" breakdown.
   *
   * One hue, varying length — the categories here have no identity worth
   * distinguishing by color, only a size worth comparing, so a categorical
   * palette would add eight colors that mean nothing. Every bar carries its
   * value as a direct label, which is what makes this readable without an
   * axis and satisfies the relief rule for the lighter accent.
   */
  import type { PaymentBreakdownItem } from '$lib/types';
  import { formatMoney, formatCount } from '$lib/format';

  interface Props {
    items: PaymentBreakdownItem[];
    currency: string;
    /** Which validated hue to use — the two breakdowns sit side by side. */
    accent: 'violet' | 'blue';
    emptyLabel: string;
    /** Cap the rows shown; the rest fold into an "Other" row. */
    limit?: number;
    otherLabel?: string;
  }

  let { items, currency, accent, emptyLabel, limit = 6, otherLabel = 'Other' }: Props = $props();

  /**
   * Past `limit` rows the tail is summed into one "Other" bar rather than
   * scrolling — a breakdown is for seeing the shape, and a 20-row list of
   * 1% slices does not show a shape.
   */
  const rows = $derived.by(() => {
    if (items.length <= limit) return items;
    const head = items.slice(0, limit - 1);
    const tail = items.slice(limit - 1);
    return [
      ...head,
      {
        key: '__other__',
        label: `${otherLabel} (${tail.length})`,
        revenue: tail.reduce((sum, i) => sum + i.revenue, 0),
        transactions: tail.reduce((sum, i) => sum + i.transactions, 0)
      }
    ];
  });

  const peak = $derived(Math.max(...rows.map((r) => r.revenue), 0));
  const total = $derived(rows.reduce((sum, r) => sum + r.revenue, 0));

  function widthPercent(value: number): number {
    if (peak <= 0) return 0;
    // Floor at 2% so a tiny-but-nonzero slice is still visibly a bar.
    return Math.max((value / peak) * 100, value > 0 ? 2 : 0);
  }

  function sharePercent(value: number): string {
    if (total <= 0) return '0%';
    return `${((value / total) * 100).toFixed(0)}%`;
  }
</script>

{#if rows.length === 0}
  <p class="empty-list-text">{emptyLabel}</p>
{:else}
  <ul class="space-y-4">
    {#each rows as row (row.key)}
      <li>
        <div class="flex items-baseline justify-between gap-3 mb-1.5">
          <span class="text-body-medium truncate">{row.label}</span>
          <span class="text-body-semibold shrink-0">{formatMoney(row.revenue, currency)}</span>
        </div>
        <div class="track">
          <div
            class="fill"
            class:violet={accent === 'violet'}
            class:blue={accent === 'blue'}
            style="width: {widthPercent(row.revenue)}%"
          ></div>
        </div>
        <div class="flex items-center justify-between mt-1.5">
          <span class="text-caption">
            {formatCount(row.transactions)}
            {row.transactions === 1 ? 'transaction' : 'transactions'}
          </span>
          <span class="text-caption">{sharePercent(row.revenue)}</span>
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .track {
    height: 8px;
    border-radius: 999px;
    background: #f1f0f5;
    overflow: hidden;
  }
  :global(.dark) .track {
    background: #1f1f27;
  }

  .fill {
    height: 100%;
    /* 4px rounded data-end, square where it meets the track's origin. */
    border-radius: 0 4px 4px 0;
    transition: width 240ms ease-out;
  }
  .fill.violet {
    background: #4a3aa7;
  }
  .fill.blue {
    background: #2a78d6;
  }
  :global(.dark) .fill.violet {
    background: #9085e9;
  }
  :global(.dark) .fill.blue {
    background: #3987e5;
  }
</style>
