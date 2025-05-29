<script lang="ts">
  import { flip } from "svelte/animate";
  import { seasonRacers, drivers, constructors, tracks, results } from "@/data";
  import {
    type TrackName,
    type ConstructorName,
    type RacerName,
  } from "@/types";
  import { carImages } from "@/utils";
  import * as GridTable from "@/components/ui/grid-table";
  import { Badge } from "@/components/ui/badge";
  import DeltaMarker from "./ui/DeltaMarker.svelte";
  import type { ConstructorResults } from "@/data/constructorsStandings";
  import { getStandingsContext } from "@/components/context";
  import * as Tooltip from "@/components/ui/tooltip";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  import { cn } from "@/lib/utils";

  type Props = {
    data: ConstructorResults;
    trackResults: Record<string, string>;
  };

  let { data, trackResults }: Props = $props();
  const { season, track, setShowType, setChartType, netPoints } =
    getStandingsContext();

  const useNetPoints = $derived(netPoints());
  const sortedData = $derived(
    Object.entries(data).sort(([, a], [, b]) => {
      return useNetPoints
        ? (b.netNormalisedPoints ?? 0) - (a.netNormalisedPoints ?? 0)
        : (b.normalisedPoints ?? 0) - (a.normalisedPoints ?? 0);
    }),
  );

  const seasonKeys = Object.keys(results[season]);
  const completedRaces = seasonKeys.filter(
    (seasonTrack) =>
      seasonKeys.indexOf(seasonTrack) <= seasonKeys.indexOf(track),
  );

  const eligibleOtherTeams = (driver: RacerName) => {
    const formerTeams = Object.entries(
      seasonRacers[season][driver]?.otherTeams ?? {},
    ).filter(([seasonTrack]) => completedRaces.includes(seasonTrack));

    if (formerTeams.some((formerTeam) => formerTeam[0] === track)) {
      return [];
    }

    return formerTeams;
  };
</script>

<div
  id="constructors"
  class="flex flex-col gap-4 col-span-2 lg:col-span-1 border rounded-lg"
>
  <div>
    <h2 class="text-2xl font-bold">Constructors' Standings</h2>
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
                Net normalised constructor points are calculated by deducting
                the two lowest collective team results from the total points
                each race, normalised to two drivers per team.
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
        setChartType("constructors");
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
        setChartType("constructors");
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
    {#each sortedData as [constructorName, result], index (constructorName)}
      {@const constructor = constructors[constructorName as ConstructorName]}
      {@const constructorDrivers = Object.entries(seasonRacers[season])
        .filter((racer) =>
          racer[1].otherTeams?.[track]
            ? racer[1].otherTeams[track].car === constructorName
            : racer[1].car === constructorName,
        )
        .map((racer) => [racer[0], drivers[racer[0] as RacerName].name])
        .toSorted((a, b) => a[1].localeCompare(b[1]))}

      <div animate:flip>
        {#if constructor && constructorDrivers.length > 0 && typeof result !== "string"}
          <GridTable.Row
            class="grid grid-cols-[110px_48px_minmax(0,1fr)_48px] sm:grid-cols-[140px_140px_minmax(0,1fr)_60px] w-full"
          >
            <GridTable.Cell class="flex items-center">
              <div class="flex items-center">
                <Badge
                  variant="secondary"
                  class="w-8 justify-center mr-2 pointer-events-none"
                >
                  {index + 1}
                </Badge>
                <DeltaMarker
                  delta={useNetPoints ? result.netDelta : result.delta}
                />
              </div>
            </GridTable.Cell>
            <GridTable.Cell>
              <div class="flex items-center gap-2">
                <img
                  src={carImages[constructorName as ConstructorName].src}
                  alt={constructorName}
                  class="w-6 h-6"
                />
                <span class="hidden md:block">{constructor.name}</span>
              </div>
            </GridTable.Cell>
            <GridTable.Cell class="flex-col items-start">
              {#each constructorDrivers as driver}
                <p
                  class={cn(
                    Object.keys(trackResults ?? {}).includes(driver[0])
                      ? ""
                      : "font-extralight text-zinc-400",
                    "flex gap-1",
                  )}
                >
                  {driver[1]}
                  {#if eligibleOtherTeams(driver[0] as RacerName).length > 0}
                    <Tooltip.Provider delayDuration={100}>
                      <Tooltip.Root>
                        <Tooltip.Trigger>
                          <CircleHelp size={16} />
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          <div class="flex flex-col gap-2">
                            <strong>Formerly with:</strong>
                            <ul class="flex flex-col gap-2">
                              {#each eligibleOtherTeams(driver[0] as RacerName) as [track, otherTeam]}
                                <li
                                  class="flex justify-between gap-4 items-center"
                                >
                                  <span>
                                    {tracks[track as TrackName].name}
                                  </span>
                                  <span>
                                    <img
                                      src={carImages[
                                        otherTeam.car as ConstructorName
                                      ].src}
                                      alt={otherTeam.car}
                                      class="w-6 h-6"
                                    />
                                  </span>
                                </li>
                              {/each}
                            </ul>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  {/if}
                </p>
              {/each}
            </GridTable.Cell>
            <GridTable.Cell class="justify-end">
              <span class="font-bold">
                {#if netPoints()}
                  {result.netNormalisedPoints}
                {:else}
                  {result.normalisedPoints}
                {/if}
              </span>
            </GridTable.Cell>
          </GridTable.Row>
        {/if}
      </div>
    {/each}
  </div>
</div>
