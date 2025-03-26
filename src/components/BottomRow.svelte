<script lang="ts">
  import { results, tracks } from "@/data";
  import { getStandingsContext } from "./context";
  import { Button } from "./ui/button";
  import { Label } from "./ui/label";
  import { Switch } from "./ui/switch";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import * as Tooltip from "./ui/tooltip";
  import type { TrackName } from "@/types";
  import { withBase } from "@/utils";

  const { season, track, netPoints, setNetPoints } = getStandingsContext();
  const completedRaces = Object.entries(results[season])
    .filter(([_, results]) => results?.results)
    .map(([track]) => track);
</script>

<div
  class="fixed bottom-0 left-0 w-full z-10 flex items-end justify-between space-x-2"
>
  <div class="flex items-center h-11 p-2 bg-background rounded-tr-lg border">
    <Button
      variant="secondary"
      size="sm"
      class="h-8"
      onclick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
    >
      <ChevronUp />
    </Button>
  </div>
  <div
    class="flex justify-center gap-1 flex-wrap rounded-t-lg bg-background p-1 border"
  >
    {#each completedRaces as completedTrack}
      <Tooltip.Provider delayDuration={100}>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <a href={withBase(`/${season}/${completedTrack}`)}>
              <Button
                variant={completedTrack === track ? "default" : "secondary"}
                size="sm"
                class="h-8"
              >
                <span
                  class={`rounded-sm fi fi-${tracks[completedTrack as TrackName].countryCode}`}
                ></span>
              </Button>
            </a>
          </Tooltip.Trigger>
          <Tooltip.Content
            >{tracks[completedTrack as TrackName].name}</Tooltip.Content
          >
        </Tooltip.Root>
      </Tooltip.Provider>
    {/each}
  </div>
  <div
    class="flex items-center space-x-2 p-2 h-11 bg-background rounded-tl-lg border"
  >
    <Label for="net-points">
      <span class="hidden sm:inline">Net Points</span>
      <span class="inline-block sm:hidden">Net</span>
    </Label>
    <Switch
      id="net-points"
      checked={netPoints()}
      onCheckedChange={(value) => {
        setNetPoints(value);
      }}
    />
  </div>
</div>
