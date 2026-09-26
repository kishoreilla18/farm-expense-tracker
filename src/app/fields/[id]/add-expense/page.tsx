import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addExpense } from "@/app/actions";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { istTodayISO } from "@/lib/date";
import { SubmitButton } from "@/components/SubmitButton";
import LogoutButton from "@/components/LogoutButton";

export default async function AddExpensePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: field } = await supabase
    .from("fields")
    .select("id, name")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!field) notFound();
  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/fields/${params.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-forest/20 bg-forest/5 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/10 transition-colors"
        >
          ← Back to crop
        </Link>
        <LogoutButton />
      </div>
      <h1 className="font-display text-2xl font-semibold text-forest">Add an expense</h1>

      {searchParams.error && (
        <p className="mt-4 rounded-md bg-clay/10 px-4 py-3 text-sm text-clay">{searchParams.error}</p>
      )}

      <form action={addExpense} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="field_id" value={params.id} />

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">What was it for?</label>
          <select name="category" required className="field-input" defaultValue="labour">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">
            If &quot;Other&quot;, describe it (optional)
          </label>
          <input name="custom_label" className="field-input" placeholder="e.g. Well repair" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Amount (₹)</label>
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            className="field-input"
            placeholder="0"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Date</label>
          <input name="expense_date" type="date" defaultValue={istTodayISO()} className="field-input" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Notes (optional)</label>
          <input name="notes" className="field-input" placeholder="e.g. 3 workers, half day" />
        </div>

        {/* WORKER WAGE & CREDIT PAYMENT OPTIONS */}
        <div className="rounded-lg border border-clay/30 bg-clay/5 p-3.5 mt-1">
          <label className="mb-1.5 block text-sm font-semibold text-forest">
            💳 Payment Status
          </label>
          <select
            name="payment_status"
            className="field-input text-xs font-semibold"
            defaultValue="paid"
          >
            <option value="paid">🟢 Fully Paid (Cash / UPI)</option>
            <option value="unpaid">🔴 Unpaid / Udhar (Pay Later After Harvest)</option>
            <option value="partial">🟡 Partially Paid (Advance / Part Payment Given)</option>
          </select>

          <div className="mt-3 flex flex-col gap-2">
            <div>
              <label className="block text-xs font-medium text-ink/70">
                Amount Paid So Far (₹) *(If Partial / Advance)*
              </label>
              <input
                name="paid_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="field-input text-xs mt-1"
                placeholder="e.g. 500 (Leave 0 if unpaid)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/70">
                Worker Name / Shop Name *(Optional)*
              </label>
              <input
                name="lender_name"
                className="field-input text-xs mt-1"
                placeholder="e.g. Ramesh Worker Mistry / Sri Venkateswara Shop"
              />
            </div>
          </div>
        </div>

        <SubmitButton loadingText="Saving expense..." className="btn-primary mt-2 w-full">
          Save expense
        </SubmitButton>
      </form>
    </main>
  );
}
