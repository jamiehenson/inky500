import { results, seasonRacers } from "@/data";
import type { SeasonName, RacerResults, TrackName, RacerName } from "@/types";
import { pointslessResults, pointsScheme } from "./standings";

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
    Record<string, { points: number; delta: number }>
  > = {};
  const constructorPoints: Record<
    string,
    Record<
      string,
      {
        points: number;
        normalisedPoints: number;
        driverCount: number;
        delta: number;
      }
    >
  > = {};

  // Compile initial race scores into standings objects
  const points = seasonRaces.reduce(
    (racesObj: GeneratedStandings, race: string) => {
      const raceResults = (results[season] as RacerResults)[race as TrackName];

      const pts = raceResults
        ? Object.entries(raceResults.results).reduce(
            (
              obj: GeneratedRaceStandings,
              item: [string, string],
              currentIndex
            ) => {
              const dnf = pointslessResults.includes(item[1]);
              const cumulativePoints =
                (pointsScheme[season][currentIndex] ?? 0) +
                (raceResults.fastestLap.racerId === item[0] ? 1 : 0);

              return (obj[item[0]] = dnf ? 0 : cumulativePoints), obj;
            },
            {}
          )
        : null;

      return (racesObj[race] = pts), racesObj;
    },
    {}
  );

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
        seasonRacer?.otherCars?.[race] ?? seasonRacer?.car ?? "unknown";
      const addedConstructorPoints =
        (constructorPoints[race]?.[car]?.points ?? 0) + racePoints[driver];

      constructorPoints[race] = {
        ...constructorPoints[race],
        [car]: {
          points: addedConstructorPoints,
          normalisedPoints: addedConstructorPoints,
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
            raceConstructors[1].points +=
              constructorPoints[raceKeys[index - 1]][
                raceConstructors[0]
              ].points;
            raceConstructors[1].normalisedPoints +=
              constructorPoints[raceKeys[index - 1]][
                raceConstructors[0]
              ].normalisedPoints;
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
    const driverKeys = Object.keys(points[race]);
    const previousDriverKeys = Object.keys(
      index > 0 ? points[raceKeys[index - 1]] ?? {} : driverKeys
    );
    driverKeys.forEach((driver) => {
      const delta =
        previousDriverKeys.indexOf(driver) - driverKeys.indexOf(driver);

      if (points[race] !== null && points[race][driver] !== undefined) {
        driverPoints[race] = {
          ...driverPoints[race],
          [driver]: {
            points: points[race][driver] ?? 0,
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
        constructorPreviousKeys.indexOf(constructor) -
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
