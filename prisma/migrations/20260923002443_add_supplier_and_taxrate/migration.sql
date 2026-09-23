-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('INDIVIDUAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "TaxRateType" AS ENUM ('VAT', 'CORPORATE_TAX', 'OTHER');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "zip_code" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,
    "website" TEXT,
    "bank_details" TEXT,
    "vat_number" TEXT,
    "category_code" TEXT,
    "vat_code" TEXT,
    "secondary_est_number" TEXT,
    "type" "SupplierType" NOT NULL,
    "personal_id_number" TEXT,
    "birth_date" DATE,
    "vat_rate_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "rate" DECIMAL(4,2) NOT NULL,
    "is_free_amount" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "type" "TaxRateType" NOT NULL,
    "operation_code" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_applied_to_base_plus_specific" BOOLEAN NOT NULL DEFAULT false,
    "country_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_public_id_key" ON "suppliers"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_public_id_key" ON "tax_rates"("public_id");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_vat_rate_id_fkey" FOREIGN KEY ("vat_rate_id") REFERENCES "tax_rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
