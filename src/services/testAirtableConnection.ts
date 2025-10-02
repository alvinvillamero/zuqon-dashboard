import { getGeneratedContent, getPublishingStatus, updatePublishStatus } from './airtable';

// Test function to verify Airtable connection and publishing workflow
export const testAirtablePublishingConnection = async (): Promise<void> => {
  try {
    console.log('🧪 Testing Airtable publishing connection...');
    
    // Step 1: Fetch generated content
    console.log('📋 Step 1: Fetching generated content...');
    const content = await getGeneratedContent();
    console.log(`Found ${content.length} content items`);
    
    // Log raw data to help debug
    if (content.length > 0) {
      console.log('📊 Sample content data structure:', {
        id: content[0].id,
        name: content[0].name,
        publishStatus: content[0].publishStatus,
        publishPlatforms: content[0].publishPlatforms,
        publishPlatformsType: typeof content[0].publishPlatforms,
        facebookStatus: content[0].facebookStatus,
      });
    }
    
    if (content.length === 0) {
      console.log('⚠️ No content found. Please generate some content first.');
      return;
    }
    
    // Show first content item details
    const firstContent = content[0];
    console.log('📄 First content item:', {
      id: firstContent.id,
      name: firstContent.name,
      publishStatus: firstContent.publishStatus,
      publishPlatforms: firstContent.publishPlatforms,
      facebookStatus: firstContent.facebookStatus,
      hasFacebookPost: !!firstContent.facebookPost
    });
    
    // Step 2: Test getting publishing status
    console.log('📊 Step 2: Testing publishing status retrieval...');
    const publishStatus = await getPublishingStatus(firstContent.id);
    console.log('Publishing status:', publishStatus);
    
    // Step 3: Test updating publishing status (if not already set)
    if (!firstContent.publishStatus || firstContent.publishStatus === 'Draft') {
      console.log('🚀 Step 3: Testing status update to Ready_to_Publish...');
      await updatePublishStatus(firstContent.id, 'Ready_to_Publish', ['Facebook']);
      
      // Verify the update
      const updatedStatus = await getPublishingStatus(firstContent.id);
      console.log('Updated status:', updatedStatus);
    } else {
      console.log('✅ Content already has publishing status:', firstContent.publishStatus);
    }
    
    console.log('✅ Airtable publishing connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Airtable publishing connection test failed:', error);
    throw error;
  }
};

// Test function to check specific content item
export const testSpecificContent = async (contentId: string): Promise<void> => {
  try {
    console.log(`🧪 Testing specific content: ${contentId}`);
    
    const status = await getPublishingStatus(contentId);
    console.log('Content publishing status:', status);
    
    // If ready to publish, we can test the workflow
    if (status.publishStatus === 'Ready_to_Publish') {
      console.log('✅ Content is ready for Make.com to process!');
      console.log('📋 Publishing details:', {
        platforms: status.publishPlatforms,
        facebookStatus: status.facebookStatus,
        publishStatus: status.publishStatus
      });
    } else {
      console.log(`ℹ️ Content status: ${status.publishStatus}`);
    }
    
  } catch (error) {
    console.error('❌ Content test failed:', error);
    throw error;
  }
};
