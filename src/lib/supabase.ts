import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  'https://livyjifslexvodreuqnu.supabase.co';

const supabaseAnonKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_wINWBqNFUNtsIfTRGInXNw_n1mZvWu8';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
