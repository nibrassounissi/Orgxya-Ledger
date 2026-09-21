import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const newPassword = "changeme123";
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email: "admin@orgaxya.test" },
    data: { passwordHash },
  });

  console.log("Password reset for:", user.email);
}

main().finally(() => prisma.$disconnect());

