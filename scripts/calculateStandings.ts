import { pointsPenalties, results, seasonRacers } from "@/data";
import type { SeasonName, TrackName, RacerName } from "@/types";
import { pointslessResults } from "./standings";
import type { RaceResults } from "@/data/results";
import { pointsScheme } from "@/points";
import type { Penalties } from "@/data/penalties";

type GeneratedRaceStandings = {
  [index: string]: number;
};

type GeneratedStandings = {
  [index: string]: GeneratedRaceStandings | null;
};

const standardDriverCount = 2;

export const calculateStandings = (season: SeasonName) => {
  const seasonRaces = Object.keys(results[season]);
  const driverPoints: Record<
    string,
    Record<string, { points: number; netPoints: number; delta: number }>
  > = {};
  const constructorPoints: Record<
    string,
    Record<
      string,
      {
        points: number;
        normalisedPoints: number;
        netPoints: number;
        netNormalisedPoints: number;
        driverCount: number;
        delta: number;
      }
    >
  > = {};

  // Compile initial race scores into standings objects
  const points = seasonRaces.reduce(
    (racesObj: GeneratedStandings, race: string) => {
      const raceResults = (results[season] as RaceResults)[race as TrackName];

      const pts = raceResults?.results
        ? Object.entries(raceResults.results).reduce(
            (
              obj: GeneratedRaceStandings,
              item: [string, string],
              currentIndex
            ) => {
              const dnf = pointslessResults.includes(item[1]);
              const cumulativePoints =
                (pointsScheme[season][currentIndex] ?? 0) +
                (raceResults.fastestLap?.racerId === item[0] ? 1 : 0) -
                ((pointsPenalties as Penalties)[season][race as TrackName]?.[
                  item[0] as RacerName
                ] ?? 0);

              return (obj[item[0]] = dnf ? 0 : cumulativePoints), obj;
            },
            {}
          )
        : null;

      return (racesObj[race] = pts), racesObj;
    },
    {}
  );

  const worstResults: Record<string, Record<string, number>> = {};

  Object.keys(points).forEach((race, raceIndex) => {
    worstResults[race] = {};

    Object.keys(points[race] ?? {}).forEach((driver) => {
      const resultsSoFar = Object.keys(points)
        .slice(0, raceIndex + 1)
        .map((raceKey) => points[raceKey]?.[driver])
        .filter((points) => points !== undefined);

      const worstTwoResults =
        resultsSoFar.length > 2
          ? resultsSoFar
              .toSorted((a, b) => b - a)
              .slice(seasonRaces.length - 3, seasonRaces.length - 1)
              .reduce((a, b) => a + b, 0)
          : 0;

      worstResults[race][driver] = worstTwoResults;
    });
  });

  // Add the points for each driver and team cumulatively, and reorder
  const raceKeys = Object.keys(points) as TrackName[];

  raceKeys.forEach((race, index) => {
    if (points[race] === null) {
      return;
    }

    const racePoints = points[race];
    const previousRacePoints = points[
      raceKeys[index - 1]
    ] as GeneratedRaceStandings;
    const racePointsKeys = Object.keys(racePoints);
    racePointsKeys.forEach((driver) => {
      const seasonRacer = seasonRacers[season][driver as RacerName];
      const car =
        seasonRacer?.otherTeams?.[race]?.car ?? seasonRacer?.car ?? "unknown";
      const addedConstructorPoints =
        (constructorPoints[race]?.[car]?.points ?? 0) + racePoints[driver];

      constructorPoints[race] = {
        ...constructorPoints[race],
        [car]: {
          points: addedConstructorPoints,
          normalisedPoints: addedConstructorPoints,
          netPoints: addedConstructorPoints,
          netNormalisedPoints: addedConstructorPoints,
          driverCount: (constructorPoints[race]?.[car]?.driverCount ?? 0) + 1,
          delta: 0,
        },
      };

      if (index > 0) {
        racePoints[driver] += previousRacePoints[driver] ?? 0;
      }
    });

    // Fill in other drivers in the standings who didn't compete in a given race
    if (index > 0) {
      Object.keys(seasonRacers[season]).forEach((driver) => {
        if (!racePointsKeys.includes(driver)) {
          racePoints[driver] = previousRacePoints[driver];
        }
      });
    }

    if (constructorPoints[race]) {
      Object.entries(constructorPoints[race]).map((constructor) => {
        constructorPoints[race][constructor[0]].normalisedPoints = Math.round(
          constructor[1].points *
            (standardDriverCount / constructor[1].driverCount)
        );
      });

      const cumulativePoints = Object.entries(constructorPoints[race]).map(
        (raceConstructors) => {
          if (index > 0) {
            const worstResultsOffset = Object.entries(
              worstResults[raceKeys[index]]
            )
              .filter((driver) => {
                const seasonRacer =
                  seasonRacers[season][driver[0] as RacerName];
                const car =
                  seasonRacer?.otherTeams?.[raceKeys[index - 1]]?.car ??
                  seasonRacer?.car ??
                  "unknown";
                return car === raceConstructors[0];
              })
              .map((driver) => driver[1])
              .reduce((a, b) => a + b, 0);

            raceConstructors[1].points +=
              constructorPoints[raceKeys[index - 1]][raceConstructors[0]]
                ?.points ?? 0;
            raceConstructors[1].normalisedPoints +=
              constructorPoints[raceKeys[index - 1]][raceConstructors[0]]
                ?.normalisedPoints ?? 0;
            raceConstructors[1].netPoints +=
              (constructorPoints[raceKeys[index - 1]][raceConstructors[0]]
                ?.points ?? 0) - worstResultsOffset;

            raceConstructors[1].netNormalisedPoints = Math.round(
              raceConstructors[1].netPoints *
                (raceConstructors[1].normalisedPoints /
                  raceConstructors[1].points)
            );
          }

          return raceConstructors;
        }
      );

      if (index > 0) {
        const missed = Object.keys(
          constructorPoints[raceKeys[index - 1]]
        ).filter(
          (constructor) =>
            !cumulativePoints.map((a) => a[0]).includes(constructor)
        );

        if (missed.length > 0) {
          missed.forEach((constructor) => {
            cumulativePoints.push([
              constructor,
              constructorPoints[raceKeys[index - 1]][constructor],
            ]);
          });
        }
      }

      constructorPoints[race] = cumulativePoints
        .sort(([, a], [, b]) => b.normalisedPoints - a.normalisedPoints)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    }

    points[race] = Object.entries(racePoints)
      .sort(([, a], [, b]) => b - a)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

    // Calculate deltas for standings
    const driverKeys = Object.entries(points[race])
      .filter((driver) => driver[1] !== undefined)
      .map((driver) => driver[0]);
    const previousDriverKeys = Object.keys(
      index > 0 ? points[raceKeys[index - 1]] ?? {} : driverKeys
    );
    driverKeys.forEach((driver) => {
      const delta =
        previousDriverKeys.indexOf(driver) === -1
          ? driverKeys.length - driverKeys.indexOf(driver)
          : previousDriverKeys.indexOf(driver) - driverKeys.indexOf(driver);

      if (points[race] !== null && points[race][driver] !== undefined) {
        driverPoints[race] = {
          ...driverPoints[race],
          [driver]: {
            points: points[race][driver] ?? 0,
            netPoints: points[race][driver] - (worstResults[race][driver] ?? 0),
            delta: index > 0 ? delta : 0,
          },
        };
      }
    });

    // Calculate deltas for constructors standings
    const constructorKeys = Object.keys(constructorPoints[race]);
    const constructorPreviousKeys = Object.keys(
      index > 0 ? constructorPoints[raceKeys[index - 1]] ?? {} : constructorKeys
    );
    constructorKeys.forEach((constructor) => {
      const delta =
        constructorPreviousKeys.indexOf(constructor) === -1
          ? constructorKeys.length - constructorKeys.indexOf(constructor)
          : constructorPreviousKeys.indexOf(constructor) -
            constructorKeys.indexOf(constructor);

      if (constructorPoints[race] !== null) {
        constructorPoints[race] = {
          ...constructorPoints[race],
          [constructor]: {
            ...constructorPoints[race][constructor],
            delta: index > 0 ? delta : 0,
          },
        };
      }
    });
  });

  return [driverPoints, constructorPoints];
};
