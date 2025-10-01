import OpenAI from 'openai';
import { Article, GraphicGenerationOptions, GeneratedGraphic } from '../types';
import { ENV } from '../config/env';
import { getPrompt } from './airtable';

const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Graphics: ${message}`, data || '');
};

/**
 * Generate a graphic prompt based on article content
 */
export const generateGraphicPrompt = async (article: Article, options: GraphicGenerationOptions): Promise<string> => {
  log('Generating graphic prompt for article:', { title: article.title });

  if (!ENV.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please check your .env file.');
  }

  try {
    // Get the graphic generation prompt from Airtable
    const prompt = await getPrompt('Graphic Prompt');
    
    if (!prompt) {
      throw new Error('Graphic Prompt not found in Airtable. Please run setup script.');
    }

    // Use the prompts from Airtable if available, otherwise use fallback
    const systemPrompt = prompt.systemPrompt || `You are a creative graphic designer who creates compelling visual prompts for AI image generation. 
Your task is to analyze article content and create a detailed, visually descriptive prompt that will generate an engaging graphic.

Guidelines:
- Create prompts that are visually descriptive and specific
- Focus on the main theme, mood, and key elements of the article
- Use art style descriptors (photorealistic, illustration, modern, minimalist, etc.)
- Include relevant visual metaphors or symbols
- Consider the target audience and platform (social media, blog, etc.)
- Keep prompts under 400 characters for DALL-E 3
- Avoid text in images unless specifically requested

Style Guidelines:
- Realistic: Use "photorealistic", "high quality photography", "professional photography"
- Illustration: Use "digital illustration", "vector art", "modern illustration"
- Infographic: Use "infographic style", "data visualization", "clean design"
- Social Media: Use "social media post design", "engaging visual", "eye-catching"

Return ONLY the visual prompt, no additional text or explanations.`;

    const userPromptTemplate = prompt.userPrompt || `Article Title: "{title}"
Article Source: {source}
Article Content: {content}

Generate a visual prompt for a {style} style graphic with {aspectRatio} aspect ratio.
{includeText}Do not include any text in the image.{/includeText}
{brandColors}Use these brand colors: {colors}{/brandColors}

Create a compelling visual prompt that represents this article's main theme and would be engaging for social media.`;

    // Format the user prompt with article details and options
    const formattedUserPrompt = userPromptTemplate
      .replace('{title}', article.title)
      .replace('{source}', article.source)
      .replace('{content}', article.content.substring(0, 1000))
      .replace('{style}', options.style)
      .replace('{aspectRatio}', options.aspectRatio)
      .replace('{includeText}', options.includeText ? '' : '')
      .replace('{/includeText}', options.includeText ? '' : '')
      .replace('{brandColors}', options.brandColors && options.brandColors.length > 0 ? '' : '')
      .replace('{colors}', options.brandColors ? options.brandColors.join(', ') : '')
      .replace('{/brandColors}', options.brandColors && options.brandColors.length > 0 ? '' : '');

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: formattedUserPrompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const generatedPrompt = response.choices[0].message.content?.trim() || '';
    log('Generated graphic prompt:', generatedPrompt);
    
    return generatedPrompt;
  } catch (error) {
    log('Error generating graphic prompt:', error);
    throw error;
  }
};

/**
 * Generate an image using DALL-E 3
 */
export const generateImage = async (prompt: string, options: GraphicGenerationOptions): Promise<GeneratedGraphic> => {
  log('Generating image with DALL-E 3:', { prompt, options });

  if (!ENV.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please check your .env file.');
  }

  try {
    // Map aspect ratios to DALL-E 3 supported sizes
    const sizeMap = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '4:3': '1024x1024', // DALL-E 3 doesn't support 4:3, using 1:1
      '9:16': '1024x1792'
    };

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: sizeMap[options.aspectRatio] as "1024x1024" | "1792x1024" | "1024x1792",
      quality: options.quality === 'hd' ? 'hd' : 'standard',
      style: options.style === 'realistic' ? 'natural' : 'vivid',
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }

    const result: GeneratedGraphic = {
      url: imageUrl,
      prompt: prompt,
      style: options.style,
      aspectRatio: options.aspectRatio,
      quality: options.quality,
      generationDate: new Date().toISOString(),
    };

    log('Image generated successfully:', result);
    return result;
  } catch (error) {
    log('Error generating image:', error);
    throw error;
  }
};

/**
 * Generate a complete graphic for an article
 */
export const generateArticleGraphic = async (
  article: Article, 
  options: GraphicGenerationOptions = {
    style: 'social-media',
    aspectRatio: '1:1',
    quality: 'standard',
    includeText: false,
    generateGraphics: false
  }
): Promise<GeneratedGraphic> => {
  log('Generating complete graphic for article:', { title: article.title, options });

  try {
    // Step 1: Generate the visual prompt
    const prompt = await generateGraphicPrompt(article, options);
    
    // Step 2: Generate the image
    const graphic = await generateImage(prompt, options);
    
    // Step 3: Convert the temporary DALL-E URL to a permanent base64 data URL
    log('Converting DALL-E image to permanent format...');
    try {
      // First try the canvas approach
      const permanentUrl = await convertDalleUrlToDataUrl(graphic.url);
      
      const permanentGraphic: GeneratedGraphic = {
        ...graphic,
        url: permanentUrl
      };
      
      log('Article graphic generated and converted to permanent format successfully:', permanentGraphic);
      return permanentGraphic;
    } catch (conversionError) {
      log('Canvas conversion failed, trying proxy method:', conversionError);
      
      try {
        // Fallback to proxy method
        const permanentUrl = await convertDalleUrlToDataUrlWithProxy(graphic.url);
        
        const permanentGraphic: GeneratedGraphic = {
          ...graphic,
          url: permanentUrl
        };
        
        log('Article graphic generated and converted to permanent format with proxy successfully:', permanentGraphic);
        return permanentGraphic;
      } catch (proxyError) {
        log('Both conversion methods failed, using original image:', proxyError);
        return graphic; // Return original if both conversion methods fail
      }
    }
  } catch (error) {
    log('Error generating article graphic:', error);
    throw error;
  }
};

/**
 * Convert DALL-E temporary URL to permanent base64 data URL
 * This avoids CORS issues by using canvas to convert the image
 */
export const convertDalleUrlToDataUrl = async (dalleUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set crossOrigin to anonymous to handle CORS
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG with good quality for smaller file size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        log(`Successfully converted DALL-E URL to data URL: ${img.width}x${img.height}`);
        resolve(dataUrl);
      } catch (error) {
        log('Error converting image to data URL:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      log('Error loading DALL-E image:', error);
      reject(new Error('Failed to load DALL-E image for conversion'));
    };
    
    // Load the image
    img.src = dalleUrl;
  });
};

/**
 * Alternative method to convert DALL-E URL using fetch with proxy
 * This is a fallback if the canvas method fails due to CORS
 */
export const convertDalleUrlToDataUrlWithProxy = async (dalleUrl: string): Promise<string> => {
  try {
    // Use a CORS proxy to fetch the image
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(dalleUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return await compressBlobToBase64(blob, 1024, 0.9);
  } catch (error) {
    log('Error converting DALL-E URL with proxy:', error);
    throw error;
  }
};

/**
 * Check if a URL is a DALL-E temporary URL that might expire
 */
export const isDalleTemporaryUrl = (url: string): boolean => {
  return url.includes('oaidalleapiprodscus.blob.core.windows.net') || 
         url.includes('dalleprodsec.blob.core.windows.net');
};

/**
 * Check if a URL is a base64 data URL (permanent)
 */
export const isDataUrl = (url: string): boolean => {
  return url.startsWith('data:');
};

/**
 * Download image from URL (for saving to local storage or Airtable)
 */
export const downloadImage = async (imageUrl: string): Promise<Blob> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    log('Error downloading image:', error);
    throw error;
  }
};

/**
 * Convert image blob to base64 for storage
 */
export const imageToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Validate uploaded image file
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size must be less than 10MB'
    };
  }
  
  return { isValid: true };
};

/**
 * Create a data URL from uploaded file
 */
export const fileToDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Resize image to optimize for display and storage
 */
export const resizeImage = async (
  file: File, 
  maxWidth: number = 1024, 
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress and optimize image for smaller file size with social media compatibility
 */
export const compressImageForSocialMedia = async (
  imageUrl: string, 
  maxWidth: number = 512, 
  quality: number = 0.8
): Promise<{ jpegUrl: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Calculate new dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      // Ensure we don't exceed original dimensions
      if (newWidth > img.width) {
        newWidth = img.width;
        newHeight = img.height;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Generate JPEG format for social media compatibility
      const jpegUrl = canvas.toDataURL('image/jpeg', quality);
      
      log(`Image compressed: ${img.width}x${img.height} → ${newWidth}x${newHeight}, JPEG generated`);
      resolve({ jpegUrl });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Compress a blob image to base64 with specified dimensions and quality
 */
export const compressBlobToBase64 = async (
  blob: Blob,
  maxWidth: number = 512,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Calculate new dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      // Ensure we don't exceed original dimensions
      if (newWidth > img.width) {
        newWidth = img.width;
        newHeight = img.height;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to JPEG for social media compatibility
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      log(`Blob compressed: ${img.width}x${img.height} → ${newWidth}x${newHeight}, quality: ${quality}`);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load blob image for compression'));
    };
    
    img.src = URL.createObjectURL(blob);
  });
};
