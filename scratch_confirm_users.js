const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ldsaywmmrnacuvcclcaf.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkc2F5d21tcm5hY3V2Y2NsY2FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDMxMzkxOCwiZXhwIjoyMTA1ODg5OTE4fQ.vLndcaYG00Y088DV8Viakh5UiciclZkPEe_gWm3r8d4";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function confirmAllUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  for (const user of users) {
    if (!user.email_confirmed_at) {
      console.log(`Confirming user: ${user.email} (${user.id})...`);
      const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });
      if (updateErr) {
        console.error(`Failed to confirm ${user.email}:`, updateErr);
      } else {
        console.log(`✓ Confirmed ${user.email}`);
      }
    } else {
      console.log(`Already confirmed: ${user.email}`);
    }
  }
}

confirmAllUsers();
