import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = NextResponse.json(
    { error: "Email ou mot de passe incorrect." },
    { status: 401 }
  );

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return genericError;
  }

  if (user.status === "PENDING") {
    return NextResponse.json(
      { error: "Compte en attente d'approbation par un administrateur." },
      { status: 403 }
    );
  }

  if (user.status === "DECLINED") {
    return NextResponse.json(
      { error: "Ce compte n'a pas été approuvé." },
      { status: 403 }
    );
  }

  const token = await new SignJWT({ userId: user.publicId, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  const response = NextResponse.json({
    message: "Connexion réussie.",
    user: { id: user.publicId, email: user.email, role: user.role },
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}