export type PaylaterProvider = 
  | 'spaylater'
  | 'gopaylater'
  | 'kredivo'
  | 'akulaku'
  | 'indodana'
  | 'traveloka'
  | 'homecredit'
  | 'kartu_kredit'
  | 'lainnya';

export type ExpenseCategory =
  | 'makanan'
  | 'transportasi'
  | 'belanja'
  | 'tagihan_rumah'
  | 'hiburan'
  | 'kesehatan'
  | 'pendidikan'
  | 'keluarga'
  | 'investasi'
  | 'lainnya';

export type IncomeSource =
  | 'gaji'
  | 'freelance'
  | 'bisnis'
  | 'investasi'
  | 'bonus'
  | 'lainnya';

export interface PaylaterItem {
  id: string;
  title: string; // e.g. "Beli Sepatu Sneakers", "HP Samsung A54"
  provider: PaylaterProvider;
  customProviderName?: string;
  totalAmount: number; // Total harga / pokok
  monthlyInstallment: number; // Nominal per bulan
  totalTenor: number; // Jumlah bulan cicilan (misal 6)
  currentTenor: number; // Cicilan berjalan saat ini (misal ke-2)
  dueDay: number; // Tanggal jatuh tempo tiap bulan (1-31)
  interestRate?: number; // Bunga per bulan (%)
  adminFee?: number; // Biaya admin per bulan
  notes?: string;
  startDate: string; // YYYY-MM
  isPaidThisMonth: boolean; // Status lunas bulan aktif
  paidHistory: {
    monthKey: string; // "2026-08"
    paidAt: string; // ISO date
    amount: number;
  }[];
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  notes?: string;
  isRecurring?: boolean;
}

export interface IncomeItem {
  id: string;
  title: string;
  amount: number;
  source: IncomeSource;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyLimit: number;
}

export interface ReminderSetting {
  enableBrowserNotification: boolean;
  remindDaysBefore: number[]; // e.g. [7, 3, 1, 0]
  autoSound: boolean;
  notificationTime: string; // "09:00"
  lastCheckedDate?: string;
}

export interface FinancialHealthScore {
  score: number; // 0 - 100
  status: 'Sangat Sehat' | 'Sehat' | 'Waspada' | 'Kritis';
  dsrPercentage: number; // Debt Service Ratio
  color: string;
  message: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
  provider: 'google' | 'guest';
  joinedAt?: string;
}

export type BankName = 'BNI' | 'BCA' | 'MANDIRI' | 'BRI' | 'BSI' | 'SEABANK' | 'JAGO' | 'LAINNYA';

export type SettlementTransactionType = 
  | 'qris' 
  | 'ewallet' 
  | 'va' 
  | 'transfer' 
  | 'cash_deposit' 
  | 'cash_withdrawal' 
  | 'fee' 
  | 'other';

export interface BankSettlementTransaction {
  id: string;
  dateTime: string; // e.g. "01 Jun 2026 11:46:12 WIB"
  date: string; // "2026-06-01"
  type: SettlementTransactionType;
  typeLabel: string; // "Pembayaran Qris", "Virtual Account", etc.
  description: string; // "TOMORO COFFEE TUBAN QR - TUBAN"
  subDescription?: string;
  amount: number; // positive for credit, negative for debit
  isCredit: boolean;
  balanceAfter: number;
  matchedCategory?: ExpenseCategory;
  isReconciled?: boolean;
  paylaterMatchTitle?: string;
}

export interface BankSettlement {
  id: string;
  bankName: BankName;
  accountHolder: string; // e.g. "SATRIA NUR ARDIANSYAH"
  accountNumber: string; // e.g. "TAPLUS - 1956663522"
  branch?: string; // e.g. "TUBAN"
  period: string; // e.g. "1 - 30 Juni 2026"
  startingBalance: number; // Saldo Awal: 3,422,447
  totalCredit: number; // Total Pemasukan: +22,750,219
  totalDebit: number; // Total Pengeluaran: -20,751,556
  endingBalance: number; // Saldo Akhir: 5,421,110
  netSettlement: number; // Saldo Akhir - Saldo Awal (or Credit - Debit)
  transactionsCount: number;
  createdAt: string;
  transactions: BankSettlementTransaction[];
  sourceFileName?: string;
}

// ==========================================
// JADWAL & PERAWATAN ASET (MAINTENANCE)
// ==========================================

export type AssetCategory = 
  | 'Kendaraan'
  | 'Mesin'
  | 'Peralatan'
  | 'Elektronik'
  | 'Bangunan'
  | 'Keamanan'
  | 'Lainnya';

export interface AssetItem {
  id: string;
  userId?: string;
  name: string; // e.g. "Toyota Avanza", "AC Ruang Meeting"
  category: AssetCategory;
  brand: string; // Merk
  model: string; // Model
  year?: number; // Tahun (opsional)
  currentMeter?: number; // Kilometer / Hour Meter (opsional)
  meterUnit?: 'km' | 'hours'; // Satuan
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type MaintenanceIntervalMethod = 
  | 'date'       // Berdasarkan tanggal
  | 'km'         // Berdasarkan kilometer
  | 'hours'      // Berdasarkan jam kerja
  | 'date_km';   // Tanggal + kilometer

export type MaintenancePriority = 'low' | 'medium' | 'high';

export type MaintenanceStatus = 
  | 'safe'       // 🟢 Aman
  | 'soon'       // 🟡 Segera
  | 'due'        // 🟠 Jatuh Tempo
  | 'overdue'    // 🔴 Terlambat
  | 'completed'; // 🔵 Selesai

export type MaintenanceReminderOption = 
  | '30_days'
  | '14_days'
  | '7_days'
  | '1_day'
  | 'on_due_date'
  | 'none';

export interface MaintenanceSchedule {
  id: string;
  userId?: string;
  assetId: string;
  title: string; // Nama perawatan, e.g. "Ganti Oli Mesin"
  category: string; // Kategori perawatan, e.g. "Oli & Pelumas"
  lastDate?: string; // YYYY-MM-DD
  lastMeter?: number;
  nextDate?: string; // YYYY-MM-DD
  nextMeter?: number;
  intervalMethod: MaintenanceIntervalMethod;
  intervalMonths?: number; // e.g. 6
  intervalKm?: number;     // e.g. 5000
  intervalHours?: number;  // e.g. 250
  priority: MaintenancePriority;
  estimatedCost?: number;
  reminder: MaintenanceReminderOption;
  notes?: string;
  isRecurring: boolean; // Jadwal berulang ON/OFF
  status?: MaintenanceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface MaintenanceRecord {
  id: string;
  userId?: string;
  scheduleId?: string;
  assetId: string;
  assetName: string;
  title: string;
  completionDate: string; // YYYY-MM-DD
  meterReading?: number; // KM / Hour meter saat selesai
  actualCost: number;
  serviceProvider?: string; // Bengkel / Teknisi / PIC
  notes?: string;
  recordedAsExpense?: boolean;
  expenseId?: string;
  createdAt: string;
}

