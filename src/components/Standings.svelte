<script lang="ts">
  import DriversStandings from "@/components/DriversStandings.svelte";
  import ConstructorsStandings from "@/components/ConstructorsStandings.svelte";
  import ProgressionChart from "./ProgressionChart.svelte";
  import Results from "./Results.svelte";
  import type { SeasonName, TrackName } from "@/types";
  import type { StandingResult } from "@/data/standings";
  import type { RacerResult } from "@/data/results";
  import type { ConstructorResults } from "@/data/constructorsStandings";

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
</script>

<Results {season} {track} data={trackResults} link={trackResults.data} />
{#if trackStandings}
  <DriversStandings {season} {track} data={trackStandings} />
{/if}
{#if trackConstructors}
  <ConstructorsStandings
    {season}
    {track}
    data={trackConstructors}
    trackResults={trackResults?.results ?? {}}
  />
{/if}
<ProgressionChart {season} {track} />
