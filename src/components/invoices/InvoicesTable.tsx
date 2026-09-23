"use client";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

type InvoiceStatus = "EXTRACTED" | "TO_VERIFY" | "VALIDATED" | "EXPORTED";

type InvoiceListItem = {
  id: number;
  publicId: string;
  number: string;
  invoiceDate: string;
  currency: string;
  totalAfterTaxWithStamp: string;
  status: InvoiceStatus;
  supplier: { id: number; name: string };
};

const statusColor: Record<InvoiceStatus, "warning" | "success" | "error"> = {
  EXTRACTED: "warning",
  TO_VERIFY: "warning",
  VALIDATED: "success",
  EXPORTED: "success",
};

const headCell =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";
const bodyCell =
  "px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400";

export default function InvoicesTable() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<InvoiceListItem[] | { invoices: InvoiceListItem[] }>(
          "/api/invoices"
        );
        setInvoices(Array.isArray(data) ? data : data.invoices);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load invoices.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayed =
    statusFilter === "ALL"
      ? invoices
      : invoices.filter((i) => i.status === statusFilter);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          {(["ALL", "EXTRACTED", "TO_VERIFY", "VALIDATED", "EXPORTED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`border-b-2 px-4 py-3 text-sm font-medium ${
                statusFilter === s
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>
        <Link href="/invoices/new">
          <Button size="sm">New invoice</Button>
        </Link>
      </div>

      {error && (
        <p
          className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoices...</p>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">No invoices found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/5">
                <TableRow>
                  <TableCell isHeader className={headCell}>Number</TableCell>
                  <TableCell isHeader className={headCell}>Supplier</TableCell>
                  <TableCell isHeader className={headCell}>Date</TableCell>
                  <TableCell isHeader className={headCell}>Total</TableCell>
                  <TableCell isHeader className={headCell}>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                {displayed.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                      {invoice.number}
                    </TableCell>
                    <TableCell className={bodyCell}>{invoice.supplier.name}</TableCell>
                    <TableCell className={bodyCell}>
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className={bodyCell}>
                      {invoice.totalAfterTaxWithStamp} {invoice.currency}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Badge size="sm" color={statusColor[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}