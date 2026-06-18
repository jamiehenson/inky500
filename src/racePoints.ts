import { pointsScheme } from "@/points";
import type { SeasonName } from "@/types";

// Results that score no points and are excluded from the championship.
export const pointlessResults = ["DNF", "DSQ", "-"];

// A "bucket" is a class key (gt3 / gt4 / tcx) for multiclass seasons, or the
// implicit "all" bucket for single-class seasons (s1–s5). Points are awarded by
// finishing position WITHIN a bucket, so each class runs its own championship.
export type RacePointsArgs = {
  season: SeasonName;
  /** [racerId, gapString] in finishing-classification order. */
  orderedResults: [string, string][];
  /** Class of a racer, or undefined for single-class seasons. */
  classOf: (racerId: string) => string | undefined;
  /** bucket -> racerId who set the fastest lap in that bucket. */
  classFastestLaps?: Partial<Record<string, string>>;
  /** racerId -> points deduction. */
  penalties?: Partial<Record<string, number>>;
  /** Points multiplier for the race (e.g. 2 for double-points endurance rounds). */
  multiplier?: number;
};

/**
 * Points scored by each racer in a single race, class-aware.
 *
 * For single-class seasons every racer falls into the "all" bucket, so the
 * per-bucket counter equals the overall finishing index — identical to the
 * previous overall-only behaviour. A pointless result (DNF/DSQ) scores 0 but
 * still consumes its grid slot, matching the existing house convention (and
 * harmless because retirees are classified last).
 */
export const calcRacePoints = ({
  season,
  orderedResults,
  classOf,
  classFastestLaps,
  penalties,
  multiplier = 1,
}: RacePointsArgs): Record<string, number> => {
  const counters: Record<string, number> = {};
  const out: Record<string, number> = {};

  for (const [racerId, result] of orderedResults) {
    const bucket = classOf(racerId) ?? "all";
    const index = counters[bucket] ?? 0;
    counters[bucket] = index + 1;

    if (pointlessResults.includes(result)) {
      out[racerId] = 0;
      continue;
    }

    const basePoints = pointsScheme[season][index] ?? 0;
    const fastestLapPoint = classFastestLaps?.[bucket] === racerId ? 1 : 0;
    const deduction = penalties?.[racerId] ?? 0;

    out[racerId] = (basePoints + fastestLapPoint) * multiplier - deduction;
  }

  return out;
};
