import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addIncome } from "@/app/actions";
import { istTodayISO } from "@/lib/date";
import { SubmitButton } from "@/components/SubmitButton";
import LogoutButton from "@/components/LogoutButton";

export default async function AddIncomePage({
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
    .select("id, name, crop_name")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!field) notFound();

  const title = field.crop_name || field.name;

  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/fields/${params.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-forest/20 bg-forest/5 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/10 transition-colors"
        >
          ← Back to {title}
        </Link>
        <LogoutButton />
      </div>
      <h1 className="font-display text-2xl font-semibold text-forest">
        Record Harvest Returns / Income
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Enter the total crop sale proceeds or harvest income for {title}.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-md bg-clay/10 px-4 py-3 text-sm text-clay">{searchParams.error}</p>
      )}

      <form action={addIncome} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="field_id" value={params.id} />

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Income / Harvest Return Amount (₹)</label>
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            className="field-input text-lg font-semibold text-sprout"
            placeholder="e.g. 500000"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Date Received</label>
          <input name="income_date" type="date" defaultValue={istTodayISO()} className="field-input" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Sale Buyer / Source Notes (optional)</label>
          <input name="source_notes" className="field-input" placeholder="e.g. Mandi sale, Cotton Trader A" />
        </div>

        <SubmitButton loadingText="Saving income..." className="btn-primary mt-2 w-full bg-sprout hover:bg-[#3d6431]">
          💰 Save Harvest Income
        </SubmitButton>
      </form>
    </main>
  );
}
