import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const roles = ["OPERATEUR", "VALIDATEUR"] as const;
const decisions = ["APPROVED", "DECLINED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (request.headers.get("x-user-role") !== "VALIDATEUR") {
    return NextResponse.json(
      { error: "Accès réservé aux validateurs." },
      { status: 403 }
    );
  }

  const reviewerId = request.headers.get("x-user-id");
  const { id } = await params;
  const body = await request.json();
  const { decision, assignedRole } = body;

  if (!decisions.includes(decision)) {
    return NextResponse.json(
      { error: "Décision invalide (APPROVED ou DECLINED attendu)." },
      { status: 400 }
    );
  }

  if (decision === "APPROVED" && !roles.includes(assignedRole)) {
    return NextResponse.json(
      { error: "Rôle invalide pour l'approbation." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: {
      status: decision,
      role: decision === "APPROVED" ? assignedRole : undefined,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: `Compte ${decision === "APPROVED" ? "approuvé" : "refusé"}.`,
    user: { id: user.id, email: user.email, role: user.role, status: user.status },
  });
}