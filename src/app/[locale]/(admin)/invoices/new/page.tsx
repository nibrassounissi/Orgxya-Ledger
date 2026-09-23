import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <div>
      <PageBreadCrumb pageTitle="New invoice" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
        <InvoiceForm />
      </div>
    </div>
  );
}