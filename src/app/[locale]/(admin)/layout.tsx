import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { publicId: session.userId },
    select: { email: true, role: true },
  });

  return (
    <AdminShell email={user?.email ?? ""} role={user?.role ?? ""}>
      {children}
    </AdminShell>
  );
}