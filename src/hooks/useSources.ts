import { useQuery } from '@tanstack/react-query';
import { getSources } from '../services/sources';

export const useSources = () => {
  const { data: sources = [], isLoading, error } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  });

  return {
    sources,
    isLoading,
    error,
  };
};