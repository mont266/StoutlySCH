import { createClient } from '@supabase/supabase-js';

// These variables are injected by the build process (e.g., Vite)
// IMPORTANT: In your hosting provider (like Netlify), set environment variables
// prefixed with VITE_. For example: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// FIX: Changed import.meta.env to process.env to resolve TypeScript error.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key are required. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);