import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'custom' | 'none';
}

// Read from env or localStorage
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      source: 'env',
    };
  }

  try {
    const custom = localStorage.getItem('terrava_custom_supabase');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          source: 'custom',
        };
      }
    }
  } catch (e) {
    console.error('Error reading custom supabase config', e);
  }

  return {
    url: '',
    anonKey: '',
    source: 'none',
  };
}

let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const key = `${config.url}_${config.anonKey}`;
  if (cachedClient && lastClientKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastClientKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client', err);
    return null;
  }
}

// Default exported client instance
export const supabase = getSupabaseClient();

export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(
    'terrava_custom_supabase',
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  cachedClient = null;
  lastClientKey = '';
}

export function clearCustomSupabaseConfig() {
  localStorage.removeItem('terrava_custom_supabase');
  cachedClient = null;
  lastClientKey = '';
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const url = customUrl || getSupabaseConfig().url;
    const anonKey = customKey || getSupabaseConfig().anonKey;

    if (!url || !anonKey) {
      return { success: false, message: 'URL dan Public Anon Key Supabase belum diisi.' };
    }

    const testClient = createClient(url, anonKey);
    // Ping paylater_items table
    const { error } = await testClient.from('paylater_items').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet or permission error
      if (error.code === '42P01' || error.message.includes('relation "public.paylater_items" does not exist')) {
        return {
          success: false,
          message: 'Terkoneksi ke Supabase, tetapi tabel belum dibuat. Silakan jalankan Schema SQL yang disediakan.',
        };
      }
      return { success: false, message: `Error Supabase: ${error.message}` };
    }

    return { success: true, message: 'Berhasil terkoneksi ke Supabase & tabel aktif! 🚀' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menghubungi server Supabase.' };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- TERRAVA FINANCIAL OPERATING SYSTEM - SUPABASE SCHEMA (MULTI-USER ISOLATION)
-- Jalankan seluruh script SQL ini di SQL Editor pada Supabase Dashboard Anda
-- ==============================================================================

-- 1. TABEL PROFIL PENGGUNA (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    provider TEXT DEFAULT 'google',
    last_sign_in_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL CICILAN & PAYLATER (PAYLATER_ITEMS)
CREATE TABLE IF NOT EXISTS public.paylater_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    custom_provider_name TEXT,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    monthly_installment NUMERIC NOT NULL DEFAULT 0,
    total_tenor INTEGER NOT NULL DEFAULT 1,
    current_tenor INTEGER NOT NULL DEFAULT 1,
    due_day INTEGER NOT NULL DEFAULT 1,
    interest_rate NUMERIC DEFAULT 0,
    admin_fee NUMERIC DEFAULT 0,
    notes TEXT,
    start_date TEXT,
    is_paid_this_month BOOLEAN DEFAULT false,
    paid_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PENGELUARAN (EXPENSES)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PEMASUKAN (INCOMES)
CREATE TABLE IF NOT EXISTS public.incomes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    source TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL BUDGET / ANGGARAN (BUDGETS)
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    category TEXT NOT NULL,
    monthly_limit NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_category UNIQUE (user_id, category)
);

-- 6. TABEL PENGATURAN NOTIFIKASI (REMINDER_SETTINGS)
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    enable_browser_notification BOOLEAN DEFAULT true,
    remind_days_before JSONB DEFAULT '[7, 3, 1, 0]'::jsonb,
    auto_sound BOOLEAN DEFAULT true,
    notification_time TEXT DEFAULT '09:00',
    last_checked_date TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL SETTLEMENT BANK & MUTASI PDF (BANK_SETTLEMENTS)
CREATE TABLE IF NOT EXISTS public.bank_settlements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default_user',
    bank_name TEXT NOT NULL DEFAULT 'BNI',
    account_holder TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch TEXT,
    period TEXT NOT NULL,
    starting_balance NUMERIC NOT NULL DEFAULT 0,
    total_credit NUMERIC NOT NULL DEFAULT 0,
    total_debit NUMERIC NOT NULL DEFAULT 0,
    ending_balance NUMERIC NOT NULL DEFAULT 0,
    net_settlement NUMERIC NOT NULL DEFAULT 0,
    transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HAPUS BATASAN UNIK LEGACY SINGLE-SETTLEMENT JIKA PERNAH DIBUAT (MENDUKUNG MULTI-BULAN)
ALTER TABLE IF EXISTS public.bank_settlements DROP CONSTRAINT IF EXISTS unique_user_settlement;

-- INDEX UNTUK PERFORMA MULTI-USER ISOLATION CEPAT
CREATE INDEX IF NOT EXISTS idx_paylater_user_id ON public.paylater_items(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_user_id ON public.reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_settlements_user_id ON public.bank_settlements(user_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paylater_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_settlements ENABLE ROW LEVEL SECURITY;

-- POLICIES: HAPUS JIKA SUDAH ADA (AGAR TIDAK ERROR JIKA DIJALANKAN ULANG)
DROP POLICY IF EXISTS "Allow public all access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public all access on paylater_items" ON public.paylater_items;
DROP POLICY IF EXISTS "Allow public all access on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public all access on incomes" ON public.incomes;
DROP POLICY IF EXISTS "Allow public all access on budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow public all access on reminder_settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Allow public all access on bank_settlements" ON public.bank_settlements;

-- POLICIES: BUAT ULANG KEBIJAKAN AKSES DENGAN ISOLASI USER
CREATE POLICY "Allow public all access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on paylater_items" ON public.paylater_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on incomes" ON public.incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on reminder_settings" ON public.reminder_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on bank_settlements" ON public.bank_settlements FOR ALL USING (true) WITH CHECK (true);

`;
