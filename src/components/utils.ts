import type { ChartConfiguration } from "chart.js/auto";

export type ChartType = "drivers" | "constructors";

export const chartConfig = {
  drivers: {
    label: "Drivers",
    color: "hsl(var(--chart-1))",
  },
  constructors: {
    label: "Constructors",
    color: "hsl(var(--chart-2))",
  },
};

export const fontFamily =
  'Archivo, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

export const commonConfig: ChartConfiguration<
  "line",
  (number | undefined)[],
  string
> = {
  type: "line",
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: fontFamily,
          },
        },
      },
      x: {
        ticks: {
          font: {
            family: fontFamily,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 14,
            family: fontFamily,
          },
        },
      },
      tooltip: {
        itemSort: (a: any, b: any) => {
          return b.raw - a.raw;
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  },
  data: {
    datasets: [],
  },
};

export const sections = [
  {
    id: "results",
    label: "Race Results 🏎️",
  },
  {
    id: "drivers",
    label: "Driver's Standings 🏆",
  },
  {
    id: "constructors",
    label: "Constructors' Standings ⚙️",
  },
  {
    id: "progression",
    label: "Progression 📈",
  },
  {
    id: "table",
    label: "Table 🏅",
  },
];
