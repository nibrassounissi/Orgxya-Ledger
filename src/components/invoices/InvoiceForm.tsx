"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import Button from "../ui/button/Button";

type SupplierOption = { id: number; name: string };

type ItemRow = {
  label: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
};

const newItem = (): ItemRow => ({
  label: "",
  quantity: "1",
  unitPrice: "",
  taxRate: "19",
});

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export default function InvoiceForm() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [number, setNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("TND");
  const [stamp, setStamp] = useState("0");
  const [isVatDeductible, setIsVatDeductible] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<SupplierOption[] | { suppliers: SupplierOption[] }>(
          "/api/suppliers"
        );
        setSuppliers(Array.isArray(data) ? data : data.suppliers);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load suppliers.");
      }
    };
    load();
  }, []);

  const updateItem = (index: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeItem = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  // Preview only: the server recalculates everything with the same formulas.
  const totals = useMemo(() => {
    let before = 0;
    let tax = 0;
    for (const row of items) {
      const lineBefore = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
      before += lineBefore;
      tax += (lineBefore * (Number(row.taxRate) || 0)) / 100;
    }
    const after = before + tax;
    return {
      before: round3(before),
      tax: round3(tax),
      after: round3(after),
      withStamp: round3(after + (Number(stamp) || 0)),
    };
  }, [items, stamp]);

  const handleSubmit = async () => {
    setError(null);

    if (!supplierId) return setError("Please choose a supplier.");
    if (!number.trim()) return setError("Invoice number is required.");
    if (!invoiceDate) return setError("Invoice date is required.");
    if (!/^[A-Za-z]{3}$/.test(currency)) return setError("Currency must be a 3-letter code.");

    const invalidItem = items.some(
      (row) =>
        !row.label.trim() ||
        !(Number(row.quantity) > 0) ||
        row.unitPrice === "" ||
        Number(row.unitPrice) < 0 ||
        row.taxRate === "" ||
        Number(row.taxRate) < 0
    );
    if (invalidItem) {
      return setError("Each item needs a label, a quantity above 0, a unit price and a tax rate.");
    }

    setSubmitting(true);
    try {
      await apiPost("/api/invoices", {
        supplierId: Number(supplierId),
        number: number.trim(),
        invoiceDate,
        dueDate: dueDate || undefined,
        currency: currency.toUpperCase(),
        stamp: Number(stamp) || 0,
        isVatDeductible,
        notes: notes.trim() || undefined,
        items: items.map((row) => ({
          label: row.label.trim(),
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
          taxRate: Number(row.taxRate),
        })),
      });
      router.push("/invoices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create the invoice.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          New purchase invoice
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the invoice details and its line items. Totals are calculated for you.
        </p>
      </div>

      {error && (
        <p
          className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="supplier">Supplier</label>
          <select
            id="supplier"
            className={inputClass}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Select a supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="number">Invoice number</label>
          <input
            id="number"
            className={inputClass}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="invoiceDate">Invoice date</label>
          <input
            id="invoiceDate"
            type="date"
            className={inputClass}
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="dueDate">Due date (optional)</label>
          <input
            id="dueDate"
            type="date"
            className={inputClass}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="currency">Currency</label>
          <input
            id="currency"
            maxLength={3}
            className={inputClass}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="stamp">Stamp duty</label>
          <input
            id="stamp"
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
        <input
          type="checkbox"
          checked={isVatDeductible}
          onChange={(e) => setIsVatDeductible(e.target.checked)}
        />
        VAT is deductible
      </label>

      <div>
        <label className={labelClass} htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Items</h2>
        <div className="space-y-3">
          {items.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] dark:border-gray-800"
            >
              <div className="col-span-2 md:col-span-1">
                <label className={labelClass}>Label</label>
                <input
                  className={inputClass}
                  value={row.label}
                  onChange={(e) => updateItem(index, { label: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className={inputClass}
                  value={row.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Unit price</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className={inputClass}
                  value={row.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Tax rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={row.taxRate}
                  onChange={(e) => updateItem(index, { taxRate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="h-11 rounded-lg px-3 text-sm text-error-600 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-error-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, newItem()])}
          className="mt-3 text-sm font-medium text-brand-500 hover:underline"
        >
          + Add item
        </button>
      </div>

      <div className="ml-auto max-w-xs space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between"><span>Total before tax</span><span>{totals.before.toFixed(3)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{totals.tax.toFixed(3)}</span></div>
        <div className="flex justify-between"><span>Total after tax</span><span>{totals.after.toFixed(3)}</span></div>
        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
          <span>Total with stamp</span>
          <span>{totals.withStamp.toFixed(3)} {currency.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button size="sm" variant="outline" onClick={() => router.push("/invoices")}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Create invoice"}
        </Button>
      </div>
    </div>
  );
}