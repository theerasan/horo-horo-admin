<script lang="ts">
  interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onconfirm: () => void;
    oncancel: () => void;
  }

  let {
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    onconfirm,
    oncancel,
  }: Props = $props();

  function handleKey(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') oncancel();
    if (e.key === 'Enter') onconfirm();
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
  <div class="modal-overlay">
    <div class="modal-backdrop" role="presentation" onclick={oncancel}></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title" class="text-base font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
      <div class="flex gap-3">
        <button
          class={danger
            ? 'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors bg-red-600 hover:bg-red-700'
            : 'btn-primary flex-1 justify-center'}
          onclick={onconfirm}
        >
          {confirmLabel}
        </button>
        <button class="btn-cancel flex-1" onclick={oncancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
