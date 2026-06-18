import fs from "fs";
import { accGrabber } from "scripts/accGrabber";
import type { TrackName } from "@/types";

const BASE = "https://inky500-acc.emperorservers.com/server/0/results/download";

// Season 6 championship calendar (16 rounds, oldest first). Excludes the
// non-championship races: Valencia shakedown (Oct 8), Hungaroring, Nürburgring,
// and the Silverstone exhibition (May 5).
const CALENDAR: { track: TrackName; file: string }[] = [
  { track: "valencia", file: "251015_214028_R" },
  { track: "kyalami", file: "251029_214203_R" },
  { track: "mt-panorama", file: "251112_215810_R" },
  { track: "suzuka", file: "251126_214347_R" },
  { track: "laguna-seca", file: "251210_213845_R" },
  { track: "watkins-glen", file: "260107_214314_R" },
  { track: "cota", file: "260121_214153_R" },
  { track: "nordschleife", file: "260204_220039_R" },
  { track: "zolder", file: "260304_213936_R" },
  { track: "red-bull-ring", file: "260318_213849_R" },
  { track: "monza", file: "260401_213953_R" },
  { track: "paul-ricard", file: "260415_214314_R" },
  { track: "spa", file: "260429_215712_R" },
  { track: "brands-hatch", file: "260513_214048_R" },
  { track: "oulton-park", file: "260527_214312_R" },
  { track: "snetterton", file: "260610_214015_R" },
];

// Manual result overrides for league stewarding decisions that aren't present in
// the ACC result data — e.g. post-race disqualifications of cars that finished.
const RESULT_OVERRIDES: Record<string, Record<string, string>> = {
  // Pirrie was disqualified from Mt Panorama (classified on track, DQ'd by stewards).
  "mt-panorama": { pirrie: "DSQ" },
};

const buildSeason6 = async () => {
  const output: Record<string, unknown> = {};

  for (const { track, file } of CALENDAR) {
    const url = `${BASE}/${file}.json`;
    const { results, fastestLap, classFastestLaps, data, date, unknownPlayers, dnf } =
      await accGrabber(url);

    const overrides = RESULT_OVERRIDES[track];
    if (overrides) {
      for (const [racer, value] of Object.entries(overrides)) {
        if (racer in results) results[racer] = value;
      }
    }

    output[track] = { results, fastestLap, classFastestLaps, data, date };

    const fl = Object.entries(classFastestLaps)
      .map(([c, r]) => `${c}:${r}`)
      .join(" ");
    console.log(
      `${track.padEnd(14)} ${String(Object.keys(results).length).padStart(2)} cars | ` +
        `DNF: ${dnf.length ? dnf.join(", ") : "—"} | FL ${fl}`,
    );
    if (unknownPlayers.length) {
      console.warn(`  ⚠ unknown players:`, unknownPlayers);
    }
  }

  fs.writeFileSync("src/data/results/s6.json", JSON.stringify(output, null, 2) + "\n");
  console.log("\nWrote src/data/results/s6.json");
};

buildSeason6();
