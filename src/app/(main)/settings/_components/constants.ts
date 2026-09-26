export interface CategoryItem {
  id: number;
  name: string;
  defaultType: "fixed" | "variable";
  color: string | null;
  sortOrder: number;
  createdAt?: string;
}

export const CATEGORY_PALETTE = [
  { label: "Violet", hex: "#713CE9" },
  { label: "Coral", hex: "#E9713C" },
  { label: "Emerald", hex: "#10B981" },
  { label: "Sky", hex: "#0EA5E9" },
  { label: "Indigo", hex: "#6366F1" },
  { label: "Rose", hex: "#F43F5E" },
  { label: "Amber", hex: "#F59E0B" },
  { label: "Teal", hex: "#14B8A6" },
  { label: "Fuchsia", hex: "#D946EF" },
  { label: "Slate", hex: "#64748B" },
];

export const STARTER_CATEGORIES = [
  { name: "Groceries", defaultType: "variable" as const, color: "#10B981" },
  {
    name: "Bills & Utilities",
    defaultType: "fixed" as const,
    color: "#F59E0B",
  },
  { name: "Rent & Housing", defaultType: "fixed" as const, color: "#713CE9" },
  {
    name: "Transport & Fuel",
    defaultType: "variable" as const,
    color: "#0EA5E9",
  },
  { name: "Dining & Food", defaultType: "variable" as const, color: "#E9713C" },
  { name: "Entertainment", defaultType: "variable" as const, color: "#F43F5E" },
  { name: "Shopping", defaultType: "variable" as const, color: "#6366F1" },
  {
    name: "Investments & SIP",
    defaultType: "fixed" as const,
    color: "#14B8A6",
  },
  { name: "Miscellaneous", defaultType: "variable" as const, color: "#64748B" },
];
