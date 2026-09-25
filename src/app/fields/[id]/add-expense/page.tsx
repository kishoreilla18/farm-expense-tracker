import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addExpense } from "@/app/actions";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { istTodayISO } from "@/lib/date";

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
      <Link href={`/fields/${params.id}`} className="text-sm text-ink/50 underline underline-offset-2">
        ← Back to field
      </Link>
      <h1 className="font-display mt-3 text-2xl font-semibold text-forest">Add an expense</h1>

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

        {/* CREDIT / UDHAR PAYMENT OPTION */}
        <div className="rounded-lg border border-clay/30 bg-clay/5 p-3.5 mt-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-clay cursor-pointer">
            <input type="checkbox" name="is_credit" className="h-4 w-4 accent-clay" />
            📕 Bought on Credit / Udhar (Unpaid Bill)
          </label>
          <p className="text-xs text-ink/60 mt-1 pl-6">
            Check this if you haven&apos;t paid cash yet and will settle after harvest.
          </p>
          <div className="mt-2 pl-6">
            <input
              name="lender_name"
              className="field-input text-xs"
              placeholder="Shop or Worker Name (e.g. Sri Venkateswara Shop)"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-2 w-full">Save expense</button>
      </form>
    </main>
  );
}
