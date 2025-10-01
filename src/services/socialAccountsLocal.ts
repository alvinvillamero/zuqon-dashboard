import { SocialMediaAccount } from './socialMedia';

const STORAGE_KEY = 'zuqon_social_accounts';

export const getSocialAccounts = async (): Promise<SocialMediaAccount[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const accounts = JSON.parse(stored);
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    console.error('Error fetching social accounts from localStorage:', error);
    return [];
  }
};

export const saveSocialAccount = async (account: SocialMediaAccount): Promise<string> => {
  try {
    const existingAccounts = await getSocialAccounts();
    
    // Check if account already exists (by platform and accountId)
    const existingIndex = existingAccounts.findIndex(
      a => a.platform === account.platform && a.accountId === account.accountId
    );
    
    if (existingIndex >= 0) {
      // Update existing account
      existingAccounts[existingIndex] = account;
    } else {
      // Add new account
      existingAccounts.push(account);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingAccounts));
    return account.id;
  } catch (error) {
    console.error('Error saving social account to localStorage:', error);
    throw error;
  }
};

export const updateSocialAccountStatus = async (accountId: string, isConnected: boolean): Promise<void> => {
  try {
    const accounts = await getSocialAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex >= 0) {
      accounts[accountIndex].isConnected = isConnected;
      accounts[accountIndex].lastSync = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (error) {
    console.error('Error updating social account status:', error);
    throw error;
  }
};

export const deleteSocialAccount = async (accountId: string): Promise<void> => {
  try {
    const accounts = await getSocialAccounts();
    const filteredAccounts = accounts.filter(a => a.id !== accountId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAccounts));
  } catch (error) {
    console.error('Error deleting social account:', error);
    throw error;
  }
};

export const refreshSocialAccountToken = async (accountId: string, newToken: string, expiresAt?: string): Promise<void> => {
  try {
    const accounts = await getSocialAccounts();
    const accountIndex = accounts.findIndex(a => a.id === accountId);
    
    if (accountIndex >= 0) {
      accounts[accountIndex].accessToken = newToken;
      accounts[accountIndex].lastSync = new Date().toISOString();
      
      if (expiresAt) {
        accounts[accountIndex].expiresAt = expiresAt;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (error) {
    console.error('Error refreshing social account token:', error);
    throw error;
  }
};

// Utility function to clear all social accounts (for testing)
export const clearAllSocialAccounts = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Utility function to export accounts (for backup)
export const exportSocialAccounts = (): string => {
  const accounts = localStorage.getItem(STORAGE_KEY);
  return accounts || '[]';
};

// Utility function to import accounts (for restore)
export const importSocialAccounts = (accountsJson: string): void => {
  try {
    const accounts = JSON.parse(accountsJson);
    if (Array.isArray(accounts)) {
      localStorage.setItem(STORAGE_KEY, accountsJson);
    }
  } catch (error) {
    console.error('Error importing social accounts:', error);
    throw new Error('Invalid accounts data');
  }
};
