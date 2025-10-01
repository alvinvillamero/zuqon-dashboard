import {
  Box,
  VStack,
  Card,
  CardBody,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Icon,
  Button,
  Select,
  FormControl,
  FormLabel,
  HStack,
  Collapse,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Image,
  Badge,
  useToast
} from '@chakra-ui/react';
import { FiExternalLink, FiZap, FiChevronDown, FiChevronRight, FiFacebook, FiInstagram, FiTwitter, FiVideo, FiImage, FiDownload, FiUpload } from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGeneratedContent, getArticles, saveGeneratedContent, getPrompt, updateGeneratedContentGraphic, updateGeneratedContentWithUploadedImage } from '../services/airtable';
import { generateContent } from '../services/openai';
import { generateArticleGraphic } from '../services/graphics';
import { uploadImage } from '../services/imageHosting';
import { ImageUpload } from '../components/ImageUpload';
import React, { useState } from 'react';
import { Article, GraphicGenerationOptions } from '../types';

export const ContentGeneration = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch existing content
  const { 
    data: existingContent = [], 
    isLoading: isLoadingContent 
  } = useQuery({
    queryKey: ['generatedContent'],
    queryFn: getGeneratedContent
  });

  // Fetch available articles
  const {
    data: articles = [],
    isLoading: isLoadingArticles
  } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles
  });

  // State for selected article and expanded content
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [regeneratingGraphic, setRegeneratingGraphic] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showUploadForContent, setShowUploadForContent] = useState<string | null>(null);
  
  // Graphic generation options
  const [graphicOptions, setGraphicOptions] = useState<GraphicGenerationOptions>({
    style: 'social-media',
    aspectRatio: '1:1',
    quality: 'standard',
    includeText: false,
    generateGraphics: false
  });

  // Get Enhanced Social Media Pack prompt
  const { data: prompt } = useQuery({
    queryKey: ['enhancedPrompt'],
    queryFn: () => getPrompt('Enhanced Social Media Pack')
  });

  // Handle generation
  const handleGenerate = async () => {
    if (!selectedArticle) return;
    
    setIsGenerating(true);
    try {
      if (!prompt) {
        throw new Error('Enhanced Social Media Pack prompt not found');
      }

      // Log article details
      console.log('Selected Article:', {
        title: selectedArticle.title,
        source: selectedArticle.source,
        content: selectedArticle.content,
        url: selectedArticle.url
      });

      // Format the user prompt with article details
      const formattedUserPrompt = prompt.userPrompt
        .replace('{title}', selectedArticle.title)
        .replace('{source}', selectedArticle.source)
        .replace('{content}', `Title: ${selectedArticle.title}\nSource: ${selectedArticle.source}\nURL: ${selectedArticle.url}`);

      // Generate content using the Enhanced Social Media Pack prompt
      const content = await generateContent(selectedArticle, {
        systemPrompt: prompt.systemPrompt,
        userPrompt: formattedUserPrompt
      });

      // Generate graphic for the article (only if enabled)
      let graphic = null;
      if (graphicOptions.generateGraphics) {
        console.log('Generating graphic with options:', graphicOptions);
        graphic = await generateArticleGraphic(selectedArticle, graphicOptions);
      }

      // Save the generated content with optional graphic
      await saveGeneratedContent({
        articleId: selectedArticle.id,
        articleUrl: selectedArticle.url,
        facebookPost: content.facebookPost,
        instagramPost: content.instagramPost,
        twitterPost: content.twitterPost,
        videoScript: content.videoScript,
        graphicUrl: graphic?.url,
        graphicPrompt: graphic?.prompt,
        graphicStyle: graphic?.style
      });
      
      // Refresh the content list
      queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle graphic regeneration
  const handleRegenerateGraphic = async (contentId: string, article: Article) => {
    setRegeneratingGraphic(contentId);
    try {
      console.log('Regenerating graphic for:', article.title);
      
      // Generate new graphic
      const graphic = await generateArticleGraphic(article, graphicOptions);
      
      // Update the content record
      await updateGeneratedContentGraphic(contentId, {
        graphicUrl: graphic.url,
        graphicPrompt: graphic.prompt,
        graphicStyle: graphic.style
      });
      
      // Refresh the content list
      queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
    } catch (error) {
      console.error('Error regenerating graphic:', error);
    } finally {
      setRegeneratingGraphic(null);
    }
  };

  // Handle image upload
  const handleImageUpload = async (contentId: string, dataUrl: string, fileName: string) => {
    setUploadingImage(contentId);
    try {
      console.log('Uploading image for content:', contentId);
      
      await updateGeneratedContentWithUploadedImage(contentId, dataUrl, fileName);
      
      // Refresh the content list
      queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
      
      // Show success toast
      toast({
        title: 'Image uploaded successfully!',
        description: `${fileName} has been added to this content.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Close upload mode
      setShowUploadForContent(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Show error toast
      toast({
        title: 'Upload failed',
        description: error.message || 'There was an error uploading your image. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingImage(null);
    }
  };


  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" color="brand.navy.900">Generate Content</Heading>
        
        
        {/* Generation Form Card */}
        <Card variant="outline" borderColor="gray.200">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel color="brand.navy.900">Select an article</FormLabel>
                <Select
                  placeholder="Select an article"
                  value={selectedArticle?.id || ''}
                  onChange={(e) => {
                    const article = articles.find(a => a.id === e.target.value);
                    setSelectedArticle(article || null);
                  }}
                  isDisabled={isLoadingArticles || isGenerating}
                  bg="white"
                  color={selectedArticle ? "brand.navy.900" : "gray.500"}
                  borderColor="gray.300"
                  _hover={{ borderColor: "brand.navy.500" }}
                  _focus={{ borderColor: "brand.navy.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-navy-500)" }}
                  sx={{
                    "& option": {
                      color: "brand.navy.900",
                      bg: "white"
                    },
                    "& option:checked": {
                      bg: "brand.navy.50",
                      color: "brand.navy.900"
                    },
                    "& option:hover": {
                      bg: "brand.navy.50",
                      color: "brand.navy.900"
                    },
                    "&::placeholder": {
                      color: "gray.500 !important",
                      opacity: "1 !important"
                    },
                    "&:not([value]):not([value=''])": {
                      color: "gray.500 !important"
                    }
                  }}
                >
                  {articles
                    .filter(article => !existingContent.some(content => content.originalUrl === article.url))
                    .map(article => (
                      <option key={article.id} value={article.id}>
                        {article.title}
                      </option>
                    ))}
                </Select>
              </FormControl>

              {/* Graphic Generation Options */}
              <Card variant="outline" borderColor="gray.200" bg="gray.50">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Heading size="sm" color="brand.navy.900">Graphic Generation Options</Heading>
                      <FormControl display="flex" alignItems="center">
                        <input
                          type="checkbox"
                          id="generateGraphics"
                          checked={graphicOptions.generateGraphics}
                          onChange={(e) => setGraphicOptions(prev => ({ ...prev, generateGraphics: e.target.checked }))}
                          style={{ marginRight: '8px' }}
                        />
                        <FormLabel htmlFor="generateGraphics" fontSize="sm" color="brand.navy.700" mb={0}>
                          Generate Graphics
                        </FormLabel>
                      </FormControl>
                    </HStack>
                    
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm" color="brand.navy.700">Style</FormLabel>
                        <Select
                          value={graphicOptions.style}
                          onChange={(e) => setGraphicOptions(prev => ({ ...prev, style: e.target.value as any }))}
                          size="sm"
                          bg="white"
                          color={graphicOptions.style ? "brand.navy.900" : "gray.500"}
                          sx={{
                            "& option": {
                              color: "brand.navy.900",
                              bg: "white"
                            },
                            "&::placeholder": {
                              color: "gray.500 !important",
                              opacity: "1 !important"
                            },
                            "&:not([value]):not([value=''])": {
                              color: "gray.500 !important"
                            }
                          }}
                        >
                          <option value="social-media">Social Media</option>
                          <option value="realistic">Realistic</option>
                          <option value="illustration">Illustration</option>
                          <option value="infographic">Infographic</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm" color="brand.navy.700">Aspect Ratio</FormLabel>
                        <Select
                          value={graphicOptions.aspectRatio}
                          onChange={(e) => setGraphicOptions(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                          size="sm"
                          bg="white"
                          color={graphicOptions.aspectRatio ? "brand.navy.900" : "gray.500"}
                          sx={{
                            "& option": {
                              color: "brand.navy.900",
                              bg: "white"
                            },
                            "&::placeholder": {
                              color: "gray.500 !important",
                              opacity: "1 !important"
                            },
                            "&:not([value]):not([value=''])": {
                              color: "gray.500 !important"
                            }
                          }}
                        >
                          <option value="1:1">Square (1:1)</option>
                          <option value="16:9">Landscape (16:9)</option>
                          <option value="9:16">Portrait (9:16)</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm" color="brand.navy.700">Quality</FormLabel>
                        <Select
                          value={graphicOptions.quality}
                          onChange={(e) => setGraphicOptions(prev => ({ ...prev, quality: e.target.value as any }))}
                          size="sm"
                          bg="white"
                          color={graphicOptions.quality ? "brand.navy.900" : "gray.500"}
                          sx={{
                            "& option": {
                              color: "brand.navy.900",
                              bg: "white"
                            },
                            "&::placeholder": {
                              color: "gray.500 !important",
                              opacity: "1 !important"
                            },
                            "&:not([value]):not([value=''])": {
                              color: "gray.500 !important"
                            }
                          }}
                        >
                          <option value="standard">Standard</option>
                          <option value="hd">HD</option>
                        </Select>
                      </FormControl>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              <Button
                bg="brand.navy.500"
                color="white"
                leftIcon={<Icon as={FiZap} />}
                isLoading={isGenerating}
                isDisabled={!selectedArticle || isLoadingArticles}
                onClick={handleGenerate}
                _hover={{ bg: "brand.navy.600" }}
                _active={{ bg: "brand.navy.700" }}
                _disabled={{ 
                  bg: "gray.100",
                  color: "gray.500",
                  cursor: "not-allowed",
                  opacity: 0.8
                }}
                size="lg"
              >
                Generate
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Generated Content History */}
        <Card variant="outline" borderColor="gray.200">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="brand.navy.900">Generated Content History</Heading>
              
              {isLoadingContent ? (
                <VStack py={6}>
                  <Text color="brand.navy.700">Loading generated content...</Text>
                </VStack>
              ) : existingContent.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th color="brand.navy.700">NAME</Th>
                      <Th color="brand.navy.700">ORIGINAL URL</Th>
                      <Th color="brand.navy.700" textAlign="right">GENERATION DATE</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {existingContent.map((content) => (
                      <React.Fragment key={content.id}>
                        <Tr cursor="pointer" onClick={() => setExpandedContent(expandedContent === content.id ? null : content.id)}>
                          <Td color="brand.navy.900">
                            <HStack>
                              <Icon 
                                as={expandedContent === content.id ? FiChevronDown : FiChevronRight} 
                                color="brand.navy.500"
                              />
                              <Text>{content.name}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Link 
                              href={content.originalUrl} 
                              isExternal 
                              color="brand.navy.500"
                              display="flex"
                              alignItems="center"
                              _hover={{ color: "brand.navy.600" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Icon as={FiExternalLink} mr={1} />
                              View Article
                            </Link>
                          </Td>
                          <Td textAlign="right" color="brand.navy.700">
                            {content.generationDate ? new Date(content.generationDate).toLocaleString() : '-'}
                          </Td>
                        </Tr>
                        <Tr>
                          <Td colSpan={3} p={0}>
                            <Collapse in={expandedContent === content.id}>
                              <Box p={4} bg="gray.50">
                                <Tabs variant="enclosed" colorScheme="brand.navy">
                                  <TabList>
                                    <Tab><Icon as={FiFacebook} mr={2} /> Facebook</Tab>
                                    <Tab><Icon as={FiInstagram} mr={2} /> Instagram</Tab>
                                    <Tab><Icon as={FiTwitter} mr={2} /> Twitter/X</Tab>
                                    <Tab><Icon as={FiVideo} mr={2} /> Video Script</Tab>
                                    <Tab><Icon as={FiImage} mr={2} /> Graphic</Tab>
                                  </TabList>
                                  <TabPanels>
                                    <TabPanel>
                                      <Text whiteSpace="pre-wrap" color="brand.navy.700">{content.facebookPost}</Text>
                                    </TabPanel>
                                    <TabPanel>
                                      <Text whiteSpace="pre-wrap" color="brand.navy.700">{content.instagramPost}</Text>
                                    </TabPanel>
                                    <TabPanel>
                                      <Text whiteSpace="pre-wrap" color="brand.navy.700">{content.twitterPost}</Text>
                                    </TabPanel>
                                    <TabPanel>
                                      <Text whiteSpace="pre-wrap" color="brand.navy.700">{content.videoScript}</Text>
                                    </TabPanel>
                                    <TabPanel>
                                      {showUploadForContent === content.id ? (
                                        <VStack spacing={4} align="stretch">
                                          <HStack justify="space-between">
                                            <Text color="brand.navy.700" fontWeight="medium">
                                              Upload Custom Image
                                            </Text>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setShowUploadForContent(null)}
                                              color="gray.500"
                                            >
                                              Cancel
                                            </Button>
                                          </HStack>
                                          <ImageUpload
                                            onImageUpload={(imageUrl, fileName) => 
                                              handleImageUpload(content.id, imageUrl, fileName)
                                            }
                                            onCancel={() => setShowUploadForContent(null)}
                                            isUploading={uploadingImage === content.id}
                                          />
                                        </VStack>
                                      ) : content.graphicUrl ? (
                                        <VStack spacing={4} align="stretch">
                                          <Image
                                            src={content.graphicUrl}
                                            alt={`Generated graphic for ${content.name}`}
                                            borderRadius="lg"
                                            boxShadow="md"
                                            maxW="100%"
                                            maxH="400px"
                                            objectFit="contain"
                                          />
                                          <HStack spacing={2} wrap="wrap">
                                            <Badge colorScheme="blue" variant="subtle">
                                              {content.graphicStyle || 'Unknown Style'}
                                            </Badge>
                                            <Button
                                              size="sm"
                                              leftIcon={<Icon as={FiDownload} />}
                                              onClick={() => window.open(content.graphicUrl, '_blank')}
                                              colorScheme="brand.navy"
                                              variant="outline"
                                            >
                                              Download
                                            </Button>
                                            <Button
                                              size="sm"
                                              leftIcon={<Icon as={FiZap} />}
                                              onClick={() => {
                                                const article = articles.find(a => a.url === content.originalUrl);
                                                if (article) {
                                                  handleRegenerateGraphic(content.id, article);
                                                }
                                              }}
                                              isLoading={regeneratingGraphic === content.id}
                                              colorScheme="orange"
                                              variant="outline"
                                            >
                                              Regenerate
                                            </Button>
                                            <Button
                                              size="sm"
                                              leftIcon={<Icon as={FiUpload} />}
                                              onClick={() => setShowUploadForContent(content.id)}
                                              colorScheme="green"
                                              variant="outline"
                                            >
                                              Upload Custom
                                            </Button>
                                          </HStack>
                                          {content.graphicPrompt && (
                                            <Box p={3} bg="gray.100" borderRadius="md">
                                              <Text fontSize="sm" color="brand.navy.600" fontWeight="medium">
                                                Prompt:
                                              </Text>
                                              <Text fontSize="sm" color="brand.navy.700" mt={1}>
                                                {content.graphicPrompt}
                                              </Text>
                                            </Box>
                                          )}
                                        </VStack>
                                      ) : (
                                        <VStack spacing={4} align="stretch">
                                          <Text color="brand.navy.600" textAlign="center" py={6}>
                                            No graphic generated for this content.
                                          </Text>
                                          <HStack spacing={4} justify="center">
                                            <Button
                                              leftIcon={<Icon as={FiZap} />}
                                              onClick={() => {
                                                const article = articles.find(a => a.url === content.originalUrl);
                                                if (article) {
                                                  handleRegenerateGraphic(content.id, article);
                                                }
                                              }}
                                              isLoading={regeneratingGraphic === content.id}
                                              colorScheme="blue"
                                              variant="outline"
                                              size="lg"
                                            >
                                              Generate Graphic
                                            </Button>
                                            <Button
                                              leftIcon={<Icon as={FiUpload} />}
                                              onClick={() => setShowUploadForContent(content.id)}
                                              colorScheme="green"
                                              variant="outline"
                                              size="lg"
                                            >
                                              Upload Custom Image
                                            </Button>
                                          </HStack>
                                        </VStack>
                                      )}
                                    </TabPanel>
                                  </TabPanels>
                                </Tabs>
                              </Box>
                            </Collapse>
                          </Td>
                        </Tr>
                      </React.Fragment>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="brand.navy.600" textAlign="center" py={6}>
                  No generated content yet. Select an article and click Generate to create content.
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};