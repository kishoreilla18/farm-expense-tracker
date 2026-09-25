import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addField } from "@/app/actions";
import { istTodayISO } from "@/lib/date";

export default async function NewFieldPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <main className="mx-auto max-w-sm px-5 py-8">
      <Link href="/dashboard" className="text-sm text-ink/50 underline underline-offset-2">
        ← Back to dashboard
      </Link>
      <h1 className="font-display mt-3 text-2xl font-semibold text-forest">Add a field or crop</h1>
      <p className="mt-1 text-sm text-ink/60">
        Create one for each plot of land or crop you want to track separately.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-md bg-clay/10 px-4 py-3 text-sm text-clay">{searchParams.error}</p>
      )}

      <form action={addField} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Crop name</label>
          <input name="crop_name" required className="field-input" placeholder="e.g. Cotton, Wheat, Sugarcane" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Field location / name (optional)</label>
          <input name="name" className="field-input" placeholder="e.g. Eluru farm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Area in acres (optional)</label>
          <input name="area_acres" type="number" step="0.1" min="0" className="field-input" placeholder="e.g. 2.5" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">Start date</label>
          <input name="start_date" type="date" defaultValue={istTodayISO()} className="field-input" />
        </div>
        <button type="submit" className="btn-primary mt-2 w-full">Save field</button>
      </form>
    </main>
  );
}
