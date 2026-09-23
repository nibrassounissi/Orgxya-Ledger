import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseSupplierInput } from "./validation";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ suppliers });
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

  const result = parseSupplierInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
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

  const { name, city, country, type, taxRateId, ...supplierData } = result.data;
  const supplier = await prisma.supplier.create({
    data: {
      name: name!,
      city: city!,
      country: country!,
      type: type!,
      ...supplierData,
      ...(taxRateId !== undefined && taxRateId !== null
        ? { taxRate: { connect: { id: taxRateId } } }
        : {}),
    },
  });
  return NextResponse.json({ supplier }, { status: 201 });
}
