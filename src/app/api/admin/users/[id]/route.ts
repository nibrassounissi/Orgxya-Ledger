import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const roles = ["OPERATEUR", "VALIDATEUR"] as const;
const decisions = [
  "APPROVED",
  "DECLINED",
  "ROLE_CHANGE",
  "SUSPEND",
  "REACTIVATE",
] as const;

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

  if (!reviewerId) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  if (!decisions.includes(decision)) {
    return NextResponse.json(
      { error: "Décision invalide (APPROVED ou DECLINED attendu)." },
      { status: 400 }
    );
  }

  if (
    (decision === "APPROVED" || decision === "ROLE_CHANGE") &&
    !roles.includes(assignedRole)
  ) {
    return NextResponse.json(
      { error: "Rôle invalide pour l'approbation." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: { id: true, publicId: true, role: true, status: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  if (
    (decision === "SUSPEND" ||
      (decision === "ROLE_CHANGE" && assignedRole === "OPERATEUR")) &&
    target.publicId === reviewerId
  ) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas suspendre ou rétrograder votre propre compte." },
      { status: 400 }
    );
  }

  if (decision === "ROLE_CHANGE" && target.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Seuls les comptes approuvés peuvent changer de rôle." },
      { status: 400 }
    );
  }

  if (decision === "SUSPEND" && target.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Seuls les comptes approuvés peuvent être suspendus." },
      { status: 400 }
    );
  }

  if (decision === "REACTIVATE" && target.status !== "SUSPENDED") {
    return NextResponse.json(
      { error: "Seuls les comptes suspendus peuvent être réactivés." },
      { status: 400 }
    );
  }

  const isStatusChange = ["APPROVED", "DECLINED", "SUSPEND", "REACTIVATE"].includes(
    decision,
  );
  const nextStatus =
    decision === "SUSPEND"
      ? "SUSPENDED"
      : decision === "REACTIVATE"
        ? "APPROVED"
        : decision === "ROLE_CHANGE"
          ? undefined
          : decision;

  const user = await prisma.user.update({
    where: { id: target.id },
    data: {
      status: nextStatus,
      role:
        decision === "APPROVED" || decision === "ROLE_CHANGE"
          ? assignedRole
          : undefined,
      reviewedById: reviewerId,
      reviewedAt: isStatusChange ? new Date() : undefined,
    },
  });

  return NextResponse.json({
    message:
      decision === "APPROVED"
        ? "Compte approuvé."
        : decision === "DECLINED"
          ? "Compte refusé."
          : decision === "SUSPEND"
            ? "Compte suspendu."
            : decision === "REACTIVATE"
              ? "Compte réactivé."
              : "Rôle mis à jour.",
    user: {
      id: user.id,
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
}