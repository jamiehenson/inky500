<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { WithElementRef } from "bits-ui";
  import { cn } from "@/lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  role="row"
  class={cn(
    "contents hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
