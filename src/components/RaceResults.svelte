<script lang="ts">
  import { drivers, pointsPenalties, seasonRacers } from "@/data";
  import {
    type RacerName,
    type ConstructorName,
    type SeasonName,
    type TrackName,
  } from "@/types";
  import { carImages } from "@/utils";
  import { pointsScheme } from "@/points";
  import type { RacerResult } from "@/data/results";
  import * as Table from "./ui/table";
  import { Badge } from "./ui/badge";
  import { cn } from "@/lib/utils";

  type Props = {
    data: RacerResult;
    season: SeasonName;
    track: TrackName;
    link?: string;
  };

  const { data, season, track, link = undefined }: Props = $props();
</script>

<div id="results" class="flex flex-col gap-4 col-span-2 border rounded-lg">
  <h2 class="text-2xl font-bold mb-0">Race Results</h2>
  {#if data.data}
    <a href={data.data} class="w-fit self-center ml-4 mb-2" target="_blank">
      <Badge variant="default">Detailed breakdown 🔎</Badge>
    </a>
  {/if}
  <Table.Root>
    <Table.Body>
      {#each Object.entries(data.results ?? {}) as [racerId, result], index}
        {@const racer = racerId as RacerName}
        {@const seasonDriver = seasonRacers[season][racer]}
        {@const driver = drivers[racer]}
        {@const hasFastestLap = data.fastestLap?.racerId === racerId}

        {#if driver && seasonDriver}
          {@const pointsDeducted = pointsPenalties[season][track]?.[racer] ?? 0}
          {@const pointsAdded = ["DNF", "DSQ", "-"].includes(result)
            ? 0
            : Number(pointsScheme[season][index] ?? "0") +
              (hasFastestLap ? 1 : 0) -
              pointsDeducted}
          {@const currentTeam =
            seasonDriver.otherTeams?.[track] ?? seasonDriver}

          <Table.Row>
            <Table.Cell class="flex items-center">
              <Badge
                variant="secondary"
                class="w-8 justify-center mr-2 pointer-events-none"
              >
                {index + 1}
              </Badge>
              <span
                class={`hidden! sm:inline-flex! rounded-sm mr-1 fi fi-${driver.countryCode}`}
              ></span>
              <span>{driver.name}</span>
            </Table.Cell>
            <Table.Cell>
              <div class="flex items-center gap-2">
                <img
                  src={carImages[currentTeam.car as ConstructorName].src}
                  alt={currentTeam.car}
                  class="w-6 h-6"
                />
                <span class="hidden sm:block">{currentTeam.team}</span>
              </div>
            </Table.Cell>
            <Table.Cell class="font-bold flex items-center justify-end">
              <div>
                <span>
                  {[".", "lap"].some(
                    (el) => result.toString().includes(el) && index !== 0,
                  )
                    ? "+"
                    : ""}
                </span>
                <span class="mr-1 sm:mr-0">{result}</span>
              </div>
              <Badge
                class={cn(
                  "ml-2 my-1 sm:my-0",
                  { "bg-blue-100 dark:bg-blue-950": hasFastestLap },
                  { "bg-red-100 dark:bg-red-950": pointsDeducted },
                )}
                variant="outline"
              >
                +{pointsAdded}
                {pointsDeducted ? ` (-${pointsDeducted})` : null}
              </Badge>
            </Table.Cell>
          </Table.Row>
        {/if}
      {/each}

      {#if data.fastestLap}
        <Table.Row>
          <Table.Cell
            class="bg-blue-100 dark:bg-blue-950 font-bold rounded-bl-lg"
          >
            <span class="font-bold">Fastest lap</span>
          </Table.Cell>
          <Table.Cell class="bg-blue-100 dark:bg-blue-950 font-bold">
            {drivers[data.fastestLap.racerId].name}
          </Table.Cell>
          <Table.Cell
            class="bg-blue-100 dark:bg-blue-950 text-right font-bold rounded-br-lg"
          >
            {data.fastestLap.time}
          </Table.Cell>
        </Table.Row>
      {/if}
    </Table.Body>
  </Table.Root>
</div>
