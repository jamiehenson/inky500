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
  role="cell"
  class={cn(
    "p-2 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0 text-sm flex items-center",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
