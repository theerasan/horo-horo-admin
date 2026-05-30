<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth.svelte';

  onMount(() => {
    auth.init();
    if (auth.user) {
      goto('/dashboard');
    } else {
      goto('/login');
    }
  });
</script>
