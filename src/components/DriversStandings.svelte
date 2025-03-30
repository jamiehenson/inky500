<script lang="ts">
  import { flip } from "svelte/animate";
  import { drivers, seasonRacers } from "@/data";
  import type { RacerName, TrackName } from "@/types";
  import { carImages } from "@/utils";
  import type { StandingResult } from "@/data/standings";
  import * as GridTable from "@/components/ui/grid-table";
  import { Badge } from "@/components/ui/badge";
  import * as Tooltip from "@/components/ui/tooltip";
  import DeltaMarker from "@/components/ui/DeltaMarker.svelte";
  import { getStandingsContext } from "@/components/context";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  type Props = {
    data: Record<string, StandingResult>;
  };

  let { data }: Props = $props();
  let { season, track, setShowType, setChartType, netPoints } =
    getStandingsContext();

  const useNetPoints = $derived(netPoints());

  const sortedData = $derived(
    Object.entries(data).sort(([, a], [, b]) => {
      return useNetPoints
        ? (b.netPoints ?? 0) - (a.netPoints ?? 0)
        : (b.points ?? 0) - (a.points ?? 0);
    }),
  );
</script>

<div
  id="drivers"
  class="flex flex-col gap-4 col-span-2 lg:col-span-1 border rounded-lg"
>
  <div>
    <h2 class="text-2xl font-bold">Drivers' Standings</h2>
    <div class="flex justify-center items-center gap-2">
      <h3 class="text-sm text-center text-muted-foreground">
        ({useNetPoints ? "net points" : "total points"})
      </h3>
      {#if useNetPoints}
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <CircleHelp size={16} />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p class="max-w-sm">
                Net points are calculated by deducting the two lowest results
                from a driver's total points each race.
              </p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/if}
    </div>
  </div>
  <div class="flex justify-center items-center gap-2">
    <Badge
      variant="outline"
      class="cursor-pointer"
      onclick={() => {
        setShowType("chart");
        setChartType("drivers");
        document
          .getElementById("progression")
          ?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <span class="hidden sm:block">Go to progression chart 📈</span>
      <span class="block sm:hidden">Chart 📈</span>
    </Badge>
    <Badge
      variant="outline"
      class="cursor-pointer"
      onclick={() => {
        setShowType("table");
        setChartType("drivers");
        document
          .getElementById("progression")
          ?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <span class="hidden sm:block">Go to overview table 🥇</span>
      <span class="block sm:hidden">Table 🥇</span>
    </Badge>
  </div>

  <div>
    {#each sortedData as [key, result], index (key)}
      {@const seasonDriver = seasonRacers[season][key as RacerName]}
      {@const driver = drivers[key as RacerName]}

      <div animate:flip>
        {#if driver && seasonDriver}
          {@const currentTeam =
            seasonDriver.otherTeams?.[track as TrackName] ?? seasonDriver}
          <GridTable.Row class="grid grid-cols-4 sm:grid-cols-5 w-full">
            <GridTable.Cell class="flex items-center">
              <Badge
                variant="secondary"
                class="w-8 justify-center mr-2 pointer-events-none"
              >
                {index + 1}
              </Badge>
              <DeltaMarker
                delta={useNetPoints
                  ? (result?.netDelta ?? 0)
                  : (result?.delta ?? 0)}
              />
            </GridTable.Cell>
            <GridTable.Cell>{driver.name}</GridTable.Cell>
            <GridTable.Cell class="sm:col-span-2">
              <div class="flex items-center gap-2">
                <img
                  src={carImages[currentTeam.car].src}
                  alt={currentTeam.car}
                  class="w-6 h-6"
                />
                <span class="hidden sm:block">{currentTeam.team}</span>
              </div>
            </GridTable.Cell>
            <GridTable.Cell class="justify-end">
              <span class="font-bold">
                {#if useNetPoints}
                  {(result as StandingResult).netPoints}
                {:else}
                  {(result as StandingResult).points}
                {/if}
              </span>
            </GridTable.Cell>
          </GridTable.Row>
        {/if}
      </div>
    {/each}
  </div>
</div>
