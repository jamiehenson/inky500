// import * as React from "react";
// import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

// import {
//   type ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";
// import type {
//   ConstructorName,
//   RacerName,
//   SeasonName,
//   TrackName,
// } from "@/types";
// import {
//   seasonRacers,
//   tracks,
//   standings,
//   constructors,
//   constructorsStandings,
// } from "@/data";

// export const description = "An interactive line chart";

// const chartData = (
//   season: SeasonName,
//   track: TrackName,
//   activeChart: string
// ) => {
//   const dataSet =
//     activeChart === "drivers"
//       ? Object.entries(standings[season]).map((entry) => [
//           entry[0],
//           Object.entries(entry[1]).reduce((acc, [key, value]) => {
//             acc[key as RacerName] = value.points;
//             return acc;
//           }, {} as Record<RacerName, number>),
//         ])
//       : Object.entries(constructorsStandings[season]).map((entry) => [
//           entry[0],
//           Object.entries(entry[1]).reduce((acc, [key, value]) => {
//             acc[key as ConstructorName] = value.normalisedPoints;
//             return acc;
//           }, {} as Record<ConstructorName, number>),
//         ]);

//   const sliceIndex =
//     (dataSet.findIndex((item) => item[0] === track) ?? dataSet.length - 1) + 1;

//   return dataSet.slice(0, sliceIndex).map((race) => ({
//     race: tracks[race[0] as TrackName].name,
//     ...(typeof race[1] === "object" ? race[1] : {}),
//   }));
// };

// const chartConfig = {
//   drivers: {
//     label: "Drivers",
//     color: "hsl(var(--chart-1))",
//   },
//   constructorsStandings: {
//     label: "Constructors",
//     color: "hsl(var(--chart-2))",
//   },
// } satisfies ChartConfig;

// export const ProgressionChart = ({
//   season,
//   track,
// }: {
//   season: SeasonName;
//   track: TrackName;
// }) => {
//   const [activeChart, setActiveChart] =
//     React.useState<keyof typeof chartConfig>("drivers");

//   const seasonDrivers = Object.keys(seasonRacers[season]) as RacerName[];
//   const seasonConstructors = Array.from(
//     new Set(Object.values(seasonRacers[season]).map((racer) => racer.car))
//   );

//   const seasonEntities =
//     activeChart === "drivers" ? seasonDrivers : seasonConstructors;

//   const chartButtons = ["s4", "s5"].includes(season)
//     ? ["drivers", "constructorsStandings"]
//     : ["drivers"];

//   return (
//     <Card className="col-span-2">
//       <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
//         <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
//           <CardTitle>Progression</CardTitle>
//           <CardDescription>
//             Showing progression as of {tracks[track].name}
//           </CardDescription>
//         </div>
//         <div className="flex">
//           {chartButtons.map((key) => {
//             const chart = key as keyof typeof chartConfig;
//             return (
//               <button
//                 key={chart}
//                 data-active={activeChart === chart}
//                 className={`flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l last:rounded-tr-lg data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6 transition-colors ${
//                   activeChart === chart
//                     ? "bg-zinc-100 dark:bg-zinc-800"
//                     : "hover:bg-zinc-50 hover:dark:bg-zinc-800"
//                 }`}
//                 onClick={() => setActiveChart(chart)}
//               >
//                 <span className="text-lg text-muted-foreground">
//                   {chartConfig[chart].label}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </CardHeader>
//       <CardContent className="px-2 sm:p-6">
//         <ChartContainer
//           config={chartConfig}
//           className="aspect-auto h-[500px] w-full"
//         >
//           <LineChart
//             accessibilityLayer
//             data={chartData(season, track, activeChart)}
//             margin={{
//               left: 12,
//               right: 12,
//             }}
//           >
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="race"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               minTickGap={32}
//             />
//             <ChartTooltip
//               content={<ChartTooltipContent className="w-[150px]" />}
//             />
//             {seasonEntities.map((item, index) => {
//               const color =
//                 activeChart === "constructorsStandings"
//                   ? constructors[item as ConstructorName].teamColor
//                   : `var(--chart-${(index % 5) + 1})`;

//               return (
//                 <Line
//                   key={item}
//                   dataKey={item}
//                   type="monotone"
//                   stroke={color}
//                   strokeWidth={2}
//                   dot={{
//                     fill: color,
//                   }}
//                   activeDot={{
//                     r: 6,
//                   }}
//                 />
//               );
//             })}
//           </LineChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   );
// };
