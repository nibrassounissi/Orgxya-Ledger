import { SupplierType } from "@/generated/prisma/enums";

const supplierTypes = Object.values(SupplierType);

const optionalStringFields = [
  "address",
  "zipCode",
  "phoneNumber",
  "email",
  "website",
  "bankDetails",
  "vatNumber",
  "categoryCode",
  "vatCode",
  "secondaryEstNumber",
  "personalIdNumber",
] as const;

export type SupplierInput = {
  name?: string;
  address?: string | null;
  zipCode?: string | null;
  city?: string;
  country?: string;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  bankDetails?: string | null;
  vatNumber?: string | null;
  categoryCode?: string | null;
  vatCode?: string | null;
  secondaryEstNumber?: string | null;
  type?: SupplierType;
  personalIdNumber?: string | null;
  birthDate?: Date | null;
  taxRateId?: number | null;
};

type ValidationResult =
  | { data: SupplierInput }
  | { error: string };

export function parseSupplierInput(
  body: unknown,
  partial = false
): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Le corps de la requête doit être un objet JSON." };
  }

  const input = body as Record<string, unknown>;
  const data: SupplierInput = {};

  for (const field of ["name", "city", "country"] as const) {
    if (!partial && typeof input[field] !== "string") {
      return { error: `Le champ ${field} est requis.` };
    }

    if (input[field] !== undefined) {
      if (typeof input[field] !== "string" || input[field].trim() === "") {
        return { error: `Le champ ${field} doit être une chaîne non vide.` };
      }
      data[field] = input[field].trim();
    }
  }

  if (input.type !== undefined) {
    if (
      typeof input.type !== "string" ||
      !supplierTypes.includes(input.type as SupplierType)
    ) {
      return { error: "Le champ type doit être INDIVIDUAL ou LEGAL." };
    }
    data.type = input.type as SupplierType;
  } else if (!partial) {
    return { error: "Le champ type est requis." };
  }

  for (const field of optionalStringFields) {
    if (input[field] !== undefined) {
      if (input[field] !== null && typeof input[field] !== "string") {
        return { error: `Le champ ${field} doit être une chaîne ou null.` };
      }
      data[field] = input[field] as string | null;
    }
  }

  if (input.birthDate !== undefined) {
    if (input.birthDate === null) {
      data.birthDate = null;
    } else if (typeof input.birthDate === "string") {
      const birthDate = new Date(input.birthDate);
      if (Number.isNaN(birthDate.getTime())) {
        return { error: "Le champ birthDate doit être une date valide." };
      }
      data.birthDate = birthDate;
    } else {
      return { error: "Le champ birthDate doit être une date ou null." };
    }
  }

  if (input.taxRateId !== undefined) {
    if (
      input.taxRateId !== null &&
      (typeof input.taxRateId !== "number" ||
        !Number.isInteger(input.taxRateId) ||
        input.taxRateId <= 0)
    ) {
      return { error: "Le champ taxRateId doit être un identifiant entier valide ou null." };
    }
    data.taxRateId = input.taxRateId as number | null;
  }

  return { data };
}

export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
