import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://kedlkijfsmnguwjgffip.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LpaGYkHb34miNYxI2pnu1A_KXP3IFjN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
