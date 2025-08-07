<script lang="ts">
  import * as Table from "@/components/ui/table";
  import { drivers, seasonRacers, results, standings } from "@/data";
  import { seasonInfo } from "@/data/seasons";
  import { cn } from "@/lib/utils";
  import type { ConstructorName, RacerName } from "@/types";
  import { carImages, resultPositionSuffix } from "@/utils";
  import ArrowUpDown from "@lucide/svelte/icons/arrow-up-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";

  const calculateDriverData = (driver: RacerName) => {
    let fastestLaps = 0;
    const positions = Object.values(results)
      .flatMap((seasonResults) => {
        const raceResults = Object.values(seasonResults);
        return raceResults.map((race) => {
          if (race?.fastestLap?.racerId === driver) {
            fastestLaps++;
          }

          return race === null || race.results === null
            ? -1
            : Object.keys(race.results).indexOf(driver) + 1;
        });
      })
      .filter((position) => position >= 1);

    const averageResult =
      positions.reduce((acc, position) => acc + position, 0) / positions.length;

    return {
      id: driver,
      name: drivers[driver].name,
      teams: Array.from(
        new Set(
          Object.values(seasonRacers)
            .filter((season) => Object.keys(season).length > 0)
            .flatMap((season) => {
              return [
                ...Object.values(season[driver]?.otherTeams ?? {}).map(
                  (otherTeam) => otherTeam.car,
                ),
                season[driver]?.car,
              ];
            }),
        ),
      ).filter((team) => team !== undefined),
      points: Object.values(standings).reduce((acc, seasonStandings) => {
        const seasonStandingEntries = Object.entries(seasonStandings);

        const points =
          Object.keys(seasonStandingEntries).length === 0
            ? 0
            : (seasonStandingEntries[seasonStandingEntries.length - 1][1][
                driver
              ]?.points ?? 0);

        return acc + points;
      }, 0),
      wins: positions.filter((position) => position === 1).length,
      podiums: positions.filter((position) => position <= 3).length,
      fastestLaps,
      bestResult: resultPositionSuffix(positions.sort((a, b) => a - b)[0]),
      averageResult: Number.isNaN(averageResult)
        ? "N/A"
        : resultPositionSuffix(Math.round(averageResult)),
      championships: Object.entries(standings)
        .map((seasonStandings) => {
          const seasonStandingValues = Object.values(seasonStandings[1]);

          const topDriver = Object.entries(
            seasonStandingValues[seasonStandingValues.length - 1],
          ).sort((a, b) =>
            b[1].netPoints && a[1].netPoints
              ? b[1].netPoints - a[1].netPoints
              : b[1].points - a[1].points,
          )[0][0];

          return driver === topDriver ? seasonStandings[0].toUpperCase() : null;
        })
        .filter(
          (season) =>
            season &&
            seasonInfo.find((info) => info.key.toUpperCase() === season)
              ?.status === "complete",
        )
        .join(", "),
    };
  };

  const headers = [
    { id: "name", label: "Name", sortable: true },
    { id: "teams", label: "Teams", sortable: false },
    { id: "championships", label: "Championships", sortable: true },
    { id: "points", label: "Points", sortable: true },
    { id: "wins", label: "Wins", sortable: true },
    { id: "podiums", label: "Podiums", sortable: true },
    { id: "fastestLaps", label: "Fastest Laps", sortable: true },
    { id: "bestResult", label: "Best Result", sortable: true },
    { id: "averageResult", label: "Average Result", sortable: true },
  ];

  const data = Object.keys(drivers)
    .filter((driver) => driver !== "unknown")
    .sort((a, b) => {
      const driverA = drivers[a as RacerName].name;
      const driverB = drivers[b as RacerName].name;

      return driverA.localeCompare(driverB);
    })
    .map((driver) => calculateDriverData(driver as RacerName));

  let sortOrder: Record<string, boolean> = $state({});
  let sortedData = $state([...data]);
  let activeSortColumn: string | null = $state(null);

  function sortTable(columnId: string) {
    const header = headers.find((header) => header.id === columnId);
    if (!header) return;

    // Toggle sort order
    if (activeSortColumn === columnId) {
      sortOrder[columnId] = !sortOrder[columnId];
    } else {
      activeSortColumn = columnId;
      sortOrder[columnId] = false;
    }

    // Sort the data
    sortedData = [...data].sort((a, b) => {
      const aValue = a[header.id as keyof typeof a];
      const bValue = b[header.id as keyof typeof b];

      if (header.id === "bestResult" || header.id === "averageResult") {
        const aValueInt = parseInt(aValue as string);
        const bValueInt = parseInt(bValue as string);

        return sortOrder[columnId]
          ? aValueInt - bValueInt
          : bValueInt - aValueInt;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder[columnId] ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || "");
      const bStr = String(bValue || "");

      return sortOrder[columnId]
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }
</script>

<div class="rounded-lg border">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        {#each headers as header}
          <Table.Head
            onclick={header.sortable ? () => sortTable(header.id) : undefined}
          >
            <div
              class={cn("flex gap-1 items-center", {
                "cursor-pointer select-none": header.sortable,
              })}
            >
              {header.label}
              {#if header.sortable}
                {#if activeSortColumn !== header.id}
                  <ArrowUpDown size="24" />
                {:else if sortOrder[header.id]}
                  <ArrowUp size="24" />
                {:else}
                  <ArrowDown size="24" />
                {/if}
              {/if}
            </div>
          </Table.Head>
        {/each}
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each sortedData as driver}
        <Table.Row>
          {#each headers as header}
            <Table.Cell>
              {#if header.id === "name"}
                <a class="hover:underline" href={`/drivers/${driver.id}`}>
                  {driver.name}
                </a>
              {:else if header.id === "teams"}
                <div class="flex flex-wrap gap-2">
                  {#each driver.teams as team}
                    <img
                      class="w-4 h-4"
                      src={carImages[team as ConstructorName].src}
                      alt={team}
                    />
                  {/each}
                </div>
              {:else}
                {driver[header.id as keyof typeof driver]}
              {/if}
            </Table.Cell>
          {/each}
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
