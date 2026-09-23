import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { matchSupplier } from "@/lib/supplierMatching";
import { invoiceTotals, parseInvoiceInput } from "./validation";

const invoiceInclude = {
  supplier: true,
  items: true,
} as const;

export async function GET() {
  const invoices = await prisma.invoicePurchase.findMany({
    include: invoiceInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Le corps de la requête doit être un JSON valide." },
      { status: 400 }
    );
  }

  const result = parseInvoiceInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const input = result.data;
  let supplierId = input.supplierId;

  if (supplierId === undefined) {
    const supplierMatch = await matchSupplier({
      name: input.supplierName ?? "",
      vatNumber: input.supplierVatNumber,
    });

    if (!supplierMatch.match) {
      return NextResponse.json(
        {
          error: "Aucun fournisseur correspondant trouvé.",
          matchType: supplierMatch.matchType,
          suggestions: supplierMatch.suggestion
            ? [supplierMatch.suggestion]
            : [],
        },
        { status: 422 }
      );
    }

    supplierId = supplierMatch.match.id;
  } else {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Le supplierId indiqué est invalide." }, { status: 400 });
    }
  }

  const stamp = input.stamp ?? new Prisma.Decimal(0);
  const customTaxes = input.customTaxes ?? null;
  const totals = invoiceTotals(input.items!, stamp, customTaxes);
  const invoice = await prisma.invoicePurchase.create({
    data: {
      number: input.number!,
      invoiceDate: input.invoiceDate!,
      currency: input.currency!,
      ...totals,
      stamp,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.customTaxes !== undefined ? { customTaxes: input.customTaxes ?? Prisma.JsonNull } : {}),
      ...(input.isVatDeductible !== undefined ? { isVatDeductible: input.isVatDeductible } : {}),
      supplier: { connect: { id: supplierId } },
      ...(input.filePath !== undefined ? { filePath: input.filePath } : {}),
      ...(input.mode !== undefined ? { mode: input.mode } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.validationErrors !== undefined ? { validationErrors: input.validationErrors ?? Prisma.JsonNull } : {}),
      ...(input.validatedById !== undefined ? { validatedById: input.validatedById } : {}),
      ...(input.validatedAt !== undefined ? { validatedAt: input.validatedAt } : {}),
      items: { create: input.items! },
    },
    include: invoiceInclude,
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
