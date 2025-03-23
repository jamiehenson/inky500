import { pointsPenalties, results, seasonRacers } from "@/data";
import type { SeasonName, TrackName, RacerName } from "@/types";
import { pointslessResults } from "./standings";
import { pointsScheme } from "@/points";

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

    return Object.entries(raceResults.results).reduce(
      (acc, [driverId, result], index) => {
        const dnf = pointslessResults.includes(result);
        if (dnf) return acc;

        const basePoints = pointsScheme[this.season][index] ?? 0;
        const fastestLapPoint =
          raceResults.fastestLap?.racerId === driverId ? 1 : 0;
        const penalties =
          pointsPenalties[this.season][race]?.[driverId as RacerName] ?? 0;

        acc[driverId] = basePoints + fastestLapPoint - penalties;
        return acc;
      },
      {} as Record<string, number>,
    );
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
      // For drivers, continue using regular points
      const currentPositions = new Map(
        Object.entries(currentStandings)
          .sort(([, a], [, b]) => b.points - a.points)
          .map(([id], index) => [id, index + 1]),
      );

      const previousPositions = new Map(
        Object.entries(previousStandings)
          .sort(([, a], [, b]) => b.points - a.points)
          .map(([id], index) => [id, index + 1]),
      );

      Object.keys(currentStandings).forEach((id) => {
        const currentPos = currentPositions.get(id) ?? 0;
        const previousPos = previousPositions.get(id) ?? currentPos;
        currentStandings[id].delta = previousPos - currentPos;
      });

      // Calculate net delta using net points for drivers
      const currentNetPositions = new Map(
        Object.entries(currentStandings)
          .sort(([, a], [, b]) => b.netPoints - a.netPoints)
          .map(([id], index) => [id, index + 1]),
      );

      const previousNetPositions = new Map(
        Object.entries(previousStandings)
          .sort(([, a], [, b]) => b.netPoints - a.netPoints)
          .map(([id], index) => [id, index + 1]),
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
