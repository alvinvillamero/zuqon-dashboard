import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  HStack,
  Icon,
  Text,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiSearch, FiRss, FiGlobe } from 'react-icons/fi';
import { useSources } from '../hooks/useSources';
import { Article } from '../types';
import * as ArticlesService from '../services/articles';

interface SearchArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlesFound: (articles: Article[]) => void;
}

export const SearchArticlesModal = ({ isOpen, onClose, onArticlesFound }: SearchArticlesModalProps) => {
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [useNewsAPI, setUseNewsAPI] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { sources = [], isLoading: isLoadingSources } = useSources();

  // Only show active sources
  const activeSources = sources.filter(source => source.isActive);

  const handleSearch = async () => {
    if (!keyword.trim() && selectedSources.length === 0) {
      toast({
        title: 'Search criteria needed',
        description: 'Please enter a keyword or select at least one source',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSearching(true);
    try {
      const searchOptions = {
        keyword: keyword.trim(),
        useNewsAPI,
        selectedSourceIds: selectedSources,
      };

      const articles = await ArticlesService.searchArticles(searchOptions);

      if (articles.length === 0) {
        toast({
          title: 'No articles found',
          description: 'Try different keywords or sources',
          status: 'info',
          duration: 3000,
        });
        return;
      }

      onArticlesFound(articles);
      onClose();
      setKeyword('');
      setSelectedSources([]);

      toast({
        title: 'Articles found',
        description: `Found ${articles.length} articles`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay style={{ backdropFilter: 'blur(2px)' }} />
      <ModalContent>
        <ModalHeader color="brand.navy.500">Search Articles</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={6}>
            {/* Keyword Search */}
            <FormControl>
              <FormLabel color="brand.navy.500">Keyword</FormLabel>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter keywords to search"
                size="lg"
                borderColor="brand.navy.200"
                _hover={{ borderColor: "brand.navy.300" }}
                _focus={{ borderColor: "brand.navy.500", boxShadow: "0 0 0 1px #1E2B5E" }}
              />
            </FormControl>

            {/* Search Sources */}
            <FormControl>
              <HStack justify="space-between" mb={4}>
                <FormLabel color="brand.navy.500" mb={0}>Search Sources</FormLabel>
                <Checkbox
                  isChecked={useNewsAPI}
                  onChange={(e) => setUseNewsAPI(e.target.checked)}
                  colorScheme="green"
                >
                  Include NewsAPI
                </Checkbox>
              </HStack>

              {isLoadingSources ? (
                <HStack justify="center" py={4}>
                  <Spinner size="sm" color="brand.navy.500" />
                  <Text color="brand.navy.500">Loading sources...</Text>
                </HStack>
              ) : activeSources.length > 0 ? (
                <VStack align="start" spacing={2}>
                  {activeSources.map((source) => (
                    <Checkbox
                      key={source.id}
                      isChecked={selectedSources.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      colorScheme="brand.navy"
                    >
                      <HStack>
                        <Icon
                          as={source.type === 'rss' ? FiRss : FiGlobe}
                          color="brand.navy.500"
                        />
                        <Text color="brand.navy.500">{source.name}</Text>
                      </HStack>
                    </Checkbox>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" textAlign="center">
                  No sources configured. Add sources in Settings.
                </Text>
              )}
            </FormControl>

            <Button
              colorScheme="brand.navy"
              onClick={handleSearch}
              isLoading={isSearching}
              width="full"
              size="lg"
              leftIcon={<Icon as={FiSearch} />}
              bg="brand.navy.500"
              color="white"
              _hover={{ bg: "brand.navy.600" }}
              isDisabled={(!keyword.trim() && selectedSources.length === 0) || isLoadingSources}
            >
              Search Articles
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};