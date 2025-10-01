import OpenAI from 'openai';
import { Article } from '../types';
import { ENV } from '../config/env';

const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] OpenAI: ${message}`, data || '');
};

export const generateContent = async (article: Article, prompt?: { systemPrompt: string; userPrompt: string }) => {
  log('Generating content for article:', { title: article.title, url: article.url });

  if (!ENV.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please check your .env file.');
  }

  if (!prompt) {
    throw new Error('Prompt is required for content generation');
  }
  
  const { systemPrompt, userPrompt } = prompt;

  try {
    // Add format instructions to system prompt
    const formatInstructions = `
Your response MUST follow this EXACT format with these EXACT markers:

<facebook>
[Your Facebook post content here]
</facebook>

<instagram>
[Your Instagram post content here]
</instagram>

<twitter>
[Your Twitter post content here]
</twitter>

<video>
[Your video script content here]
</video>

Do not include any other text or markers outside these tags.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        { role: "system", content: systemPrompt + "\n\n" + formatInstructions },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const rawContent = response.choices[0].message.content || '';
    log('Raw generated content:', rawContent);
    
    // Debug content extraction
    const extractAndLog = (text: string, startTag: string, endTag?: string) => {
      const result = extractSection(text, startTag, endTag);
      console.log(`Extracting ${startTag}:`, { result, startIndex: text.indexOf(startTag) });
      return result;
    };

    // Enhanced extraction function with better logging
    const extractSection = (text: string, startTag: string, endTag?: string) => {
      console.log(`Extracting section with startTag: "${startTag}"`);
      
      // Find the start index
      const startIndex = text.indexOf(startTag);
      console.log(`Start index: ${startIndex}`);
      
      if (startIndex === -1) {
        console.log(`Start tag "${startTag}" not found`);
        return '';
      }

      // Get the content after start tag
      const contentAfterStart = text.substring(startIndex + startTag.length);
      console.log(`Content starts with: ${contentAfterStart.substring(0, 50)}...`);

      // Find the end index
      let endIndex = contentAfterStart.length;
      if (endTag) {
        endIndex = contentAfterStart.indexOf(endTag);
        console.log(`End index relative to content start: ${endIndex}`);
        if (endIndex === -1) {
          console.log(`End tag "${endTag}" not found, using full remaining content`);
          endIndex = contentAfterStart.length;
        }
      }

      // Extract and trim the content
      const extractedContent = contentAfterStart.substring(0, endIndex).trim();
      console.log(`Extracted content: ${extractedContent.substring(0, 50)}...`);
      
      return extractedContent;
    };

    // Log the exact raw content
    console.log('Raw content to parse:', rawContent);

    // Function to extract content between markers
    const extractBetweenMarkers = (text: string, startMarker: string, endMarker: string): string => {
      const startIndex = text.indexOf(startMarker);
      if (startIndex === -1) return '';
      
      const contentStart = startIndex + startMarker.length;
      const afterStart = text.substring(contentStart);
      
      const endIndex = endMarker ? afterStart.indexOf(endMarker) : afterStart.length;
      if (endIndex === -1) return afterStart.trim();
      
      return afterStart.substring(0, endIndex).trim();
    };

    // Function to extract content between XML-like tags
    const extractTagContent = (text: string, tag: string): string => {
      const startTag = `<${tag}>`;
      const endTag = `</${tag}>`;
      
      const startIndex = text.indexOf(startTag);
      const endIndex = text.indexOf(endTag);
      
      if (startIndex === -1 || endIndex === -1) {
        console.log(`Could not find ${tag} content between tags`);
        return '';
      }
      
      const content = text.substring(startIndex + startTag.length, endIndex).trim();
      console.log(`Found ${tag} content:`, content);
      return content;
    };

    // Extract each section using XML-like tags
    const facebookPost = extractTagContent(rawContent, 'facebook');
    const instagramPost = extractTagContent(rawContent, 'instagram');
    const twitterPost = extractTagContent(rawContent, 'twitter');
    const videoScript = extractTagContent(rawContent, 'video');

    return {
      name: article.title,
      originalUrl: article.url,
      facebookPost: facebookPost || 'No Facebook post generated.',
      instagramPost: instagramPost || 'No Instagram caption generated.',
      twitterPost: twitterPost || 'No Twitter/X post generated.',
      videoScript: videoScript || 'No video script generated.',
      generationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-'), // MM-DD-YYYY format
      status: 'completed',
    };
  } catch (error) {
    log('Error generating content:', error);
    throw error;
  }
};