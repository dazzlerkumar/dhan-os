"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDateDisplay } from "@/lib/formatters";
import type { TransactionItem } from "@/types/transactions";
import { DataTableColumnHeader } from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface CategoryMeta {
  id: number;
  name: string;
  color: string | null;
}

interface PaymentMethodMeta {
  id: number;
  name: string;
  kind: string;
}

interface ColumnOptions {
  categories: CategoryMeta[];
  paymentMethods: PaymentMethodMeta[];
  onEdit: (tx: TransactionItem) => void;
  onDelete: (id: number) => void;
}

export function getTransactionColumns({
  categories,
  paymentMethods,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<TransactionItem>[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const methodMap = new Map(paymentMethods.map((m) => [m.id, m]));

  return [
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category & Description" />
      ),
      cell: ({ row }) => {
        const tx = row.original;
        const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
        const isIncome = tx.flow === "income";

        return (
          <div className="flex items-center gap-3 py-1">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: category?.color
                  ? `${category.color}25`
                  : isIncome
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(113, 60, 233, 0.15)",
                color: category?.color
                  ? category.color
                  : isIncome
                    ? "#10B981"
                    : "#713CE9",
              }}
            >
              {category?.name
                ? category.name.charAt(0)
                : tx.description.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {tx.description}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {category && <span className="truncate">{category.name}</span>}
                {category && tx.note && <span>•</span>}
                {tx.note && (
                  <span className="truncate italic text-muted-foreground/80">
                    {tx.note}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDateDisplay(row.original.date)}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        const tx = row.original;
        const isIncome = tx.flow === "income";
        const isInvest = tx.flow === "invest";

        if (isIncome) {
          return (
            <span className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Income
            </span>
          );
        }

        if (isInvest) {
          return (
            <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Invest
            </span>
          );
        }

        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
              tx.isFixed
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-border bg-muted/60 text-muted-foreground"
            }`}
          >
            {tx.isFixed ? "Fixed" : "Variable"}
          </span>
        );
      },
    },
    {
      accessorKey: "paymentMethodId",
      header: "Method",
      cell: ({ row }) => {
        const methodId = row.original.paymentMethodId;
        const method = methodId ? methodMap.get(methodId) : null;

        if (!method) {
          return <span className="text-muted-foreground/60">—</span>;
        }

        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            <span>{method.name}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader
            column={column}
            title="Amount"
            className="justify-end"
          />
        </div>
      ),
      cell: ({ row }) => {
        const tx = row.original;
        const isIncome = tx.flow === "income";
        const numAmount = Number.parseFloat(tx.amount) || 0;

        return (
          <div className="text-right font-semibold tabular-nums">
            <span
              className={
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              }
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(numAmount)}
            </span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const tx = row.original;

        return (
          <div className="flex justify-center">
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
                <DropdownMenuItem onClick={() => onEdit(tx)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(tx.id)}
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
