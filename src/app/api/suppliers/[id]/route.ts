import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseId, parseSupplierInput } from "../validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant fournisseur invalide." }, { status: 400 });
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { taxRate: true },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });
  }

  return NextResponse.json({ supplier });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant fournisseur invalide." }, { status: 400 });
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

  const result = parseSupplierInput(body, true);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (Object.keys(result.data).length === 0) {
    return NextResponse.json(
      { error: "Au moins un champ à modifier est requis." },
      { status: 400 }
    );
  }

  if (result.data.taxRateId !== undefined && result.data.taxRateId !== null) {
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: result.data.taxRateId },
      select: { id: true },
    });
    if (!taxRate) {
      return NextResponse.json(
        { error: "Le taxRateId indiqué est invalide." },
        { status: 400 }
      );
    }
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: result.data,
  });
  return NextResponse.json({ supplier });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const id = parseId((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant fournisseur invalide." }, { status: 400 });
  }

  try {
    await prisma.supplier.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
