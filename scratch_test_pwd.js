const { Client } = require("pg");

const passwords = [
  "FarmerPassword123!",
  "Kishore123!",
  "kishoreilla2810",
  "kishoreilla2810@gmail.com",
  "Supabase123!",
  "ldsaywmmrnacuvcclcaf"
];

async function testPasswords() {
  for (const pwd of passwords) {
    const client = new Client({
      connectionString: `postgres://postgres.ldsaywmmrnacuvcclcaf:${encodeURIComponent(pwd)}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log("Success with password:", pwd);
      await client.query(`
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_credit boolean NOT NULL DEFAULT false;
        ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS lender_name text;
      `);
      console.log("Migration executed successfully!");
      await client.end();
      return;
    } catch (e) {
      console.log("Failed password:", pwd, e.message);
    }
  }
}

testPasswords();
