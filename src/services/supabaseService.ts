import { getSupabaseClient } from '../lib/supabase';
import { 
  PaylaterItem, 
  ExpenseItem, 
  IncomeItem, 
  CategoryBudget, 
  ReminderSetting,
  UserProfile,
  BankSettlement
} from '../types';

// ==========================================
// 0. USER PROFILES & AUTH PERSISTENCE
// ==========================================

export async function saveUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: profile.id,
      name: profile.name,
      email: profile.email.toLowerCase(),
      avatar_url: profile.avatarUrl || null,
      provider: profile.provider || 'google',
      last_sign_in_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase saveUserProfile error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving user profile to Supabase:', err);
    return false;
  }
}

export async function fetchUserProfileFromSupabase(userIdOrEmail: string): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const query = userIdOrEmail.includes('@')
      ? client.from('profiles').select('*').eq('email', userIdOrEmail.toLowerCase()).single()
      : client.from('profiles').select('*').eq('id', userIdOrEmail).single();

    const { data, error } = await query;
    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatar_url || undefined,
      isLoggedIn: true,
      provider: data.provider || 'google',
      joinedAt: data.created_at,
    };
  } catch (err) {
    console.error('Error fetching user profile from Supabase:', err);
    return null;
  }
}

// ==========================================
// 1. PAYLATER ITEMS (ISOLATED BY USER)
// ==========================================

export async function fetchPaylaterFromSupabase(userId?: string): Promise<PaylaterItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('paylater_items')
      .select('*')
      .order('due_day', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetchPaylater error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any): PaylaterItem => ({
      id: row.id,
      title: row.title,
      provider: row.provider,
      customProviderName: row.custom_provider_name || undefined,
      totalAmount: Number(row.total_amount) || 0,
      monthlyInstallment: Number(row.monthly_installment) || 0,
      totalTenor: Number(row.total_tenor) || 1,
      currentTenor: Number(row.current_tenor) || 1,
      dueDay: Number(row.due_day) || 1,
      interestRate: Number(row.interest_rate) || 0,
      adminFee: Number(row.admin_fee) || 0,
      notes: row.notes || undefined,
      startDate: row.start_date || new Date().toISOString().slice(0, 7),
      isPaidThisMonth: Boolean(row.is_paid_this_month),
      paidHistory: Array.isArray(row.paid_history) ? row.paid_history : [],
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error fetching paylater from Supabase:', err);
    return null;
  }
}

export async function upsertPaylaterToSupabase(item: PaylaterItem, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: item.id,
      user_id: userId || 'default_user',
      title: item.title,
      provider: item.provider,
      custom_provider_name: item.customProviderName || null,
      total_amount: item.totalAmount,
      monthly_installment: item.monthlyInstallment,
      total_tenor: item.totalTenor,
      current_tenor: item.currentTenor,
      due_day: item.dueDay,
      interest_rate: item.interestRate || 0,
      admin_fee: item.adminFee || 0,
      notes: item.notes || null,
      start_date: item.startDate || null,
      is_paid_this_month: item.isPaidThisMonth,
      paid_history: item.paidHistory || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('paylater_items')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting paylater item to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error upserting paylater to Supabase:', err);
    return false;
  }
}

export async function deletePaylaterFromSupabase(id: string, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let query = client.from('paylater_items').delete().eq('id', id);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.error('Error deleting paylater from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deletePaylaterFromSupabase:', err);
    return false;
  }
}

// ==========================================
// 2. EXPENSES (ISOLATED BY USER)
// ==========================================

export async function fetchExpensesFromSupabase(userId?: string): Promise<ExpenseItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetchExpenses error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any): ExpenseItem => ({
      id: row.id,
      title: row.title,
      amount: Number(row.amount) || 0,
      category: row.category,
      date: row.date,
      notes: row.notes || undefined,
      isRecurring: Boolean(row.is_recurring),
    }));
  } catch (err) {
    console.error('Error fetching expenses from Supabase:', err);
    return null;
  }
}

export async function upsertExpenseToSupabase(expense: ExpenseItem, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: expense.id,
      user_id: userId || 'default_user',
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      notes: expense.notes || null,
      is_recurring: expense.isRecurring || false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('expenses')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting expense to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertExpenseToSupabase:', err);
    return false;
  }
}

export async function deleteExpenseFromSupabase(id: string, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let query = client.from('expenses').delete().eq('id', id);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.error('Error deleting expense from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteExpenseFromSupabase:', err);
    return false;
  }
}

// ==========================================
// 3. INCOMES (ISOLATED BY USER)
// ==========================================

export async function fetchIncomesFromSupabase(userId?: string): Promise<IncomeItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('incomes')
      .select('*')
      .order('date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetchIncomes error:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any): IncomeItem => ({
      id: row.id,
      title: row.title,
      amount: Number(row.amount) || 0,
      source: row.source,
      date: row.date,
      notes: row.notes || undefined,
    }));
  } catch (err) {
    console.error('Error fetching incomes from Supabase:', err);
    return null;
  }
}

export async function upsertIncomeToSupabase(income: IncomeItem, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: income.id,
      user_id: userId || 'default_user',
      title: income.title,
      amount: income.amount,
      source: income.source,
      date: income.date,
      notes: income.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('incomes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting income to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertIncomeToSupabase:', err);
    return false;
  }
}

export async function deleteIncomeFromSupabase(id: string, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let query = client.from('incomes').delete().eq('id', id);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.error('Error deleting income from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteIncomeFromSupabase:', err);
    return false;
  }
}

// ==========================================
// 4. BUDGETS (ISOLATED BY USER)
// ==========================================

export async function fetchBudgetsFromSupabase(userId?: string): Promise<CategoryBudget[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('budgets').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetchBudgets error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((row: any): CategoryBudget => ({
      category: row.category,
      monthlyLimit: Number(row.monthly_limit) || 0,
    }));
  } catch (err) {
    console.error('Error fetching budgets from Supabase:', err);
    return null;
  }
}

export async function upsertBudgetToSupabase(budget: CategoryBudget, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const effectiveUserId = userId || 'default_user';
    const payload = {
      id: `${effectiveUserId}_${budget.category}`,
      user_id: effectiveUserId,
      category: budget.category,
      monthly_limit: budget.monthlyLimit,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('budgets')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting budget to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertBudgetToSupabase:', err);
    return false;
  }
}

// ==========================================
// 5. REMINDER SETTINGS (ISOLATED BY USER)
// ==========================================

export async function fetchReminderSettingsFromSupabase(userId?: string): Promise<ReminderSetting | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const effectiveUserId = userId || 'default_user';
    const { data, error } = await client
      .from('reminder_settings')
      .select('*')
      .eq('user_id', effectiveUserId)
      .single();

    if (error) {
      console.warn('Supabase fetchReminderSettings error:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      enableBrowserNotification: Boolean(data.enable_browser_notification),
      remindDaysBefore: Array.isArray(data.remind_days_before) ? data.remind_days_before : [7, 3, 1, 0],
      autoSound: Boolean(data.auto_sound),
      notificationTime: data.notification_time || '09:00',
      lastCheckedDate: data.last_checked_date || undefined,
    };
  } catch (err) {
    console.error('Error fetching reminder settings from Supabase:', err);
    return null;
  }
}

export async function upsertReminderSettingsToSupabase(settings: ReminderSetting, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const effectiveUserId = userId || 'default_user';
    const payload = {
      id: `settings_${effectiveUserId}`,
      user_id: effectiveUserId,
      enable_browser_notification: settings.enableBrowserNotification,
      remind_days_before: settings.remindDaysBefore,
      auto_sound: settings.autoSound,
      notification_time: settings.notificationTime,
      last_checked_date: settings.lastCheckedDate || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('reminder_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting reminder settings to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertReminderSettingsToSupabase:', err);
    return false;
  }
}

// ==========================================
// 6. BANK SETTLEMENTS & STATEMENT PERSISTENCE (MULTI-MONTH SUPPORT)
// ==========================================

export async function fetchSettlementsFromSupabase(userId?: string): Promise<BankSettlement[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const effectiveUserId = userId || 'default_user';
    const { data, error } = await client
      .from('bank_settlements')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchSettlements error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any): BankSettlement => {
      const txList = Array.isArray(row.transactions) ? row.transactions : [];
      return {
        id: row.id,
        bankName: row.bank_name,
        accountHolder: row.account_holder,
        accountNumber: row.account_number,
        branch: row.branch || undefined,
        period: row.period,
        startingBalance: Number(row.starting_balance) || 0,
        totalCredit: Number(row.total_credit) || 0,
        totalDebit: Number(row.total_debit) || 0,
        endingBalance: Number(row.ending_balance) || 0,
        netSettlement: Number(row.net_settlement) || 0,
        transactionsCount: txList.length,
        transactions: txList,
        sourceFileName: row.source_file_name || undefined,
        createdAt: row.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('Error fetching settlements from Supabase:', err);
    return null;
  }
}

export async function fetchSettlementFromSupabase(userId?: string): Promise<BankSettlement | null> {
  const all = await fetchSettlementsFromSupabase(userId);
  if (!all || all.length === 0) return null;
  return all[0];
}

export async function syncSettlementsToSupabase(settlements: BankSettlement[], userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const effectiveUserId = userId || 'default_user';
    if (settlements.length === 0) {
      await deleteAllSettlementsFromSupabase(effectiveUserId);
      return true;
    }

    const payloads = settlements.map((settlement, idx) => ({
      id: settlement.id || `set_${effectiveUserId}_${idx}_${Date.now()}`,
      user_id: effectiveUserId,
      bank_name: settlement.bankName || 'BNI',
      account_holder: settlement.accountHolder || 'Nasabah',
      account_number: settlement.accountNumber || '-',
      branch: settlement.branch || null,
      period: settlement.period || `Periode ${idx + 1}`,
      starting_balance: settlement.startingBalance || 0,
      total_credit: settlement.totalCredit || 0,
      total_debit: settlement.totalDebit || 0,
      ending_balance: settlement.endingBalance || 0,
      net_settlement: settlement.netSettlement || 0,
      transactions: settlement.transactions || [],
      source_file_name: settlement.sourceFileName || null,
      updated_at: new Date().toISOString(),
    }));

    // First attempt: upsert on 'id'
    const { error } = await client
      .from('bank_settlements')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      // If table has legacy unique constraint (e.g. unique_user_settlement on user_id)
      if (error.code === '23505' || error.message?.includes('unique_user_settlement') || error.message?.includes('duplicate key')) {
        console.warn('Handling legacy unique_user_settlement constraint by replacing user settlements:', error.message);
        
        // Strategy: clean up existing records for user and re-insert
        await client.from('bank_settlements').delete().eq('user_id', effectiveUserId);
        
        const { error: insError } = await client.from('bank_settlements').insert(payloads);
        if (!insError) {
          return true;
        }

        // If PostgreSQL DB still has UNIQUE(user_id) constraint and payloads > 1, save single top record gracefully
        if (insError.code === '23505' && payloads.length > 0) {
          const { error: singleErr } = await client.from('bank_settlements').insert([payloads[0]]);
          if (!singleErr) return true;
        }
      }

      console.warn('Supabase syncSettlements error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in syncSettlementsToSupabase:', err);
    return false;
  }
}

export async function upsertSettlementToSupabase(settlement: BankSettlement, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const effectiveUserId = userId || 'default_user';
    const payload = {
      id: settlement.id || `set_${Date.now()}`,
      user_id: effectiveUserId,
      bank_name: settlement.bankName,
      account_holder: settlement.accountHolder,
      account_number: settlement.accountNumber,
      branch: settlement.branch || null,
      period: settlement.period,
      starting_balance: settlement.startingBalance,
      total_credit: settlement.totalCredit,
      total_debit: settlement.totalDebit,
      ending_balance: settlement.endingBalance,
      net_settlement: settlement.netSettlement,
      transactions: settlement.transactions || [],
      source_file_name: settlement.sourceFileName || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('bank_settlements')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // Handle legacy unique_user_settlement constraint
      if (error.code === '23505' || error.message?.includes('unique_user_settlement') || error.message?.includes('duplicate key')) {
        console.warn('Handling legacy unique_user_settlement constraint in upsertSettlementToSupabase:', error.message);
        
        // Update existing record by user_id
        const { error: updateError } = await client
          .from('bank_settlements')
          .update(payload)
          .eq('user_id', effectiveUserId);

        if (!updateError) {
          return true;
        }

        // Fallback: delete and insert
        await client.from('bank_settlements').delete().eq('user_id', effectiveUserId);
        const { error: insertError } = await client.from('bank_settlements').insert([payload]);
        if (!insertError) {
          return true;
        }
      }

      console.warn('Supabase upsertSettlement error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertSettlementToSupabase:', err);
    return false;
  }
}

export async function deleteSettlementFromSupabase(settlementId: string, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const effectiveUserId = userId || 'default_user';
    const { error } = await client
      .from('bank_settlements')
      .delete()
      .eq('id', settlementId)
      .eq('user_id', effectiveUserId);

    if (error) {
      console.warn('Supabase deleteSettlement error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteSettlementFromSupabase:', err);
    return false;
  }
}

export async function deleteAllSettlementsFromSupabase(userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const effectiveUserId = userId || 'default_user';
    const { error } = await client
      .from('bank_settlements')
      .delete()
      .eq('user_id', effectiveUserId);

    if (error) {
      console.warn('Supabase deleteAllSettlements error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteAllSettlementsFromSupabase:', err);
    return false;
  }
}


