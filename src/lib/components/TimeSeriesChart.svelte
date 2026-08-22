<script lang="ts">
  /**
   * A single-series time chart, drawn as plain SVG — an area for a continuous
   * measure (revenue) or columns for a count (transactions).
   *
   * Single series on purpose: revenue and transaction count live on different
   * scales, and putting them on one plot would need a second y-axis, which
   * misleads by construction. Two charts, one scale each.
   *
   * No legend either — with one series the card's title already names what is
   * plotted, so a one-swatch legend would just restate it.
   *
   * Width is measured from the DOM rather than baked into a viewBox, because a
   * viewBox that stretches would distort the labels along with the marks.
   */
  import { formatMoney, formatCount, formatBucket as formatBucketDate } from '$lib/format';

  /**
   * One bucket. The series is passed already reduced to a single plotted
   * measure — deciding *which* field to plot is the caller's job, so this
   * component works for revenue, discount given, or any other one-per-bucket
   * number without learning each dashboard's response shape.
   */
  export interface ChartPoint {
    bucket: string;
    /** The plotted measure. */
    value: number;
    /** A secondary figure for the tooltip's meta line. */
    meta?: number;
  }

  interface Props {
    points: ChartPoint[];
    /** How values are formatted: currency, or a plain integer count. */
    metric: 'money' | 'count';
    variant: 'area' | 'columns';
    /** 'day' or 'month' — decides how bucket dates are labelled. */
    bucket: string;
    currency: string;
    emptyLabel: string;
    /** Names the measure for screen readers. The card title names it visually. */
    seriesLabel: string;
    /** Renders the tooltip's second line from `meta`. Omit for no meta line. */
    metaLabel?: (meta: number) => string;
  }

  let { points, metric, variant, bucket, currency, emptyLabel, seriesLabel, metaLabel }: Props =
    $props();

  /**
   * Gradient ids must be unique per instance: two area charts on one page with
   * the same id make the second one reference the first's fill, and whichever
   * unmounts first takes the gradient with it.
   */
  const gradientId = `areaFill-${Math.random().toString(36).slice(2, 9)}`;

  // ── Geometry ───────────────────────────────────────────────────────────────
  // Left gutter holds y-axis labels, bottom holds the date ticks; the top pad
  // keeps the peak's marker and its ring clear of the card's edge.
  const PAD = { top: 16, right: 12, bottom: 28, left: 52 };
  const HEIGHT = 260;
  const MAX_BAR_WIDTH = 24; // never fill the band — the leftover is air
  const BAR_GAP = 2; // surface gap between adjacent columns

  let width = $state(720);
  let hoverIndex = $state<number | null>(null);

  const values = $derived(points.map((p) => p.value));
  const hasData = $derived(values.some((v) => v > 0));

  const plotWidth = $derived(Math.max(width - PAD.left - PAD.right, 10));
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  /**
   * Ticks are rounded up to a clean step (1/2/5 × 10ⁿ) so the axis reads
   * 0 / 200 / 400 rather than 0 / 173 / 346. An all-zero window still gets a
   * real axis — otherwise the chart collapses to a line on the baseline with
   * no scale to explain it.
   */
  const scale = $derived.by(() => {
    const peak = Math.max(...values, 0);
    if (peak <= 0) {
      // An all-zero window still gets a plausible axis so the empty state
      // reads as "measured, nothing happened". The ticks have to span that
      // axis — a 0–100 scale labelled 0/1/2/3/4 stacks every label on the
      // baseline.
      const max = metric === 'money' ? 100 : 4;
      return { max, ticks: [0, 0.25, 0.5, 0.75, 1].map((f) => f * max) };
    }

    const rough = peak / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10;
    const max = Math.ceil(peak / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= max + step / 2; v += step) ticks.push(v);
    return { max, ticks };
  });

  const xAt = $derived((i: number) =>
    points.length <= 1 ? PAD.left + plotWidth / 2 : PAD.left + (plotWidth * i) / (points.length - 1)
  );
  const yAt = $derived((v: number) => PAD.top + plotHeight - (v / scale.max) * plotHeight);

  /** Column band width, capped so wide charts don't grow slab-like bars. */
  const bandWidth = $derived(plotWidth / Math.max(points.length, 1));
  const barWidth = $derived(Math.max(Math.min(bandWidth - BAR_GAP, MAX_BAR_WIDTH), 2));
  const barXAt = $derived((i: number) => PAD.left + bandWidth * i + (bandWidth - barWidth) / 2);

  const linePath = $derived(
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`).join(' ')
  );
  const areaPath = $derived(
    values.length === 0
      ? ''
      : `${linePath} L${xAt(values.length - 1).toFixed(2)},${PAD.top + plotHeight} L${xAt(0).toFixed(2)},${PAD.top + plotHeight} Z`
  );

  /** The index of the largest value — the one point that gets a direct label. */
  const peakIndex = $derived.by(() => {
    let best = -1;
    values.forEach((v, i) => {
      if (v > 0 && (best === -1 || v > values[best])) best = i;
    });
    return best;
  });

  // ── Formatting ─────────────────────────────────────────────────────────────

  function formatAxis(v: number): string {
    if (metric === 'count') return String(Math.round(v));
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`;
    return String(Math.round(v));
  }

  /** A plotted value as the reader should see it — the peak label and tooltip. */
  function formatValue(v: number): string {
    return metric === 'money' ? formatMoney(v, currency) : formatCount(v);
  }

  const formatBucket = (iso: string, long = false) => formatBucketDate(iso, bucket, long);

  /**
   * Where a tick's label sits. Centered on its mark, except at the two ends,
   * where it is pulled flush to the plot edge so it stays fully inside.
   */
  const tickX = $derived((i: number) => {
    const centre = variant === 'columns' ? barXAt(i) + barWidth / 2 : xAt(i);
    if (i === 0) return Math.max(centre - (variant === 'columns' ? barWidth / 2 : 0), 2);
    if (i === points.length - 1) return Math.min(centre + (variant === 'columns' ? barWidth / 2 : 0), width - 2);
    return centre;
  });

  /**
   * Which x positions get a tick label. A 30-day window has no room for 30
   * dates, so it takes roughly every fifth — always including the last, since
   * "where does this end" is the label readers look for first.
   */
  const labelledIndices = $derived.by(() => {
    const n = points.length;
    if (n === 0) return [];
    const maxLabels = Math.max(2, Math.floor(plotWidth / 68));
    const stride = Math.ceil(n / maxLabels);
    const out: number[] = [];
    for (let i = n - 1; i >= 0; i -= stride) out.unshift(i);
    return out;
  });

  // ── Hover ──────────────────────────────────────────────────────────────────

  function onMove(event: PointerEvent) {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (points.length === 0) return;
    const raw =
      variant === 'columns'
        ? Math.floor((x - PAD.left) / Math.max(bandWidth, 1))
        : Math.round(((x - PAD.left) / Math.max(plotWidth, 1)) * (points.length - 1));
    hoverIndex = Math.min(Math.max(raw, 0), points.length - 1);
  }

  const tooltip = $derived.by(() => {
    if (hoverIndex === null || !points[hoverIndex]) return null;
    const p = points[hoverIndex];
    const anchor = variant === 'columns' ? barXAt(hoverIndex) + barWidth / 2 : xAt(hoverIndex);
    // Keep the card inside the plot at both ends rather than letting it clip.
    const halfCard = 78;
    const left = Math.min(Math.max(anchor, PAD.left + halfCard), width - halfCard);
    return {
      point: p,
      anchor,
      left,
      top: Math.max(yAt(p.value) - 12, 8)
    };
  });
</script>

<div class="chart" bind:clientWidth={width}>
  <!-- role/label sit on the <svg>, not the wrapper: the wrapper also holds the
       tooltip and the empty-state text, which are not part of the picture. -->
  <svg
    role="img"
    aria-label="{seriesLabel} per {bucket}"
    width="100%"
    height={HEIGHT}
    viewBox="0 0 {width} {HEIGHT}"
    onpointermove={onMove}
    onpointerleave={() => (hoverIndex = null)}
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--series)" stop-opacity="0.18" />
        <stop offset="100%" stop-color="var(--series)" stop-opacity="0.02" />
      </linearGradient>
    </defs>

    <!-- Gridlines: hairline, solid, one step off the surface. -->
    {#each scale.ticks as tick}
      <line
        x1={PAD.left}
        y1={yAt(tick)}
        x2={width - PAD.right}
        y2={yAt(tick)}
        class="grid"
        stroke-width="1"
      />
      <text x={PAD.left - 10} y={yAt(tick) + 4} class="axis-text" text-anchor="end">
        {formatAxis(tick)}
      </text>
    {/each}

    {#if variant === 'area'}
      <path d={areaPath} fill="url(#{gradientId})" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--series)"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      {#each values as v, i}
        {#if v > 0 && (i === peakIndex || i === hoverIndex)}
          <!-- 2px surface ring keeps the marker legible where it sits on the line. -->
          <circle cx={xAt(i)} cy={yAt(v)} r="6" class="marker-ring" />
          <circle cx={xAt(i)} cy={yAt(v)} r="4" fill="var(--series)" />
        {/if}
      {/each}
    {:else}
      {#each values as v, i}
        <!-- 4px rounded cap, square at the baseline: two rects rather than a
             uniformly rounded one, so the bar sits flat on the axis. -->
        {@const h = Math.max(PAD.top + plotHeight - yAt(v), 0)}
        {#if h > 0}
          <rect
            x={barXAt(i)}
            y={yAt(v)}
            width={barWidth}
            height={h}
            rx={Math.min(4, barWidth / 2)}
            fill="var(--series)"
            opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.45}
          />
          {#if h > 4}
            <rect
              x={barXAt(i)}
              y={PAD.top + plotHeight - Math.min(h, 4)}
              width={barWidth}
              height={Math.min(h, 4)}
              fill="var(--series)"
              opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.45}
            />
          {/if}
        {:else}
          <!-- An empty bucket still gets a 2px stub, so a run of zeroes reads
               as "measured, nothing happened" rather than a gap in the data. -->
          <rect x={barXAt(i)} y={PAD.top + plotHeight - 2} width={barWidth} height="2" class="zero-stub" />
        {/if}
      {/each}
    {/if}

    <!-- Baseline sits above the marks so columns read as resting on it. -->
    <line
      x1={PAD.left}
      y1={PAD.top + plotHeight}
      x2={width - PAD.right}
      y2={PAD.top + plotHeight}
      class="axis-line"
      stroke-width="1"
    />

    {#if hoverIndex !== null && variant === 'area'}
      <line
        x1={xAt(hoverIndex)}
        y1={PAD.top}
        x2={xAt(hoverIndex)}
        y2={PAD.top + plotHeight}
        class="crosshair"
        stroke-width="1"
      />
    {/if}

    {#each labelledIndices as i}
      <!-- The first and last ticks anchor to their inside edge rather than
           centering: a centered date at either end hangs half outside the
           plot and gets clipped by the SVG's own bounds. -->
      <text
        x={tickX(i)}
        y={HEIGHT - 8}
        class="axis-text"
        text-anchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
      >
        {formatBucket(points[i].bucket)}
      </text>
    {/each}

    <!-- One direct label, on the peak: enough to anchor the scale without
         printing a number on every point. Suppressed while hovering, where
         the tooltip is saying the same thing more precisely. -->
    {#if hasData && peakIndex >= 0 && hoverIndex === null}
      <text
        x={Math.min(
          Math.max(variant === 'columns' ? barXAt(peakIndex) + barWidth / 2 : xAt(peakIndex), PAD.left + 24),
          width - PAD.right - 24
        )}
        y={Math.max(yAt(values[peakIndex]) - 12, PAD.top + 2)}
        class="peak-label"
        text-anchor="middle"
      >
        {formatValue(values[peakIndex])}
      </text>
    {/if}
  </svg>

  {#if tooltip}
    <div class="tooltip" style="left: {tooltip.left}px; top: {tooltip.top}px;">
      <p class="tooltip-date">{formatBucket(tooltip.point.bucket, true)}</p>
      <p class="tooltip-value">{formatValue(tooltip.point.value)}</p>
      {#if metaLabel && tooltip.point.meta !== undefined}
        <p class="tooltip-meta">{metaLabel(tooltip.point.meta)}</p>
      {/if}
    </div>
  {/if}

  {#if !hasData}
    <p class="chart-empty">{emptyLabel}</p>
  {/if}
</div>

<style>
  /* Series color is defined per theme here rather than inherited, so the chart
     is self-contained: the surrounding card only picks the metric. Values are
     the validated violet/aqua steps for each surface. */
  .chart {
    position: relative;
    width: 100%;
    --series: #4a3aa7;
    --grid: #eceaf3;
    --axis: #d8d5e4;
    --ink-muted: #6b7280;
    --ink: #111827;
    --surface: #ffffff;
  }

  :global(.dark) .chart {
    --series: #9085e9;
    --grid: #23232b;
    --axis: #33333d;
    --ink-muted: #9ca3af;
    --ink: #f9fafb;
    --surface: #111827;
  }

  .grid {
    stroke: var(--grid);
  }
  .axis-line {
    stroke: var(--axis);
  }
  .crosshair {
    stroke: var(--axis);
  }
  .zero-stub {
    fill: var(--axis);
  }
  .marker-ring {
    fill: var(--surface);
  }
  /* Axis and label text wears ink tokens, never the series color. */
  .axis-text {
    fill: var(--ink-muted);
    font-size: 11px;
    font-weight: 500;
  }
  .peak-label {
    fill: var(--ink);
    font-size: 11px;
    font-weight: 600;
  }

  .tooltip {
    position: absolute;
    transform: translate(-50%, -100%);
    pointer-events: none;
    white-space: nowrap;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    background: var(--surface);
    border: 1px solid var(--axis);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
    z-index: 5;
  }
  .tooltip-date {
    font-size: 11px;
    color: var(--ink-muted);
  }
  .tooltip-value {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
  }
  .tooltip-meta {
    font-size: 11px;
    color: var(--ink-muted);
  }

  .chart-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--ink-muted);
    pointer-events: none;
  }
</style>
