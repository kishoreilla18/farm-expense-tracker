import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRupees, formatDateLong } from "@/lib/date";
import { categoryLabel, categoryIcon } from "@/lib/categories";
import { parseCreditInfo } from "@/lib/khata";
import { settleExpenseCredit, deleteExpense, recordPartialPayment } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import LogoutButton from "@/components/LogoutButton";

export default async function KhataPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fields } = await supabase
    .from("fields")
    .select("id, name, crop_name")
    .eq("user_id", user.id);

  const fieldMap = new Map<string, string>();
  for (const f of fields ?? []) {
    fieldMap.set(f.id, f.crop_name || f.name);
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, field_id, category, custom_label, amount, expense_date, notes")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false });

  const pendingUdharList = (expenses ?? []).filter((e) => {
    const cred = parseCreditInfo(e.notes, Number(e.amount));
    return cred.isCredit && cred.pendingBalance > 0;
  });

  const totalUdharAmount = pendingUdharList.reduce((s, e) => {
    return s + parseCreditInfo(e.notes, Number(e.amount)).pendingBalance;
  }, 0);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 pb-24">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 rounded-lg border border-forest/20 bg-forest/5 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/10 transition-colors"
        >
          ← Dashboard
        </Link>
        <LogoutButton />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">
            📖 Khata / Pending Credit & Worker Dues
          </h1>
          <p className="text-sm text-ink/60 mt-0.5">
            Track unpaid shop bills and worker wages to pay in parts or settle after harvest sales.
          </p>
        </div>
      </div>

      {/* OVERALL UDHAR SUMMARY CARD */}
      <div className="card mt-5 p-5 bg-clay/5 border-clay/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-clay uppercase tracking-wider">Total Pending Dues</p>
            <p className="font-display text-3xl font-bold text-clay mt-1">
              {formatRupees(totalUdharAmount)}
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-clay px-3 py-1 text-xs font-bold text-paper">
              {pendingUdharList.length} {pendingUdharList.length === 1 ? "Unsettled Bill" : "Unsettled Bills"}
            </span>
          </div>
        </div>
      </div>

      {/* PENDING BILLS LIST */}
      <h2 className="font-display text-xl font-semibold text-forest mt-8 mb-3">
        Unsettled Bills & Worker Wages
      </h2>

      {pendingUdharList.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg">🎉 Great news!</p>
          <p className="text-sm text-ink/70 mt-1">
            You have zero pending credit bills or worker wage debts.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {pendingUdharList.map((e) => {
            const totalAmt = Number(e.amount);
            const cred = parseCreditInfo(e.notes, totalAmt);
            const cropOrFieldName = fieldMap.get(e.field_id) || "Unknown Crop";

            return (
              <li key={e.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden>{categoryIcon(e.category)}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-ink text-base">
                          {categoryLabel(e.category, e.custom_label)}
                        </p>
                        <span className="rounded bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest">
                          🌱 {cropOrFieldName}
                        </span>
                      </div>
                      {cred.lenderName && (
                        <p className="text-xs font-semibold text-clay mt-0.5">
                          🏪 Shop / Worker: {cred.lenderName}
                        </p>
                      )}
                      <p className="text-xs text-ink/60 mt-0.5">
                        Date: {formatDateLong(e.expense_date)}
                        {cred.cleanNotes ? ` · ${cred.cleanNotes}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-base font-semibold text-ink/70">
                      Total: {formatRupees(totalAmt)}
                    </p>
                    <p className="font-display text-lg font-bold text-clay">
                      Due: {formatRupees(cred.pendingBalance)}
                    </p>
                  </div>
                </div>

                {/* ACTION BAR: RECORD PARTIAL PAYMENT OR SETTLE ALL */}
                <div className="flex items-center justify-between border-t border-line pt-3 flex-wrap gap-2 text-xs">
                  <span className="text-ink/70">
                    Paid: <strong className="text-sprout">{formatRupees(cred.paidAmount)}</strong> | Remaining: <strong className="text-clay">{formatRupees(cred.pendingBalance)}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <form action={recordPartialPayment} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="field_id" value={e.field_id} />
                      <input type="hidden" name="redirect_to" value="/khata" />
                      <input
                        name="payment_add_amount"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="Pay ₹"
                        className="w-20 px-2 py-1 border border-line rounded text-xs"
                      />
                      <SubmitButton
                        loadingText="Paying..."
                        className="rounded bg-mustard/20 px-2.5 py-1 font-semibold text-forest hover:bg-mustard transition-colors text-xs"
                      >
                        - Pay Part
                      </SubmitButton>
                    </form>

                    <form action={settleExpenseCredit}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="field_id" value={e.field_id} />
                      <input type="hidden" name="redirect_to" value="/khata" />
                      <SubmitButton
                        loadingText="Settling..."
                        confirmText="Are you sure you want to mark this credit / worker bill as fully settled?"
                        className="rounded bg-sprout px-3 py-1 text-xs font-semibold text-paper hover:bg-[#3d6431] transition-colors"
                      >
                        ✓ Settle All
                      </SubmitButton>
                    </form>

                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="field_id" value={e.field_id} />
                      <input type="hidden" name="redirect_to" value="/khata" />
                      <SubmitButton
                        loadingText="..."
                        confirmText="Are you sure you want to delete this expense record?"
                        aria-label="Delete bill"
                        className="rounded px-2 py-1 text-xs text-ink/40 hover:bg-clay/10 hover:text-clay"
                      >
                        ✕
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
