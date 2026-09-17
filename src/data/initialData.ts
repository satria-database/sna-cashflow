import { CategoryBudget, ExpenseItem, IncomeItem, PaylaterItem, ReminderSetting } from '../types';

// Clean initial data starting from 0 (empty arrays)
export const INITIAL_PAYLATER_ITEMS: PaylaterItem[] = [];

export const INITIAL_EXPENSES: ExpenseItem[] = [];

export const INITIAL_INCOMES: IncomeItem[] = [];

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'makanan', monthlyLimit: 0 },
  { category: 'tagihan_rumah', monthlyLimit: 0 },
  { category: 'transportasi', monthlyLimit: 0 },
  { category: 'belanja', monthlyLimit: 0 },
  { category: 'hiburan', monthlyLimit: 0 },
  { category: 'kesehatan', monthlyLimit: 0 },
  { category: 'investasi', monthlyLimit: 0 },
  { category: 'pendidikan', monthlyLimit: 0 },
  { category: 'keluarga', monthlyLimit: 0 },
  { category: 'lainnya', monthlyLimit: 0 },
];

export const INITIAL_REMINDER_SETTINGS: ReminderSetting = {
  enableBrowserNotification: true,
  remindDaysBefore: [7, 3, 1, 0],
  autoSound: true,
  notificationTime: '09:00',
};
