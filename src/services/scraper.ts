import axios from 'axios';
import { Article } from '../types';

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

export const fetchRSSFeed = async (url: string): Promise<Article[]> => {
  try {
    console.log('Fetching RSS feed:', url);
    const response = await axios.get(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const data = response.data.contents;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");
    const items = xmlDoc.querySelectorAll("item");
    const articles: Article[] = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent || "No Title";
      const link = item.querySelector("link")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();

      articles.push({
        title: title,
        content: description,
        url: link,
        source: new URL(url).hostname,
        dateFetched: new Date(pubDate).toISOString(),
      });
    });

    console.log(`Fetched ${articles.length} articles from RSS feed: ${url}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    throw new Error(`Failed to fetch RSS feed from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const scrapeArticle = async (url: string): Promise<Article> => {
  try {
    console.log('Scraping article:', url);
    const response = await axios.get(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const data = response.data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");

    const title = doc.querySelector("h1")?.textContent ||
                  doc.querySelector("meta[property='og:title']")?.getAttribute('content') ||
                  "No Title";

    const content = Array.from(doc.querySelectorAll("p"))
                       .map(p => p.textContent)
                       .join("\n\n") ||
                  doc.querySelector("meta[property='og:description']")?.getAttribute('content') ||
                  "No content available.";

    const dateFetched = doc.querySelector("time")?.getAttribute('datetime') ||
                       doc.querySelector("meta[property='article:published_time']")?.getAttribute('content') ||
                       new Date().toISOString();

    console.log(`Scraped article: ${title} from ${url}`);
    return {
      title: title,
      content: content,
      url: url,
      source: new URL(url).hostname,
      dateFetched: new Date(dateFetched).toISOString(),
    };
  } catch (error) {
    console.error(`Error scraping article ${url}:`, error);
    throw new Error(`Failed to scrape article from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const testSource = async (url: string, type: 'rss' | 'direct'): Promise<{ success: boolean; message: string; lastFetched?: string }> => {
  try {
    console.log(`Testing source: ${url} (Type: ${type})`);
    if (type === 'rss') {
      const articles = await fetchRSSFeed(url);
      if (articles.length > 0) {
        return { success: true, message: `Successfully fetched ${articles.length} articles.`, lastFetched: new Date().toISOString() };
      } else {
        return { success: true, message: 'Successfully connected, but no articles found.', lastFetched: new Date().toISOString() };
      }
    } else { // direct
      const article = await scrapeArticle(url);
      if (article.title && article.content) {
        return { success: true, message: `Successfully scraped article: "${article.title}".`, lastFetched: new Date().toISOString() };
      } else {
        return { success: true, message: 'Successfully connected, but could not extract content.', lastFetched: new Date().toISOString() };
      }
    }
  } catch (error) {
    console.error(`Error testing source ${url}:`, error);
    return { success: false, message: `Failed to test source: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};