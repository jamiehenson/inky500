<script lang="ts">
  import DriversStandings from "@/components/DriversStandings.svelte";
  import ConstructorsStandings from "@/components/ConstructorsStandings.svelte";
  import Progression from "./Progression.svelte";
  import BottomRow from "./BottomRow.svelte";
  import type { SeasonName, TrackName } from "@/types";
  import type { StandingResult } from "@/data/standings";
  import type { RacerResult } from "@/data/results";
  import type { ConstructorResults } from "@/data/constructorsStandings";
  import type { ChartType, ShowType, SortType } from "@/components/types";
  import { setStandingsContext } from "@/components/context";

  type Props = {
    season: SeasonName;
    track: TrackName;
    trackStandings: Record<string, StandingResult>;
    trackConstructors: ConstructorResults;
    trackResults: RacerResult;
  };

  let {
    season,
    track,
    trackStandings,
    trackConstructors,
    trackResults,
  }: Props = $props();

  let chartType = $state<ChartType>("drivers");
  let showType = $state<ShowType>("chart");
  let sortType = $state<SortType>("points");
  let netPoints = $state(["s5"].includes(season));

  setStandingsContext({
    season,
    track,
    netPoints: () => netPoints,
    setNetPoints: (value: boolean) => (netPoints = value),
    showType: () => showType,
    setShowType: (value: ShowType) => (showType = value),
    sortType: () => sortType,
    setSortType: (value: SortType) => (sortType = value),
    chartType: () => chartType,
    setChartType: (value: ChartType) => (chartType = value),
  });
</script>

<BottomRow />
{#if trackStandings}
  <DriversStandings data={trackStandings} />
{/if}
{#if trackConstructors}
  <ConstructorsStandings
    data={trackConstructors}
    trackResults={trackResults?.results ?? {}}
  />
{/if}
<Progression />
