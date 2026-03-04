import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client-side Supabase client (safe to use in browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (has write access, only use in API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
