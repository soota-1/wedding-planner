import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

const hasValidEnv = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!hasValidEnv) {
  console.warn(
    'Supabase URL or Anon Key is missing. Running in offline fallback mode. If you just created .env, restart Expo with: npx expo start -c'
  );
}

// Use safe placeholder when env vars are not yet inlined by Metro so createClient never throws on startup
export const supabase = createClient(
  hasValidEnv ? supabaseUrl : 'https://offline-placeholder.supabase.co',
  hasValidEnv ? supabaseAnonKey : 'offline-placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
