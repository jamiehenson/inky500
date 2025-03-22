<script lang="ts">
  import { seasonRacers, drivers, constructors, results } from "@/data";
  import { type ConstructorName, type RacerName } from "@/types";
  import { carImages } from "@/utils";
  import * as Table from "@/components/ui/table";
  import { Badge } from "@/components/ui/badge";
  import DeltaMarker from "./ui/DeltaMarker.svelte";
  import type { ConstructorResults } from "@/data/constructorsStandings";
  import { getStandingsContext } from "@/components/context";

  type Props = {
    data: ConstructorResults;
    trackResults: Record<string, string>;
  };

  let { data, trackResults }: Props = $props();
  const { season, track, setShowType, setChartType } = getStandingsContext();
</script>

<div
  id="constructors"
  class="flex flex-col gap-4 col-span-2 lg:col-span-1 border rounded-lg"
>
  <h2 class="text-2xl font-bold">Constructors' Standings</h2>
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
      Go to progression chart 📈
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
      Go to overview table 🥇
    </Badge>
  </div>
  <Table.Root>
    <Table.Body>
      {#each Object.entries(data) as [constructorName, result], index}
        {@const constructor = constructors[constructorName as ConstructorName]}
        {@const constructorDrivers = Object.entries(seasonRacers[season])
          .filter((racer) =>
            racer[1].otherTeams?.[track]
              ? racer[1].otherTeams[track].car === constructorName
              : racer[1].car === constructorName,
          )
          .map((racer) => [racer[0], drivers[racer[0] as RacerName].name])
          .toSorted((a, b) => a[1].localeCompare(b[1]))}

        {#if constructor && constructorDrivers.length > 0 && typeof result !== "string"}
          <Table.Row>
            <Table.Cell>
              <div class="flex items-center">
                <Badge
                  variant="secondary"
                  class="w-8 justify-center mr-2 pointer-events-none"
                >
                  {index + 1}
                </Badge>
                <DeltaMarker delta={result.delta} />
              </div>
            </Table.Cell>
            <Table.Cell>
              <div class="flex items-center gap-2">
                <img
                  src={carImages[constructorName as ConstructorName].src}
                  alt={constructorName}
                  class="w-6 h-6"
                />
                <span class="hidden sm:block">{constructor.name}</span>
              </div>
            </Table.Cell>
            <Table.Cell>
              {#each constructorDrivers as driver}
                <p
                  class={Object.keys(trackResults ?? {}).includes(driver[0])
                    ? ""
                    : "font-extralight text-zinc-400"}
                >
                  {driver[1]}
                </p>
              {/each}
            </Table.Cell>
            <Table.Cell class="font-bold text-right">
              <span class="font-bold">{result.normalisedPoints}</span>{" "}
              {#if Object.keys(results).indexOf(track) >= Object.keys(results).length - 3 && result.netNormalisedPoints}
                <span class="font-light text-xs">
                  ({result.netNormalisedPoints})
                </span>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/if}
      {/each}
    </Table.Body>
  </Table.Root>
</div>
