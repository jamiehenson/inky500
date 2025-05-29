<script lang="ts">
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Minus from "@lucide/svelte/icons/minus";

  type Props = {
    delta: number;
  };

  let { delta }: Props = $props();
</script>

<div class="flex items-center text-green-500 gap-1">
  {#if delta > 0}
    <ChevronUp size="24" class="stroke-green-500" />
  {:else if delta < 0}
    <ChevronDown size="24" class="stroke-red-500" />
  {:else}
    <Minus size="24" class="stroke-gray-500" />
  {/if}

  <span class="font-bold text-foreground"
    >{delta !== 0 ? Math.abs(delta) : null}</span
  >
</div>
