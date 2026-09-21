import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const statuses = ["PENDING", "APPROVED", "DECLINED"] as const;

export async function GET(request: NextRequest) {
  if (request.headers.get("x-user-role") !== "VALIDATEUR") {
    return NextResponse.json(
      { error: "Accès réservé aux validateurs." },
      { status: 403 }
    );
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = statuses.includes(statusParam as (typeof statuses)[number])
    ? (statusParam as (typeof statuses)[number])
    : undefined;

  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}