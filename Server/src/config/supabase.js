/* eslint-disable no-undef */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

// Supabase configuration
const supabaseUrl =
  process.env.SUPABASE_URL || "https://clggjkjdjzerweawprjk.supabase.co";
const supabaseKey =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZ2dqa2pkanplcndlYXdwcmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDgzNjMsImV4cCI6MjA2NTU4NDM2M30.uoSiyyU1jgSlsmt7Ne_wktsQEJTz1OAzpWWj_9_O3Ew";

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
