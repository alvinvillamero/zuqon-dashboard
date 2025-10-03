import { updatePublishStatus, getPublishingStatus, updatePublishingResults } from './airtable';

// Test script to verify publishing workflow
export const testPublishingWorkflow = async (contentId: string): Promise<void> => {
  try {
    console.log('🧪 Testing publishing workflow for content:', contentId);
    
    // Step 1: Initiate publishing
    console.log('📤 Step 1: Initiating Facebook publishing...');
    await updatePublishStatus(contentId, 'Ready_to_Publish', ['Facebook']);
    
    // Step 2: Check status
    console.log('📊 Step 2: Checking publishing status...');
    const status = await getPublishingStatus(contentId);
    console.log('Status:', status);
    
    // Step 3: Simulate Make.com success response
    console.log('✅ Step 3: Simulating successful Facebook publishing...');
    await updatePublishingResults(contentId, [
      {
        platform: 'Facebook',
        status: 'success',
        postId: `fb_test_${Date.now()}`,
        publishedAt: new Date().toISOString()
      }
    ]);
    
    // Step 4: Check final status
    console.log('📊 Step 4: Checking final status...');
    const finalStatus = await getPublishingStatus(contentId);
    console.log('Final status:', finalStatus);
    
    console.log('✅ Publishing workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Publishing workflow test failed:', error);
    throw error;
  }
};

// Test error scenario
export const testPublishingError = async (contentId: string): Promise<void> => {
  try {
    console.log('🧪 Testing publishing error scenario for content:', contentId);
    
    // Step 1: Initiate publishing
    await updatePublishStatus(contentId, 'Ready_to_Publish', ['Facebook']);
    
    // Step 2: Simulate Make.com error response
    console.log('❌ Simulating Facebook publishing error...');
    await updatePublishingResults(contentId, [
      {
        platform: 'Facebook',
        status: 'failed',
        errorMessage: 'Test error: Invalid access token'
      }
    ]);
    
    // Step 3: Check error status
    const errorStatus = await getPublishingStatus(contentId);
    console.log('Error status:', errorStatus);
    
    console.log('✅ Error scenario test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error scenario test failed:', error);
    throw error;
  }
};

