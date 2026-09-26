import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupees } from "@/lib/date";
import { parseCreditInfo } from "@/lib/khata";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || (user.user_metadata?.full_name as string) || user.email;

  const { data: fields } = await supabase
    .from("fields")
    .select("id, name, crop_name, area_acres, start_date, is_completed, total_income")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: expenses } = await supabase
    .from("expenses")
    .select("field_id, amount, notes")
    .eq("user_id", user.id);

  const { data: incomes } = await supabase
    .from("incomes")
    .select("field_id, amount")
    .eq("user_id", user.id);

  const expensesByField = new Map<string, number>();
  let grandTotalSpent = 0;
  let grandTotalCreditDues = 0;

  for (const e of expenses ?? []) {
    const amt = Number(e.amount);
    grandTotalSpent += amt;
    expensesByField.set(e.field_id, (expensesByField.get(e.field_id) ?? 0) + amt);

    if (parseCreditInfo(e.notes).isCredit) {
      grandTotalCreditDues += amt;
    }
  }

  const incomesByField = new Map<string, number>();
  let grandTotalIncome = 0;
  for (const i of incomes ?? []) {
    const amt = Number(i.amount);
    grandTotalIncome += amt;
    incomesByField.set(i.field_id, (incomesByField.get(i.field_id) ?? 0) + amt);
  }

  // Fallback to f.total_income if incomes table is empty or missing entries
  for (const f of fields ?? []) {
    if (!incomesByField.has(f.id) && Number(f.total_income || 0) > 0) {
      const amt = Number(f.total_income);
      incomesByField.set(f.id, amt);
      grandTotalIncome += amt;
    }
  }

  const grandNetPnL = grandTotalIncome - grandTotalSpent;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 pb-24">
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Custom App Logo */}
            <img
              src="/icons/icon-main.jpg"
              alt="Farm Emblem Logo"
              className="h-10 w-10 rounded-xl shadow-sm border border-forest/20 object-cover"
            />
            <div>
              <h1 className="font-display text-2xl font-semibold text-forest mb-0.5">
                Welcome, {userName} 👋
              </h1>
              <p className="text-sm text-ink/60">Farm Financial Overview</p>
            </div>
          </div>

          <LogoutButton />
        </div>

        {/* OVERALL FARM PROFIT & LOSS CARD */}
        <div className="card p-4 bg-forest/5 border-forest/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-ink/60">Total Spent</p>
              <p className="font-display text-base sm:text-lg font-semibold text-mustard">{formatRupees(grandTotalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/60">Total Income</p>
              <p className="font-display text-base sm:text-lg font-semibold text-sprout">{formatRupees(grandTotalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/60">Net P&L</p>
              {grandNetPnL > 0 ? (
                <p className="font-display text-base sm:text-lg font-bold text-sprout">+ {formatRupees(grandNetPnL)}</p>
              ) : grandNetPnL < 0 ? (
                <p className="font-display text-base sm:text-lg font-bold text-clay">- {formatRupees(Math.abs(grandNetPnL))}</p>
              ) : (
                <p className="font-display text-base sm:text-lg font-semibold text-ink/70">₹0</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <h2 className="font-display text-xl font-semibold text-forest">Your Crops & Fields</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/khata"
            className="rounded-lg border border-clay/30 bg-clay/5 px-3 py-1.5 text-xs font-semibold text-clay hover:bg-clay hover:text-paper transition-colors flex items-center gap-1 active:scale-95"
          >
            📖 Khata {grandTotalCreditDues > 0 ? `(${formatRupees(grandTotalCreditDues)})` : ""}
          </Link>
          <Link href="/fields/new" className="btn-primary py-1.5 px-3.5 text-xs active:scale-95">
            + Add crop
          </Link>
        </div>
      </div>

      {(!fields || fields.length === 0) && (
        <div className="card p-6 text-center">
          <p className="text-ink/70">You haven&apos;t added a field or crop yet.</p>
          <Link href="/fields/new" className="btn-primary mt-4 inline-flex">
            Add your first crop
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {(fields ?? []).map((f) => {
          const spent = expensesByField.get(f.id) ?? 0;
          const income = incomesByField.get(f.id) ?? 0;
          const netPnL = income - spent;

          return (
            <li key={f.id}>
              <Link
                href={`/fields/${f.id}`}
                className="card flex flex-col gap-3 p-4 hover:border-sprout transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink text-base">
                        {f.crop_name || f.name}
                      </p>
                      {f.is_completed ? (
                        <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-semibold text-paper">
                          Harvest Completed
                        </span>
                      ) : (
                        <span className="rounded-full bg-sprout/20 px-2 py-0.5 text-[10px] font-semibold text-forest">
                          Active Crop
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/60 mt-0.5">
                      {f.crop_name && f.name && f.name !== f.crop_name ? `${f.name} · ` : ""}
                      {f.area_acres ? `${f.area_acres} acres · ` : ""}
                      since {new Date(f.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  
                  {/* P&L Status Badge */}
                  <div>
                    {income > 0 ? (
                      netPnL > 0 ? (
                        <span className="inline-block rounded-md bg-sprout/15 px-2.5 py-1 text-xs font-bold text-sprout">
                          + {formatRupees(netPnL)} Profit
                        </span>
                      ) : netPnL < 0 ? (
                        <span className="inline-block rounded-md bg-clay/15 px-2.5 py-1 text-xs font-bold text-clay">
                          - {formatRupees(Math.abs(netPnL))} Loss
                        </span>
                      ) : (
                        <span className="inline-block rounded-md bg-line px-2.5 py-1 text-xs font-semibold text-ink/70">
                          Break-even
                        </span>
                      )
                    ) : (
                      <p className="font-display text-base font-semibold text-mustard">
                        {formatRupees(spent)} spent
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line/60 pt-2.5 text-xs text-ink/70">
                  <span>Spent: <strong className="text-mustard">{formatRupees(spent)}</strong></span>
                  <span>Returns: <strong className="text-sprout">{formatRupees(income)}</strong></span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
