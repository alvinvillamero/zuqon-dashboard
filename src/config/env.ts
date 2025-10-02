const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = (import.meta as any).env[key] || defaultValue;
  if (value === undefined) {
    console.error(`Environment variable ${key} is not set`);
    return '';
  }
  return value;
};

export const ENV = {
  AIRTABLE_API_KEY: getEnvVar('VITE_AIRTABLE_API_KEY'),
  AIRTABLE_BASE_ID: getEnvVar('VITE_AIRTABLE_BASE_ID'),
  AIRTABLE_TOPICS_TABLE: getEnvVar('VITE_AIRTABLE_TOPICS_TABLE', 'Topic'),
  AIRTABLE_CONTENT_TABLE: getEnvVar('VITE_AIRTABLE_CONTENT_TABLE', 'Generated_Content'),
  OPENAI_API_KEY: getEnvVar('VITE_OPENAI_API_KEY'),
  
  // Make.com Integration
  MAKECOM_WEBHOOK_URL: getEnvVar('VITE_MAKECOM_WEBHOOK_URL'),
  
  // Social Media API Keys
  FACEBOOK_APP_ID: getEnvVar('VITE_FACEBOOK_APP_ID'),
  FACEBOOK_APP_SECRET: getEnvVar('VITE_FACEBOOK_APP_SECRET'),
  INSTAGRAM_APP_ID: getEnvVar('VITE_INSTAGRAM_APP_ID'),
  INSTAGRAM_APP_SECRET: getEnvVar('VITE_INSTAGRAM_APP_SECRET'),
  TWITTER_CLIENT_ID: getEnvVar('VITE_TWITTER_CLIENT_ID'),
  TWITTER_CLIENT_SECRET: getEnvVar('VITE_TWITTER_CLIENT_SECRET'),
};