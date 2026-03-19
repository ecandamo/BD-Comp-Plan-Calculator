import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PayoutStatus = "TO_BE_PAID" | "PAID" | "PENDING";

type Row = {
  key: string;
  date: string;
  category: string;
  source: string;
  label: string;
  amount: number;
  status: PayoutStatus;
};

const statusLabel: Record<PayoutStatus, string> = {
  TO_BE_PAID: "To be paid",
  PAID: "Paid",
  PENDING: "Pending"
};

const rowStatusClass = (status: PayoutStatus) =>
  status === "PAID"
    ? "bg-muted/35 text-muted-foreground hover:bg-muted/45"
    : status === "PENDING"
      ? "bg-amber-100/80 text-amber-950 hover:bg-amber-100 dark:bg-amber-500/18 dark:text-amber-100 dark:hover:bg-amber-500/24"
      : "bg-[var(--status-good-bg)] text-[var(--status-good-text)] hover:bg-[color-mix(in_srgb,var(--status-good-bg)_92%,white)] dark:hover:bg-[color-mix(in_srgb,var(--status-good-bg)_92%,black)]";

export function PayoutDataTable({
  rows,
  money,
  onStatusChange
}: {
  rows: Row[];
  money: (x: number) => string;
  onStatusChange: (key: string, status: PayoutStatus) => void;
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="h-auto px-0 font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Date
            <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-semibold">{row.original.date || "(No Date)"}</span>
      },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "source", header: "Source" },
      { accessorKey: "label", header: "Label" },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="ml-auto h-auto px-0 font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Amount
            <ArrowUpDown className="size-3.5" />
          </Button>
        ),
        cell: ({ row }) => <div className="text-right font-semibold">{money(row.original.amount)}</div>
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Select value={row.original.status} onValueChange={(value) => onStatusChange(row.original.key, value as PayoutStatus)}>
              <SelectTrigger className="h-9 w-[140px] rounded-full border-current/20 bg-white/70 text-current dark:bg-slate-950/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TO_BE_PAID">To be paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      }
    ],
    [money, onStatusChange]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase();
      return [row.original.date, row.original.category, row.original.source, row.original.label].some((value) => value.toLowerCase().includes(q));
    }
  });

  const handleExportCsv = () => {
    const exportRows = table.getRowModel().rows.map((row) => row.original);
    if (!exportRows.length) {
      toast.info("No payout rows to export.");
      return;
    }

    const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, "\"\"")}"`;
    const csvLines = [
      ["Date", "Category", "Source", "Label", "Amount", "Status"].map(csvEscape).join(","),
      ...exportRows.map((row) =>
        [row.date, row.category, row.source, row.label, row.amount.toFixed(2), statusLabel[row.status]].map(csvEscape).join(",")
      )
    ];

    try {
      const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `payout-schedule-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to export payout schedule CSV.");
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Filter payouts" className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={header.column.id === "amount" || header.column.id === "status" ? "text-right" : undefined}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className={cn(rowStatusClass(row.original.status))}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.id === "amount" || cell.column.id === "status" ? "text-right" : undefined}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                No payouts match the current filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
