<script lang="ts" module>
  import { type VariantProps, tv } from "tailwind-variants";

  export const badgeVariants = tv({
    base: "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2",
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
        outline: "text-foreground",
      },
      carClass: {
        gt3: "bg-green-600 text-white border-transparent",
        gt4: "bg-amber-500 text-black border-transparent",
        tcx: "bg-blue-600 text-white border-transparent",
        all: "bg-muted text-muted-foreground border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
  import type { WithElementRef } from "bits-ui";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cn } from "@/lib/utils.js";
  import type { SeasonRacerClass } from "@/data/seasonRacers";

  let {
    ref = $bindable(null),
    href,
    class: className,
    variant = "default",
    carClass,
    children,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    variant?: BadgeVariant;
    carClass?: SeasonRacerClass;
  } = $props();
</script>

<svelte:element
  this={href ? "a" : "span"}
  bind:this={ref}
  {href}
  class={cn(badgeVariants({ variant, carClass }), className)}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
