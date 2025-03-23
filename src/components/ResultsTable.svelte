<script lang="ts">
  import {
    tracks,
    standings,
    drivers,
    constructors,
    results,
    constructorsStandings,
    seasonRacers,
  } from "@/data";
  import {
    type TrackName,
    type RacerName,
    type ConstructorName,
  } from "@/types";
  import * as Table from "@/components/ui/table";
  import { Badge } from "@/components/ui/badge";
  import { cn } from "@/lib/utils";
  import { carImages } from "@/utils";
  import { getStandingsContext } from "./context";
  import { pointsScheme } from "@/points";

  type ConstructorResults = Record<
    TrackName,
    Record<ConstructorName, number[]>
  >;

  type ConstructorTotals = Record<TrackName, Record<ConstructorName, number>>;

  const { season, track, chartType, netPoints } = getStandingsContext();

  const useNetPoints = $derived(netPoints());

  const cellColor = (pos: number) => {
    if (pos === 0) return "";
    if (pos === 1) return "bg-amber-300 dark:bg-amber-400";
    if (pos === 2) return "bg-gray-300 dark:bg-gray-400";
    if (pos === 3) return "bg-orange-300 dark:bg-orange-700";
    if (pos <= 10) return "bg-sky-100 dark:bg-sky-300";
    return "bg-green-100 dark:bg-green-300";
  };

  const constructorResults = Object.entries(
    results[season] ?? {},
  ).reduce<ConstructorResults>((acc, [track, result]) => {
    if (result?.results) {
      const resultKeys = Object.keys(result?.results ?? {});
      resultKeys.map((driver) => {
        const driverData = seasonRacers[season][driver as RacerName];
        const driverConstructor: ConstructorName =
          driverData?.otherTeams?.[track as TrackName]?.car ??
          driverData?.car ??
          "unknown";

        acc[track as TrackName] = {
          ...(acc[track as TrackName] ?? {}),
          [driverConstructor]: [
            ...((acc[track as TrackName] ?? {})[driverConstructor] ?? []),
            resultKeys.indexOf(driver) + 1,
          ],
        };
      });
    }
    return acc;
  }, {} as ConstructorResults);

  const constructorTotals = Object.entries(
    constructorResults,
  ).reduce<ConstructorTotals>((acc, [track, constructorResults]) => {
    return {
      ...acc,
      [track as TrackName]: {
        ...Object.entries(constructorResults).reduce<
          Record<ConstructorName, number>
        >(
          (acc, [constructor, positions]) => {
            return {
              ...acc,
              [constructor as ConstructorName]: Math.round(
                positions.reduce((sum, pos) => sum + pos, 0) / positions.length,
              ),
            };
          },
          {} as Record<ConstructorName, number>,
        ),
      },
    };
  }, {} as ConstructorTotals);

  const sortedData = $derived(
    chartType() === "drivers"
      ? Object.entries(standings[season][track] ?? {}).sort(
          (a, b) =>
            (b[1]?.[useNetPoints ? "netPoints" : "points"] ?? 0) -
            (a[1]?.[useNetPoints ? "netPoints" : "points"] ?? 0),
        )
      : Object.entries(constructorsStandings[season][track] ?? {}).sort(
          (a, b) =>
            (b[1]?.[
              useNetPoints ? "netNormalisedPoints" : "normalisedPoints"
            ] ?? 0) -
            (a[1]?.[
              useNetPoints ? "netNormalisedPoints" : "normalisedPoints"
            ] ?? 0),
        ),
  );

  const netConstructorsPoints = (
    resultTrack: TrackName,
    constructor: ConstructorName,
  ) => {
    const field = useNetPoints ? "netNormalisedPoints" : "normalisedPoints";
    const thisRace =
      constructorsStandings[season][resultTrack]?.[constructor]?.[field] ?? 0;

    const lastRaceIndex =
      Object.keys(constructorsStandings[season]).findIndex(
        (c) => c === resultTrack,
      ) - 1;

    const lastRace =
      Object.values(constructorsStandings[season])[lastRaceIndex]?.[
        constructor
      ]?.[field] ?? 0;

    return thisRace - lastRace;
  };

  const raceIndex = $derived(
    Object.keys(results[season] ?? {}).findIndex(
      (resultsTrack) => resultsTrack === track,
    ),
  );

  const scopedResults = Object.entries(results[season]).filter(
    (_, index) => index <= raceIndex,
  );
</script>

<Table.Root class="w-full overflow-x-auto">
  <Table.Header>
    <Table.Row>
      <Table.Head>Pos.</Table.Head>
      <Table.Head
        >{chartType() === "drivers" ? "Driver" : "Constructor"}</Table.Head
      >
      {#each scopedResults as [track, result]}
        {@const trackData = tracks[track as TrackName]}
        {#if result?.results}
          <Table.Head>
            <div class="flex flex-col items-center gap-1 p-2 pt-1">
              <span class="font-bold">{trackData.abbreviation}</span>
              <span class="rounded-sm fi fi-{trackData.countryCode}"></span>
            </div>
          </Table.Head>
        {/if}
      {/each}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each sortedData as [item], index}
      <Table.Row>
        <Table.Cell>
          <Badge variant="secondary">{index + 1}</Badge>
        </Table.Cell>
        <Table.Cell>
          {#if chartType() === "drivers"}
            {drivers[item as RacerName].name}
          {:else}
            <div class="flex items-center gap-2">
              <img
                src={carImages[item as ConstructorName].src}
                alt={item}
                class="w-5 h-5"
              />
              {constructors[item as ConstructorName].name}
            </div>
          {/if}
        </Table.Cell>
        {#each scopedResults as [resultTrack, result]}
          {#if result?.results}
            {@const position =
              chartType() === "drivers"
                ? Object.keys(result?.results ?? {}).indexOf(item) + 1
                : Object.entries(constructorTotals[resultTrack as TrackName])
                    .sort((a, b) => a[1] - b[1])
                    .findIndex(([c]) => c === item) + 1}
            {@const points =
              chartType() === "drivers"
                ? pointsScheme[season][position - 1] +
                  (result.fastestLap?.racerId === (item as RacerName) ? 1 : 0)
                : netConstructorsPoints(
                    resultTrack as TrackName,
                    item as ConstructorName,
                  )}
            {@const deducted =
              useNetPoints &&
              chartType() === "drivers" &&
              standings[season][track]?.[
                item as RacerName
              ]?.deductedRaces?.includes(resultTrack)}
            <Table.Cell
              class={cn(cellColor(position), "text-center border", {
                "bg-red-100 dark:bg-red-300": deducted,
              })}
            >
              <div class="flex flex-col items-center relative">
                <span
                  class={cn("text-sm font-bold", {
                    "select-none": deducted,
                  })}
                >
                  {position > 0 ? `P${position}` : ""}
                </span>
                {#if position > 0}
                  <span
                    class={cn("text-xs", {
                      "select-none": deducted,
                    })}
                  >
                    ({points})
                  </span>
                {/if}
                {#if deducted}
                  <span
                    class="text-5xl absolute top-0 right-0 w-full h-full flex items-center justify-center pt-1"
                    >❌</span
                  >
                {/if}
              </div>
            </Table.Cell>
          {/if}
        {/each}
        <Table.Cell class="text-center">
          <span class="text-sm font-bold">
            {#if chartType() === "drivers"}
              {#if useNetPoints}
                {standings[season][track]?.[item as RacerName]?.netPoints}
              {:else}
                {standings[season][track]?.[item as RacerName]?.points}
              {/if}
            {:else if useNetPoints}
              {constructorsStandings[season][track]?.[item as ConstructorName]
                ?.netNormalisedPoints}
            {:else}
              {constructorsStandings[season][track]?.[item as ConstructorName]
                ?.normalisedPoints}
            {/if}
          </span>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
