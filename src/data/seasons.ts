import type { Status } from "@/components/StatusBadge.astro";
import type { SeasonName } from "@/types";

interface SeasonInfo {
  game: string;
  key: SeasonName;
  status: Status;
  subtitle: string;
}

export const seasonInfo: SeasonInfo[] = [
  {
    key: "s1",
    subtitle: "Ginetta Juniors",
    game: "Project Cars 2",
    status: "complete",
  },
  {
    key: "s2",
    subtitle: "Touring Cars",
    game: "Project Cars 2",
    status: "complete",
  },
  {
    key: "s3",
    subtitle: "TCX",
    game: "ACC",
    status: "complete",
  },
  {
    key: "s4",
    subtitle: "GT4",
    game: "ACC",
    status: "complete",
  },
  {
    key: "s5",
    subtitle: "GT3",
    game: "ACC",
    status: "in-progress",
  },
];
