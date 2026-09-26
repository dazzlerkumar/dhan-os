export function formatCurrency(
  value: number | string | null | undefined,
  options?: {
    showDecimals?: boolean;
    currency?: string;
  },
): string {
  if (value === null || value === undefined) return "₹0";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return "₹0";

  const showDecimals = options?.showDecimals ?? true;
  const currencySymbol = options?.currency ?? "₹";

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);

  return `${currencySymbol}${formatted}`;
}

export function formatMonthDisplay(monthStr: string): string {
  if (!monthStr || !/^\d{4}-\d{2}(-\d{2})?$/.test(monthStr)) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthNumStr, 10) - 1;
  const date = new Date(year, month, 1);

  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10) - 1;
  const day = Number.parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
