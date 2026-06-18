<script lang="ts">
  import { flip } from "svelte/animate";
  import { drivers, seasonRacers } from "@/data";
  import type { RacerName, TrackName } from "@/types";
  import { carImages, withBase } from "@/utils";
  import type { StandingResult } from "@/data/standings";
  import type { SeasonRacerClass } from "@/data/seasonRacers";
  import * as GridTable from "@/components/ui/grid-table";
  import { Badge } from "@/components/ui/badge";
  import * as Tooltip from "@/components/ui/tooltip";
  import { Label } from "@/components/ui/label";
  import { Switch } from "@/components/ui/switch";
  import DeltaMarker from "@/components/ui/DeltaMarker.svelte";
  import { getStandingsContext } from "@/components/context";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  type Props = {
    data: Record<string, StandingResult>;
  };

  let { data }: Props = $props();
  let {
    season,
    track,
    setShowType,
    setChartType,
    netPoints,
    classGroup,
    setClassGroup,
  } = getStandingsContext();

  const useNetPoints = $derived(netPoints());

  const classOf = (key: string) =>
    seasonRacers[season][key as RacerName]?.class;

  // Only multiclass seasons (drivers tagged with a class) offer class grouping.
  const hasClasses = Object.values(seasonRacers[season]).some((r) => r?.class);

  const sortByPoints = (entries: [string, StandingResult][]) =>
    [...entries].sort(([, a], [, b]) =>
      useNetPoints
        ? (b.netPoints ?? 0) - (a.netPoints ?? 0)
        : (b.points ?? 0) - (a.points ?? 0),
    );

  // Either a single "all" group, or one group per class (in GT3/GT4/TCX order).
  const groupedData = $derived.by(() => {
    const entries = Object.entries(data) as [string, StandingResult][];
    if (!classGroup() || !hasClasses) {
      return [
        { carClass: "all" as SeasonRacerClass, data: sortByPoints(entries) },
      ];
    }
    const order: SeasonRacerClass[] = ["gt3", "gt4", "tcx"];
    const groups: Record<string, [string, StandingResult][]> = {};
    for (const entry of entries) {
      const cls = classOf(entry[0]) ?? "all";
      (groups[cls] ??= []).push(entry);
    }
    return order
      .filter((cls) => groups[cls]?.length)
      .map((cls) => ({ carClass: cls, data: sortByPoints(groups[cls]) }));
  });
</script>

<div
  id="drivers"
  class="flex flex-col gap-4 col-span-2 lg:col-span-1 border rounded-lg"
>
  <div class="relative">
    {#if hasClasses}
      <div class="absolute top-2 right-2 flex items-center gap-2">
        <Label for="class-group">Class</Label>
        <Switch
          id="class-group"
          checked={classGroup()}
          onCheckedChange={(value) => setClassGroup(value)}
        />
      </div>
    {/if}
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
    {#each groupedData as group (group.carClass)}
      {#if group.carClass !== "all"}
        <p
          class="uppercase rounded bg-accent text-accent-foreground p-2 m-2 text-sm font-bold text-center"
        >
          {group.carClass}
        </p>
      {/if}
      {#each group.data as [key, result], index (key)}
        {@const seasonDriver = seasonRacers[season][key as RacerName]}
        {@const driver = drivers[key as RacerName]}

        <div animate:flip>
          {#if driver && seasonDriver}
            {@const currentTeam =
              seasonDriver.otherTeams?.[track as TrackName] ?? seasonDriver}
            <GridTable.Row
              class="grid grid-cols-[110px_48px_minmax(0,1fr)_48px] sm:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_60px] w-full"
            >
              <GridTable.Cell class="flex items-center order-1">
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
              <GridTable.Cell class="order-3 sm:order-2 gap-2">
                {#if seasonDriver.class && seasonDriver.class !== "all" && !classGroup()}
                  <Badge
                    carClass={seasonDriver.class}
                    class="uppercase pointer-events-none"
                  >
                    {seasonDriver.class}
                  </Badge>
                {/if}
                <a class="hover:underline" href={withBase(`/drivers/${key}`)}
                  >{driver.name}</a
                >
              </GridTable.Cell>
              <GridTable.Cell class="order-2 sm:order-3">
                <div class="flex items-center gap-2">
                  <img
                    src={carImages[currentTeam.car].src}
                    alt={currentTeam.car}
                    class="w-6 h-6"
                  />
                  <span class="hidden sm:block">{currentTeam.team}</span>
                </div>
              </GridTable.Cell>
              <GridTable.Cell class="justify-end order-4">
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
    {/each}
  </div>
</div>
