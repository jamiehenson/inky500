<script lang="ts">
  import { results, tracks } from "@/data";
  import { getStandingsContext } from "./context";
  import { Button } from "./ui/button";
  import { Label } from "./ui/label";
  import { Switch } from "./ui/switch";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import ArrowUpToLine from "@lucide/svelte/icons/arrow-up-to-line";
  import * as Tooltip from "./ui/tooltip";
  import * as Popover from "./ui/popover";
  import type { TrackName } from "@/types";
  import { withBase } from "@/utils";

  const { season, track, netPoints, setNetPoints } = getStandingsContext();
  const completedRaces = Object.entries(results[season])
    .filter(([_, results]) => results?.results)
    .map(([track]) => track);
</script>

<div
  class="fixed bottom-0 left-0 w-full z-10 flex items-end justify-between space-x-2 bg-background sm:bg-transparent"
>
  <div class="min-w-[100px] sm:min-w-[150px]">
    <div
      class="inline-flex items-center h-12 p-2 bg-background sm:rounded-tr-lg sm:border"
    >
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
        <ArrowUpToLine />
      </Button>
    </div>
  </div>
  <div class="rounded-t-lg bg-background p-1 sm:border">
    <div class="hidden sm:flex justify-center gap-1 flex-wrap">
      {#each completedRaces as completedTrack}
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <a href={withBase(`/${season}/${completedTrack}`)}>
                <Button
                  variant={completedTrack === track ? "default" : "secondary"}
                  size="sm"
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
    <div class="block sm:hidden">
      <Popover.Root>
        <Popover.Trigger>
          <Button variant="secondary" size="sm" class="mb-0.5">
            Season {season[season.length - 1].toUpperCase()}
            <ChevronUp />
          </Button>
        </Popover.Trigger>
        <Popover.Content>
          <div class="grid grid-cols-3 gap-2">
            {#each completedRaces as completedTrack}
              <a href={withBase(`/${season}/${completedTrack}`)}>
                <Button
                  variant={completedTrack === track ? "default" : "secondary"}
                  size="sm"
                >
                  {tracks[completedTrack as TrackName].abbreviation}
                  <span
                    class={`rounded-sm fi fi-${tracks[completedTrack as TrackName].countryCode}`}
                  ></span>
                </Button>
              </a>
            {/each}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  </div>
  <div class="min-w-[100px] sm:min-w-[150px]">
    {#if ["s5"].includes(season)}
      <div
        class="flex items-center space-x-2 p-2 h-12 bg-background sm:rounded-tl-lg sm:border"
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
    {:else}
      <div></div>
    {/if}
  </div>
</div>
