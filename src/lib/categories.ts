export type CategoryId =
  | "labour"
  | "fertilizer"
  | "machine"
  | "diesel"
  | "food"
  | "rent"
  | "other";

export const EXPENSE_CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "labour", label: "Daily Workers / Labour", icon: "👷" },
  { id: "fertilizer", label: "Fertilizer & Pesticides", icon: "🌱" },
  { id: "machine", label: "Machine Rental", icon: "🚜" },
  { id: "diesel", label: "Tractor Diesel / Fuel", icon: "⛽" },
  { id: "food", label: "Workers' Food", icon: "🍱" },
  { id: "rent", label: "Land Rent", icon: "📄" },
  { id: "other", label: "Other", icon: "➕" }
];

export function categoryLabel(id: string, customLabel?: string | null) {
  if (id === "other" && customLabel) return customLabel;
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryIcon(id: string) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.icon ?? "💰";
}
