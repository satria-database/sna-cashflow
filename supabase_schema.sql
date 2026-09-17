-- =========================================================
-- TERRAVA FINANCIAL OS - SUPABASE DATABASE SCHEMA
-- Jalankan script SQL ini di Supabase SQL Editor
-- =========================================================

-- 1. Table: paylater_items (Pencatatan tagihan paylater & cicilan)
CREATE TABLE IF NOT EXISTS public.paylater_items (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
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

-- 2. Table: expenses (Pencatatan pengeluaran harian & bulanan)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: incomes (Pencatatan pemasukan & cash flow)
CREATE TABLE IF NOT EXISTS public.incomes (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    source TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: budgets (Batas anggaran per kategori pengeluaran)
CREATE TABLE IF NOT EXISTS public.budgets (
    category TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    monthly_limit NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: reminder_settings (Pengaturan notifikasi & preferensi)
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_settings',
    user_id TEXT DEFAULT 'default_user',
    enable_browser_notification BOOLEAN DEFAULT true,
    remind_days_before JSONB DEFAULT '[7, 3, 1, 0]'::jsonb,
    auto_sound BOOLEAN DEFAULT true,
    notification_time TEXT DEFAULT '09:00',
    last_checked_date TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table: bank_settlements (Penyimpanan laporan settlement & mutasi rekening per bulan/periode)
CREATE TABLE IF NOT EXISTS public.bank_settlements (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    bank_name TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch TEXT,
    period TEXT NOT NULL,
    starting_balance NUMERIC DEFAULT 0,
    total_credit NUMERIC DEFAULT 0,
    total_debit NUMERIC DEFAULT 0,
    ending_balance NUMERIC DEFAULT 0,
    net_settlement NUMERIC DEFAULT 0,
    transactions JSONB DEFAULT '[]'::jsonb,
    source_file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional/Open for Public Anon
ALTER TABLE public.paylater_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_settlements ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon key (full CRUD) - Drop existing first to allow safe re-execution
DROP POLICY IF EXISTS "Allow public all access on paylater_items" ON public.paylater_items;
DROP POLICY IF EXISTS "Allow public all access on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public all access on incomes" ON public.incomes;
DROP POLICY IF EXISTS "Allow public all access on budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow public all access on reminder_settings" ON public.reminder_settings;
DROP POLICY IF EXISTS "Allow public all access on bank_settlements" ON public.bank_settlements;

CREATE POLICY "Allow public all access on paylater_items" ON public.paylater_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on incomes" ON public.incomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on reminder_settings" ON public.reminder_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on bank_settlements" ON public.bank_settlements FOR ALL USING (true) WITH CHECK (true);

-- Indices for rapid date & category queries
CREATE INDEX IF NOT EXISTS idx_paylater_due_day ON public.paylater_items(due_day);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON public.incomes(date);
CREATE INDEX IF NOT EXISTS idx_bank_settlements_user_id ON public.bank_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_settlements_created_at ON public.bank_settlements(created_at);
