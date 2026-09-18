/**
 * Persistent Storage Helper using IndexedDB with localStorage fallback
 * Prevents data loss when saving large bank settlement files (e.g., 7+ PDF statements with thousands of transactions)
 */
import { BankSettlement, AssetItem, MaintenanceSchedule, MaintenanceRecord } from '../types';

const DB_NAME = 'TerramoraFinDB';
const DB_VERSION = 1;
const STORE_SETTLEMENTS = 'bank_settlements';
const STORE_GENERAL = 'app_data';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SETTLEMENTS)) {
        db.createObjectStore(STORE_SETTLEMENTS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_GENERAL)) {
        db.createObjectStore(STORE_GENERAL, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save bank settlements list persistently to IndexedDB + localStorage
 */
export async function saveBankSettlementsPersistent(userId: string, settlements: BankSettlement[]): Promise<boolean> {
  const key = `terrava_settlements_${userId}`;
  
  // 1. Save to IndexedDB (No quota limitation for multiple PDFs)
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SETTLEMENTS], 'readwrite');
      const store = tx.objectStore(STORE_SETTLEMENTS);
      const putReq = store.put({ key, data: settlements, updatedAt: Date.now() });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, using localStorage fallback:', err);
  }

  // 2. Also save to localStorage as quick synchronous cache
  try {
    localStorage.setItem(key, JSON.stringify(settlements));
    if (settlements.length > 0) {
      localStorage.setItem(`terrava_settlement_${userId}`, JSON.stringify(settlements[0]));
    } else {
      localStorage.removeItem(`terrava_settlement_${userId}`);
    }
  } catch (lsErr) {
    console.warn('localStorage quota reached or unavailable, preserved in IndexedDB:', lsErr);
  }

  return true;
}

/**
 * Load bank settlements list from IndexedDB with localStorage fallback
 */
export async function loadBankSettlementsPersistent(userId: string): Promise<BankSettlement[] | null> {
  const key = `terrava_settlements_${userId}`;

  // 1. Try to read from IndexedDB first for full fidelity
  try {
    const db = await openDatabase();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction([STORE_SETTLEMENTS], 'readonly');
      const store = tx.objectStore(STORE_SETTLEMENTS);
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });

    if (result && Array.isArray(result.data) && result.data.length > 0) {
      return result.data;
    }
  } catch (err) {
    console.warn('IndexedDB read failed, trying localStorage:', err);
  }

  // 2. Fallback to localStorage
  try {
    const savedMulti = localStorage.getItem(key);
    if (savedMulti !== null) {
      const parsed = JSON.parse(savedMulti);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const savedSingle = localStorage.getItem(`terrava_settlement_${userId}`);
    if (savedSingle !== null) {
      const parsed = JSON.parse(savedSingle);
      if (parsed) return [parsed];
    }
  } catch (e) {
    console.warn('Error reading settlements from localStorage:', e);
  }

  return null;
}

/**
 * Delete all settlements for user from IndexedDB and localStorage
 */
export async function clearBankSettlementsPersistent(userId: string): Promise<void> {
  const key = `terrava_settlements_${userId}`;
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_SETTLEMENTS], 'readwrite');
    const store = tx.objectStore(STORE_SETTLEMENTS);
    store.delete(key);
  } catch (e) {
    console.warn('IndexedDB clear failed:', e);
  }

  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`terrava_settlement_${userId}`);
  } catch (e) {
    console.warn('localStorage clear failed:', e);
  }
}

/**
 * Save maintenance assets, schedules, and records persistently to IndexedDB + localStorage
 */
export async function saveMaintenanceDataPersistent(
  userId: string,
  dataOrAssets: {
    assets: AssetItem[];
    schedules: MaintenanceSchedule[];
    records: MaintenanceRecord[];
  } | AssetItem[],
  schedules?: MaintenanceSchedule[],
  records?: MaintenanceRecord[]
): Promise<boolean> {
  const data = Array.isArray(dataOrAssets)
    ? { assets: dataOrAssets, schedules: schedules || [], records: records || [] }
    : dataOrAssets;

  const key = `terrava_maintenance_${userId}`;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_GENERAL], 'readwrite');
      const store = tx.objectStore(STORE_GENERAL);
      const putReq = store.put({ key, data, updatedAt: Date.now() });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB save maintenance failed, fallback to localStorage:', err);
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (lsErr) {
    console.warn('localStorage save maintenance error:', lsErr);
  }

  return true;
}

/**
 * Load maintenance assets, schedules, and records from IndexedDB or localStorage
 */
export async function loadMaintenanceDataPersistent(
  userId: string
): Promise<{
  assets: AssetItem[];
  schedules: MaintenanceSchedule[];
  records: MaintenanceRecord[];
} | null> {
  const key = `terrava_maintenance_${userId}`;

  try {
    const db = await openDatabase();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction([STORE_GENERAL], 'readonly');
      const store = tx.objectStore(STORE_GENERAL);
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });

    if (result && result.data && Array.isArray(result.data.assets)) {
      return result.data;
    }
  } catch (err) {
    console.warn('IndexedDB load maintenance error:', err);
  }

  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.assets)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('localStorage load maintenance error:', e);
  }

  return null;
}

