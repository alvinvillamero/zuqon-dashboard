import axios from 'axios';
import { Article } from '../types';

// Your API key
const NEWSAPI_KEY = '5203b58d5a5349cca40c7f6e054450a0';
const NEWSAPI_ENDPOINT = 'https://newsapi.org/v2';

const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

// Function to test API key
export const testApiKey = async (): Promise<boolean> => {
  try {
    log('Testing NewsAPI key...');
    
    const response = await axios.get(`${NEWSAPI_ENDPOINT}/top-headlines`, {
      params: {
        apiKey: NEWSAPI_KEY,
        country: 'us',
        pageSize: 1
      }
    });

    log('API test successful:', {
      status: response.status,
      hasArticles: !!response.data.articles
    });

    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log('API test failed:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
    } else {
      log('API test failed with unknown error:', error);
    }
    return false;
  }
};

// Function to handle API errors
const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    log('API Error:', { status, message });

    switch (status) {
      case 401:
        throw new Error('Invalid API key. Please check your NewsAPI key.');
      case 429:
        throw new Error('API rate limit exceeded. Please try again later.');
      case 426:
        throw new Error('You are using a Developer plan. Please upgrade for more features.');
      default:
        throw new Error(`NewsAPI error: ${message}`);
    }
  }
  throw error;
};

export const searchArticles = async (keyword: string): Promise<Article[]> => {
  try {
    log(`Starting search for keyword: "${keyword}"`);

    const response = await axios.get(`${NEWSAPI_ENDPOINT}/everything`, {
      params: {
        q: keyword,
        apiKey: NEWSAPI_KEY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100
      }
    });

    log('API Response:', {
      status: response.status,
      totalResults: response.data.totalResults,
      articleCount: response.data.articles?.length
    });

    if (!response.data.articles) {
      throw new Error('No articles found in response');
    }

    const articles = response.data.articles.map((article: any) => ({
      title: article.title || 'Untitled',
      content: article.description || article.content || 'No content available',
      url: article.url,
      source: article.source?.name || 'Unknown Source',
      dateFetched: article.publishedAt || new Date().toISOString(),
      imageUrl: article.urlToImage,
      author: article.author
    }));

    log(`Processed ${articles.length} articles`);
    return articles;

  } catch (error) {
    log('Error in searchArticles:', error);
    return handleApiError(error);
  }
};

export const searchByKeyword = async (keyword: string): Promise<Article[]> => {
  log(`Starting searchByKeyword for: "${keyword}"`);
  
  try {
    // Try /everything endpoint first
    const articles = await searchArticles(keyword);
    
    if (articles.length === 0) {
      log('No articles found, trying top headlines...');
      
      // Fallback to top headlines if no results
      const headlinesResponse = await axios.get(`${NEWSAPI_ENDPOINT}/top-headlines`, {
        params: {
          q: keyword,
          apiKey: NEWSAPI_KEY,
          language: 'en',
          pageSize: 100
        }
      });

      const headlineArticles = headlinesResponse.data.articles.map((article: any) => ({
        title: article.title || 'Untitled',
        content: article.description || article.content || 'No content available',
        url: article.url,
        source: article.source?.name || 'Unknown Source',
        dateFetched: article.publishedAt || new Date().toISOString(),
        imageUrl: article.urlToImage,
        author: article.author
      }));

      log(`Found ${headlineArticles.length} articles from top headlines`);
      return headlineArticles;
    }

    log(`Returning ${articles.length} articles from /everything endpoint`);
    return articles;

  } catch (error) {
    log('Error in searchByKeyword:', error);
    throw error;
  }
};