-- CreateEnum
CREATE TYPE "InvoiceMode" AS ENUM ('OCR_LLM', 'HANDWRITTEN');

-- CreateEnum
CREATE TYPE "InvoiceWorkflowStatus" AS ENUM ('EXTRACTED', 'TO_VERIFY', 'VALIDATED', 'EXPORTED');

-- CreateTable
CREATE TABLE "invoices_purchases" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "total_before_tax" DECIMAL(10,3) NOT NULL,
    "stamp" DECIMAL(10,3) NOT NULL,
    "tax_amount" DECIMAL(10,3) NOT NULL,
    "total_after_tax_without_stamp" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "total_after_tax_with_stamp" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "due_date" DATE,
    "custom_taxes" JSONB,
    "is_vat_deductible" BOOLEAN NOT NULL DEFAULT false,
    "supplier_id" INTEGER NOT NULL,
    "file_path" TEXT,
    "mode" "InvoiceMode",
    "status" "InvoiceWorkflowStatus" NOT NULL DEFAULT 'EXTRACTED',
    "validation_errors" JSONB,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items_purchases" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" DECIMAL(10,1) NOT NULL,
    "unit_price" DECIMAL(10,3) NOT NULL,
    "total_before_tax" DECIMAL(10,3) NOT NULL,
    "tax_rate" DECIMAL(4,2) NOT NULL,
    "tax_amount" DECIMAL(10,3) NOT NULL,
    "total_after_tax" DECIMAL(10,3) NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_purchases_public_id_key" ON "invoices_purchases"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_purchases_public_id_key" ON "invoice_items_purchases"("public_id");

-- AddForeignKey
ALTER TABLE "invoices_purchases" ADD CONSTRAINT "invoices_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items_purchases" ADD CONSTRAINT "invoice_items_purchases_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
