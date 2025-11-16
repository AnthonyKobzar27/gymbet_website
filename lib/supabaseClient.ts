import { createClient } from '@supabase/supabase-js';

// Simple server-side client (for API routes)
// For Next.js 13+ App Router with SSR, use @supabase/ssr package
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function createServerClient() {
  // TypeScript knows these are defined after the check above
  return createClient(supabaseUrl as string, supabaseAnonKey as string);
}

