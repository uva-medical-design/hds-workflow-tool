// Quick script to test Supabase connection
// Run with: npx tsx scripts/test-connection.ts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase connection...");
  console.log(`URL: ${supabaseUrl}`);

  // Try a simple query - this will fail if tables don't exist yet, but connection should work
  const { data, error } = await supabase.from("users").select("count").limit(1);

  if (error) {
    if (error.code === "PGRST204" || error.message.includes("does not exist")) {
      console.log("Connection successful! Tables not created yet.");
      console.log("Run the schema.sql in Supabase Dashboard to create tables.");
    } else {
      console.error("Connection error:", error.message);
    }
  } else {
    console.log("Connection successful! Users table exists.");
    console.log("Data:", data);
  }
}

testConnection();
