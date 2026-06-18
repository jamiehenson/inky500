import { pointsPenalties, results, seasonRacers } from "@/data";
import type { SeasonName, TrackName, RacerName } from "@/types";
import { calcRacePoints } from "@/racePoints";
import { doublePointsTracks } from "@/points";

type BaseStanding = {
  points: number;
  netPoints: number;
  delta: number;
  netDelta: number;
};

type DriverStanding = BaseStanding & {
  deductedRaces: string[];
};

type ConstructorStanding = BaseStanding & {
  normalisedPoints: number;
  netNormalisedPoints: number;
  driverCount: number;
};

type Standings = Record<
  string,
  Record<string, DriverStanding | ConstructorStanding>
>;

class StandingsCalculator {
  private readonly standardDriverCount = 2;
  private points: Record<string, Record<string, number>> = {};
  private worstResults: Record<
    string,
    Record<string, { races: string[]; points: number }>
  > = {};

  constructor(
    private season: SeasonName,
    private races: string[],
  ) {}

  private getDriverCar(driver: RacerName, race: TrackName): string {
    const seasonRacer = seasonRacers[this.season][driver];
    return (
      seasonRacer?.otherTeams?.[race]?.car ?? seasonRacer?.car ?? "unknown"
    );
  }

  private calculateRacePoints(race: TrackName): Record<string, number> {
    const raceResults = results[this.season][race];
    if (!raceResults?.results) return {};

    const classOf = (id: string) =>
      seasonRacers[this.season][id as RacerName]?.class;

    // Multiclass seasons store per-class fastest laps; single-class seasons fall
    // back to the one overall fastest lap (bucketed under its driver's class or "all").
    const fl = raceResults.fastestLap;
    const classFastestLaps =
      raceResults.classFastestLaps ??
      (fl ? { [classOf(fl.racerId) ?? "all"]: fl.racerId } : {});

    const multiplier = (doublePointsTracks[this.season] ?? []).includes(race)
      ? 2
      : 1;

    return calcRacePoints({
      season: this.season,
      orderedResults: Object.entries(raceResults.results) as [string, string][],
      classOf,
      classFastestLaps,
      penalties: pointsPenalties[this.season][race] as
        | Record<string, number>
        | undefined,
      multiplier,
    });
  }

  private calculateWorstResults() {
    // Track worst results per driver up to each race
    this.races.forEach((race, raceIndex) => {
      this.worstResults[race] = {};

      Object.keys(seasonRacers[this.season] ?? {}).forEach((driver) => {
        // Get all race results up to this point
        const raceResults = this.races
          .slice(0, raceIndex + 1)
          .map((raceKey) => ({
            race: raceKey,
            // Get the non-cumulative points for this specific race
            points:
              (this.calculateRacePoints(raceKey as TrackName) ?? {})[driver] ??
              0,
          }))
          .sort((a, b) => a.points - b.points); // Sort ascending to get worst results first

        // Take the two worst results
        const worstTwo = raceResults.slice(0, 2);

        this.worstResults[race][driver] = {
          races: worstTwo.map((r) => r.race),
          points: worstTwo.reduce((sum, r) => sum + r.points, 0),
        };
      });
    });
  }

  private getAllSeasonDrivers(): string[] {
    return Object.keys(seasonRacers[this.season] ?? {});
  }

  private fillMissingDriverPoints(race: string, index: number) {
    const allDrivers = this.getAllSeasonDrivers();

    allDrivers.forEach((driver) => {
      // If driver didn't race, set their points to 0 for this race
      if (!this.points[race][driver]) {
        this.points[race][driver] = 0;
      }
    });
  }

  private calculateDriverStandings(): Record<
    string,
    Record<string, DriverStanding>
  > {
    const standings: Record<string, Record<string, DriverStanding>> = {};
    const allDrivers = this.getAllSeasonDrivers();

    this.races.forEach((race, index) => {
      if (!this.points[race]) return;

      standings[race] = {};
      const currentPoints = this.points[race];
      const previousStandings =
        index > 0 ? standings[this.races[index - 1]] : null;

      allDrivers.forEach((driver) => {
        const points = currentPoints[driver] ?? 0;
        // Subtract the worst two results for this driver up to this race
        const netPoints =
          points - (this.worstResults[race][driver]?.points ?? 0);

        standings[race][driver] = {
          points,
          netPoints,
          delta: 0,
          netDelta: 0,
          deductedRaces: this.worstResults[race][driver]?.races ?? [],
        };
      });

      this.updatePositionDeltas(standings[race], previousStandings);
    });

    return standings;
  }

  private calculateConstructorStandings(): Record<
    string,
    Record<string, ConstructorStanding>
  > {
    const standings: Record<string, Record<string, ConstructorStanding>> = {};

    this.races.forEach((race, index) => {
      if (!this.points[race]) return;

      standings[race] = {};
      const previousStandings =
        index > 0 ? standings[this.races[index - 1]] : null;
      const raceResults =
        results[this.season][race as TrackName]?.results ?? {};

      // Get all constructors
      const allConstructors = new Set<string>();
      this.getAllSeasonDrivers().forEach((driver) => {
        allConstructors.add(
          this.getDriverCar(driver as RacerName, race as TrackName),
        );
      });

      // Calculate points for this specific race
      const raceConstructorPoints: Record<
        string,
        {
          racePoints: number;
          driverCount: number;
          drivers: string[];
        }
      > = {};

      // Count participating drivers and calculate points
      Object.keys(raceResults).forEach((driver) => {
        const car = this.getDriverCar(driver as RacerName, race as TrackName);
        if (!raceConstructorPoints[car]) {
          raceConstructorPoints[car] = {
            racePoints: 0,
            driverCount: 0,
            drivers: [],
          };
        }
        raceConstructorPoints[car].driverCount += 1;
        raceConstructorPoints[car].drivers.push(driver);
      });

      // Add points for scoring finishes
      const singleRacePoints =
        this.calculateRacePoints(race as TrackName) ?? {};
      Object.entries(singleRacePoints).forEach(([driver, points]) => {
        const car = this.getDriverCar(driver as RacerName, race as TrackName);
        raceConstructorPoints[car].racePoints += points;
      });

      // Calculate standings for each constructor
      allConstructors.forEach((car) => {
        const currentRaceData = raceConstructorPoints[car];

        if (!currentRaceData || currentRaceData.driverCount === 0) {
          // Constructor didn't participate, carry forward previous standings
          if (previousStandings?.[car]) {
            standings[race][car] = { ...previousStandings[car] };
          }
          return;
        }

        // Calculate normalized points for this race
        const normalizationFactor =
          this.standardDriverCount / currentRaceData.driverCount;
        const raceNormalizedPoints = Math.round(
          currentRaceData.racePoints * normalizationFactor,
        );

        // Get previous standings or start at 0
        const previousPoints = previousStandings?.[car]?.points ?? 0;
        const previousNormalizedPoints =
          previousStandings?.[car]?.normalisedPoints ?? 0;

        // Calculate cumulative totals
        const totalPoints = previousPoints + currentRaceData.racePoints;
        const totalNormalizedPoints =
          previousNormalizedPoints + raceNormalizedPoints;

        // Find two worst results up to this point, including non-participation (0 points)
        const constructorResults = this.races
          .slice(0, index + 1)
          .map((raceKey) => {
            const raceData = results[this.season][raceKey as TrackName];

            // If no results or no participation, count as 0 points
            if (!raceData?.results)
              return { points: 0, normalized: 0, race: raceKey };

            const drivers = Object.keys(raceData.results).filter(
              (d) =>
                this.getDriverCar(d as RacerName, raceKey as TrackName) === car,
            );

            // No participation counts as 0 points
            if (drivers.length === 0)
              return { points: 0, normalized: 0, race: raceKey };

            // Calculate points excluding drivers with penalties
            const racePoints = drivers.reduce((sum, d) => {
              // Skip this driver's points if they have a penalty
              if (
                pointsPenalties[this.season][raceKey as TrackName]?.[
                  d as RacerName
                ] !== undefined
              ) {
                return sum;
              }
              return (
                sum + (this.calculateRacePoints(raceKey as TrackName)?.[d] ?? 0)
              );
            }, 0);

            // Only count drivers without penalties for normalization
            const driversWithoutPenalties = drivers.filter(
              (d) =>
                pointsPenalties[this.season][raceKey as TrackName]?.[
                  d as RacerName
                ] === undefined,
            );

            // Calculate normalization based on drivers without penalties
            const effectiveDriverCount =
              driversWithoutPenalties.length || drivers.length;
            const normalizationFactor =
              this.standardDriverCount / effectiveDriverCount;
            const normalizedPoints = Math.round(
              racePoints * normalizationFactor,
            );

            return {
              points: racePoints,
              normalized: normalizedPoints,
              race: raceKey,
            };
          });

        // Get two worst results by normalized points
        const worstNormalizedResults = [...constructorResults]
          .sort((a, b) => a.normalized - b.normalized)
          .slice(0, 2);

        const worstResultsPoints = [...constructorResults]
          .sort((a, b) => a.points - b.points)
          .slice(0, 2)
          .reduce((sum, r) => sum + r.points, 0);

        const worstResultsNormalized = worstNormalizedResults.reduce(
          (sum, r) => sum + r.normalized,
          0,
        );

        standings[race][car] = {
          points: totalPoints,
          normalisedPoints: totalNormalizedPoints,
          netPoints: totalPoints - worstResultsPoints,
          netNormalisedPoints: totalNormalizedPoints - worstResultsNormalized,
          driverCount: currentRaceData.driverCount,
          delta: 0,
          netDelta: 0,
        };
      });

      this.updatePositionDeltas(standings[race], previousStandings);
    });

    return standings;
  }

  // Rank drivers within their class (or a single "all" bucket for single-class
  // seasons) by the given metric, returning a 1-based position per driver.
  private rankByClass(
    standings: Record<string, BaseStanding>,
    metric: "points" | "netPoints",
  ): Map<string, number> {
    const byClass: Record<string, string[]> = {};
    Object.keys(standings).forEach((id) => {
      const cls = seasonRacers[this.season][id as RacerName]?.class ?? "all";
      (byClass[cls] ??= []).push(id);
    });

    const positions = new Map<string, number>();
    Object.values(byClass).forEach((ids) => {
      ids
        .sort(
          (a, b) => (standings[b][metric] ?? 0) - (standings[a][metric] ?? 0),
        )
        .forEach((id, index) => positions.set(id, index + 1));
    });
    return positions;
  }

  private updatePositionDeltas<T extends BaseStanding | ConstructorStanding>(
    currentStandings: Record<string, T>,
    previousStandings: Record<string, T> | null,
  ) {
    // For the first race, all deltas should be 0
    if (!previousStandings) {
      Object.values(currentStandings).forEach((standing) => {
        standing.delta = 0;
        standing.netDelta = 0;
      });
      return;
    }

    if (this.isConstructorStanding(currentStandings)) {
      // TypeScript now knows this is Record<string, ConstructorStanding>
      const currentPositions = new Map(
        Object.entries(currentStandings)
          .sort(([, a], [, b]) => b.normalisedPoints - a.normalisedPoints)
          .map(([id], index) => [id, index + 1]),
      );

      const previousPositions = new Map(
        Object.entries(previousStandings as Record<string, ConstructorStanding>)
          .sort(([, a], [, b]) => b.normalisedPoints - a.normalisedPoints)
          .map(([id], index) => [id, index + 1]),
      );

      // Calculate regular delta using normalised points
      Object.keys(currentStandings).forEach((id) => {
        const currentPos = currentPositions.get(id) ?? 0;
        const previousPos = previousPositions.get(id) ?? currentPos;
        currentStandings[id].delta = previousPos - currentPos;
      });

      // Calculate net delta using net normalised points
      const currentNetPositions = new Map(
        Object.entries(currentStandings)
          .sort(([, a], [, b]) => b.netNormalisedPoints - a.netNormalisedPoints)
          .map(([id], index) => [id, index + 1]),
      );

      const previousNetPositions = new Map(
        Object.entries(previousStandings as Record<string, ConstructorStanding>)
          .sort(([, a], [, b]) => b.netNormalisedPoints - a.netNormalisedPoints)
          .map(([id], index) => [id, index + 1]),
      );

      Object.keys(currentStandings).forEach((id) => {
        const currentPos = currentNetPositions.get(id) ?? 0;
        const previousPos = previousNetPositions.get(id) ?? currentPos;
        currentStandings[id].netDelta = previousPos - currentPos;
      });
    } else {
      // Drivers are ranked within their class, so position deltas reflect
      // movement in the class championship (a leader who stays top of their
      // class shows no change, even if passed on overall points). Single-class
      // seasons collapse to one "all" bucket, i.e. overall ranking as before.
      const currentPositions = this.rankByClass(currentStandings, "points");
      const previousPositions = this.rankByClass(previousStandings, "points");

      Object.keys(currentStandings).forEach((id) => {
        const currentPos = currentPositions.get(id) ?? 0;
        const previousPos = previousPositions.get(id) ?? currentPos;
        currentStandings[id].delta = previousPos - currentPos;
      });

      // Calculate net delta using net points for drivers
      const currentNetPositions = this.rankByClass(
        currentStandings,
        "netPoints",
      );
      const previousNetPositions = this.rankByClass(
        previousStandings,
        "netPoints",
      );

      Object.keys(currentStandings).forEach((id) => {
        const currentPos = currentNetPositions.get(id) ?? 0;
        const previousPos = previousNetPositions.get(id) ?? currentPos;
        currentStandings[id].netDelta = previousPos - currentPos;
      });
    }
  }

  // Type guard to check if we're dealing with constructor standings
  private isConstructorStanding(
    standings: Record<string, BaseStanding | ConstructorStanding>,
  ): standings is Record<string, ConstructorStanding> {
    const firstStanding = Object.values(standings)[0];
    return "normalisedPoints" in firstStanding;
  }

  public calculate(): [
    Record<string, Record<string, DriverStanding>>,
    Record<string, Record<string, ConstructorStanding>>,
  ] {
    // Calculate initial race points
    this.races.forEach((race, index) => {
      this.points[race] = this.calculateRacePoints(race as TrackName) ?? {};
      this.fillMissingDriverPoints(race, index);
    });

    // Calculate cumulative points
    this.races.forEach((race, index) => {
      if (index === 0) return;

      const allDrivers = this.getAllSeasonDrivers();
      const previousRace = this.races[index - 1];

      allDrivers.forEach((driver) => {
        // Add previous race points to current race points (which may be 0 if they didn't race)
        this.points[race][driver] += this.points[previousRace][driver] ?? 0;
      });
    });

    this.calculateWorstResults();

    return [
      this.calculateDriverStandings(),
      this.calculateConstructorStandings(),
    ];
  }
}

export const calculateStandings = (season: SeasonName) => {
  const completedRaces = Object.entries(results[season])
    .filter(([, raceData]) => raceData?.results !== null)
    .map(([race]) => race);

  const calculator = new StandingsCalculator(season, completedRaces);
  return calculator.calculate();
};
