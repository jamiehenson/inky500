<script lang="ts">
  import { drivers, results, seasonRacers } from "@/data";
  import type { RacerName, SeasonName, TrackName } from "@/types";
  import { carImages } from "@/utils";
  import type { StandingResult } from "@/data/standings";
  import * as Table from "@/components/ui/table";
  import { Badge } from "@/components/ui/badge";
  import DeltaMarker from "@/components/ui/DeltaMarker.svelte";
  import { getStandingsContext } from "@/components/context";
  type Props = {
    data: Record<string, StandingResult>;
  };

  let { data }: Props = $props();
  let { season, track, setShowType, setChartType, netPoints } =
    getStandingsContext();
</script>

<div
  id="drivers"
  class="flex flex-col gap-4 col-span-2 lg:col-span-1 border rounded-lg"
>
  <div>
    <h2 class="text-2xl font-bold">Drivers' Standings</h2>
    <h3 class="text-sm text-center text-muted-foreground">
      ({netPoints() ? "net points" : "total points"})
    </h3>
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
      {#each Object.entries(data) as [key, result], index}
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
                <DeltaMarker delta={result.delta} />
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
              <span class="font-bold">{(result as StandingResult).points}</span
              >{" "}
              {#if Object.keys(results).indexOf(track) >= Object.keys(results).length - 3 && (result as StandingResult).netPoints}
                <span class="font-light text-xs"
                  >({(result as StandingResult).netPoints})
                </span>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/if}
      {/each}
    </Table.Body>
  </Table.Root>
</div>
