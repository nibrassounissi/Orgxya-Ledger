import { NextRequest, NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { invoiceTotals, parseId, parseInvoiceInput } from "../validation";

const invoiceInclude = {
  supplier: true,
  items: true,
} as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant facture invalide." }, { status: 400 });
  }

  const invoice = await prisma.invoicePurchase.findUnique({
    where: { id },
    include: invoiceInclude,
  });
  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant facture invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Le corps de la requête doit être un JSON valide." },
      { status: 400 }
    );
  }

  const result = parseInvoiceInput(body, true);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (Object.keys(result.data).length === 0) {
    return NextResponse.json(
      { error: "Au moins un champ à modifier est requis." },
      { status: 400 }
    );
  }

  const existing = await prisma.invoicePurchase.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  const input = result.data;
  const supplierId = input.supplierId ?? existing.supplierId;
  if (input.supplierId !== undefined) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
      select: { id: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Le supplierId indiqué est invalide." }, { status: 400 });
    }
  }

  const stamp = input.stamp ?? existing.stamp;
  const customTaxes = input.customTaxes !== undefined ? input.customTaxes : existing.customTaxes;
  const items = input.items ?? existing.items;
  const totals = invoiceTotals(items, stamp, customTaxes);
  const updateData = {
    ...(input.number !== undefined ? { number: input.number } : {}),
    ...(input.invoiceDate !== undefined ? { invoiceDate: input.invoiceDate } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...totals,
    ...(input.stamp !== undefined ? { stamp: input.stamp } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.customTaxes !== undefined ? { customTaxes: input.customTaxes ?? Prisma.JsonNull } : {}),
    ...(input.isVatDeductible !== undefined ? { isVatDeductible: input.isVatDeductible } : {}),
    ...(input.supplierId !== undefined ? { supplier: { connect: { id: supplierId } } } : {}),
    ...(input.filePath !== undefined ? { filePath: input.filePath } : {}),
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.validationErrors !== undefined ? { validationErrors: input.validationErrors ?? Prisma.JsonNull } : {}),
    ...(input.validatedById !== undefined ? { validatedById: input.validatedById } : {}),
    ...(input.validatedAt !== undefined ? { validatedAt: input.validatedAt } : {}),
  };

  const invoice = await prisma.$transaction(async (transaction) => {
    if (input.items !== undefined) {
      await transaction.invoicePurchaseItem.deleteMany({ where: { invoiceId: id } });
    }
    return transaction.invoicePurchase.update({
      where: { id },
      data: {
        ...updateData,
        ...(input.items !== undefined ? { items: { create: input.items } } : {}),
      },
      include: invoiceInclude,
    });
  });

  return NextResponse.json({ invoice });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant facture invalide." }, { status: 400 });
  }

  try {
    await prisma.invoicePurchase.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
