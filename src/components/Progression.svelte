<script lang="ts">
  import { onMount } from "svelte";
  import { constructorsStandings, tracks } from "@/data";
  import { type TrackName } from "@/types";
  import Chart, { type ChartConfiguration } from "chart.js/auto";
  import { constructors, drivers, seasonRacers, standings } from "@/data";
  import type { ConstructorName, RacerName } from "@/types";
  import * as Card from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import * as Select from "@/components/ui/select";
  import { commonConfig } from "./utils";
  import { cn } from "@/lib/utils";
  import ResultsTable from "./ResultsTable.svelte";
  import type { ChartType, SortType, ShowType } from "./types";
  import { getStandingsContext } from "./context";

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
  } = getStandingsContext();

  const chart = $derived(chartType());
  const sort = $derived(sortType());
  const show = $derived(showType());

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
  const driverData = Object.keys(seasonRacers[season])
    .map((driver) => ({
      driver,
      standings: Object.values(standings[season] ?? {})
        .slice(0, seasonStandingKeys.indexOf(track) + 1)
        .map((standing) => standing[driver as RacerName]?.points),
      rankings: Object.values(standings[season] ?? {})
        .slice(0, seasonStandingKeys.indexOf(track) + 1)
        .map((standing) => {
          const rank = Object.keys(standing).indexOf(driver) + 1;
          return rank === 0 ? -1 : rank;
        }),
    }))
    .sort((a, b) =>
      drivers[a.driver as RacerName].name.localeCompare(
        drivers[b.driver as RacerName].name,
      ),
    );

  const constructorData =
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
              .map((standing) => standing[constructor]?.normalisedPoints ?? 0),
            rankings: Object.values(constructorsStandings[season])
              .slice(0, seasonStandingKeys.indexOf(track) + 1)
              .map((standing) => {
                const rank = Object.keys(standing).indexOf(constructor) + 1;
                return rank === 0 ? -1 : rank;
              }),
          }))
          .sort((a, b) =>
            constructors[a.constructor as ConstructorName].name.localeCompare(
              constructors[b.constructor as ConstructorName].name,
            ),
          )
      : [];

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
        </Card.Description>
      </div>
      <div class="flex items-center gap-4 !mt-3 md:!mt-0">
        <div class="flex flex-col gap-2">
          <div>Show me</div>
          <Select.Root
            type="single"
            value={chartType()}
            onValueChange={(value) => {
              setChartType(value as ChartType);
            }}
          >
            <Select.Trigger class="w-36">{chartType()}</Select.Trigger>
            <Select.Content>
              <Select.Item value="drivers">drivers</Select.Item>
              {#if ["s4", "s5"].includes(season)}
                <Select.Item value="constructors">constructors</Select.Item>
              {/if}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="flex flex-col gap-2">
          <div>as a</div>
          <Select.Root
            type="single"
            value={showType()}
            onValueChange={(value) => {
              setShowType(value as ShowType);
            }}
          >
            <Select.Trigger class="w-36">{showType()}</Select.Trigger>
            <Select.Content>
              <Select.Item value="chart">chart</Select.Item>
              <Select.Item value="table">table</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="flex flex-col gap-2">
          <div>and sort by</div>
          <Select.Root
            type="single"
            value={sortType()}
            onValueChange={(value) => {
              setSortType(value as SortType);
            }}
            disabled={showType() === "table"}
          >
            <Select.Trigger class="w-36"
              >{showType() === "chart" ? sortType() : "n/a"}</Select.Trigger
            >
            <Select.Content>
              <Select.Item value="points">points</Select.Item>
              <Select.Item value="rank">rank</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    </Card.Header>
    <Card.Content>
      <div class={cn("h-[600px]", showType() === "chart" ? "flex" : "hidden")}>
        <canvas bind:this={standingsCtx} id="standings-chart"></canvas>
      </div>
      {#if showType() === "table"}
        <ResultsTable />
      {/if}
    </Card.Content>
    <Card.Footer class="flex justify-center gap-3 p-3">
      {#if showType() === "chart"}
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
