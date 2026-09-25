// All dates in this app are handled as IST (India Standard Time, UTC+5:30)
// calendar dates, since that's the farmer's local day regardless of which
// UTC-based server the code happens to run on.

export function istTodayISO(): string {
  const now = new Date();
  const istMs = now.getTime() + (5.5 * 60 + now.getTimezoneOffset()) * 60 * 1000;
  const ist = new Date(istMs);
  return ist.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}
