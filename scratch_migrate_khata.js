const { Client } = require("pg");

const client = new Client({
  connectionString: "postgres://postgres.ldsaywmmrnacuvcclcaf:FarmerPassword123!@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase DB");

  await client.query(`
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_credit boolean NOT NULL DEFAULT false;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS lender_name text;
  `);

  console.log("Migration finished: is_credit and lender_name added to public.expenses");
  await client.end();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
