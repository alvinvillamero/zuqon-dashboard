import { getGeneratedContent, updatePublishStatus } from './airtable';

// Function to clean content for Make.com compatibility
const cleanContentForMakecom = (content: any) => {
  const cleaned = { ...content };
  
  // Clean Facebook post content
  if (cleaned.facebookPost) {
    cleaned.facebookPost = cleaned.facebookPost
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[""'']/g, '"') // Replace smart quotes with regular quotes
      .replace(/[–—]/g, '-') // Replace em/en dashes with regular dashes
      .replace(/…/g, '...') // Replace ellipsis character
      .trim();
  }
  
  // Clean graphic URL
  if (cleaned.graphicUrl) {
    try {
      // Validate and potentially fix URL
      const url = new URL(cleaned.graphicUrl);
      cleaned.graphicUrl = url.toString();
    } catch (e) {
      console.warn('Invalid graphic URL:', cleaned.graphicUrl);
      cleaned.graphicUrl = undefined;
    }
  }
  
  return cleaned;
};

// Debug function to check what data is being sent to Make.com
export const debugMakecomData = async (contentId: string): Promise<void> => {
  try {
    console.log('🔍 Debugging Make.com data for content:', contentId);
    
    // Get the content that would be sent to Make.com
    const allContent = await getGeneratedContent();
    const content = allContent.find(c => c.id === contentId);
    
    if (!content) {
      console.error('❌ Content not found');
      return;
    }
    
    console.log('📋 Content data that Make.com will receive:');
    console.log('Content ID:', content.id);
    console.log('Content Name:', content.name);
    console.log('Facebook Post:', content.facebookPost);
    console.log('Facebook Post Length:', content.facebookPost?.length || 0);
    console.log('Graphic URL:', content.graphicUrl);
    console.log('Publish Status:', content.publishStatus);
    console.log('Publish Platforms:', content.publishPlatforms);
    
    // Check for potential issues
    const issues = [];
    
    if (!content.facebookPost || content.facebookPost.trim() === '') {
      issues.push('❌ Facebook post content is empty');
    }
    
    if (content.facebookPost && content.facebookPost.length > 63206) {
      issues.push('❌ Facebook post is too long (max 63,206 characters)');
    }
    
    if (content.graphicUrl && !content.graphicUrl.startsWith('http')) {
      issues.push('❌ Graphic URL is not a valid HTTP URL');
    }
    
    if (!content.publishPlatforms || !content.publishPlatforms.includes('Facebook')) {
      issues.push('❌ Facebook not in publish platforms');
    }
    
    // Check for problematic characters that could cause URL encoding issues
    if (content.facebookPost) {
      const problematicChars = content.facebookPost.match(/[\u0000-\u001F\u007F-\u009F]/g);
      if (problematicChars) {
        issues.push(`❌ Facebook post contains control characters: ${problematicChars.join(', ')}`);
      }
      
      // Check for unescaped quotes or special characters
      const specialChars = content.facebookPost.match(/[""'']/g);
      if (specialChars) {
        issues.push(`⚠️ Facebook post contains special quotes that might need escaping: ${specialChars.join(', ')}`);
      }
    }
    
    if (content.graphicUrl) {
      try {
        new URL(content.graphicUrl);
      } catch (e) {
        issues.push('❌ Graphic URL is not a valid URL format');
      }
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Potential issues found:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ Content looks good for Facebook publishing');
    }
    
    // Show what the Make.com trigger should see
    console.log('🎯 Make.com trigger data (original):');
    console.log({
      id: content.id,
      'Publish Status': content.publishStatus,
      'Publish Platforms': content.publishPlatforms,
      'Facebook Post': content.facebookPost,
      'Graphic URL': content.graphicUrl,
      Name: content.name
    });
    
    // Show cleaned version
    const cleanedContent = cleanContentForMakecom(content);
    console.log('🧹 Make.com trigger data (cleaned):');
    console.log({
      id: cleanedContent.id,
      'Publish Status': cleanedContent.publishStatus,
      'Publish Platforms': cleanedContent.publishPlatforms,
      'Facebook Post': cleanedContent.facebookPost,
      'Graphic URL': cleanedContent.graphicUrl,
      Name: cleanedContent.name
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Function to test updating a content item for Make.com
export const testMakecomTrigger = async (contentId: string): Promise<void> => {
  try {
    console.log('🧪 Testing Make.com trigger for content:', contentId);
    
    // Update the content to trigger Make.com
    await updatePublishStatus(contentId, 'Ready_to_Publish', ['Facebook']);
    
    console.log('✅ Content updated - Make.com should be triggered');
    console.log('📋 Check your Make.com scenario execution history');
    
  } catch (error) {
    console.error('❌ Test trigger failed:', error);
  }
};
