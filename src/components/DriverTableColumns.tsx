"use client";

import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { carImages } from "@/utils";
import type { ConstructorName } from "@/types";

const sortableColumn = (column: any, label: string) => (
  <Button
    variant="ghost"
    className="px-0 font-bold"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    {label}
    <ArrowUpDown className="ml-2 h-4 w-4" />
  </Button>
);

export const columns = [
  { accessorKey: "name", header: "Driver" },
  {
    accessorKey: "teams",
    header: "Teams",
    cell: ({ row }: { row: any }) => {
      const teams = row.getValue("teams");
      return (
        <div className="flex gap-2">
          {teams.map((team: string) => (
            <img
              key={team}
              className="w-4 h-4"
              src={carImages[team as ConstructorName].src}
              alt={team}
            />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "points",
    header: ({ column }: { column: unknown }) =>
      sortableColumn(column, "Points"),
  },
  {
    accessorKey: "wins",
    header: ({ column }: { column: unknown }) => sortableColumn(column, "Wins"),
  },
  {
    accessorKey: "podiums",
    header: ({ column }: { column: unknown }) =>
      sortableColumn(column, "Podiums"),
  },
  {
    accessorKey: "fastestLaps",
    header: ({ column }: { column: unknown }) =>
      sortableColumn(column, "Fastest Laps"),
  },
  { accessorKey: "bestResult", header: "Best Result" },
  { accessorKey: "averageResult", header: "Average Result" },
];
