import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Icon,
  useToast,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSearch, FiZap, FiPlus } from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getArticles, saveArticle } from '../services/airtable';
import { useNavigate } from 'react-router-dom';
import { SearchArticlesModal } from '../components/SearchArticlesModal';
import { Article } from '../types';

export const Articles = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: savedArticles = [], isLoading, refetch } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  const handleSearchResults = (foundArticles: Article[]) => {
    setSearchResults(foundArticles);
    toast({
      title: `Found ${foundArticles.length} articles`,
      status: 'success',
      duration: 3000,
    });
  };

  const handleSaveArticle = async (article: Article) => {
    try {
      setIsSaving(true);
      await saveArticle(article);
      
      // Remove from search results
      setSearchResults(prev => prev.filter(a => a.url !== article.url));
      
      // Refresh saved articles
      await refetch();

      toast({
        title: 'Article saved successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to save article',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await Promise.all(searchResults.map(article => saveArticle(article)));
      
      // Clear search results
      setSearchResults([]);
      
      // Refresh saved articles
      await refetch();

      toast({
        title: 'All articles saved successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to save all articles',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg" color="brand.navy.500">Articles</Heading>
          <HStack spacing={4}>
            <Button
              leftIcon={<Icon as={FiSearch} />}
              onClick={onOpen}
              bg="brand.navy.500"
              color="white"
              _hover={{ bg: "brand.navy.600" }}
            >
              Search Articles
            </Button>
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={() => refetch()}
              isLoading={isLoading}
              variant="outline"
              borderColor="brand.navy.500"
              color="brand.navy.500"
              _hover={{ bg: "brand.navy.50" }}
            >
              Refresh
            </Button>
          </HStack>
        </HStack>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md" color="brand.navy.500">
                    Search Results ({searchResults.length})
                  </Heading>
                  <HStack>
                    <Button
                      leftIcon={<Icon as={FiPlus} />}
                      onClick={handleSaveAll}
                      isLoading={isSaving}
                      colorScheme="green"
                    >
                      Save All
                    </Button>
                  </HStack>
                </HStack>

                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>TITLE</Th>
                      <Th>SOURCE</Th>
                      <Th>DATE</Th>
                      <Th>ACTIONS</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {searchResults.map((article, index) => (
                      <Tr key={article.url + index}>
                        <Td maxW="400px">
                          <Text noOfLines={2}>{article.title}</Text>
                        </Td>
                        <Td>
                          <Badge
                            bg="blue.100"
                            color="blue.700"
                            px={2}
                            py={1}
                            borderRadius="md"
                            textTransform="uppercase"
                            fontSize="xs"
                            fontWeight="medium"
                          >
                            {article.source}
                          </Badge>
                        </Td>
                        <Td>{new Date(article.dateFetched).toLocaleDateString()}</Td>
                        <Td>
                          <Button
                            leftIcon={<Icon as={FiPlus} />}
                            onClick={() => handleSaveArticle(article)}
                            isLoading={isSaving}
                            size="sm"
                            colorScheme="green"
                          >
                            Save
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Saved Articles */}
        <Box>
          <Heading size="md" mb={4} color="brand.navy.500">Saved Articles</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>TITLE</Th>
                <Th>SOURCE</Th>
                <Th>DATE</Th>
                <Th>STATUS</Th>
                <Th>ACTIONS</Th>
              </Tr>
            </Thead>
            <Tbody>
              {savedArticles.map((article) => (
                <Tr key={article.id}>
                  <Td maxW="400px">
                    <Text noOfLines={2}>{article.title}</Text>
                  </Td>
                  <Td>
                    <Badge
                      bg="blue.100"
                      color="blue.700"
                      px={2}
                      py={1}
                      borderRadius="md"
                      textTransform="uppercase"
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {article.source}
                    </Badge>
                  </Td>
                  <Td>{new Date(article.dateFetched).toLocaleDateString()}</Td>
                  <Td>
                    <Badge
                      bg={article.hasGeneratedContent ? "green.500" : "orange.500"}
                      color="white"
                      px={2}
                      py={1}
                      borderRadius="md"
                      textTransform="uppercase"
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      {article.hasGeneratedContent ? 'Generated' : 'Not Generated'}
                    </Badge>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Generate content"
                      icon={<Icon as={FiZap} />}
                      onClick={() => navigate(`/generate?articleId=${article.id}`)}
                      isDisabled={article.hasGeneratedContent}
                      size="sm"
                      bg={article.hasGeneratedContent ? "transparent" : "brand.navy.500"}
                      color={article.hasGeneratedContent ? "gray.400" : "white"}
                      _hover={article.hasGeneratedContent ? {} : { bg: "brand.navy.600" }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <SearchArticlesModal
        isOpen={isOpen}
        onClose={onClose}
        onArticlesFound={handleSearchResults}
      />
    </Box>
  );
};