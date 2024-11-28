import { JSDOM } from "jsdom";
import { penalties } from "@/data";
import {
  type SeasonName,
  type TrackName,
  drivers,
  type RacerName,
} from "@/types";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const day = date.getUTCDate();
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${month} ${day}${getOrdinal(day)}, ${year}`;
};

export const timeGrabber = async (
  season: SeasonName,
  race: TrackName,
  link: string
) => {
  const response = await fetch(link);
  const html = await response.text();
  const dom = new JSDOM(
    html
      .replace(/<style([\S\s]*?)>([\S\s]*?)<\/style>/gim, "")
      .replace(/<script([\S\s]*?)>([\S\s]*?)<\/script>/gim, "")
  );

  const dateElement =
    dom.window.document.querySelector("h1")?.nextElementSibling?.textContent;
  const date = dateElement ? formatDate(dateElement) : null;

  const table = dom.window.document.querySelector("table");

  const results: Record<string, string> = {};
  const fastestLap = {
    racerId: "unknown",
    time: "23:59:999",
  };
  let highestLapCount = 0;

  if (table) {
    const times = Array.from(table.querySelectorAll("tr"))
      .map((row) => {
        const cells = row.querySelectorAll("td");
        const driver = cells[1];
        const totalTime = cells[3];
        const numLaps = cells[4];
        const bestLap = cells[5];

        if (driver && totalTime && bestLap && numLaps) {
          return [
            driver.innerHTML.split("\n")[0],
            totalTime.innerHTML,
            bestLap.innerHTML.split("<")[0],
            numLaps.innerHTML.split("lap")[0],
          ];
        }

        return [];
      })
      .slice(1);

    let lapCounter = 0;

    times.forEach((time, index) => {
      const tableName = time[0];
      const name =
        Object.entries(drivers).find((driver) =>
          (driver[1] as { tableNames?: string[] }).tableNames?.includes(
            tableName
          )
        )?.[0] ?? tableName;

      let parsedTime = time[1].split(":").slice(1).join(":");

      if (Number(time[3]) > highestLapCount) {
        highestLapCount = Number(time[3]);
      } else if (Number(time[3]) <= highestLapCount - 5) {
        parsedTime = "DNF";
      } else {
        if (index > 0) {
          parsedTime = (
            (Date.parse(`01/01/2000 ${time[1]}`) -
              Date.parse(`01/01/2000 ${times[index - 1][1]}`)) /
            1000
          )
            .toFixed(3)
            .toString();
        }

        if (parsedTime.startsWith("-")) {
          lapCounter++;
          parsedTime = `${lapCounter} lap${lapCounter === 1 ? "" : "s"}`;
        } else if (lapCounter > 0) {
          parsedTime = `${lapCounter} lap${lapCounter === 1 ? "" : "s"}`;
        }
      }

      results[name] = parsedTime;

      if (
        time[2] !== "00:00.000" &&
        Date.parse(`01/01/2000 00:${time[2]}`) <
          Date.parse(`01/01/2000 00:${fastestLap.time}`)
      ) {
        fastestLap.time = time[2];
        fastestLap.racerId = name;
      }
    });
  }

  // Perform any penalty rearrangements
  const resultsKeys = Object.keys(results) as RacerName[];
  const copy = [...resultsKeys];
  copy.forEach((result, index) => {
    const penalty = penalties[season]?.[race]?.[result];

    if (penalty) {
      resultsKeys.splice(index, 1);
      resultsKeys.splice(index + penalty, 0, result);
    }
  });

  const orderedResults = resultsKeys.reduce(
    (obj: Record<string, string>, item: string) => {
      return (obj[item] = results[item]), obj;
    },
    {}
  );

  return { results: orderedResults, fastestLap, data: link, date };
};
