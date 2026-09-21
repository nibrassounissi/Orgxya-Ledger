import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { publicId: session.userId },
    select: {
      publicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json();
  const { name, email } = body;

  if (name !== undefined && name !== null && typeof name !== "string") {
    return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  }

  const normalizedName =
    name === null ? null : typeof name === "string" ? name.trim() : undefined;

  if (normalizedName !== undefined && normalizedName !== null && normalizedName.length === 0) {
    return NextResponse.json(
      { error: "Le nom ne peut pas être vide." },
      { status: 400 }
    );
  }

  if (normalizedName !== undefined && normalizedName !== null && normalizedName.length > 100) {
    return NextResponse.json(
      { error: "Le nom ne peut pas dépasser 100 caractères." },
      { status: 400 }
    );
  }

  if (email !== undefined && (typeof email !== "string" || !email.trim())) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const normalizedEmail = typeof email === "string" ? email.trim() : undefined;

  if (normalizedEmail !== undefined) {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.publicId !== session.userId) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé par un autre compte." },
        { status: 409 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { publicId: session.userId },
    data: {
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
    },
    select: {
      id: true,
      publicId: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return NextResponse.json({ message: "Profil mis à jour.", user });
}