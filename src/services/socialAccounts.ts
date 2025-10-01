import Airtable from 'airtable';
import { ENV } from '../config/env';
import { SocialMediaAccount } from './socialMedia';

const base = new Airtable({ apiKey: ENV.AIRTABLE_API_KEY }).base(ENV.AIRTABLE_BASE_ID);
const socialAccountsTable = base('Social_Accounts');

export const getSocialAccounts = async (): Promise<SocialMediaAccount[]> => {
  try {
    const records = await socialAccountsTable.select({
      sort: [{ field: 'Platform', direction: 'asc' }]
    }).all();

    return records.map(record => ({
      id: record.id,
      platform: record.get('Platform') as 'facebook' | 'instagram' | 'twitter',
      name: record.get('Name') as string,
      username: record.get('Username') as string,
      accountId: record.get('Account_ID') as string,
      accessToken: record.get('Access_Token') as string,
      refreshToken: record.get('Refresh_Token') as string || undefined,
      expiresAt: record.get('Expires_At') as string || undefined,
      isConnected: Boolean(record.get('Is_Connected')),
      lastSync: record.get('Last_Sync') as string || undefined,
      permissions: (record.get('Permissions') as string || '').split(',').filter(p => p.trim()),
    }));
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    throw error;
  }
};

export const saveSocialAccount = async (account: SocialMediaAccount): Promise<string> => {
  try {
    // Check if account already exists
    const existingRecords = await socialAccountsTable.select({
      filterByFormula: `{Account_ID} = '${account.accountId}' AND {Platform} = '${account.platform}'`,
      maxRecords: 1
    }).firstPage();

    const saveData = {
      'Platform': account.platform,
      'Name': account.name,
      'Username': account.username,
      'Account_ID': account.accountId,
      'Access_Token': account.accessToken,
      'Refresh_Token': account.refreshToken || '',
      'Expires_At': account.expiresAt || '',
      'Is_Connected': account.isConnected,
      'Last_Sync': account.lastSync || new Date().toISOString(),
      'Permissions': account.permissions.join(','),
    };

    if (existingRecords.length > 0) {
      // Update existing account
      const record = await socialAccountsTable.update(existingRecords[0].id, saveData);
      return record.id;
    } else {
      // Create new account
      const record = await socialAccountsTable.create(saveData);
      return record.id;
    }
  } catch (error) {
    console.error('Error saving social account:', error);
    throw error;
  }
};

export const updateSocialAccountStatus = async (accountId: string, isConnected: boolean): Promise<void> => {
  try {
    await socialAccountsTable.update(accountId, {
      'Is_Connected': isConnected,
      'Last_Sync': new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating social account status:', error);
    throw error;
  }
};

export const deleteSocialAccount = async (accountId: string): Promise<void> => {
  try {
    await socialAccountsTable.destroy(accountId);
  } catch (error) {
    console.error('Error deleting social account:', error);
    throw error;
  }
};

export const refreshSocialAccountToken = async (accountId: string, newToken: string, expiresAt?: string): Promise<void> => {
  try {
    const updateData: any = {
      'Access_Token': newToken,
      'Last_Sync': new Date().toISOString(),
    };

    if (expiresAt) {
      updateData['Expires_At'] = expiresAt;
    }

    await socialAccountsTable.update(accountId, updateData);
  } catch (error) {
    console.error('Error refreshing social account token:', error);
    throw error;
  }
};
