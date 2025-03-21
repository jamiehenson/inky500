<script lang="ts">
  import { onMount } from "svelte";
  import { constructorsStandings, tracks } from "@/data";
  import { type SeasonName, type TrackName } from "@/types";
  import Chart, { type ChartConfiguration } from "chart.js/auto";
  import { constructors, drivers, seasonRacers, standings } from "@/data";
  import type { ConstructorName, RacerName } from "@/types";
  import * as Card from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { chartConfig, commonConfig, type ChartType } from "./utils";

  type Props = {
    season: SeasonName;
    track: TrackName;
  };

  const { season, track }: Props = $props();

  let standingsCtx: HTMLCanvasElement;
  let chartInstance: Chart;
  let activeChartType: ChartType = $state("drivers");
  let usePoints = $state(true);

  const seasonStandingKeys = Object.keys(standings[season] ?? {});
  const seasonStandingValues = Object.values(standings[season] ?? {});

  const chartButtons: ChartType[] = ["s4", "s5"].includes(season)
    ? ["drivers", "constructors"]
    : ["drivers"];

  const config: ChartConfiguration<"line", number[], string> = {
    ...commonConfig,
    data: {
      datasets: [],
      labels: seasonStandingKeys
        .slice(0, seasonStandingKeys.indexOf(track) + 1)
        .map((track) => tracks[track as TrackName].name),
    },
  };

  function updateChartData(type: "drivers" | "constructors", points: boolean) {
    activeChartType = type;
    usePoints = points;

    if (chartInstance) {
      const seasonStandingKeys = Object.keys(standings[season] ?? {});
      const seasonStandingValues = Object.values(standings[season] ?? {});

      const driverData = Object.keys(seasonRacers[season])
        .map((driver) => ({
          driver,
          standings: seasonStandingValues
            .slice(0, seasonStandingKeys.indexOf(track) + 1)
            .map((standing) => standing[driver as RacerName]?.points),
          rankings: seasonStandingValues
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
                  .map(
                    (standing) => standing[constructor]?.normalisedPoints ?? 0,
                  ),
                rankings: Object.values(constructorsStandings[season])
                  .slice(0, seasonStandingKeys.indexOf(track) + 1)
                  .map((standing) => {
                    const rank = Object.keys(standing).indexOf(constructor) + 1;
                    return rank === 0 ? -1 : rank;
                  }),
              }))
              .sort((a, b) =>
                constructors[
                  a.constructor as ConstructorName
                ].name.localeCompare(
                  constructors[b.constructor as ConstructorName].name,
                ),
              )
          : [];

      const data = type === "drivers" ? driverData : constructorData;
      chartInstance.data.datasets = data.map((item) => ({
        label:
          type === "drivers" && "driver" in item
            ? drivers[item.driver as RacerName].name
            : constructors[item.constructor as ConstructorName].name,
        data: points ? item.standings : item.rankings,
        borderWidth: 2,
        backgroundColor:
          type === "drivers"
            ? undefined
            : constructors[item.constructor as ConstructorName].teamColor,
        borderColor:
          type === "drivers"
            ? undefined
            : constructors[item.constructor as ConstructorName].teamColor,
      }));

      if (chartInstance.options.scales) {
        chartInstance.options.scales.y = {
          ...chartInstance.options.scales.y,
          min: points ? 0 : 1,
          reverse: !points,
        };
      }

      if (chartInstance.options.plugins) {
        chartInstance.options.plugins.tooltip = {
          ...chartInstance.options.plugins.tooltip,
          itemSort: (a: any, b: any) => {
            return points ? b.raw - a.raw : a.raw - b.raw;
          },
        };
      }

      chartInstance.update();
    }
  }

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

  onMount(() => {
    if (standingsCtx) {
      chartInstance = new Chart(standingsCtx, config);
      updateChartData("drivers", true);
    }
  });
</script>

<div id="progression" class="col-span-2">
  <Card.Root>
    <Card.Header
      class="flex flex-col items-stretch space-y-0 border-b p-0 md:flex-row"
    >
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
        <Card.Title>Progression</Card.Title>
        <Card.Description>
          Showing progression as of {tracks[track].name}
        </Card.Description>
      </div>
      <div class="flex flex-col z-10 mt-4 sm:mt-0 p-2 gap-2 justify-center">
        <Button
          variant="outline"
          onclick={() => updateChartData(activeChartType, true)}
          >Sort by Points</Button
        >
        <Button
          variant="outline"
          onclick={() => updateChartData(activeChartType, false)}
          >Sort by Rank</Button
        >
      </div>
      <div class="flex">
        {#each chartButtons as chart}
          <button
            onclick={() => updateChartData(chart, usePoints)}
            data-active={`${activeChartType === chart}`}
            class="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:last:rounded-tr-lg sm:border-l md:border-t-0 sm:px-8 sm:py-6 transition-colors data-[active=true]:bg-zinc-100 dark:data-[active=true]:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <span class="text-lg text-muted-foreground">
              {chartConfig[chart].label}
            </span>
          </button>
        {/each}
      </div>
    </Card.Header>
    <Card.Content
      class="relative px-2 sm:p-6 sm:pb-0 flex items-start justify-center h-[600px]"
    >
      <canvas
        bind:this={standingsCtx}
        id="standings-chart"
        class="absolute inset-x-0 inset-y-6 sm:inset-6 w-full transition-opacity duration-500 ease-in-out"
      ></canvas>
    </Card.Content>
    <div class="flex justify-center gap-3 p-3">
      <Button onclick={() => toggleAllDatasets(true)} variant="outline"
        >Show All</Button
      >
      <Button onclick={() => toggleAllDatasets(false)} variant="outline"
        >Show None</Button
      >
    </div>
  </Card.Root>
</div>
