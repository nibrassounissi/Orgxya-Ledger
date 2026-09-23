import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import SuppliersManager from "@/components/suppliers/SuppliersManager";

export default function SuppliersPage() {
  return (
    <div>
      <PageBreadCrumb pageTitle="Suppliers" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Suppliers
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Suppliers used to match and enter purchase invoices.
          </p>
        </div>
        <SuppliersManager />
      </div>
    </div>
  );
}