import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DangerZone from "@/components/user-profile/DangerZone";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Security from "@/components/user-profile/Security";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | Orgaxya Ledger",
  description:
    "Manage your Orgaxya Ledger profile and account settings.",
};

export default async function Profile() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { publicId: session.userId },
        select: { name: true, email: true, role: true },
      })
    : null;

  return (
    <div>
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 lg:mb-7 dark:text-white/90">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard
            name={user?.name ?? null}
            email={user?.email ?? ""}
            role={user?.role ?? ""}
          />
          <UserAddressCard />
          <Security />
          <DangerZone />
        </div>
      </div>
    </div>
  );
}
