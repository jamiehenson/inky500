import fs from "fs";
import { type TrackName, type SeasonName } from "../src/types";
import { timeGrabber } from "scripts/timeGrabber";
import { calculateStandings } from "scripts/calculateStandings";

const activeSeason = "s5";

export const pointslessResults = ["DNF", "DSQ"];

const generateStandings = async () => {
  if (process.argv[2] === "add") {
    const parsedResults = await timeGrabber(
      process.argv[3] as SeasonName,
      process.argv[4] as TrackName,
      process.argv[5]
    );

    const resultsPath = `src/data/results/${process.argv[3]}.json`;
    const resultsFile = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

    resultsFile[process.argv[4]] = parsedResults;

    fs.writeFileSync(resultsPath, JSON.stringify(resultsFile), { flag: "w" });
  }

  const standingsResults = calculateStandings(activeSeason);

  const standings = JSON.stringify(standingsResults[0]);
  const standingsPath = `src/data/standings/${activeSeason}.json`;

  try {
    fs.writeFileSync(standingsPath, standings, { flag: "w" });
    console.log(`${activeSeason} standings data saved to file successfully.`);
  } catch (error) {
    console.error("Error writing JSON data to file:", error);
  }

  const constructors = JSON.stringify(standingsResults[1]);

  const constructorsPath = `src/data/constructorsStandings/${activeSeason}.json`;

  try {
    fs.writeFileSync(constructorsPath, constructors, { flag: "w" });
    console.log(
      `${activeSeason} constructors data saved to file successfully.`
    );
  } catch (error) {
    console.error("Error writing JSON data to file:", error);
  }
};

if (process) {
  generateStandings();
}
