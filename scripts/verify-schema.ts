// Verify schema and roster
// Run with: npx tsx scripts/verify-schema.ts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("Verifying schema...\n");

  // Check users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("name, email, role")
    .order("role")
    .order("name");

  if (usersError) {
    console.error("Users table error:", usersError.message);
  } else {
    console.log(`Users (${users.length}):`);
    users.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.name}`));
  }

  // Check other tables exist
  const tables = ["projects", "phase_data", "versions", "build_feedback", "files", "sessions"];

  console.log("\nTable check:");
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(0);
    const status = error ? `✗ ${error.message}` : "✓";
    console.log(`  ${table}: ${status}`);
  }

  console.log("\n✓ Schema verification complete");
}

verify();
