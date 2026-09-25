import { Resend } from "resend";
import { categoryLabel } from "./categories";
import { formatRupees, formatDateLong } from "./date";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_dummy");
}
const FROM = process.env.EMAIL_FROM || "Farm Expenses <onboarding@resend.dev>";

export type ExpenseRow = {
  category: string;
  custom_label: string | null;
  amount: number;
  field_name: string;
};

// Email sent to an individual farmer summarising *their* spend for the day.
export async function sendFarmerDailyEmail(opts: {
  to: string;
  name: string | null;
  dateISO: string;
  expenses: ExpenseRow[];
}) {
  const { to, name, dateISO, expenses } = opts;
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const dateLabel = formatDateLong(dateISO);

  const rows = expenses.length
    ? expenses
      .map(
        (e) => `<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;">${escapeHtml(e.field_name)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;">${escapeHtml(categoryLabel(e.category, e.custom_label))}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;text-align:right;">${formatRupees(Number(e.amount))}</td>
          </tr>`
      )
      .join("")
    : `<tr><td colspan="3" style="padding:10px;color:#6B4A2F;">No expenses were logged today.</td></tr>`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#22261F;">
    <h2 style="color:#1F3D2B;margin-bottom:4px;">Daily Expense Summary</h2>
    <p style="margin-top:0;color:#6B4A2F;">${dateLabel}${name ? " · " + escapeHtml(name) : ""}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;">
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;">Field</th>
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;">Category</th>
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:18px;font-weight:bold;color:#1F3D2B;margin-top:14px;">
      Total spent today: ${formatRupees(total)}
    </p>
    <p style="font-size:12px;color:#6B4A2F;margin-top:24px;">
      Sent automatically by your Farm Expense Tracker every day at 7:00 PM IST.
    </p>
  </div>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Farm expenses for ${dateLabel} — ${formatRupees(total)}`,
    html
  });
  if (error) throw new Error(error.message);
}

// One consolidated digest sent to the admin covering every farmer.
export async function sendAdminDailyEmail(opts: {
  to: string;
  dateISO: string;
  perFarmer: { name: string; email: string; total: number; count: number }[];
}) {
  const { to, dateISO, perFarmer } = opts;
  const grandTotal = perFarmer.reduce((s, f) => s + f.total, 0);
  const dateLabel = formatDateLong(dateISO);

  const rows = perFarmer.length
    ? perFarmer
      .map(
        (f) => `<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;">${escapeHtml(f.name || f.email)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;text-align:center;">${f.count}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;text-align:right;">${formatRupees(f.total)}</td>
          </tr>`
      )
      .join("")
    : `<tr><td colspan="3" style="padding:10px;color:#6B4A2F;">No expenses were logged by anyone today.</td></tr>`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#22261F;">
    <h2 style="color:#1F3D2B;margin-bottom:4px;">Admin Daily Digest — All Farmers</h2>
    <p style="margin-top:0;color:#6B4A2F;">${dateLabel}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;">
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;">Farmer</th>
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;text-align:center;">Entries</th>
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:18px;font-weight:bold;color:#1F3D2B;margin-top:14px;">
      Total across all farmers: ${formatRupees(grandTotal)}
    </p>
  </div>`;

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Admin digest ${dateLabel} — ${formatRupees(grandTotal)} across ${perFarmer.length} farmer(s)`,
    html
  });
  if (error) throw new Error(error.message);
}

export async function sendFieldReportEmail(opts: {
  to: string | string[];
  farmerName: string;
  fieldName: string;
  cropName: string | null;
  areaAcres: number | null;
  startDate: string;
  expenses: { category: string; custom_label: string | null; amount: number; expense_date: string; notes: string | null }[];
}) {
  const { to, farmerName, fieldName, cropName, areaAcres, expenses } = opts;
  const grandTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const title = cropName || fieldName;

  const rows = expenses.length
    ? expenses
        .map(
          (e) => `<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;">${escapeHtml(formatDateLong(e.expense_date))}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;">${escapeHtml(categoryLabel(e.category, e.custom_label))}${e.notes ? `<br/><small style="color:#6B4A2F;">${escapeHtml(e.notes)}</small>` : ""}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #DED6C3;text-align:right;">${formatRupees(Number(e.amount))}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding:10px;color:#6B4A2F;">No expenses logged for this field yet.</td></tr>`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#22261F;">
    <h2 style="color:#1F3D2B;margin-bottom:4px;">Expense Report — ${escapeHtml(title)}</h2>
    <p style="margin-top:0;color:#6B4A2F;">
      Farmer: <strong>${escapeHtml(farmerName)}</strong>
      ${fieldName && fieldName !== cropName ? ` · Location: ${escapeHtml(fieldName)}` : ""}
      ${areaAcres ? ` · ${areaAcres} Acres` : ""}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
      <thead>
        <tr style="text-align:left;">
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;">Date</th>
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;">Category</th>
          <th style="padding:6px 10px;border-bottom:2px solid #1F3D2B;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:18px;font-weight:bold;color:#1F3D2B;margin-top:16px;">
      Total Spent: ${formatRupees(grandTotal)}
    </p>
    <p style="font-size:12px;color:#6B4A2F;margin-top:24px;">
      Sent via Farm Expense Tracker Report.
    </p>
  </div>`;

  const recipients = Array.isArray(to) ? to : [to];
  for (const recipient of recipients) {
    if (!recipient) continue;
    try {
      await getResend().emails.send({
        from: FROM,
        to: recipient,
        subject: `Expense Report: ${title} — ${formatRupees(grandTotal)} (${farmerName})`,
        html
      });
    } catch (e: any) {
      console.error(`Failed to send report email to ${recipient}:`, e?.message || e);
    }
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
