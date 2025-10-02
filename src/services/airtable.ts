import Airtable from 'airtable';
import { Article, GeneratedContent } from '../types';
import { ENV } from '../config/env';

const base = new Airtable({ apiKey: ENV.AIRTABLE_API_KEY }).base(ENV.AIRTABLE_BASE_ID);
const topicsTable = base('Topic');
const contentTable = base('Generated_Content');
const promptsTable = base('Prompts');

export const getPrompt = async (promptName: string) => {
  try {
    const records = await promptsTable.select({
      filterByFormula: `{Name}='${promptName}'`
    }).firstPage();

    if (records && records.length > 0) {
      const prompt = records[0];
      return {
        id: prompt.id,
        name: prompt.get('Name') as string,
        systemPrompt: prompt.get('System_Prompt') as string,
        userPrompt: prompt.get('User_Prompt') as string,
        category: prompt.get('Category') as string,
        isActive: prompt.get('Is_Active') as boolean
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting prompt:', error);
    return null;
  }
};

export const verifyEnhancedPrompt = async (): Promise<boolean> => {
  try {
    const records = await promptsTable.select({
      filterByFormula: "{Name}='Enhanced Social Media Pack'"
    }).firstPage();

    if (records && records.length > 0) {
      const prompt = records[0];
      console.log('✅ Enhanced Social Media Pack prompt found:', {
        name: prompt.get('Name'),
        category: prompt.get('Category'),
        isActive: prompt.get('Is_Active')
      });
      return true;
    }
    console.log('❌ Enhanced Social Media Pack prompt not found - please run setup script');
    return false;
  } catch (error) {
    console.error('Error verifying prompt:', error);
    return false;
  }
};

export const testAirtableConnection = async (): Promise<boolean> => {
  try {
    await topicsTable.select({ maxRecords: 1 }).firstPage();
    return true;
  } catch (error) {
    console.error('Airtable connection test failed:', error);
    return false;
  }
};

export const getArticles = async (): Promise<Article[]> => {
  try {
    // Log the fetch attempt
    console.log('Fetching articles...');
    
    // First, get one record to see all available fields
    const sampleRecord = await topicsTable.select({
      maxRecords: 1
    }).firstPage();
    
    if (sampleRecord.length > 0) {
      console.log('Available fields:', Object.keys(sampleRecord[0].fields));
    }

    // Then get all records
    const records = await topicsTable.select({
      sort: [{ field: 'Date Fetched', direction: 'desc' }]
    }).all();

    // Log the first record's fields to see what's available
    if (records.length > 0) {
      console.log('First record fields:', records[0].fields);
    }

    // Log what we got
    console.log('Fetched articles:', records.map(record => ({
      title: record.get('Topic'),
      contentLength: (record.get('Content') as string || '').length,
      source: record.get('Source')
    })));

    return records.map(record => ({
      id: record.id,
      title: record.get('Topic') as string,
      content: record.get('Content') as string || '',
      url: record.get('URL') as string,
      source: record.get('Source') as string,
      dateFetched: record.get('Date Fetched') as string,
      hasGeneratedContent: Boolean(record.get('Has_Generated_Content')),
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

export const saveArticle = async (article: Article): Promise<string> => {
  try {
    // Log the full article object
    console.log('Attempting to save article:', JSON.stringify(article, null, 2));
    
    // Check if article already exists
    const existingRecords = await topicsTable.select({
      filterByFormula: `{URL} = '${article.url}'`,
      maxRecords: 1
    }).firstPage();

    if (existingRecords.length > 0) {
      throw new Error('Article with this URL already exists');
    }

    // Format the date properly
    const formattedDate = new Date(article.dateFetched).toISOString().split('T')[0];

    // Prepare minimal data to save - only essential fields
    const saveData = {
      'Topic': article.title,
      'URL': article.url,
      'Source': article.source
    };

    // Log what we're trying to save
    console.log('Saving to Airtable:', JSON.stringify(saveData, null, 2));

    // Create new record
    const record = await topicsTable.create(saveData);

    console.log('Article saved successfully:', { id: record.id });
    return record.id;
  } catch (error) {
    // Log detailed error info
    console.error('Error saving article:', {
      error: error.error,
      message: error.message,
      statusCode: error.statusCode,
      details: error
    });
    throw error;
  }
};

export const getGeneratedContent = async (): Promise<GeneratedContent[]> => {
  try {
    const records = await contentTable.select({
      sort: [{ field: 'Generation_Date', direction: 'desc' }]
    }).all();

    return records.map(record => {
      // Handle Graphic_URL as attachment field
      const graphicAttachment = record.get('Graphic_URL') as any;
      let graphicUrl: string | undefined;
      
      if (graphicAttachment && Array.isArray(graphicAttachment) && graphicAttachment.length > 0) {
        // Get the URL from the first attachment
        graphicUrl = graphicAttachment[0].url;
      }
      
      return {
        id: record.id,
        name: record.get('Name') as string,
        originalUrl: record.get('Original_URL') as string,
        facebookPost: record.get('Facebook_Post') as string,
        instagramPost: record.get('Instagram_Post') as string,
        twitterPost: record.get('Twitter_X_Post') as string,
        videoScript: record.get('Video_Script') as string,
        generationDate: record.get('Generation_Date') as string,
        graphicUrl: graphicUrl,
        graphicPrompt: record.get('Graphic_Prompt') as string || undefined,
        graphicStyle: record.get('Graphic_Style') as string || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching generated content:', error);
    // Log detailed error info
    if (error.error && error.message) {
      console.error('Detailed error:', {
        error: error.error,
        message: error.message,
        statusCode: error.statusCode
      });
    }
    throw error;
  }
};

export const verifyPrompt = async (promptName: string): Promise<boolean> => {
  try {
    const records = await promptsTable.select({
      filterByFormula: `{Name}='${promptName}'`
    }).firstPage();

    if (records && records.length > 0) {
      const prompt = records[0];
      console.log('Found prompt:', {
        name: prompt.get('Name'),
        category: prompt.get('Category'),
        isActive: prompt.get('Is_Active')
      });
      return true;
    }
    console.log('Prompt not found:', promptName);
    return false;
  } catch (error) {
    console.error('Error verifying prompt:', error);
    return false;
  }
};

export const saveGeneratedContent = async (content: {
  articleId: string;
  articleUrl: string;
  facebookPost: string;
  instagramPost: string;
  twitterPost: string;
  videoScript: string;
  graphicUrl?: string;
  graphicPrompt?: string;
  graphicStyle?: string;
}): Promise<void> => {
  try {
    // Get the article to get its title
    const article = await topicsTable.find(content.articleId);
    
    // Prepare save data - only include fields that exist
    const saveData: any = {
      'Name': article.get('Topic') as string,
      'Original_URL': content.articleUrl,
      'Facebook_Post': content.facebookPost,
      'Instagram_Post': content.instagramPost,
      'Twitter_X_Post': content.twitterPost,
      'Video_Script': content.videoScript
    };

    // Only add graphic fields if they exist and have values
    // Detect field structure and save graphic data accordingly
    const fieldStructure = await detectFieldStructure();
    
    if (content.graphicUrl) {
      const graphicUrlField = fieldStructure.graphicUrlField || 'Graphic_URL';
      
      // Handle graphic URL based on its format
      if (content.graphicUrl.startsWith('data:')) {
        // Base64 data URL - convert to attachment format
        const base64Data = content.graphicUrl.split(',')[1];
        const mimeType = content.graphicUrl.split(',')[0].split(':')[1].split(';')[0];
        const extension = mimeType.split('/')[1] || 'jpg';
        
        saveData[graphicUrlField] = [
          {
            filename: `generated-graphic-${Date.now()}.${extension}`,
            content: base64Data,
            contentType: mimeType
          }
        ];
      } else {
        // Regular URL - use attachment format with URL
        saveData[graphicUrlField] = [
          {
            url: content.graphicUrl,
            filename: `generated-graphic-${Date.now()}.png`
          }
        ];
      }
    }
    
    // Only add fields that actually exist in the table
    if (content.graphicPrompt && fieldStructure.allFields.includes('Graphic_Prompt')) {
      saveData['Graphic_Prompt'] = content.graphicPrompt;
    }
    
    if (content.graphicStyle && fieldStructure.allFields.includes('Graphic_Style')) {
      saveData['Graphic_Style'] = content.graphicStyle;
    }

    console.log('Attempting to save:', JSON.stringify(saveData, null, 2));

    // Save the generated content
    await contentTable.create(saveData);
  } catch (error) {
    console.error('Error saving generated content:', JSON.stringify(error, null, 2));
    // Log detailed error info
    if (error.error && error.message) {
      console.error('Detailed error:', {
        error: error.error,
        message: error.message,
        statusCode: error.statusCode,
        details: error
      });
    }
    throw error;
  }
};

export const updateGeneratedContentGraphic = async (
  contentId: string,
  graphicData: {
    graphicUrl: string;
    graphicPrompt: string;
    graphicStyle: string;
  }
): Promise<void> => {
  try {
    // Detect the correct field name for graphic URL
    const fieldStructure = await detectFieldStructure();
    const graphicUrlField = fieldStructure.graphicUrlField || 'Graphic_URL';
    
    console.log(`Using field: ${graphicUrlField}`);
    console.log(`All available fields:`, fieldStructure.allFields);
    
    // Prepare update data - only include fields that exist
    let updateData: any = {};
    
    // Only add fields that actually exist in the table
    if (fieldStructure.allFields.includes('Graphic_Prompt')) {
      updateData['Graphic_Prompt'] = graphicData.graphicPrompt;
    }
    if (fieldStructure.allFields.includes('Graphic_Style')) {
      updateData['Graphic_Style'] = graphicData.graphicStyle;
    }
    
    // Handle graphic URL as attachment (since you changed the field type to attachment)
    if (graphicData.graphicUrl.startsWith('data:')) {
      // Base64 data URL - convert to attachment format
      const base64Data = graphicData.graphicUrl.split(',')[1];
      const mimeType = graphicData.graphicUrl.split(',')[0].split(':')[1].split(';')[0];
      const extension = mimeType.split('/')[1] || 'jpg';
      
      updateData[graphicUrlField] = [
        {
          filename: `generated-graphic-${Date.now()}.${extension}`,
          content: base64Data,
          contentType: mimeType
        }
      ];
    } else {
      // Regular URL - use attachment format with URL
      updateData[graphicUrlField] = [
        {
          url: graphicData.graphicUrl,
          filename: `generated-graphic-${Date.now()}.png`
        }
      ];
    }
    
    console.log(`Attempting to update ${graphicUrlField} with attachment format:`, updateData);
    await contentTable.update(contentId, updateData);
    console.log(`✅ Successfully updated ${graphicUrlField} as attachment field`);
    
  } catch (error) {
    console.error('Error updating graphic:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    // If the error contains field information, log it
    if (error.error && error.error.message) {
      console.error('Airtable error message:', error.error.message);
    }
    
    throw error;
  }
};

export const updateGeneratedContentWithUploadedImage = async (
  contentId: string,
  dataUrl: string,
  fileName: string
): Promise<void> => {
  try {
    // Detect the correct field name for graphic URL
    const fieldStructure = await detectFieldStructure();
    const graphicUrlField = fieldStructure.graphicUrlField || 'Graphic_URL';
    
    console.log(`Using field: ${graphicUrlField}`);
    
    // Since the field is now an attachment field, use attachment format
    const base64String = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const extension = mimeType.split('/')[1] || 'jpg';
    
    const updateData: any = {
      [graphicUrlField]: [
        {
          filename: fileName || `uploaded-image-${Date.now()}.${extension}`,
          content: base64String,
          contentType: mimeType
        }
      ]
    };
    
    console.log('Attempting to update with attachment format:', updateData);
    await contentTable.update(contentId, updateData);
    console.log(`Successfully updated ${graphicUrlField} as attachment field`);
    
  } catch (error) {
    console.error('Error updating with uploaded image:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    // If the error contains field information, log it
    if (error.error && error.error.message) {
      console.error('Airtable error message:', error.error.message);
    }
    
    throw error;
  }
};

// Diagnostic function to check available fields
export const checkAirtableFields = async (): Promise<void> => {
  try {
    console.log('🔍 Checking Airtable Generated_Content table fields...');
    
    // Get one record to see all available fields
    const records = await contentTable.select({ maxRecords: 1 }).firstPage();
    
    if (records.length > 0) {
      const record = records[0];
      const fields = Object.keys(record.fields);
      
      console.log('📋 Available fields in Generated_Content table:');
      fields.forEach(field => {
        console.log(`  - "${field}"`);
      });
      
      // Check for graphic-related fields
      const graphicFields = fields.filter(field => 
        field.toLowerCase().includes('graphic') || 
        field.toLowerCase().includes('image') ||
        field.toLowerCase().includes('photo')
      );
      
      if (graphicFields.length > 0) {
        console.log('🎨 Graphic-related fields found:');
        graphicFields.forEach(field => {
          console.log(`  ✅ "${field}"`);
        });
      } else {
        console.log('⚠️ No graphic-related fields found');
        console.log('💡 Please add these fields to your Airtable:');
        console.log('   - Graphic_URL (Long text)');
        console.log('   - Graphic_Prompt (Long text)');
        console.log('   - Graphic_Style (Single line text)');
      }
    } else {
      console.log('⚠️ No records found in Generated_Content table');
    }
  } catch (error) {
    console.error('❌ Error checking Airtable fields:', error);
  }
};

// Diagnostic function to check Prompts table fields
export const checkPromptsTableFields = async (): Promise<void> => {
  try {
    console.log('🔍 Checking Airtable Prompts table fields...');
    
    // Get one record to see all available fields
    const records = await promptsTable.select({ maxRecords: 1 }).firstPage();
    
    if (records.length > 0) {
      const record = records[0];
      const fields = Object.keys(record.fields);
      
      console.log('📋 Available fields in Prompts table:');
      fields.forEach(field => {
        console.log(`  - "${field}"`);
      });
      
      // Check for expected prompt fields
      const expectedFields = ['Name', 'System_Prompt', 'User_Prompt', 'Category', 'Version', 'Is_Active'];
      const missingFields = expectedFields.filter(expected => 
        !fields.some(field => field === expected)
      );
      
      if (missingFields.length > 0) {
        console.log('⚠️ Missing expected fields:');
        missingFields.forEach(field => {
          console.log(`  ❌ "${field}"`);
        });
      } else {
        console.log('✅ All expected fields found');
      }
    } else {
      console.log('⚠️ No records found in Prompts table');
    }
  } catch (error) {
    console.error('❌ Error checking Prompts table fields:', error);
  }
};

// Function to detect all available fields and their types
export const detectFieldStructure = async (): Promise<{
  graphicUrlField?: string;
  graphicPromptField?: string;
  graphicStyleField?: string;
  allFields: string[];
}> => {
  try {
    const records = await contentTable.select({ maxRecords: 1 }).firstPage();
    
    if (records.length === 0) {
      return { allFields: [] };
    }
    
    const fields = Object.keys(records[0].fields);
    
    // Look for graphic-related fields
    const graphicUrlField = fields.find(field => 
      field.toLowerCase().includes('graphic') && 
      (field.toLowerCase().includes('url') || field.toLowerCase().includes('image'))
    );
    
    const graphicPromptField = fields.find(field => 
      field.toLowerCase().includes('graphic') && 
      field.toLowerCase().includes('prompt')
    );
    
    const graphicStyleField = fields.find(field => 
      field.toLowerCase().includes('graphic') && 
      field.toLowerCase().includes('style')
    );
    
    return {
      graphicUrlField,
      graphicPromptField,
      graphicStyleField,
      allFields: fields
    };
  } catch (error) {
    console.error('Error detecting field structure:', error);
    return { allFields: [] };
  }
};

// Function to test field type compatibility
export const testFieldCompatibility = async (contentId: string, fieldName: string): Promise<{
  supportsText: boolean;
  supportsAttachment: boolean;
  error?: string;
}> => {
  const result = {
    supportsText: false,
    supportsAttachment: false,
    error: undefined as string | undefined
  };

  try {
    // Test text field approach
    try {
      await contentTable.update(contentId, {
        [fieldName]: 'test-text-value'
      });
      result.supportsText = true;
      console.log(`✅ Field ${fieldName} supports text values`);
    } catch (textError) {
      console.log(`❌ Field ${fieldName} does not support text values:`, textError.message);
    }

    // Test attachment field approach
    try {
      await contentTable.update(contentId, {
        [fieldName]: [
          {
            url: 'https://example.com/test.png',
            filename: 'test.png'
          }
        ]
      });
      result.supportsAttachment = true;
      console.log(`✅ Field ${fieldName} supports attachment values`);
    } catch (attachmentError) {
      console.log(`❌ Field ${fieldName} does not support attachment values:`, attachmentError.message);
    }

    return result;
  } catch (error) {
    result.error = error.message;
    return result;
  }
};

// Function to create/save graphic generation prompt
export const saveGraphicPrompt = async (promptData: {
  name: string;
  systemPrompt: string;
  userPrompt: string;
  category: string;
  version?: string;
  isActive?: boolean;
}): Promise<string> => {
  try {
    // Create minimal save data with only existing fields
    const saveData: any = {
      'Name': promptData.name,
      'Category': promptData.category,
      'Is_Active': promptData.isActive !== false // Default to true
    };

    // Only add fields that exist in your Airtable
    // Check if System_Prompt field exists by trying to get a record first
    try {
      const testRecord = await promptsTable.select({ maxRecords: 1 }).firstPage();
      if (testRecord.length > 0) {
        const fields = Object.keys(testRecord[0].fields);
        
        if (fields.includes('System_Prompt')) {
          saveData['System_Prompt'] = promptData.systemPrompt;
        }
        if (fields.includes('User_Prompt')) {
          saveData['User_Prompt'] = promptData.userPrompt;
        }
        if (fields.includes('Version')) {
          // Try different version formats
          saveData['Version'] = promptData.version || '1.0';
        }
      }
    } catch (fieldError) {
      console.log('Could not check field existence, using minimal data');
    }

    console.log('Saving graphic prompt with available fields:', saveData);
    
    const record = await promptsTable.create(saveData);
    console.log('Graphic prompt saved successfully:', { id: record.id });
    return record.id;
  } catch (error) {
    console.error('Error saving graphic prompt:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    // If the error contains field information, log it
    if (error.error && error.error.message) {
      console.error('Airtable error message:', error.error.message);
    }
    
    throw error;
  }
};

// Function to update existing graphic prompt
export const updateGraphicPrompt = async (
  promptId: string,
  promptData: {
    systemPrompt?: string;
    userPrompt?: string;
    category?: string;
    version?: number | string;
    isActive?: boolean;
  }
): Promise<void> => {
  try {
    const updateData: any = {};
    
    if (promptData.systemPrompt !== undefined) updateData['System_Prompt'] = promptData.systemPrompt;
    if (promptData.userPrompt !== undefined) updateData['User_Prompt'] = promptData.userPrompt;
    if (promptData.category !== undefined) updateData['Category'] = promptData.category;
    if (promptData.isActive !== undefined) updateData['Is_Active'] = promptData.isActive;
    
    // Skip version field to avoid data type issues
    // if (promptData.version !== undefined) updateData['Version'] = promptData.version;

    console.log('Updating graphic prompt:', updateData);
    
    await promptsTable.update(promptId, updateData);
    console.log('Graphic prompt updated successfully');
  } catch (error) {
    console.error('Error updating graphic prompt:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};