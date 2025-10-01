/**
 * Image hosting service using multiple free APIs
 * This service uploads base64 images to various free services and returns public URLs
 */

interface ImgurResponse {
  data: {
    id: string;
    title: string;
    description: string;
    datetime: number;
    type: string;
    animated: boolean;
    width: number;
    height: number;
    size: number;
    views: number;
    bandwidth: number;
    vote: string;
    favorite: boolean;
    nsfw: boolean;
    section: string;
    account_url: string;
    account_id: number;
    is_ad: boolean;
    in_most_viral: boolean;
    has_sound: boolean;
    tags: any[];
    ad_type: number;
    ad_url: string;
    edited: string;
    in_gallery: boolean;
    link: string;
    comment_count: number;
    favorite_count: number;
    ups: number;
    downs: number;
    points: number;
    score: number;
  };
  success: boolean;
  status: number;
}

/**
 * Upload a base64 image to Imgur and return the public URL
 * @param base64Data - Base64 data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
 * @param filename - Optional filename for the image
 * @returns Promise<string> - Public URL of the uploaded image
 */
export const uploadImageToImgur = async (base64Data: string, filename?: string): Promise<string> => {
  try {
    // Extract the base64 part from the data URL
    const base64String = base64Data.split(',')[1];
    
    if (!base64String) {
      throw new Error('Invalid base64 data URL');
    }

    // Imgur API endpoint
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7', // Imgur's anonymous client ID
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64String,
        type: 'base64',
        title: filename || 'Uploaded Image',
        description: 'Uploaded via Zuqon Dashboard'
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Imgur rate limit exceeded. Please try again later.');
      }
      throw new Error(`Imgur API error: ${response.status} ${response.statusText}`);
    }

    const result: ImgurResponse = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to upload image to Imgur');
    }

    return result.data.link;
  } catch (error) {
    console.error('Error uploading image to Imgur:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload to PostImage (free alternative to Imgur)
 * @param base64Data - Base64 data URL
 * @param filename - Optional filename
 * @returns Promise<string> - Public URL
 */
export const uploadImageToPostImage = async (base64Data: string, filename?: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('upload', blob, filename || 'image.jpg');
    
    // Upload to PostImage
    const uploadResponse = await fetch('https://postimages.org/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`PostImage API error: ${uploadResponse.status}`);
    }
    
    const result = await uploadResponse.json();
    
    if (!result.status || result.status !== 'OK') {
      throw new Error('Failed to upload image to PostImage');
    }
    
    return result.url;
  } catch (error) {
    console.error('Error uploading image to PostImage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload to FreeImageHost (completely free, no API key needed)
 * @param base64Data - Base64 data URL
 * @param filename - Optional filename
 * @returns Promise<string> - Public URL
 */
export const uploadImageToFreeImageHost = async (base64Data: string, filename?: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob, filename || 'image.jpg');
    
    // Upload to FreeImageHost
    const uploadResponse = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`FreeImageHost API error: ${uploadResponse.status}`);
    }
    
    const result = await uploadResponse.json();
    
    if (!result.success || !result.image?.url) {
      throw new Error('Failed to upload image to FreeImageHost');
    }
    
    return result.image.url;
  } catch (error) {
    console.error('Error uploading image to FreeImageHost:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Create a temporary blob URL (for local testing)
 * @param base64Data - Base64 data URL
 * @param filename - Optional filename
 * @returns Promise<string> - Blob URL
 */
export const createBlobUrl = async (base64Data: string, filename?: string): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    console.log(`Created blob URL: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error('Error creating blob URL:', error);
    throw new Error(`Failed to create blob URL: ${error.message}`);
  }
};

/**
 * Upload image with multiple fallback options
 * @param base64Data - Base64 data URL
 * @param filename - Optional filename
 * @param service - Preferred service ('imgur' | 'postimage' | 'blob')
 * @returns Promise<string> - Public URL of the uploaded image
 */
export const uploadImage = async (
  base64Data: string, 
  filename?: string, 
  service: 'freeimagehost' = 'freeimagehost'
): Promise<string> => {
  try {
    return await uploadImageToFreeImageHost(base64Data, filename);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
