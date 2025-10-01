import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Text,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Switch,
  Select,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw, FiGlobe, FiRss } from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SourcesService from '../services/sources';
import { Source } from '../types';

export const Settings = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'rss' as 'rss' | 'direct'
  });

  // Fetch API keys status
  const apiKeys = [
    { 
      name: 'OpenAI API Key', 
      value: (import.meta as any).env.VITE_OPENAI_API_KEY || '', 
      envKey: 'VITE_OPENAI_API_KEY',
      isConfigured: Boolean((import.meta as any).env.VITE_OPENAI_API_KEY)
    },
    { 
      name: 'Airtable API Key', 
      value: (import.meta as any).env.VITE_AIRTABLE_API_KEY || '', 
      envKey: 'VITE_AIRTABLE_API_KEY',
      isConfigured: Boolean((import.meta as any).env.VITE_AIRTABLE_API_KEY)
    },
    { 
      name: 'NewsAPI Key', 
      value: (import.meta as any).env.VITE_NEWSAPI_KEY || '', 
      envKey: 'VITE_NEWSAPI_KEY',
      isConfigured: Boolean((import.meta as any).env.VITE_NEWSAPI_KEY)
    },
    { 
      name: 'Facebook App ID', 
      value: (import.meta as any).env.VITE_FACEBOOK_APP_ID || '', 
      envKey: 'VITE_FACEBOOK_APP_ID',
      isConfigured: Boolean((import.meta as any).env.VITE_FACEBOOK_APP_ID)
    },
    { 
      name: 'Facebook App Secret', 
      value: (import.meta as any).env.VITE_FACEBOOK_APP_SECRET || '', 
      envKey: 'VITE_FACEBOOK_APP_SECRET',
      isConfigured: Boolean((import.meta as any).env.VITE_FACEBOOK_APP_SECRET)
    },
    { 
      name: 'Instagram App ID', 
      value: (import.meta as any).env.VITE_INSTAGRAM_APP_ID || '', 
      envKey: 'VITE_INSTAGRAM_APP_ID',
      isConfigured: Boolean((import.meta as any).env.VITE_INSTAGRAM_APP_ID)
    },
    { 
      name: 'Instagram App Secret', 
      value: (import.meta as any).env.VITE_INSTAGRAM_APP_SECRET || '', 
      envKey: 'VITE_INSTAGRAM_APP_SECRET',
      isConfigured: Boolean((import.meta as any).env.VITE_INSTAGRAM_APP_SECRET)
    },
    { 
      name: 'Twitter Client ID', 
      value: (import.meta as any).env.VITE_TWITTER_CLIENT_ID || '', 
      envKey: 'VITE_TWITTER_CLIENT_ID',
      isConfigured: Boolean((import.meta as any).env.VITE_TWITTER_CLIENT_ID)
    },
    { 
      name: 'Twitter Client Secret', 
      value: (import.meta as any).env.VITE_TWITTER_CLIENT_SECRET || '', 
      envKey: 'VITE_TWITTER_CLIENT_SECRET',
      isConfigured: Boolean((import.meta as any).env.VITE_TWITTER_CLIENT_SECRET)
    }
  ];

  // Fetch sources
  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: SourcesService.getSources,
  });

  const handleAddSource = async () => {
    if (!newSource.name || !newSource.url) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await SourcesService.addSource({
        name: newSource.name,
        url: newSource.url,
        type: newSource.type,
        isActive: true,
      });

      queryClient.invalidateQueries({ queryKey: ['sources'] });
      setNewSource({ name: '', url: '', type: 'rss' });
      onClose();

      toast({
        title: 'Source added',
        description: `${newSource.name} has been added to your sources`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error adding source',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await SourcesService.deleteSource(id);
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      
      toast({
        title: 'Source removed',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error removing source',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleToggleSource = async (id: string, currentStatus: boolean) => {
    try {
      await SourcesService.updateSourceStatus(id, !currentStatus);
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    } catch (error) {
      toast({
        title: 'Error updating source',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleTestSource = async (source: Source) => {
    setIsLoading({ ...isLoading, [source.id]: true });
    try {
      await SourcesService.testAndUpdateSource(source.id);
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      
      toast({
        title: 'Source test successful',
        description: `Successfully fetched content from ${source.name}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Source test failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading({ ...isLoading, [source.id]: false });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <Heading size="md" color="zuqon.500">API Configuration</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {apiKeys.map((key) => (
                <FormControl key={key.name}>
                  <FormLabel color="zuqon.500">{key.name}</FormLabel>
                  <HStack>
                    <Input
                      type="password"
                      value={key.value}
                      isReadOnly
                      bg="gray.50"
                    />
                    <Badge
                      colorScheme={key.isConfigured ? 'green' : 'red'}
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {key.isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                    </Badge>
                  </HStack>
                  <FormHelperText>
                    Configure this in your .env file as {key.envKey}
                  </FormHelperText>
                </FormControl>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Sources Section */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md" color="zuqon.500">Content Sources</Heading>
              <Button
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                onClick={onOpen}
                bg="#1e2b5e"
                color="white"
                _hover={{ bg: "#2a3a6e" }}
              >
                Add Source
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="zuqon.500">Name</Th>
                  <Th color="zuqon.500">URL</Th>
                  <Th color="zuqon.500">Type</Th>
                  <Th color="zuqon.500">Status</Th>
                  <Th color="zuqon.500">Last Fetched</Th>
                  <Th color="zuqon.500">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sources.map((source) => (
                  <Tr key={source.id}>
                    <Td>
                      <HStack>
                        <Icon 
                          as={source.type === 'rss' ? FiRss : FiGlobe} 
                          color="accent.500" 
                        />
                        <Text color="zuqon.500">{source.name}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Text 
                        color="gray.600" 
                        fontSize="sm" 
                        maxW="200px" 
                        isTruncated
                      >
                        {source.url}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={source.type === 'rss' ? 'purple' : 'blue'}
                        variant="subtle"
                      >
                        {source.type.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Switch
                        isChecked={source.isActive}
                        onChange={() => handleToggleSource(source.id, source.isActive)}
                        colorScheme="green"
                      />
                    </Td>
                    <Td>
                      <Text color="gray.600" fontSize="sm">
                        {source.lastFetched
                          ? new Date(source.lastFetched).toLocaleString()
                          : 'Never'
                        }
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Test source">
                          <IconButton
                            aria-label="Test source"
                            icon={<FiRefreshCw />}
                            size="sm"
                            bg="#1e2b5e"
                            color="white"
                            _hover={{ bg: "#2a3a6e" }}
                            onClick={() => handleTestSource(source)}
                            isLoading={isLoading[source.id]}
                          />
                        </Tooltip>
                        <Tooltip label="Delete source">
                          <IconButton
                            aria-label="Delete source"
                            icon={<FiTrash2 />}
                            size="sm"
                            bg="red.500"
                            color="white"
                            _hover={{ bg: "red.600" }}
                            onClick={() => handleDeleteSource(source.id)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {sources.length === 0 && (
                  <Tr>
                    <Td colSpan={6}>
                      <Text textAlign="center" color="gray.500" py={4}>
                        No sources configured. Click "Add Source" to get started.
                      </Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Add Source Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay style={{ backdropFilter: 'blur(2px)' }} />
          <ModalContent>
            <ModalHeader color="zuqon.500">Add New Source</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="zuqon.500">Source Name</FormLabel>
                  <Input
                    placeholder="e.g., TechCrunch News"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="zuqon.500">Source Type</FormLabel>
                  <Select
                    value={newSource.type}
                    onChange={(e) => setNewSource({ ...newSource, type: e.target.value as 'rss' | 'direct' })}
                  >
                    <option value="rss">RSS Feed</option>
                    <option value="direct">Direct URL</option>
                  </Select>
                  <FormHelperText>
                    {newSource.type === 'rss' 
                      ? 'RSS feeds automatically update when new content is published'
                      : 'Direct URLs are scraped on demand'
                    }
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="zuqon.500">URL</FormLabel>
                  <Input
                    placeholder={newSource.type === 'rss' 
                      ? 'https://example.com/feed.xml'
                      : 'https://example.com/article'
                    }
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleAddSource}
                bg="#1e2b5e"
                color="white"
                _hover={{ bg: "#2a3a6e" }}
              >
                Add Source
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};