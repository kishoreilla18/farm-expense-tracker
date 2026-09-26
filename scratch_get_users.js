const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ldsaywmmrnacuvcclcaf.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkc2F5d21tcm5hY3V2Y2NsY2FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDMxMzkxOCwiZXhwIjoyMTA1ODg5OTE4fQ.vLndcaYG00Y088DV8Viakh5UiciclZkPEe_gWm3r8d4";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function getUsers() {
  const { data: profiles, error: profErr } = await supabase.from("profiles").select("*");
  if (profErr) {
    console.error("Profile fetch error:", profErr);
  } else {
    console.log("Registered Profiles:", JSON.stringify(profiles, null, 2));
  }

  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Auth fetch error:", authErr);
  } else {
    console.log("Auth Users:", JSON.stringify(authUsers.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })), null, 2));
  }
}

getUsers();
