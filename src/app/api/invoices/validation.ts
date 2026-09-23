import { Prisma } from "@/generated/prisma/client";
import { InvoiceMode, InvoiceWorkflowStatus } from "@/generated/prisma/enums";

const invoiceModes = Object.values(InvoiceMode);
const invoiceStatuses = Object.values(InvoiceWorkflowStatus);

export type CalculatedItem = {
  label: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  totalBeforeTax: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAfterTax: Prisma.Decimal;
};

export type InvoiceInput = {
  number?: string;
  invoiceDate?: Date;
  currency?: string;
  stamp?: Prisma.Decimal;
  notes?: string | null;
  dueDate?: Date | null;
  customTaxes?: Prisma.InputJsonValue | null;
  isVatDeductible?: boolean;
  supplierId?: number;
  filePath?: string | null;
  mode?: InvoiceMode | null;
  status?: InvoiceWorkflowStatus;
  validationErrors?: Prisma.InputJsonValue | null;
  validatedById?: string | null;
  validatedAt?: Date | null;
  items?: CalculatedItem[];
};

type ValidationResult = { data: InvoiceInput } | { error: string };

function decimal(value: unknown, field: string, allowZero = true): Prisma.Decimal | string {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    value === "" ||
    !Number.isFinite(Number(value)) ||
    (!allowZero && Number(value) <= 0) ||
    (allowZero && Number(value) < 0)
  ) {
    return `Le champ ${field} doit être un nombre ${allowZero ? "positif ou nul" : "strictement positif"}.`;
  }
  return new Prisma.Decimal(value);
}

function date(value: unknown, field: string): Date | null | string {
  if (value === null) return null;
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
    return `Le champ ${field} doit être une date valide.`;
  }
  return new Date(value);
}

function parseItems(value: unknown): CalculatedItem[] | string {
  if (!Array.isArray(value) || value.length === 0) {
    return "Le champ items doit contenir au moins un article.";
  }

  const items: CalculatedItem[] = [];
  for (const [index, raw] of value.entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return `L'article ${index + 1} doit être un objet JSON.`;
    }
    const input = raw as Record<string, unknown>;
    if (typeof input.label !== "string" || input.label.trim() === "") {
      return `Le champ label est requis pour l'article ${index + 1}.`;
    }

    const quantity = decimal(input.quantity, `quantity de l'article ${index + 1}`, false);
    const unitPrice = decimal(input.unitPrice, `unitPrice de l'article ${index + 1}`);
    const taxRate = decimal(input.taxRate, `taxRate de l'article ${index + 1}`);
    if (typeof quantity === "string") return quantity;
    if (typeof unitPrice === "string") return unitPrice;
    if (typeof taxRate === "string") return taxRate;

    const totalBeforeTax = quantity.mul(unitPrice);
    const taxAmount = totalBeforeTax.mul(taxRate).div(100);
    items.push({
      label: input.label.trim(),
      quantity,
      unitPrice,
      totalBeforeTax,
      taxRate,
      taxAmount,
      totalAfterTax: totalBeforeTax.plus(taxAmount),
    });
  }
  return items;
}

export function parseInvoiceInput(body: unknown, partial = false): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Le corps de la requête doit être un objet JSON." };
  }

  const input = body as Record<string, unknown>;
  const data: InvoiceInput = {};

  for (const field of ["number", "invoiceDate", "currency", "supplierId"] as const) {
    if (!partial && input[field] === undefined) {
      return { error: `Le champ ${field} est requis.` };
    }
  }

  if (input.number !== undefined) {
    if (typeof input.number !== "string" || input.number.trim() === "") {
      return { error: "Le champ number doit être une chaîne non vide." };
    }
    data.number = input.number.trim();
  }

  if (input.invoiceDate !== undefined) {
    const parsed = date(input.invoiceDate, "invoiceDate");
    if (typeof parsed === "string") return { error: parsed };
    if (!parsed) return { error: "Le champ invoiceDate est requis." };
    data.invoiceDate = parsed;
  }

  if (input.dueDate !== undefined) {
    const parsed = date(input.dueDate, "dueDate");
    if (typeof parsed === "string") return { error: parsed };
    data.dueDate = parsed;
  }

  if (input.currency !== undefined) {
    if (typeof input.currency !== "string" || !/^[A-Za-z]{3}$/.test(input.currency)) {
      return { error: "Le champ currency doit être un code de trois lettres." };
    }
    data.currency = input.currency.toUpperCase();
  }

  if (input.supplierId !== undefined) {
    if (typeof input.supplierId !== "number" || !Number.isInteger(input.supplierId) || input.supplierId <= 0) {
      return { error: "Le champ supplierId doit être un identifiant entier valide." };
    }
    data.supplierId = input.supplierId;
  }

  if (input.stamp !== undefined) {
    const parsed = decimal(input.stamp, "stamp");
    if (typeof parsed === "string") return { error: parsed };
    data.stamp = parsed;
  }

  if (input.notes !== undefined) {
    if (input.notes !== null && typeof input.notes !== "string") {
      return { error: "Le champ notes doit être une chaîne ou null." };
    }
    data.notes = input.notes as string | null;
  }

  for (const field of ["filePath", "validatedById"] as const) {
    if (input[field] !== undefined) {
      if (input[field] !== null && typeof input[field] !== "string") {
        return { error: `Le champ ${field} doit être une chaîne ou null.` };
      }
      data[field] = input[field] as string | null;
    }
  }

  if (input.isVatDeductible !== undefined) {
    if (typeof input.isVatDeductible !== "boolean") {
      return { error: "Le champ isVatDeductible doit être un booléen." };
    }
    data.isVatDeductible = input.isVatDeductible;
  }

  if (input.mode !== undefined) {
    if (input.mode !== null && (typeof input.mode !== "string" || !invoiceModes.includes(input.mode as InvoiceMode))) {
      return { error: "Le champ mode doit être OCR_LLM, HANDWRITTEN ou null." };
    }
    data.mode = input.mode as InvoiceMode | null;
  }

  if (input.status !== undefined) {
    if (typeof input.status !== "string" || !invoiceStatuses.includes(input.status as InvoiceWorkflowStatus)) {
      return { error: "Le champ status est invalide." };
    }
    data.status = input.status as InvoiceWorkflowStatus;
  }

  for (const field of ["customTaxes", "validationErrors"] as const) {
    if (input[field] !== undefined) {
      if (input[field] !== null && (typeof input[field] !== "object" && typeof input[field] !== "number" && typeof input[field] !== "string")) {
        return { error: `Le champ ${field} doit être une valeur JSON ou null.` };
      }
      data[field] = input[field] as Prisma.InputJsonValue | null;
    }
  }

  if (input.validatedAt !== undefined) {
    const parsed = date(input.validatedAt, "validatedAt");
    if (typeof parsed === "string") return { error: parsed };
    data.validatedAt = parsed;
  }

  if (input.items !== undefined) {
    const items = parseItems(input.items);
    if (typeof items === "string") return { error: items };
    data.items = items;
  } else if (!partial) {
    return { error: "Le champ items doit contenir au moins un article." };
  }

  return { data };
}

export function customTaxAmount(value: unknown): Prisma.Decimal {
  if (typeof value === "number" || typeof value === "string") {
    return new Prisma.Decimal(value);
  }
  if (Array.isArray(value)) {
    return value.reduce((sum, entry) => sum.plus(customTaxAmount(entry)), new Prisma.Decimal(0));
  }
  if (value && typeof value === "object") {
    return Object.values(value).reduce((sum, entry) => sum.plus(customTaxAmount(entry)), new Prisma.Decimal(0));
  }
  return new Prisma.Decimal(0);
}

export function invoiceTotals(
  items: Array<Pick<CalculatedItem, "totalBeforeTax" | "taxAmount" | "totalAfterTax">>,
  stamp: Prisma.Decimal,
  customTaxes: unknown
) {
  const totalBeforeTax = items.reduce(
    (sum, item) => sum.plus(item.totalBeforeTax),
    new Prisma.Decimal(0)
  );
  const taxAmount = items.reduce(
    (sum, item) => sum.plus(item.taxAmount),
    new Prisma.Decimal(0)
  );
  const customTaxTotal = customTaxAmount(customTaxes);
  const totalAfterTax = items
    .reduce((sum, item) => sum.plus(item.totalAfterTax), new Prisma.Decimal(0))
    .plus(customTaxTotal);

  return {
    totalBeforeTax,
    taxAmount: taxAmount.plus(customTaxTotal),
    totalAfterTax,
    totalAfterTaxWithStamp: totalAfterTax.plus(stamp),
  };
}

export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
