import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export type SupplierMatchResult = {
  match: Prisma.SupplierGetPayload<{}> | null;
  matchType: "EXACT_VAT" | "FUZZY_NAME" | "NONE";
  confidence?: number;
  suggestion?: {
    supplier: Prisma.SupplierGetPayload<{}>;
    confidence: number;
  };
};

type SimilarSupplier = {
  id: number;
  similarity: number;
};

export async function matchSupplier(input: {
  vatNumber?: string | null;
  name: string;
}): Promise<SupplierMatchResult> {
  const vatNumber = input.vatNumber?.trim();
  const name = input.name.trim();

  if (vatNumber) {
    const exactVat = await prisma.$queryRaw<[{ id: number }?]>(Prisma.sql`
      SELECT id
      FROM suppliers
      WHERE vat_number IS NOT NULL
        AND LOWER(TRIM(vat_number)) = LOWER(TRIM(${vatNumber}))
      LIMIT 1
    `);

    if (exactVat[0]) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: exactVat[0].id },
      });
      if (supplier) {
        return { match: supplier, matchType: "EXACT_VAT" };
      }
    }
  }

  if (!name) {
    return { match: null, matchType: "NONE" };
  }

  const similarSuppliers = await prisma.$queryRaw<SimilarSupplier[]>(Prisma.sql`
    SELECT id, similarity(name, ${name}) AS similarity
    FROM suppliers
    ORDER BY similarity(name, ${name}) DESC
    LIMIT 1
  `);
  const best = similarSuppliers[0];

  if (!best) {
    return { match: null, matchType: "NONE" };
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: best.id } });
  if (!supplier) {
    return { match: null, matchType: "NONE" };
  }

  if (best.similarity >= 0.3) {
    return {
      match: supplier,
      matchType: "FUZZY_NAME",
      confidence: best.similarity,
    };
  }

  return {
    match: null,
    matchType: "NONE",
    suggestion: { supplier, confidence: best.similarity },
  };
}
