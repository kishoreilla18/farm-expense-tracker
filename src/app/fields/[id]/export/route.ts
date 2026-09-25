import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/categories";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: field } = await supabase
    .from("fields")
    .select("name")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

  const { data: expenses } = await supabase
    .from("expenses")
    .select("expense_date, category, custom_label, amount, notes")
    .eq("field_id", params.id)
    .eq("user_id", user.id)
    .order("expense_date", { ascending: true });

  const header = "Date,Category,Amount (INR),Notes\n";
  const rows = (expenses ?? [])
    .map((e) => {
      const cells = [
        e.expense_date,
        categoryLabel(e.category, e.custom_label),
        Number(e.amount).toFixed(2),
        (e.notes ?? "").replace(/"/g, '""')
      ];
      return cells.map((c) => `"${c}"`).join(",");
    })
    .join("\n");

  const csv = header + rows + "\n";
  const filename = `${field.name.replace(/[^a-z0-9]+/gi, "_")}_expenses.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
