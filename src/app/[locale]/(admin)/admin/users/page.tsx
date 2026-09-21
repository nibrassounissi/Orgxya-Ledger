import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import UsersApprovalTable from "@/components/user-profile/UsersApprovalTable";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getSession();

  if (session?.role !== "VALIDATEUR") {
    redirect("/");
  }

  return (
    <div>
      <PageBreadCrumb pageTitle="User approvals" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Pending users
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review account requests before granting access.
          </p>
        </div>
        <UsersApprovalTable />
      </div>
    </div>
  );
}
