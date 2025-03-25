<script lang="ts">
  import DriversStandings from "@/components/DriversStandings.svelte";
  import ConstructorsStandings from "@/components/ConstructorsStandings.svelte";
  import Progression from "./Progression.svelte";
  import type { SeasonName, TrackName } from "@/types";
  import type { StandingResult } from "@/data/standings";
  import type { RacerResult } from "@/data/results";
  import type { ConstructorResults } from "@/data/constructorsStandings";
  import type { ChartType, ShowType, SortType } from "@/components/types";
  import { setStandingsContext } from "@/components/context";
  import { Switch } from "./ui/switch";
  import { Label } from "./ui/label";
  import { Button } from "./ui/button";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";

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

  let chartType = $state<ChartType>("constructors");
  let showType = $state<ShowType>("chart");
  let sortType = $state<SortType>("points");
  let netPoints = $state(true);

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

<div
  class="fixed z-10 bottom-0 right-0 flex items-center space-x-2 p-2 h-10 bg-background rounded-tl-lg"
>
  <Label for="net-points">
    <span class="hidden sm:inline">Net Points</span>
    <span class="inline-block sm:hidden">Net</span>
  </Label>
  <Switch
    id="net-points"
    checked={netPoints}
    onCheckedChange={(value) => {
      netPoints = value;
    }}
  />
</div>
<div
  class="fixed z-10 bottom-0 left-0 flex items-center space-x-2 p-2 h-10 bg-background rounded-tr-lg"
>
  <Button
    variant="secondary"
    size="sm"
    class="h-8"
    onclick={() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }}
  >
    <ChevronUp />
  </Button>
</div>
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
