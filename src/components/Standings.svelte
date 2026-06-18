<script lang="ts">
  import DriversStandings from "@/components/DriversStandings.svelte";
  import ConstructorsStandings from "@/components/ConstructorsStandings.svelte";
  import Progression from "./Progression.svelte";
  import BottomRow from "./BottomRow.svelte";
  import type { SeasonName, TrackName } from "@/types";
  import type { StandingResult } from "@/data/standings";
  import { results, type RacerResult } from "@/data/results";
  import type { ConstructorResults } from "@/data/constructorsStandings";
  import type { ChartType, ShowType, SortType } from "@/components/types";
  import type { SeasonRacerClass } from "@/data/seasonRacers";
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

  // Seasons that use net points (worst-two dropped); only meaningful once a few
  // rounds are in. The multiclass season also groups standings by class.
  const usesNetPoints =
    ["s5", "s6"].includes(season) &&
    Object.keys(results[season]).indexOf(track) >= 2;
  const isMulticlass = ["s6"].includes(season);

  let chartType = $state<ChartType>("drivers");
  let showType = $state<ShowType>("chart");
  let sortType = $state<SortType>("points");
  let netPoints = $state(usesNetPoints);
  let classGroup = $state(isMulticlass);
  let classFilter = $state<SeasonRacerClass>("all");

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
    classGroup: () => classGroup,
    setClassGroup: (value: boolean) => (classGroup = value),
    classFilter: () => classFilter,
    setClassFilter: (value: SeasonRacerClass) => (classFilter = value),
  });
</script>

<BottomRow />
{#if trackStandings}
  <DriversStandings data={trackStandings} />
{/if}
{#if trackConstructors && Object.keys(trackConstructors).length > 0}
  <ConstructorsStandings
    data={trackConstructors}
    trackResults={trackResults?.results ?? {}}
  />
{/if}
<Progression />
