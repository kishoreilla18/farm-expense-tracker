"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { istTodayISO } from "@/lib/date";
import { sendFieldReportEmail } from "@/lib/email";

// ---------- AUTH ----------

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();

  if (!email || !password) redirect("/signup?error=Please+fill+in+all+fields");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  if (!data.session) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      redirect(`/login?error=${encodeURIComponent("Account created! If required, please confirm your email before logging in.")}`);
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- FIELDS ----------

export async function addField(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const crop_name = String(formData.get("crop_name") || "").trim() || null;
  let name = String(formData.get("name") || "").trim();
  if (!name && crop_name) {
    name = crop_name;
  }
  const area_acres_raw = String(formData.get("area_acres") || "").trim();
  const area_acres = area_acres_raw ? Number(area_acres_raw) : null;
  const start_date = String(formData.get("start_date") || "") || istTodayISO();

  if (!crop_name && !name) redirect("/fields/new?error=Crop+name+is+required");

  const { error } = await supabase
    .from("fields")
    .insert({ user_id: user.id, name, crop_name, area_acres, start_date });

  if (error) redirect(`/fields/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteField(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  await supabase.from("fields").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ---------- EXPENSES ----------

export async function addExpense(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const field_id = String(formData.get("field_id") || "");
  const category = String(formData.get("category") || "");
  const custom_label = String(formData.get("custom_label") || "").trim() || null;
  const amountRaw = String(formData.get("amount") || "");
  const amount = Number(amountRaw);
  const expense_date = String(formData.get("expense_date") || "") || istTodayISO();
  let notes = String(formData.get("notes") || "").trim() || null;

  const is_credit = formData.get("is_credit") === "on" || formData.get("is_credit") === "true";
  const lender_name = String(formData.get("lender_name") || "").trim();

  if (is_credit) {
    const tag = `[UDHAR:${lender_name ? ` ${lender_name}` : ""}]`;
    notes = notes ? `${tag} ${notes}` : tag;
  }

  if (!field_id || !category || !amountRaw || isNaN(amount) || amount <= 0) {
    redirect(`/fields/${field_id}/add-expense?error=Please+enter+a+valid+category+and+amount`);
  }

  const { error } = await supabase.from("expenses").insert({
    field_id,
    user_id: user.id,
    category,
    custom_label,
    amount,
    expense_date,
    notes
  });

  if (error) {
    redirect(`/fields/${field_id}/add-expense?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/fields/${field_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/khata");
  redirect(`/fields/${field_id}`);
}

export async function deleteExpense(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  const field_id = String(formData.get("field_id") || "");
  const redirect_to = String(formData.get("redirect_to") || "");

  await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id);

  if (field_id) revalidatePath(`/fields/${field_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/khata");

  if (redirect_to) redirect(redirect_to);
  redirect(`/fields/${field_id}`);
}

export async function settleExpenseCredit(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  const field_id = String(formData.get("field_id") || "");
  const redirect_to = String(formData.get("redirect_to") || "");

  const { data: expense } = await supabase
    .from("expenses")
    .select("notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (expense && expense.notes) {
    // Remove [UDHAR: ...] prefix
    const updatedNotes = expense.notes.replace(/\[UDHAR:[^\]]*\]\s*/g, "").trim() || null;
    await supabase
      .from("expenses")
      .update({ notes: updatedNotes })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  if (field_id) revalidatePath(`/fields/${field_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/khata");

  if (redirect_to) redirect(redirect_to);
  redirect(`/fields/${field_id}`);
}

// ---------- EMAIL REPORT ----------

export async function sendFieldEmailReport(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const field_id = String(formData.get("field_id") || "");
  if (!field_id) redirect("/dashboard");

  const { data: field } = await supabase
    .from("fields")
    .select("id, name, crop_name, area_acres, start_date")
    .eq("id", field_id)
    .eq("user_id", user.id)
    .single();

  if (!field) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const farmerName = profile?.full_name || (user.user_metadata?.full_name as string) || user.email!;

  const { data: expenses } = await supabase
    .from("expenses")
    .select("category, custom_label, amount, expense_date, notes")
    .eq("field_id", field_id)
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false });

  const recipients = [user.email!];
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== user.email) {
    recipients.push(process.env.ADMIN_EMAIL);
  }

  let errorMessage: string | null = null;
  try {
    await sendFieldReportEmail({
      to: recipients,
      farmerName,
      fieldName: field.name,
      cropName: field.crop_name,
      areaAcres: field.area_acres,
      startDate: field.start_date,
      expenses: expenses ?? []
    });
  } catch (err: any) {
    errorMessage = err.message || "Failed to send email report";
  }

  if (errorMessage) {
    redirect(`/fields/${field_id}?error=${encodeURIComponent(errorMessage)}`);
  } else {
    redirect(`/fields/${field_id}?success=${encodeURIComponent("Email report sent successfully to user and admin!")}`);
  }
}

// ---------- INCOMES / HARVEST RETURNS & PnL ----------

export async function addIncome(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const field_id = String(formData.get("field_id") || "");
  const amountRaw = String(formData.get("amount") || "");
  const amount = Number(amountRaw);
  const income_date = String(formData.get("income_date") || "") || istTodayISO();
  const source_notes = String(formData.get("source_notes") || "").trim() || null;

  if (!field_id || !amountRaw || isNaN(amount) || amount <= 0) {
    redirect(`/fields/${field_id}/add-income?error=Please+enter+a+valid+income+amount`);
  }

  const { error } = await supabase.from("incomes").insert({
    field_id,
    user_id: user.id,
    amount,
    income_date,
    source_notes
  });

  if (error) {
    redirect(`/fields/${field_id}/add-income?error=${encodeURIComponent(error.message)}`);
  }

  const { data: allIncomes } = await supabase
    .from("incomes")
    .select("amount")
    .eq("field_id", field_id)
    .eq("user_id", user.id);

  const totalIncome = (allIncomes ?? []).reduce((s, i) => s + Number(i.amount), 0);

  await supabase
    .from("fields")
    .update({ total_income: totalIncome })
    .eq("id", field_id)
    .eq("user_id", user.id);

  revalidatePath(`/fields/${field_id}`);
  revalidatePath("/dashboard");
  redirect(`/fields/${field_id}`);
}

export async function deleteIncome(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  const field_id = String(formData.get("field_id") || "");

  await supabase.from("incomes").delete().eq("id", id).eq("user_id", user.id);

  const { data: allIncomes } = await supabase
    .from("incomes")
    .select("amount")
    .eq("field_id", field_id)
    .eq("user_id", user.id);

  const totalIncome = (allIncomes ?? []).reduce((s, i) => s + Number(i.amount), 0);

  await supabase
    .from("fields")
    .update({ total_income: totalIncome })
    .eq("id", field_id)
    .eq("user_id", user.id);

  revalidatePath(`/fields/${field_id}`);
  revalidatePath("/dashboard");
  redirect(`/fields/${field_id}`);
}

export async function toggleCropComplete(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const field_id = String(formData.get("field_id") || "");
  const current_status = formData.get("is_completed") === "true";

  await supabase
    .from("fields")
    .update({ is_completed: !current_status })
    .eq("id", field_id)
    .eq("user_id", user.id);

  revalidatePath(`/fields/${field_id}`);
  revalidatePath("/dashboard");
  redirect(`/fields/${field_id}`);
}
