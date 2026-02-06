// Run schema.sql against Supabase using service role key
// Run with: npx tsx scripts/run-schema.ts

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");

async function runSchema() {
  console.log("Running schema against Supabase...");
  console.log(`Project: ${projectRef}\n`);

  const schemaPath = path.join(__dirname, "../supabase/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Use Supabase's SQL endpoint (available via Management API or pg protocol)
  // Since we can't use pg directly without connection string, we'll use individual table creation

  // For now, output the SQL and instructions
  console.log("Schema SQL is ready at: supabase/schema.sql");
  console.log("\nTo run it:");
  console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql`);
  console.log("2. Create a new query and paste the contents of supabase/schema.sql");
  console.log("3. Click Run\n");

  // Alternatively, try using the Supabase API to check if we can run SQL
  // The Management API requires a different auth token (not service role)

  // Let's verify we can at least connect and check existing tables
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Current tables in database:");
    if (data.paths) {
      const tables = Object.keys(data.paths).filter((p) => !p.startsWith("/rpc"));
      if (tables.length === 0) {
        console.log("  (none - schema not yet applied)");
      } else {
        tables.forEach((t) => console.log(`  - ${t.replace("/", "")}`));
      }
    } else {
      console.log("  (unable to list tables)");
    }
  }

  console.log("\n---");
  console.log("Since Supabase REST API doesn't support raw DDL execution,");
  console.log("please run the schema manually in the SQL Editor.");
  console.log("\nI'll copy the SQL to your clipboard if pbcopy is available...");
}

runSchema();
