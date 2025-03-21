<script lang="ts">
  import DriversStandings from "@/components/DriversStandings.svelte";
  import ConstructorsStandings from "@/components/ConstructorsStandings.svelte";
  import Progression from "./Progression.svelte";
  import type { SeasonName, TrackName } from "@/types";
  import type { StandingResult } from "@/data/standings";
  import type { RacerResult } from "@/data/results";
  import type { ConstructorResults } from "@/data/constructorsStandings";
  import { FormSwitch } from "./ui/form-switch";
  import { Button } from "./ui/button";

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

  let netPoints = $state(false);
</script>

<FormSwitch
  label="Show net points"
  description="This championship uses net points, which means the worst two results will be dropped."
  checked={netPoints}
  onCheck={(value) => (netPoints = value)}
/>
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
