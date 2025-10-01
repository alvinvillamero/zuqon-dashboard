import { Article } from '../types';
import { searchByKeyword } from './newsapi';
import { getSources } from './sources';
import { scrapeArticle, fetchRSSFeed } from './scraper';

interface SearchOptions {
  keyword: string;
  useNewsAPI: boolean;
  selectedSourceIds: string[];
}

export const searchArticles = async (options: SearchOptions): Promise<Article[]> => {
  const { keyword, useNewsAPI, selectedSourceIds } = options;
  const allSources = getSources();
  const selectedSources = allSources.filter(s => selectedSourceIds.includes(s.id));
  
  const fetchPromises: Promise<Article[]>[] = [];

  // Add NewsAPI search if enabled
  if (useNewsAPI && keyword) {
    fetchPromises.push(searchByKeyword(keyword));
  }

  // Add selected sources
  for (const source of selectedSources) {
    if (source.type === 'rss') {
      fetchPromises.push(fetchRSSFeed(source.url));
    } else {
      fetchPromises.push(
        scrapeArticle(source.url).then(article => [article])
      );
    }
  }

  const results = await Promise.allSettled(fetchPromises);
  const articles: Article[] = [];

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  });

  // Deduplicate by URL
  const uniqueArticles = Array.from(
    new Map(articles.map(article => [article.url, article])).values()
  );

  // Sort by date
  return uniqueArticles.sort(
    (a, b) => new Date(b.dateFetched).getTime() - new Date(a.dateFetched).getTime()
  );
};