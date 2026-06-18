import driversData from "@/data/drivers/drivers.json";
import type { RacerName } from "@/types";

// carGroup mislabels the BMW M2 CS Racing (TCX, carModel 27) as "GT3", so TCX
// must be detected by carModel; GT4's carGroup is reliable.
export const classOfCar = (carModel: number, carGroup: string): "gt3" | "gt4" | "tcx" =>
  carModel === 27 ? "tcx" : carGroup === "GT4" ? "gt4" : "gt3";

const playerIdToKey: Record<string, string> = {};
for (const [key, driver] of Object.entries(driversData as Record<string, { playerId?: string }>)) {
  if (driver.playerId) playerIdToKey[driver.playerId] = key;
}

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const months = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  const day = date.getUTCDate();
  const ordinal = (n: number) => {
    const v = n % 100;
    return ["th", "st", "nd", "rd"][(v - 20) % 10] || ["th", "st", "nd", "rd"][v] || "th";
  };
  return `${months[date.getUTCMonth()]} ${day}${ordinal(day)}, ${date.getUTCFullYear()}`;
};

// Leader / total race time: minutes can exceed 59 (e.g. Spa), so no minute padding.
const formatRaceTime = (ms: number) =>
  `${Math.floor(ms / 60000)}:${pad(Math.floor((ms % 60000) / 1000))}.${pad(ms % 1000, 3)}`;

// Lap time: "MM:SS.mmm".
const formatLap = (ms: number) =>
  `${pad(Math.floor(ms / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}.${pad(ms % 1000, 3)}`;

const NO_LAP = 2147483647;

type AccLine = {
  car: { carModel: number; carGroup: string; drivers: { playerId: string }[] };
  timing: { totalTime: number; lapCount: number; bestLap: number };
};

export type AccResult = {
  results: Record<string, string>;
  fastestLap: { racerId: RacerName; time: string };
  classFastestLaps: Partial<Record<string, RacerName>>;
  data: string;
  date: string | null;
  unknownPlayers: { playerId: string; laps: number }[];
  dnf: string[];
};

/**
 * Parse an ACC race-result JSON download into the inky500 result format.
 * Dedupes ghost/spare-car entries by playerId (keeping the most-completed run),
 * resolves drivers by Steam id, derives class from carModel, and produces
 * gap strings + overall and per-class fastest laps.
 */
export const accGrabber = async (downloadUrl: string): Promise<AccResult> => {
  const response = await fetch(downloadUrl);
  const data = (await response.json()) as {
    sessionResult: { leaderBoardLines: AccLine[] };
    Date: string;
  };
  const lines = data.sessionResult.leaderBoardLines;

  // Dedupe by playerId, keeping the entry with the most laps (drops 0-lap spares).
  const best: Record<string, { line: AccLine; idx: number; laps: number }> = {};
  lines.forEach((line, idx) => {
    const pid = line.car.drivers[0].playerId;
    const laps = line.timing.lapCount;
    if (!(pid in best) || laps > best[pid].laps) best[pid] = { line, idx, laps };
  });
  const ordered = Object.values(best)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.line);

  const leadLaps = ordered[0]?.timing.lapCount ?? 0;
  const leadTotal = ordered[0]?.timing.totalTime ?? 0;

  const results: Record<string, string> = {};
  const classFastestLaps: Partial<Record<string, RacerName>> = {};
  const classFastestMs: Record<string, number> = {};
  let overallFl: { racerId: RacerName; ms: number } | null = null;
  const unknownPlayers: { playerId: string; laps: number }[] = [];
  const dnf: string[] = [];
  let prevTotal = 0;

  for (const [i, line] of ordered.entries()) {
    const { carModel, carGroup, drivers } = line.car;
    const { totalTime, lapCount, bestLap } = line.timing;
    const pid = drivers[0].playerId;
    const key = playerIdToKey[pid];

    if (!key) {
      unknownPlayers.push({ playerId: pid, laps: lapCount });
      continue;
    }

    const cls = classOfCar(carModel, carGroup);
    // A car is classified if it ran 60%+ of the winner's total race time; below
    // that (or zero laps) it retired. totalTime is the sum of a car's own lap
    // times, so a car running to the flag stays near the leader's total even
    // when many laps down, while a true retirement falls well short.
    const retired = lapCount === 0 || totalTime < 0.6 * leadTotal;

    let gap: string;
    if (retired) {
      gap = "DNF";
      dnf.push(key);
    } else if (i === 0) {
      gap = formatRaceTime(totalTime);
    } else {
      const lapsDown = leadLaps - lapCount;
      gap = lapsDown > 0
        ? `${lapsDown} lap${lapsDown === 1 ? "" : "s"}`
        : ((totalTime - prevTotal) / 1000).toFixed(3);
    }
    results[key] = gap;
    prevTotal = totalTime;

    // Fastest laps are tracked across all participants, including retirees: if a
    // car that later retired set the class's fastest lap, the point is voided
    // (the retiree scores nothing and no classified driver inherits it).
    if (bestLap > 0 && bestLap < NO_LAP) {
      if (!overallFl || bestLap < overallFl.ms) overallFl = { racerId: key as RacerName, ms: bestLap };
      if (classFastestMs[cls] === undefined || bestLap < classFastestMs[cls]) {
        classFastestMs[cls] = bestLap;
        classFastestLaps[cls] = key as RacerName;
      }
    }
  }

  return {
    results,
    fastestLap: overallFl
      ? { racerId: overallFl.racerId, time: formatLap(overallFl.ms) }
      : { racerId: "unknown" as RacerName, time: "00:00.000" },
    classFastestLaps,
    data: downloadUrl,
    date: data.Date ? formatDate(data.Date) : null,
    unknownPlayers,
    dnf,
  };
};
