import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import InvoicesTable from "@/components/invoices/InvoicesTable";

export default function InvoicesPage() {
  return (
    <div>
      <PageBreadCrumb pageTitle="Invoices" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Purchase invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Extracted and manually entered purchase invoices.
          </p>
        </div>
        <InvoicesTable />
      </div>
    </div>
  );
}