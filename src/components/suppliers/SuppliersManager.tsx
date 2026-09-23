
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import Button from "../ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

type SupplierType = "INDIVIDUAL" | "LEGAL";

type Supplier = {
  id: number;
  publicId: string;
  name: string;
  type: SupplierType;
  vatNumber: string | null;
  city: string;
  country: string;
  address: string | null;
  zipCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  bankDetails: string | null;
};

type FormState = {
  name: string;
  type: SupplierType;
  vatNumber: string;
  city: string;
  country: string;
  address: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  website: string;
  bankDetails: string;
};

const emptyForm: FormState = {
  name: "",
  type: "LEGAL",
  vatNumber: "",
  city: "",
  country: "TN",
  address: "",
  zipCode: "",
  phoneNumber: "",
  email: "",
  website: "",
  bankDetails: "",
};

const toForm = (s: Supplier): FormState => ({
  name: s.name,
  type: s.type,
  vatNumber: s.vatNumber ?? "",
  city: s.city,
  country: s.country,
  address: s.address ?? "",
  zipCode: s.zipCode ?? "",
  phoneNumber: s.phoneNumber ?? "",
  email: s.email ?? "",
  website: s.website ?? "",
  bankDetails: s.bankDetails ?? "",
});

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";
const headCell =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";
const bodyCell =
  "px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400";

export default function SuppliersManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Supplier[] | { suppliers: Supplier[] }>("/api/suppliers");
      setSuppliers(Array.isArray(data) ? data : data.suppliers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.vatNumber ?? "").toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setPanelOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm(toForm(supplier));
    setFormError(null);
    setPanelOpen(true);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setFormError(null);

    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.city.trim()) return setFormError("City is required.");
    if (!form.country.trim()) return setFormError("Country is required.");
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return setFormError("Email format is invalid.");
    }

    // On create, empty optional fields are omitted. On edit, they are sent as null so they can be cleared.
    const optional = (value: string) => {
      const v = value.trim();
      return v === "" ? (editing ? null : undefined) : v;
    };

    const payload = {
      name: form.name.trim(),
      type: form.type,
      city: form.city.trim(),
      country: form.country.trim(),
      vatNumber: optional(form.vatNumber),
      address: optional(form.address),
      zipCode: optional(form.zipCode),
      phoneNumber: optional(form.phoneNumber),
      email: optional(form.email),
      website: optional(form.website),
      bankDetails: optional(form.bankDetails),
    };

    setSaving(true);
    try {
      if (editing) {
        await apiPatch(`/api/suppliers/${editing.id}`, payload);
      } else {
        await apiPost("/api/suppliers", payload);
      }
      setPanelOpen(false);
      await loadSuppliers();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unable to save the supplier.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = window.confirm(
      `Delete "${supplier.name}"?\n\nWarning: all purchase invoices linked to this supplier will be deleted too.`
    );
    if (!confirmed) return;

    try {
      await apiDelete(`/api/suppliers/${supplier.id}`);
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete the supplier.");
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className={`${inputClass} sm:max-w-xs`}
          placeholder="Search by name or tax ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="sm" onClick={openCreate}>
          Add supplier
        </Button>
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading suppliers...</p>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {suppliers.length === 0
              ? "No suppliers yet. Add your first supplier to start entering invoices."
              : "No suppliers match your search."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/5">
                <TableRow>
                  <TableCell isHeader className={headCell}>Name</TableCell>
                  <TableCell isHeader className={headCell}>Tax ID</TableCell>
                  <TableCell isHeader className={headCell}>Type</TableCell>
                  <TableCell isHeader className={headCell}>City</TableCell>
                  <TableCell isHeader className={headCell}>Country</TableCell>
                  <TableCell isHeader className={headCell}>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                {displayed.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                      {supplier.name}
                    </TableCell>
                    <TableCell className={bodyCell}>{supplier.vatNumber ?? "—"}</TableCell>
                    <TableCell className={bodyCell}>
                      {supplier.type === "LEGAL" ? "Company" : "Individual"}
                    </TableCell>
                    <TableCell className={bodyCell}>{supplier.city}</TableCell>
                    <TableCell className={bodyCell}>{supplier.country}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => openEdit(supplier)}
                          className="font-medium text-brand-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(supplier)}
                          className="font-medium text-error-600 hover:underline dark:text-error-400"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-99999 flex justify-end bg-gray-900/50">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {editing ? "Edit supplier" : "New supplier"}
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            {formError && (
              <p
                className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
                role="alert"
              >
                {formError}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="s-name">Name</label>
                <input id="s-name" className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="s-type">Type</label>
                <select id="s-type" className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as SupplierType)}>
                  <option value="LEGAL">Company</option>
                  <option value="INDIVIDUAL">Individual</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="s-vat">Tax ID (matricule fiscal)</label>
                <input id="s-vat" className={inputClass} value={form.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="s-city">City</label>
                  <input id="s-city" className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="s-country">Country</label>
                  <input id="s-country" className={inputClass} value={form.country} onChange={(e) => set("country", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-[2fr_1fr] gap-4">
                <div>
                  <label className={labelClass} htmlFor="s-address">Address</label>
                  <input id="s-address" className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="s-zip">Zip code</label>
                  <input id="s-zip" className={inputClass} value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="s-phone">Phone</label>
                <input id="s-phone" className={inputClass} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="s-email">Email</label>
                <input id="s-email" type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="s-website">Website</label>
                <input id="s-website" className={inputClass} value={form.website} onChange={(e) => set("website", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="s-bank">Bank details</label>
                <input id="s-bank" className={inputClass} value={form.bankDetails} onChange={(e) => set("bankDetails", e.target.value)} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button size="sm" variant="outline" onClick={() => setPanelOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create supplier"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}