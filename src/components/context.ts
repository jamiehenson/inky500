import { getContext, setContext } from "svelte";
import type { SeasonName, TrackName } from "@/types";
import type { ShowType, SortType, ChartType } from "./types";

export const setStandingsContext = ({
  season,
  track,
  netPoints,
  setNetPoints,
  chartType,
  setChartType,
  showType,
  setShowType,
  sortType,
  setSortType,
}: {
  season: SeasonName;
  track: TrackName;
  netPoints: () => boolean;
  setNetPoints: (netPoints: boolean) => void;
  chartType: () => ChartType;
  setChartType: (chartType: ChartType) => void;
  showType: () => ShowType;
  setShowType: (showType: ShowType) => void;
  sortType: () => SortType;
  setSortType: (sortType: SortType) => void;
}) => {
  setContext<SeasonName>("season", season);
  setContext<TrackName>("track", track);
  setContext<() => boolean>("netPoints", netPoints);
  setContext<(netPoints: boolean) => void>("setNetPoints", setNetPoints);
  setContext<() => ChartType>("chartType", chartType);
  setContext<(type: ChartType) => void>("setChartType", setChartType);
  setContext<() => ShowType>("showType", showType);
  setContext<(type: ShowType) => void>("setShowType", setShowType);
  setContext<() => SortType>("sortType", sortType);
  setContext<(type: SortType) => void>("setSortType", setSortType);
};

export const getStandingsContext = () => ({
  season: getContext<SeasonName>("season"),
  track: getContext<TrackName>("track"),
  netPoints: getContext<() => boolean>("netPoints"),
  setNetPoints: getContext<(netPoints: boolean) => void>("setNetPoints"),
  chartType: getContext<() => ChartType>("chartType"),
  setChartType: getContext<(type: ChartType) => void>("setChartType"),
  showType: getContext<() => ShowType>("showType"),
  setShowType: getContext<(type: ShowType) => void>("setShowType"),
  sortType: getContext<() => SortType>("sortType"),
  setSortType: getContext<(type: SortType) => void>("setSortType"),
});
