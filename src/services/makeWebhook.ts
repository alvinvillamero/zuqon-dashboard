import { updatePublishingResults } from './airtable';

// Interface for Make.com webhook payload
interface MakeWebhookPayload {
  contentId: string;
  results: Array<{
    platform: string;
    status: 'success' | 'failed';
    postId?: string;
    errorMessage?: string;
    publishedAt?: string;
  }>;
}

// Handle webhook from Make.com with publishing results
export const handleMakeWebhook = async (payload: MakeWebhookPayload): Promise<void> => {
  try {
    console.log('Received Make.com webhook:', payload);
    
    // Validate payload
    if (!payload.contentId || !payload.results || !Array.isArray(payload.results)) {
      throw new Error('Invalid webhook payload');
    }
    
    // Update publishing results in Airtable
    await updatePublishingResults(payload.contentId, payload.results);
    
    console.log('Successfully processed Make.com webhook');
  } catch (error) {
    console.error('Error processing Make.com webhook:', error);
    throw error;
  }
};

// Simulate webhook for testing (can be removed in production)
export const simulateFacebookPublishSuccess = async (contentId: string): Promise<void> => {
  const mockPayload: MakeWebhookPayload = {
    contentId,
    results: [
      {
        platform: 'Facebook',
        status: 'success',
        postId: `fb_${Date.now()}`,
        publishedAt: new Date().toISOString()
      }
    ]
  };
  
  await handleMakeWebhook(mockPayload);
};

export const simulateFacebookPublishFailure = async (contentId: string, errorMessage: string): Promise<void> => {
  const mockPayload: MakeWebhookPayload = {
    contentId,
    results: [
      {
        platform: 'Facebook',
        status: 'failed',
        errorMessage
      }
    ]
  };
  
  await handleMakeWebhook(mockPayload);
};
