import { ArchiveRecord, UserArchivist } from '../types';

interface ArchivistAccount extends UserArchivist {
  passwordHash: string;
}

// Global flag to indicate if we are in LAN Server mode
let isLanServerActive = false;

/**
 * Checks if the central LAN server is online and responding.
 */
export async function checkServerStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/status', { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      const data = await response.json();
      isLanServerActive = data.mode === 'lan_server';
      return isLanServerActive;
    }
  } catch (e) {
    isLanServerActive = false;
  }
  return false;
}

export function isLanActive(): boolean {
  return isLanServerActive;
}

/**
 * Fetches All Records (from LAN server or local fallback)
 */
export async function fetchRecords(): Promise<ArchiveRecord[]> {
  // Always try to read from server if online
  if (isLanServerActive) {
    try {
      const resp = await fetch('/api/records');
      if (resp.ok) {
        const records = await resp.json();
        // Fallback sync to local state to prevent data loss when shifting back to standalone
        localStorage.setItem('alg_archive_records_v1', JSON.stringify(records));
        return records;
      }
    } catch (e) {
      console.warn('LAN server unreachable, falling back to local database.');
    }
  }

  // Standalone fallback
  const cached = localStorage.getItem('alg_archive_records_v1');
  return cached ? JSON.parse(cached) : [];
}

/**
 * Saves All Records (to LAN server and local fallback)
 */
export async function saveRecords(records: ArchiveRecord[]): Promise<boolean> {
  // Always write locally first for ultimate data safety
  localStorage.setItem('alg_archive_records_v1', JSON.stringify(records));

  if (isLanServerActive) {
    try {
      const resp = await fetch('/api/records/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });
      return resp.ok;
    } catch (e) {
      console.error('Failed to sync records to LAN server:', e);
      return false;
    }
  }
  return true;
}

/**
 * Fetches Archivists Accounts (from LAN server or local fallback)
 */
export async function fetchAccounts(): Promise<ArchivistAccount[]> {
  const getDefaultAdmin = (): ArchivistAccount[] => [
    {
      username: 'admin',
      fullName: 'مسؤول المصلحة (المدير)',
      role: 'admin',
      avatar: '🏛️',
      matsaleh: 'مديرية الميزانية - ورقلة',
      passwordHash: 'admin'
    }
  ];

  if (isLanServerActive) {
    try {
      const resp = await fetch('/api/accounts');
      if (resp.ok) {
        const accounts = await resp.json();
        localStorage.setItem('alg_archivists_accounts_v4', JSON.stringify(accounts));
        return accounts;
      }
    } catch (e) {
      console.warn('LAN server unreachable for accounts.');
    }
  }

  const cached = localStorage.getItem('alg_archivists_accounts_v4');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {
      // ignore
    }
  }
  return getDefaultAdmin();
}

/**
 * Saves Archivists Accounts (to LAN server and local fallback)
 */
export async function saveAccounts(accounts: ArchivistAccount[]): Promise<boolean> {
  localStorage.setItem('alg_archivists_accounts_v4', JSON.stringify(accounts));

  if (isLanServerActive) {
    try {
      const resp = await fetch('/api/accounts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accounts),
      });
      return resp.ok;
    } catch (e) {
      console.error('Failed to sync accounts to LAN server:', e);
      return false;
    }
  }
  return true;
}
