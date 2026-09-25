import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRupees, formatDateLong } from "@/lib/date";
import { categoryLabel, categoryIcon } from "@/lib/categories";
import { deleteExpense, deleteField, deleteIncome, sendFieldEmailReport, toggleCropComplete, settleExpenseCredit } from "@/app/actions";
import { parseCreditInfo } from "@/lib/khata";

export default async function FieldDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { success?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: field } = await supabase
    .from("fields")
    .select("id, name, crop_name, area_acres, start_date, is_completed, total_income")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!field) notFound();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, custom_label, amount, expense_date, notes")
    .eq("field_id", field.id)
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: incomes } = await supabase
    .from("incomes")
    .select("id, amount, income_date, source_notes")
    .eq("field_id", field.id)
    .eq("user_id", user.id)
    .order("income_date", { ascending: false });

  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = (incomes ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const netPnL = totalIncome - totalExpenses;

  const totalCreditDues = (expenses ?? []).reduce((sum, e) => {
    const cred = parseCreditInfo(e.notes);
    return cred.isCredit ? sum + Number(e.amount) : sum;
  }, 0);

  // Group expenses by date
  const expenseGroups: { date: string; total: number; items: typeof expenses }[] = [];
  for (const e of expenses ?? []) {
    const last = expenseGroups[expenseGroups.length - 1];
    if (last && last.date === e.expense_date) {
      last.total += Number(e.amount);
      last.items!.push(e);
    } else {
      expenseGroups.push({ date: e.expense_date, total: Number(e.amount), items: [e] });
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 pb-32">
      <Link href="/dashboard" className="text-sm text-ink/50 underline underline-offset-2">
        ← All fields
      </Link>

      {searchParams?.success && (
        <div className="mt-3 rounded-md bg-sprout/15 px-4 py-3 text-sm font-semibold text-sprout">
          ✓ {searchParams.success}
        </div>
      )}

      {searchParams?.error && (
        <div className="mt-3 rounded-md bg-clay/10 px-4 py-3 text-sm font-semibold text-clay">
          ⚠️ {searchParams.error}
        </div>
      )}

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-forest">
              {field.crop_name || field.name}
            </h1>
            {field.is_completed ? (
              <span className="rounded-full bg-forest px-2.5 py-0.5 text-xs font-semibold text-paper">
                Harvest Completed
              </span>
            ) : (
              <span className="rounded-full bg-sprout/20 px-2.5 py-0.5 text-xs font-semibold text-forest">
                Active Crop
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {field.crop_name && field.name && field.name !== field.crop_name ? `${field.name} · ` : ""}
            {field.area_acres ? `${field.area_acres} acres · ` : ""}
            since {formatDateLong(field.start_date)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Link href={`/fields/${field.id}/export`} className="text-sm font-semibold text-forest underline underline-offset-2">
            Export CSV
          </Link>
          <form action={sendFieldEmailReport}>
            <input type="hidden" name="field_id" value={field.id} />
            <button
              type="submit"
              className="rounded-md bg-forest/10 px-3 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-paper transition-colors"
            >
              📩 Email Report
            </button>
          </form>
        </div>
      </div>

      {/* PROFIT & LOSS SUMMARY CARD */}
      <div className="card mt-5 p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-display text-lg font-semibold text-forest">Crop Financial Return (P&L)</h2>
          <form action={toggleCropComplete}>
            <input type="hidden" name="field_id" value={field.id} />
            <input type="hidden" name="is_completed" value={String(field.is_completed)} />
            <button
              type="submit"
              className={`rounded px-3 py-1 text-xs font-semibold border ${
                field.is_completed
                  ? "border-forest text-forest hover:bg-forest/10"
                  : "border-sprout bg-sprout text-paper hover:bg-[#3d6431]"
              }`}
            >
              {field.is_completed ? "Reopen Crop Season" : "✓ Mark Crop Harvested"}
            </button>
          </form>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-center sm:grid-cols-3">
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs text-ink/60">Total Spent (Investment)</p>
            <p className="font-display text-lg font-semibold text-mustard">{formatRupees(totalExpenses)}</p>
          </div>
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs text-ink/60">Total Return (Harvest Sale)</p>
            <p className="font-display text-lg font-semibold text-sprout">{formatRupees(totalIncome)}</p>
          </div>
          <div className="col-span-2 rounded-md bg-paper p-3 sm:col-span-1">
            <p className="text-xs text-ink/60">Net Profit / Loss</p>
            {netPnL > 0 ? (
              <p className="font-display text-lg font-bold text-sprout">+ {formatRupees(netPnL)} 🎉</p>
            ) : netPnL < 0 ? (
              <p className="font-display text-lg font-bold text-clay">- {formatRupees(Math.abs(netPnL))} ⚠️</p>
            ) : (
              <p className="font-display text-lg font-semibold text-ink/70">Break Even (₹0)</p>
            )}
          </div>
        </div>

        {totalCreditDues > 0 && (
          <div className="mt-3 rounded-md bg-clay/10 p-2.5 text-center text-xs font-semibold text-clay">
            📕 Pending Credit Dues (Udhar): {formatRupees(totalCreditDues)} to be settled
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Link
            href={`/fields/${field.id}/add-income`}
            className="rounded-md bg-sprout px-4 py-2 text-xs font-semibold text-paper hover:bg-[#3d6431] transition-colors"
          >
            💰 + Record Harvest Income
          </Link>
        </div>
      </div>

      {/* HARVEST INCOME LIST */}
      {(incomes && incomes.length > 0) && (
        <section className="mt-6">
          <h3 className="font-display text-lg font-semibold text-forest mb-2">💰 Harvest Sales & Income</h3>
          <ul className="card flex flex-col divide-y divide-line p-3">
            {incomes.map((inc) => (
              <li key={inc.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-semibold text-sprout">{formatRupees(Number(inc.amount))}</p>
                  <p className="text-xs text-ink/60">
                    {formatDateLong(inc.income_date)}{inc.source_notes ? ` · ${inc.source_notes}` : ""}
                  </p>
                </div>
                <form action={deleteIncome}>
                  <input type="hidden" name="id" value={inc.id} />
                  <input type="hidden" name="field_id" value={field.id} />
                  <button
                    type="submit"
                    aria-label="Delete income"
                    className="rounded px-2 py-1 text-xs text-ink/30 hover:bg-clay/10 hover:text-clay"
                  >
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* EXPENSE LEDGER */}
      <h3 className="font-display text-lg font-semibold text-forest mt-8 mb-2">💸 Expense Ledger</h3>
      {(!expenses || expenses.length === 0) && (
        <div className="card p-6 text-center">
          <p className="text-ink/70">No expenses logged yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {expenseGroups.map((g) => (
          <section key={g.date}>
            <div className="mb-2 flex items-baseline justify-between border-b-2 border-forest pb-1">
              <h3 className="font-semibold text-forest">{formatDateLong(g.date)}</h3>
              <p className="text-sm font-semibold text-ink/70">Day total: {formatRupees(g.total)}</p>
            </div>
            <ul className="flex flex-col">
              {g.items!.map((e) => {
                const cred = parseCreditInfo(e.notes);

                return (
                  <li key={e.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-none">
                    <span className="text-xl" aria-hidden>{categoryIcon(e.category)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-ink">{categoryLabel(e.category, e.custom_label)}</p>
                        {cred.isCredit && (
                          <span className="rounded bg-clay/15 px-2 py-0.5 text-[10px] font-bold text-clay">
                            📕 Udhar{cred.lenderName ? `: ${cred.lenderName}` : ""}
                          </span>
                        )}
                      </div>
                      {cred.cleanNotes && <p className="text-xs text-ink/50">{cred.cleanNotes}</p>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{formatRupees(Number(e.amount))}</p>
                      
                      {cred.isCredit && (
                        <form action={settleExpenseCredit}>
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="field_id" value={field.id} />
                          <button
                            type="submit"
                            title="Mark as paid / settled"
                            className="rounded bg-sprout/15 px-2 py-1 text-[11px] font-semibold text-sprout hover:bg-sprout hover:text-paper transition-colors"
                          >
                            ✓ Settle
                          </button>
                        </form>
                      )}

                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="field_id" value={field.id} />
                        <button
                          type="submit"
                          aria-label="Delete expense"
                          className="ml-1 rounded px-2 py-1 text-ink/30 hover:bg-clay/10 hover:text-clay"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-4">
        <form action={deleteField}>
          <input type="hidden" name="id" value={field.id} />
          <button type="submit" className="btn-danger py-2 px-4 text-sm">
            Delete this field
          </button>
        </form>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 shadow-lg">
        <Link
          href={`/fields/${field.id}/add-expense`}
          className="btn-primary py-3 px-5 text-sm"
        >
          + Add expense
        </Link>
        <Link
          href={`/fields/${field.id}/add-income`}
          className="btn-primary py-3 px-5 text-sm bg-sprout hover:bg-[#3d6431]"
        >
          💰 Add income
        </Link>
      </div>
    </main>
  );
}
