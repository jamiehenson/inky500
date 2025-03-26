<script lang="ts">
  import { drivers, results, seasonRacers } from "@/data";
  import type { RacerName, SeasonName, TrackName } from "@/types";
  import { carImages } from "@/utils";
  import type { StandingResult } from "@/data/standings";
  import * as Table from "@/components/ui/table";
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
      Go to progression chart 📈
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
      Go to overview table 🥇
    </Badge>
  </div>
  <Table.Root>
    <Table.Body>
      {#each sortedData as [key, result], index}
        {@const seasonDriver = seasonRacers[season][key as RacerName]}
        {@const driver = drivers[key as RacerName]}

        {#if driver && seasonDriver}
          {@const currentTeam =
            seasonDriver.otherTeams?.[track as TrackName] ?? seasonDriver}
          <Table.Row>
            <Table.Cell>
              <div class="flex items-center">
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
              </div>
            </Table.Cell>
            <Table.Cell>{driver.name}</Table.Cell>
            <Table.Cell>
              <div class="flex items-center gap-2">
                <img
                  src={carImages[currentTeam.car].src}
                  alt={currentTeam.car}
                  class="w-6 h-6"
                />
                <span class="hidden sm:block">{currentTeam.team}</span>
              </div>
            </Table.Cell>
            <Table.Cell class="font-bold text-right">
              <span class="font-bold">
                {#if useNetPoints}
                  {(result as StandingResult).netPoints}
                {:else}
                  {(result as StandingResult).points}
                {/if}
              </span>
            </Table.Cell>
          </Table.Row>
        {/if}
      {/each}
    </Table.Body>
  </Table.Root>
</div>
