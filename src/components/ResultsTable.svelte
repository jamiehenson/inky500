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
    type SeasonName,
    type TrackName,
    type RacerName,
    type ConstructorName,
  } from "@/types";
  import { type ChartType } from "./Progression.svelte";
  import * as Table from "./ui/table";
  import { Badge } from "./ui/badge";
  import { cn } from "@/lib/utils";
  import { carImages } from "@/utils";

  type Props = {
    season: SeasonName;
    track: TrackName;
    chartType: ChartType;
  };

  type ConstructorResults = Record<
    TrackName,
    Record<ConstructorName, number[]>
  >;

  type ConstructorTotals = Record<TrackName, Record<ConstructorName, number>>;

  const { season, track, chartType }: Props = $props();

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
</script>

<Table.Root class="w-full overflow-x-auto">
  <Table.Header>
    <Table.Row>
      <Table.Head>Pos.</Table.Head>
      <Table.Head
        >{chartType === "drivers" ? "Driver" : "Constructor"}</Table.Head
      >
      {#each Object.entries(results[season] ?? {}) as [track, result]}
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
    {#if chartType === "drivers"}
      {#each Object.keys(standings[season][track] ?? {}) as driver, index}
        <Table.Row>
          <Table.Cell>
            <Badge variant="secondary">{index + 1}</Badge>
          </Table.Cell>
          <Table.Cell>
            {drivers[driver as RacerName].name}
          </Table.Cell>
          {#each Object.values(results[season]) as result}
            {#if result?.results}
              {@const position =
                Object.keys(result?.results ?? {}).indexOf(driver) + 1}
              <Table.Cell class={cn(cellColor(position), "text-center border")}>
                <span class="text-sm font-bold">
                  {position > 0 ? position : ""}
                </span>
              </Table.Cell>
            {/if}
          {/each}
          <Table.Cell class="text-center">
            <span class="text-sm font-bold">
              {standings[season][track][driver as RacerName].points}
            </span>
          </Table.Cell>
        </Table.Row>
      {/each}
    {:else if chartType === "constructors"}
      {#each Object.keys(constructorsStandings[season][track] ?? {}) as constructor, index}
        <Table.Row>
          <Table.Cell>
            <Badge variant="secondary">{index + 1}</Badge>
          </Table.Cell>
          <Table.Cell>
            <div class="flex items-center gap-2">
              <img
                src={carImages[constructor as ConstructorName].src}
                alt={constructor}
                class="w-5 h-5"
              />
              {constructors[constructor as ConstructorName].name}
            </div>
          </Table.Cell>
          {#each Object.keys(results[season]) as track}
            {#if results[season][track as TrackName]?.results}
              {@const position =
                Object.entries(constructorTotals[track as TrackName])
                  .sort((a, b) => a[1] - b[1])
                  .findIndex(([c]) => c === constructor) + 1}
              <Table.Cell class={cn(cellColor(position), "text-center border")}>
                {position > 0 ? position : ""}
              </Table.Cell>
            {/if}
          {/each}
          <Table.Cell class="text-center">
            <span class="text-sm font-bold">
              {constructorsStandings[season][track]?.[
                constructor as ConstructorName
              ]?.normalisedPoints}
            </span>
          </Table.Cell>
        </Table.Row>
      {/each}
    {/if}
  </Table.Body>
</Table.Root>
