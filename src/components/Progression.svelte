<script lang="ts">
  import { constructorsStandings, tracks } from "@/data";
  import { type TrackName } from "@/types";
  import Chart, { type ChartConfiguration } from "chart.js/auto";
  import { constructors, drivers, seasonRacers, standings } from "@/data";
  import type { ConstructorName, RacerName } from "@/types";
  import * as Card from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { commonConfig } from "./utils";
  import { cn } from "@/lib/utils";
  import ResultsTable from "./ResultsTable.svelte";
  import type { ChartType, SortType, ShowType } from "./types";
  import { getStandingsContext } from "./context";
  import * as RadioGroup from "@/components/ui/radio-group";
  import { Label } from "./ui/label";

  let standingsCtx: HTMLCanvasElement;
  let chartInstance: Chart;
  let {
    chartType,
    sortType,
    showType,
    season,
    track,
    setShowType,
    setChartType,
    setSortType,
    netPoints,
  } = getStandingsContext();

  const chart = $derived(chartType());
  const sort = $derived(sortType());
  const show = $derived(showType());
  const useNetPoints = $derived(netPoints());

  const seasonStandingKeys = Object.keys(standings[season] ?? {});

  const config: ChartConfiguration<"line", number[], string> = {
    ...commonConfig,
    data: {
      datasets: [],
      labels: seasonStandingKeys
        .slice(0, seasonStandingKeys.indexOf(track) + 1)
        .map((track) => tracks[track as TrackName].name),
    },
  };

  // Derive data based on current state
  const driverData = $derived(
    Object.keys(seasonRacers[season])
      .map((driver) => ({
        driver,
        standings: Object.values(standings[season] ?? {})
          .slice(0, seasonStandingKeys.indexOf(track) + 1)
          .map((standing) =>
            useNetPoints
              ? (standing[driver as RacerName]?.netPoints ?? 0)
              : (standing[driver as RacerName]?.points ?? 0),
          ),
        rankings: Object.values(standings[season] ?? {})
          .slice(0, seasonStandingKeys.indexOf(track) + 1)
          .map((standing) => {
            // Sort drivers by points and find the position of the current driver
            const sortedDrivers = Object.entries(standing)
              .sort(([, a], [, b]) =>
                useNetPoints
                  ? (b.netPoints ?? 0) - (a.netPoints ?? 0)
                  : (b.points ?? 0) - (a.points ?? 0),
              )
              .map(([driverId]) => driverId);

            const rank = sortedDrivers.indexOf(driver) + 1;
            return rank === 0 ? -1 : rank;
          }),
      }))
      .sort((a, b) =>
        drivers[a.driver as RacerName].name.localeCompare(
          drivers[b.driver as RacerName].name,
        ),
      ),
  );

  const constructorData = $derived(
    Object.keys(constructorsStandings[season]).length > 0
      ? Array.from(
          new Set(
            Object.values(seasonRacers[season]).flatMap((racer) => [
              racer.car,
              ...Object.values(racer.otherTeams ?? {}).map(
                (otherTeam) => otherTeam.car,
              ),
            ]),
          ),
        )
          .map((constructor) => ({
            constructor,
            standings: Object.values(constructorsStandings[season])
              .slice(0, seasonStandingKeys.indexOf(track) + 1)
              .map((standing) =>
                useNetPoints
                  ? (standing[constructor]?.netNormalisedPoints ?? 0)
                  : (standing[constructor]?.normalisedPoints ?? 0),
              ),
            rankings: Object.values(constructorsStandings[season])
              .slice(0, seasonStandingKeys.indexOf(track) + 1)
              .map((standing) => {
                // Sort constructors by points and find the position of the current constructor
                const sortedConstructors = Object.entries(standing)
                  .sort(([, a], [, b]) =>
                    useNetPoints
                      ? (b.netNormalisedPoints ?? 0) -
                        (a.netNormalisedPoints ?? 0)
                      : (b.normalisedPoints ?? 0) - (a.normalisedPoints ?? 0),
                  )
                  .map(([constructorId]) => constructorId);
                const rank = sortedConstructors.indexOf(constructor) + 1;
                return rank === 0 ? -1 : rank;
              }),
          }))
          .sort((a, b) =>
            constructors[a.constructor as ConstructorName].name.localeCompare(
              constructors[b.constructor as ConstructorName].name,
            ),
          )
      : [],
  );

  // Effect to update chart when data changes
  $effect(() => {
    if (!chartInstance) {
      chartInstance = new Chart(standingsCtx, config);
    }

    const data = chart === "drivers" ? driverData : constructorData;

    chartInstance.data.datasets = data.map((item) => ({
      label:
        chart === "drivers" && "driver" in item
          ? drivers[item.driver as RacerName].name
          : constructors[item.constructor as ConstructorName].name,
      data: sort === "points" ? item.standings : item.rankings,
      borderWidth: 2,
      backgroundColor:
        chart === "drivers"
          ? undefined
          : constructors[item.constructor as ConstructorName].teamColor,
      borderColor:
        chart === "drivers"
          ? undefined
          : constructors[item.constructor as ConstructorName].teamColor,
    }));

    if (chartInstance.options.scales) {
      chartInstance.options.scales.y = {
        ...chartInstance.options.scales.y,
        min: sort === "points" ? 0 : 1,
        reverse: sort === "rank",
      };
    }

    if (chartInstance.options.plugins) {
      chartInstance.options.plugins.tooltip = {
        ...chartInstance.options.plugins.tooltip,
        itemSort: (a: any, b: any) => {
          return sort === "points" ? b.raw - a.raw : a.raw - b.raw;
        },
      };
    }

    chartInstance.update();
  });

  function toggleAllDatasets(show: boolean) {
    if (chartInstance) {
      // Update dataset visibility
      chartInstance.data.datasets.forEach((dataset) => {
        dataset.hidden = !show;
      });

      chartInstance.legend?.legendItems?.forEach((_, index) => {
        if (chartInstance.legend) {
          chartInstance.legend.options.display = true;
        }
        chartInstance.setDatasetVisibility(index, show);
      });

      chartInstance.update();
    }
  }
</script>

<div
  id="progression"
  class="col-span-2 max-w-[calc(100vw-1.5rem)] md:max-w-none"
>
  <Card.Root>
    <Card.Header
      class="flex flex-col items-stretch space-y-0 border-b p-0 md:flex-row px-6 py-5 sm:py-6"
    >
      <div class="flex flex-1 flex-col justify-center gap-1">
        <Card.Title>Progression</Card.Title>
        <Card.Description>
          Showing progression as of {tracks[track].name}
          {#if useNetPoints}
            (net points)
          {:else}
            (total points)
          {/if}
        </Card.Description>
      </div>
      <div class="flex items-center gap-6 !mt-3 md:!mt-0">
        <div class="flex flex-col gap-2">
          <div>Show me</div>
          <RadioGroup.Root
            value={chart}
            onValueChange={(value) => {
              setChartType(value as ChartType);
            }}
          >
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="drivers" id="drivers-radio" />
              <Label for="drivers-radio">drivers</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="constructors" id="constructors-radio" />
              <Label for="constructors-radio">constructors</Label>
            </div>
          </RadioGroup.Root>
        </div>
        <div class="flex flex-col gap-2">
          <div>as a</div>
          <RadioGroup.Root
            value={show}
            onValueChange={(value) => {
              setShowType(value as ShowType);
            }}
          >
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="chart" id="chart-radio" />
              <Label for="chart-radio">chart</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="table" id="table-radio" />
              <Label for="table-radio">table</Label>
            </div>
          </RadioGroup.Root>
        </div>
        <div class="flex flex-col gap-2">
          <div>and sort by</div>
          <RadioGroup.Root
            value={sort}
            onValueChange={(value) => {
              setSortType(value as SortType);
            }}
            disabled={show === "table"}
          >
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="points" id="points-radio" />
              <Label for="points-radio">points</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="rank" id="rank-radio" />
              <Label for="rank-radio">rank</Label>
            </div>
          </RadioGroup.Root>
        </div>
      </div>
    </Card.Header>
    <Card.Content>
      <div class={cn("h-[600px]", show === "chart" ? "flex" : "hidden")}>
        <canvas bind:this={standingsCtx} id="standings-chart"></canvas>
      </div>
      {#if show === "table"}
        <ResultsTable />
      {/if}
    </Card.Content>
    <Card.Footer class="flex justify-center gap-3 p-3">
      {#if show === "chart"}
        <Button onclick={() => toggleAllDatasets(true)} variant="outline"
          >Show All</Button
        >
        <Button onclick={() => toggleAllDatasets(false)} variant="outline"
          >Show None</Button
        >
      {/if}
    </Card.Footer>
  </Card.Root>
</div>
