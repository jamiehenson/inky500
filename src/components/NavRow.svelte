<script lang="ts">
  import { Button } from "./ui/button";

  export const sections = [
    {
      id: "results",
      label: "Race Results 🏎️",
    },
    {
      id: "drivers",
      label: "Driver's Standings 🏆",
    },
    {
      id: "constructors",
      label: "Constructors' Standings ⚙️",
    },
    {
      id: "progression",
      label: "Progression 📈",
    },
  ];
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
