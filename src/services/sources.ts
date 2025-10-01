import { Source } from '../types';

const LOCAL_STORAGE_KEY = 'zuqon_sources';

export const getSources = (): Source[] => {
  try {
    const storedSources = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedSources ? JSON.parse(storedSources) : [];
  } catch (error) {
    console.error('Error getting sources from local storage:', error);
    return [];
  }
};

export const saveSources = (sources: Source[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sources));
  } catch (error) {
    console.error('Error saving sources to local storage:', error);
  }
};

export const addSource = (source: Source) => {
  const sources = getSources();
  if (sources.some(s => s.url === source.url)) {
    throw new Error('Source with this URL already exists');
  }
  const updatedSources = [...sources, source];
  saveSources(updatedSources);
  return source;
};

export const updateSource = (id: string, updates: Partial<Source>) => {
  const sources = getSources();
  const index = sources.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error('Source not found');
  }
  const updatedSource = { ...sources[index], ...updates };
  sources[index] = updatedSource;
  saveSources(sources);
  return updatedSource;
};

export const deleteSource = (id: string) => {
  const sources = getSources();
  const updatedSources = sources.filter(s => s.id !== id);
  saveSources(updatedSources);
};