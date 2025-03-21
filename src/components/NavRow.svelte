<script lang="ts">
  import { sections } from "./utils";
  import { Button } from "./ui/button";
</script>

<div
  class="flex gap-4 flex-wrap justify-center items-center rounded-lg border p-4 col-span-2"
>
  {#each sections as section}
    <Button
      variant="outline"
      onclick={() =>
        document
          .getElementById(section.id)
          ?.scrollIntoView({ behavior: "smooth" })}>{section.label}</Button
    >
  {/each}
</div>
