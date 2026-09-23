import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Server-side Supabase client. Uses the service-role key, which bypasses
 * row-level security — keep this instance out of any client-facing code path
 * and always scope queries/files by the authenticated userId ourselves.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
