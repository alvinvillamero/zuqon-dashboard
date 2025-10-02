export interface Article {
  id?: string;
  title: string;
  content: string;
  url: string;
  source: string;
  dateFetched: string;
  imageUrl?: string | null;
  author?: string;
  hasGeneratedContent?: boolean;
}

export interface GeneratedContent {
  id: string;
  name: string;
  originalUrl: string;
  facebookPost: string;
  instagramPost: string;
  twitterPost: string;
  videoScript: string;
  generationDate: string;
  graphicUrl?: string;
  graphicPrompt?: string;
  graphicStyle?: string;
  // Publishing status fields
  publishStatus?: string;
  publishPlatforms?: string[];
  facebookStatus?: string;
  instagramStatus?: string;
  twitterStatus?: string;
  publishedAt?: string;
  publishingError?: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'direct';
  isActive: boolean;
  lastFetched?: string;
}

export interface GraphicGenerationOptions {
  style: 'realistic' | 'illustration' | 'infographic' | 'social-media';
  aspectRatio: '1:1' | '16:9' | '4:3' | '9:16';
  quality: 'standard' | 'hd';
  includeText: boolean;
  brandColors?: string[];
  generateGraphics: boolean;
}

export interface GeneratedGraphic {
  url: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  quality: string;
  generationDate: string;
}