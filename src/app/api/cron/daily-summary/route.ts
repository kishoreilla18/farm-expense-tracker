import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFarmerDailyEmail, sendAdminDailyEmail } from "@/lib/email";
import { istTodayISO } from "@/lib/date";

// Triggered by Vercel Cron (see vercel.json — "30 13 * * *" = 7:00 PM IST).
// Secured with CRON_SECRET: Vercel automatically sends
// "Authorization: Bearer <CRON_SECRET>" when that env var is set on the project.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const dateISO = istTodayISO();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name");

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("user_id, category, custom_label, amount, field_id, fields(name)")
    .eq("expense_date", dateISO);

  if (expensesError) {
    return NextResponse.json({ error: expensesError.message }, { status: 500 });
  }

  type Row = {
    user_id: string;
    category: string;
    custom_label: string | null;
    amount: number;
    fields: { name: string } | { name: string }[] | null;
  };

  const byUser = new Map<string, Row[]>();
  for (const e of (expenses ?? []) as Row[]) {
    const list = byUser.get(e.user_id) ?? [];
    list.push(e);
    byUser.set(e.user_id, list);
  }

  const perFarmerForAdmin: { name: string; email: string; total: number; count: number }[] = [];
  const results: { email: string; sent: boolean; error?: string }[] = [];

  for (const profile of profiles ?? []) {
    const rows = byUser.get(profile.id) ?? [];
    const fieldExpenses = rows.map((r) => ({
      category: r.category,
      custom_label: r.custom_label,
      amount: Number(r.amount),
      field_name: Array.isArray(r.fields) ? r.fields[0]?.name ?? "Field" : r.fields?.name ?? "Field"
    }));

    const total = fieldExpenses.reduce((s, e) => s + e.amount, 0);
    perFarmerForAdmin.push({
      name: profile.full_name || profile.email,
      email: profile.email,
      total,
      count: fieldExpenses.length
    });

    try {
      await sendFarmerDailyEmail({
        to: profile.email,
        name: profile.full_name,
        dateISO,
        expenses: fieldExpenses
      });
      results.push({ email: profile.email, sent: true });
    } catch (err: any) {
      results.push({ email: profile.email, sent: false, error: err?.message });
    }
  }

  if (process.env.ADMIN_EMAIL) {
    try {
      await sendAdminDailyEmail({
        to: process.env.ADMIN_EMAIL,
        dateISO,
        perFarmer: perFarmerForAdmin
      });
    } catch (err: any) {
      results.push({ email: process.env.ADMIN_EMAIL, sent: false, error: err?.message });
    }
  }

  return NextResponse.json({ date: dateISO, farmersEmailed: results.length, results });
}
