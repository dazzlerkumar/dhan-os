"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatCurrency,
  formatDateDisplay,
  formatMonthDisplay,
} from "@/lib/formatters";
import type { CardStatementSummary } from "@/types/cards";

interface StatementColumnsProps {
  onEdit: (stmt: CardStatementSummary) => void;
  onDelete: (stmt: CardStatementSummary) => void;
}

export function getStatementColumns({
  onEdit,
  onDelete,
}: StatementColumnsProps): ColumnDef<CardStatementSummary>[] {
  return [
    {
      accessorKey: "cycleMonth",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Billing Cycle" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 py-1 font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatMonthDisplay(row.original.cycleMonth)}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "generatedAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Billed Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatCurrency(row.original.generatedAmount)}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "spend",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cycle Spend" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatCurrency(row.original.spend)}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "status",
      header: "Settlement Status",
      cell: ({ row }) => {
        const paidDate = row.original.paidDate;
        if (paidDate) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Paid on {formatDateDisplay(paidDate)}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Unsettled
          </span>
        );
      },
    },
    {
      accessorKey: "rewards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cashback / Rewards" />
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          <Gift className="h-3.5 w-3.5" />
          {formatCurrency(row.original.rewards)}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const stmt = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onEdit(stmt)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(stmt)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
