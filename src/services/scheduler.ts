import { Article } from '../types';
import { saveArticle } from './airtable';
import { scrapeArticle, fetchRSSFeed } from './scraper';

type ScheduleCallback = () => void;

class Scheduler {
  private intervals: Map<string, number> = new Map();
  private lastRun: Map<string, Date> = new Map();

  // Convert cron-like expression to milliseconds
  private cronToMs(cronExpression: string): number {
    // For simplicity, we'll just handle basic intervals
    // Format: "*/n h * * *" where n is hours
    const hours = parseInt(cronExpression.split(' ')[1].replace('*/', ''));
    return hours * 60 * 60 * 1000; // Convert hours to milliseconds
  }

  scheduleJob(id: string, cronExpression: string, callback: ScheduleCallback): void {
    // Clear existing interval if any
    this.clearJob(id);

    const intervalMs = this.cronToMs(cronExpression);
    
    // Set up new interval
    const intervalId = window.setInterval(() => {
      callback();
      this.lastRun.set(id, new Date());
    }, intervalMs);

    this.intervals.set(id, intervalId);
    this.lastRun.set(id, new Date());
  }

  clearJob(id: string): void {
    const existingInterval = this.intervals.get(id);
    if (existingInterval) {
      window.clearInterval(existingInterval);
      this.intervals.delete(id);
      this.lastRun.delete(id);
    }
  }

  getLastRun(id: string): Date | undefined {
    return this.lastRun.get(id);
  }

  clearAll(): void {
    this.intervals.forEach((intervalId) => {
      window.clearInterval(intervalId);
    });
    this.intervals.clear();
    this.lastRun.clear();
  }
}

export const scheduler = new Scheduler();

export const startScraping = async (
  scheduleId: string,
  cronExpression: string,
  sources: string[],
  onSuccess?: (articles: Article[]) => void,
  onError?: (error: Error) => void
) => {
  const scrapeAndSave = async () => {
    try {
      const articles: Article[] = [];
      
      for (const source of sources) {
        if (source.includes('rss') || source.includes('feed')) {
          const feedArticles = await fetchRSSFeed(source);
          articles.push(...feedArticles);
        } else {
          const article = await scrapeArticle(source);
          articles.push(article);
        }
      }

      // Save articles to Airtable
      for (const article of articles) {
        await saveArticle(article);
      }

      onSuccess?.(articles);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  // Run immediately
  await scrapeAndSave();
  
  // Schedule future runs
  scheduler.scheduleJob(scheduleId, cronExpression, scrapeAndSave);
};

export const stopScraping = (scheduleId: string) => {
  scheduler.clearJob(scheduleId);
};

