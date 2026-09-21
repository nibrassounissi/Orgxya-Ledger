import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const normalizedName = typeof name === "string" ? name.trim() : null;
  if (normalizedName && normalizedName.length > 100) {
    return NextResponse.json(
      { error: "Le nom ne peut pas dépasser 100 caractères." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email,
      passwordHash,
      role: "OPERATEUR",
      status: "PENDING",
    },
  });

  return NextResponse.json(
    {
      message: "Compte créé. En attente d'approbation par un administrateur.",
      userId: user.publicId,
    },
    { status: 201 }
  );
}