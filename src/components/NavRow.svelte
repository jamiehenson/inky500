<script lang="ts">
  import { Button } from "./ui/button";

  export const sections = [
    {
      id: "results",
      label: "Results 🏎️",
    },
    {
      id: "drivers",
      label: "Drivers 🏆",
    },
    {
      id: "constructors",
      label: "Constructors ⚙️",
    },
    {
      id: "progression",
      label: "Progression 📈",
    },
  ];
</script>

<div
  class="grid grid-cols-2 sm:grid-cols-4 gap-2 justify-center items-center rounded-b-lg border p-4 col-span-2 -mt-8"
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
