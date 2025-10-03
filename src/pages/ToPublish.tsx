import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Icon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Collapse,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { 
  FiSend, 
  FiFacebook, 
  FiInstagram, 
  FiTwitter, 
  FiCalendar, 
  FiExternalLink,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGeneratedContent, getPublishingStatus } from '../services/airtable';
import { simulateFacebookPublishSuccess, simulateFacebookPublishFailure } from '../services/makeWebhook';
import { testAirtablePublishingConnection } from '../services/testAirtableConnection';
import { debugMakecomData } from '../services/debugMakecom';
import { ProcessedImage } from '../components/ProcessedImage';

interface PublishSchedule {
  id: string;
  contentId: string;
  platform: string;
  accountId: string;
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'failed';
  publishedTime?: string;
}

export const ToPublish = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [schedulingContent, setSchedulingContent] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, string[]>>({});
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Mock data for scheduled posts - in real implementation, this would come from API
  const [scheduledPosts] = useState<PublishSchedule[]>([
    {
      id: '1',
      contentId: 'content-1',
      platform: 'facebook',
      accountId: '1',
      scheduledTime: '2025-01-28T09:00:00Z',
      status: 'scheduled'
    },
    {
      id: '2',
      contentId: 'content-2',
      platform: 'instagram',
      accountId: '2',
      scheduledTime: '2025-01-28T10:00:00Z',
      status: 'published',
      publishedTime: '2025-01-28T10:00:00Z'
    }
  ]);


  // Fetch generated content
  const { data: generatedContent = [], isLoading } = useQuery({
    queryKey: ['generatedContent'],
    queryFn: getGeneratedContent
  });


  // Handle platform selection
  const handlePlatformChange = (contentId: string, platform: string, checked: boolean) => {
    setSelectedPlatforms(prev => {
      const current = prev[contentId] || [];
      if (checked) {
        return { ...prev, [contentId]: [...current, platform] };
      } else {
        return { ...prev, [contentId]: current.filter(p => p !== platform) };
      }
    });
  };

  // Check if content is already published to a specific platform
  const isContentPublishedToPlatform = (content: any, platform: string): boolean => {
    if (!content.publishStatus) return false;
    
    // If we already have derived platforms on the record, honor them immediately
    if (Array.isArray(content.publishPlatforms) && content.publishPlatforms.includes(platform)) {
      return true;
    }

    // If content is published overall, check if it was published to this platform
    if (content.publishStatus === 'Published') {
      return content.publishPlatforms?.includes(platform) || false;
    }
    
    // If content is scheduled, check if it's scheduled to this platform
    if (content.publishStatus === 'Scheduled') {
      return content.scheduledPlatforms?.includes(platform) || false;
    }
    
    // Check individual platform status
    const platformStatusField = `${platform.toLowerCase()}Status`;
    const platformStatus = content[platformStatusField];
    return platformStatus === 'Published';
  };

  // Check if platform checkbox should be disabled
  const isPlatformDisabled = (content: any, platform: string): boolean => {
    return isContentPublishedToPlatform(content, platform);
  };

  // Make.com integration - Publish via Airtable trigger
  const handleMakeComPublish = async (contentId: string, platforms: string[], scheduledTime?: string) => {
    try {
      setSchedulingContent(contentId);
      
      // Find the content
      const content = generatedContent.find(c => c.id === contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      if (platforms.length === 0) {
        throw new Error('Please select at least one platform to publish to');
      }

      // Validate Facebook content specifically
      if (platforms.includes('Facebook') && !content.facebookPost) {
        throw new Error('Facebook post content is missing. Please regenerate the content.');
      }

      // Import Airtable service
      const { triggerMakecomWebhook } = await import('../services/airtable');
      
      // Trigger Make.com webhook directly for instant publishing
      await triggerMakecomWebhook(
        contentId,
        platforms,
        scheduledTime
      );

      // Show different messages for Facebook vs other platforms
      const isFacebookOnly = platforms.length === 1 && platforms[0] === 'Facebook';
      const includesFacebook = platforms.includes('Facebook');
      
      toast({
        title: scheduledTime ? 'Post scheduled!' : 'Publishing initiated!',
        description: scheduledTime 
          ? `Your content has been scheduled for ${platforms.join(', ')}. ${includesFacebook ? 'Facebook' : 'The platforms'} will receive the post at the scheduled time.`
          : `Your content is being published to ${platforms.join(', ')}. ${isFacebookOnly ? 'Facebook publishing' : 'Make.com automation'} is now processing your request.`,
        status: 'success',
        duration: includesFacebook ? 7000 : 5000,
        isClosable: true,
      });

      // Clear selected platforms for this content
      setSelectedPlatforms(prev => ({ ...prev, [contentId]: [] }));
      
      // Refresh content to show updated status
      queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
      
      // Start polling for status updates if Facebook is included
      if (includesFacebook) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
        }, 10000); // Check status after 10 seconds
      }
      
    } catch (error) {
      console.error('Error initiating publish via Make.com:', error);
      toast({
        title: 'Publishing failed',
        description: error instanceof Error ? error.message : 'An error occurred while initiating publish.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSchedulingContent(null);
    }
  };

  // Enhanced publish now with Make.com
  const handlePublishNowMakeCom = async (contentId: string) => {
    const platforms = selectedPlatforms[contentId] || [];
    await handleMakeComPublish(contentId, platforms);
  };

  // Schedule post function with Make.com
  const handleSchedulePost = async (contentId: string) => {
    const platforms = selectedPlatforms[contentId] || [];
    
    if (platforms.length === 0) {
      toast({
        title: 'No platforms selected',
        description: 'Please select at least one platform to schedule to',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setSelectedContent(contentId);
    onOpen();
  };

  // Handle actual scheduling
  const handleScheduleSubmit = async (scheduledTime: string, platforms: string[]) => {
    if (!selectedContent) return;

    try {
      setSchedulingContent(selectedContent);
      
      // Import Airtable service
      const { scheduleContent } = await import('../services/airtable');
      
      // Schedule the content
      await scheduleContent(selectedContent, {
        scheduledTime,
        platforms,
        isScheduled: true
      });

      toast({
        title: 'Post scheduled successfully!',
        description: `Your content will be published to ${platforms.join(', ')} at ${new Date(scheduledTime).toLocaleString()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear selected platforms and close modal
      setSelectedPlatforms(prev => ({ ...prev, [selectedContent]: [] }));
      onClose();
      
      // Refresh content to show updated status
      queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
      
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast({
        title: 'Scheduling failed',
        description: error instanceof Error ? error.message : 'An error occurred while scheduling the post.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSchedulingContent(null);
    }
  };




  // Component to show publishing status
  const PublishingStatusBadge = ({ content }: { content: any }) => {
    // Use content data directly, but also poll for updates
    const { data: publishStatus } = useQuery({
      queryKey: ['publishingStatus', content.id],
      queryFn: () => getPublishingStatus(content.id),
      refetchInterval: 5000, // Poll every 5 seconds
      enabled: !!content.publishStatus,
      initialData: {
        publishStatus: content.publishStatus,
        publishPlatforms: content.publishPlatforms,
        facebookStatus: content.facebookStatus,
        instagramStatus: content.instagramStatus,
        twitterStatus: content.twitterStatus,
        publishedAt: content.publishedAt,
        errorMessage: content.publishingError,
      }
    });

    if (!publishStatus?.publishStatus) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Ready_to_Publish': return 'orange';
        case 'Publishing': return 'blue';
        case 'Published': return 'green';
        case 'Failed': return 'red';
        case 'Scheduled': return 'purple';
        case 'Not_Published': return 'gray';
        default: return 'gray';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'Ready_to_Publish': return 'Ready to Publish';
        case 'Publishing': return 'Publishing...';
        case 'Published': return 'Published';
        case 'Failed': return 'Failed';
        case 'Scheduled': return 'Scheduled';
        case 'Not_Published': return 'Not Published';
        default: return status;
      }
    };

    return (
      <VStack spacing={1} align="start">
        <Badge
          colorScheme={getStatusColor(publishStatus.publishStatus)}
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
        >
          {getStatusText(publishStatus.publishStatus)}
        </Badge>
        
        {publishStatus.publishPlatforms && publishStatus.publishPlatforms.length > 0 && (
          <HStack spacing={1}>
            {publishStatus.publishPlatforms.map((platform) => {
              const getPlatformColor = (platform: string) => {
                switch (platform.toLowerCase()) {
                  case 'facebook': return 'blue';
                  case 'instagram': return 'pink';
                  case 'twitter': return 'blue';
                  default: return 'gray';
                }
              };
              return (
                <Badge
                  key={platform}
                  colorScheme={getPlatformColor(platform)}
                  size="sm"
                  fontSize="xs"
                >
                  {platform}
                </Badge>
              );
            })}
          </HStack>
        )}
        
        {publishStatus.facebookStatus && publishStatus.facebookStatus !== 'Pending' && (
          <Text fontSize="xs" color={publishStatus.facebookStatus === 'Published' ? 'green.600' : 'red.600'}>
            FB: {publishStatus.facebookStatus}
          </Text>
        )}
        
        {publishStatus.errorMessage && (
          <Text fontSize="xs" color="red.600" maxW="200px" isTruncated>
            Error: {publishStatus.errorMessage}
          </Text>
        )}
        
        {/* Test buttons for development - remove in production */}
        {publishStatus.publishStatus === 'Ready_to_Publish' && (
          <HStack spacing={1}>
            <Button
              size="xs"
              colorScheme="green"
              variant="outline"
              onClick={async () => {
                await simulateFacebookPublishSuccess(content.id);
                queryClient.invalidateQueries({ queryKey: ['publishingStatus', content.id] });
                queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
              }}
            >
              ✓ Test Success
            </Button>
            <Button
              size="xs"
              colorScheme="red"
              variant="outline"
              onClick={async () => {
                await simulateFacebookPublishFailure(content.id, 'Test error message');
                queryClient.invalidateQueries({ queryKey: ['publishingStatus', content.id] });
                queryClient.invalidateQueries({ queryKey: ['generatedContent'] });
              }}
            >
              ✗ Test Fail
            </Button>
            <Button
              size="xs"
              colorScheme="purple"
              variant="outline"
              onClick={async () => {
                await debugMakecomData(content.id);
              }}
            >
              🔍 Debug
            </Button>
          </HStack>
        )}
      </VStack>
    );
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg" color="brand.navy.900">To Publish</Heading>
        
        <Tabs variant="enclosed" colorScheme="brand.navy">
          <TabList>
            <Tab>Generated Content</Tab>
            <Tab>Scheduled Posts</Tab>
          </TabList>

          <TabPanels>
            {/* Generated Content Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Facebook Publishing Ready!</AlertTitle>
                    <AlertDescription>
                      Your content can now be published directly to Facebook via Make.com automation. 
                      Select Facebook platform and click "Publish Now" to send your content to Make.com for processing.
                      Status updates will appear in real-time.
                    </AlertDescription>
                  </Box>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    ml={4}
                    onClick={async () => {
                      try {
                        await testAirtablePublishingConnection();
                        toast({
                          title: 'Connection Test Successful',
                          description: 'Airtable connection and publishing workflow are working correctly. Check console for details.',
                          status: 'success',
                          duration: 5000,
                        });
                      } catch (error) {
                        toast({
                          title: 'Connection Test Failed',
                          description: error instanceof Error ? error.message : 'Unknown error occurred',
                          status: 'error',
                          duration: 5000,
                        });
                      }
                    }}
                  >
                    Test Connection
                  </Button>
                </Alert>
                
                <Card>
                  <CardHeader>
                    <Heading size="md" color="brand.navy.500">Ready to Publish</Heading>
                  </CardHeader>
                  <CardBody>
                    {isLoading ? (
                      <Text color="brand.navy.700">Loading generated content...</Text>
                    ) : generatedContent.length > 0 ? (
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th color="brand.navy.700">CONTENT</Th>
                            <Th color="brand.navy.700">ORIGINAL URL</Th>
                            <Th color="brand.navy.700">GENERATION DATE</Th>
                            <Th color="brand.navy.700">STATUS</Th>
                            <Th color="brand.navy.700">ACTIONS</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {generatedContent.map((content) => (
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
                                  <Text fontSize="sm" color="gray.600" maxW="200px" isTruncated>
                                    {content.originalUrl}
                                  </Text>
                                </Td>
                                <Td color="brand.navy.700">
                                  {content.generationDate ? new Date(content.generationDate).toLocaleDateString() : '-'}
                                </Td>
                                <Td>
                                  <PublishingStatusBadge content={content} />
                                </Td>
                                <Td>
                                  <VStack spacing={2} align="stretch" minW="200px">
                                    {/* Platform Selection */}
                                    <HStack spacing={3} wrap="wrap">
                                      <HStack spacing={1}>
                                        <input 
                                          type="checkbox" 
                                          id={`facebook-${content.id}`}
                                          checked={selectedPlatforms[content.id]?.includes('Facebook') || false}
                                          disabled={isPlatformDisabled(content, 'Facebook')}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handlePlatformChange(content.id, 'Facebook', e.target.checked);
                                          }}
                                          style={{
                                            opacity: isPlatformDisabled(content, 'Facebook') ? 0.5 : 1,
                                            cursor: isPlatformDisabled(content, 'Facebook') ? 'not-allowed' : 'pointer'
                                          }}
                                        />
                                        <label 
                                          htmlFor={`facebook-${content.id}`}
                                          style={{
                                            opacity: isPlatformDisabled(content, 'Facebook') ? 0.5 : 1,
                                            cursor: isPlatformDisabled(content, 'Facebook') ? 'not-allowed' : 'pointer'
                                          }}
                                        >
                                          <HStack spacing={1}>
                                            <Icon as={FiFacebook} color={isPlatformDisabled(content, 'Facebook') ? "gray.400" : "blue.600"} boxSize={3} />
                                            <Text fontSize="xs" color={isPlatformDisabled(content, 'Facebook') ? "gray.400" : "inherit"}>
                                              FB {isPlatformDisabled(content, 'Facebook') ? 
                                                (content.publishStatus === 'Scheduled' ? '(Scheduled)' : '(Published)') : ''}
                                            </Text>
                                          </HStack>
                                        </label>
                                      </HStack>
                                      <HStack spacing={1}>
                                        <input 
                                          type="checkbox" 
                                          id={`instagram-${content.id}`}
                                          checked={selectedPlatforms[content.id]?.includes('Instagram') || false}
                                          disabled={isPlatformDisabled(content, 'Instagram')}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handlePlatformChange(content.id, 'Instagram', e.target.checked);
                                          }}
                                          style={{
                                            opacity: isPlatformDisabled(content, 'Instagram') ? 0.5 : 1,
                                            cursor: isPlatformDisabled(content, 'Instagram') ? 'not-allowed' : 'pointer'
                                          }}
                                        />
                                        <label 
                                          htmlFor={`instagram-${content.id}`}
                                          style={{
                                            opacity: isPlatformDisabled(content, 'Instagram') ? 0.5 : 1,
                                            cursor: isPlatformDisabled(content, 'Instagram') ? 'not-allowed' : 'pointer'
                                          }}
                                        >
                                          <HStack spacing={1}>
                                            <Icon as={FiInstagram} color={isPlatformDisabled(content, 'Instagram') ? "gray.400" : "pink.600"} boxSize={3} />
                                            <Text fontSize="xs" color={isPlatformDisabled(content, 'Instagram') ? "gray.400" : "inherit"}>
                                              IG {isPlatformDisabled(content, 'Instagram') ? 
                                                (content.publishStatus === 'Scheduled' ? '(Scheduled)' : '(Published)') : ''}
                                            </Text>
                                          </HStack>
                                        </label>
                                      </HStack>
                                      <HStack spacing={1}>
                                        <input 
                                          type="checkbox" 
                                          id={`twitter-${content.id}`}
                                          checked={selectedPlatforms[content.id]?.includes('Twitter') || false}
                                          disabled={isPlatformDisabled(content, 'Twitter')}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handlePlatformChange(content.id, 'Twitter', e.target.checked);
                                          }}
                                          style={{
                                            opacity: isPlatformDisabled(content, 'Twitter') ? 0.5 : 1,
                                            cursor: isPlatformDisabled(content, 'Twitter') ? 'not-allowed' : 'pointer'
                                          }}
                                        />
                                        <label 
                                          htmlFor={`twitter-${content.id}`}
                                          style={{
                                            opacity: isPlatformDisabled(content, 'Twitter') ? 0.5 : 1,
                                            cursor: isPlatformDisabled(content, 'Twitter') ? 'not-allowed' : 'pointer'
                                          }}
                                        >
                                          <HStack spacing={1}>
                                            <Icon as={FiTwitter} color={isPlatformDisabled(content, 'Twitter') ? "gray.400" : "blue.400"} boxSize={3} />
                                            <Text fontSize="xs" color={isPlatformDisabled(content, 'Twitter') ? "gray.400" : "inherit"}>
                                              TW {isPlatformDisabled(content, 'Twitter') ? 
                                                (content.publishStatus === 'Scheduled' ? '(Scheduled)' : '(Published)') : ''}
                                            </Text>
                                          </HStack>
                                        </label>
                                      </HStack>
                                    </HStack>

                                    {/* Publish Buttons */}
                                    <HStack spacing={2}>
                                      <Button
                                        size="xs"
                                        colorScheme="green"
                                        leftIcon={<Icon as={FiSend} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePublishNowMakeCom(content.id);
                                        }}
                                        isLoading={schedulingContent === content.id}
                                        isDisabled={!selectedPlatforms[content.id]?.length || 
                                                   (isPlatformDisabled(content, 'Facebook') && 
                                                    isPlatformDisabled(content, 'Instagram') && 
                                                    isPlatformDisabled(content, 'Twitter'))}
                                      >
                                        Publish Now
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        leftIcon={<Icon as={FiCalendar} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSchedulePost(content.id);
                                        }}
                                        isDisabled={!selectedPlatforms[content.id]?.length || 
                                                   (isPlatformDisabled(content, 'Facebook') && 
                                                    isPlatformDisabled(content, 'Instagram') && 
                                                    isPlatformDisabled(content, 'Twitter'))}
                                      >
                                        Schedule
                                      </Button>
                                    </HStack>
                                  </VStack>
                                </Td>
                              </Tr>
                              <Tr>
                                <Td colSpan={5} p={0}>
                                  <Collapse in={expandedContent === content.id}>
                                    <Box p={4} bg="gray.50">
                                      <Tabs variant="enclosed" colorScheme="brand.navy" size="sm">
                                        <TabList>
                                          <Tab><Icon as={FiFacebook} mr={2} /> Facebook</Tab>
                                          <Tab><Icon as={FiInstagram} mr={2} /> Instagram</Tab>
                                          <Tab><Icon as={FiTwitter} mr={2} /> Twitter/X</Tab>
                                        </TabList>
                                        <TabPanels>
                                          <TabPanel>
                                            <VStack spacing={4} align="stretch">
                                              <Text whiteSpace="pre-wrap" color="brand.navy.700" fontSize="sm">
                                                {content.facebookPost}
                                              </Text>
                                              {content.graphicUrl && (
                                                <ProcessedImage
                                                  src={content.graphicUrl}
                                                  alt="Generated graphic"
                                                  maxW="300px"
                                                  borderRadius="md"
                                                />
                                              )}
                                              <HStack spacing={2}>
                                                <Button
                                                  size="sm"
                                                  colorScheme="blue"
                                                  leftIcon={<Icon as={FiSend} />}
                                                  onClick={() => handlePublishNow(content.id, 'facebook')}
                                                  isLoading={schedulingContent === content.id}
                                                >
                                                  Publish Now
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  leftIcon={<Icon as={FiCalendar} />}
                                                  onClick={() => {
                                                    setSelectedContent(content.id);
                                                    onOpen();
                                                  }}
                                                >
                                                  Schedule
                                                </Button>
                                              </HStack>
                                            </VStack>
                                          </TabPanel>
                                          <TabPanel>
                                            <VStack spacing={4} align="stretch">
                                              <Text whiteSpace="pre-wrap" color="brand.navy.700" fontSize="sm">
                                                {content.instagramPost}
                                              </Text>
                                              {content.graphicUrl && (
                                                <ProcessedImage
                                                  src={content.graphicUrl}
                                                  alt="Generated graphic"
                                                  maxW="300px"
                                                  borderRadius="md"
                                                />
                                              )}
                                              <HStack spacing={2}>
                                                <Button
                                                  size="sm"
                                                  colorScheme="pink"
                                                  leftIcon={<Icon as={FiSend} />}
                                                  onClick={() => handlePublishNow(content.id, 'instagram')}
                                                  isLoading={schedulingContent === content.id}
                                                >
                                                  Publish Now
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  leftIcon={<Icon as={FiCalendar} />}
                                                  onClick={() => {
                                                    setSelectedContent(content.id);
                                                    onOpen();
                                                  }}
                                                >
                                                  Schedule
                                                </Button>
                                              </HStack>
                                            </VStack>
                                          </TabPanel>
                                          <TabPanel>
                                            <VStack spacing={4} align="stretch">
                                              <Text whiteSpace="pre-wrap" color="brand.navy.700" fontSize="sm">
                                                {content.twitterPost}
                                              </Text>
                                              {content.graphicUrl && (
                                                <ProcessedImage
                                                  src={content.graphicUrl}
                                                  alt="Generated graphic"
                                                  maxW="300px"
                                                  borderRadius="md"
                                                />
                                              )}
                                              <HStack spacing={2}>
                                                <Button
                                                  size="sm"
                                                  colorScheme="blue"
                                                  leftIcon={<Icon as={FiSend} />}
                                                  onClick={() => handlePublishNow(content.id, 'twitter')}
                                                  isLoading={schedulingContent === content.id}
                                                >
                                                  Publish Now
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  leftIcon={<Icon as={FiCalendar} />}
                                                  onClick={() => {
                                                    setSelectedContent(content.id);
                                                    onOpen();
                                                  }}
                                                >
                                                  Schedule
                                                </Button>
                                              </HStack>
                                            </VStack>
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
                        No generated content available. Generate some content first to publish.
                      </Text>
                    )}
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Scheduled Posts Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md" color="brand.navy.500">Scheduled Posts</Heading>
                  </CardHeader>
                  <CardBody>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th color="brand.navy.700">CONTENT</Th>
                          <Th color="brand.navy.700">PLATFORM</Th>
                          <Th color="brand.navy.700">SCHEDULED TIME</Th>
                          <Th color="brand.navy.700">STATUS</Th>
                          <Th color="brand.navy.700">ACTIONS</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {scheduledPosts.map((post) => (
                          <Tr key={post.id}>
                            <Td color="brand.navy.900">
                              <Text fontSize="sm">Generated Content #{post.contentId}</Text>
                            </Td>
                            <Td>
                              <HStack>
                                <Icon 
                                  as={post.platform === 'facebook' ? FiFacebook : 
                                      post.platform === 'instagram' ? FiInstagram : 
                                      FiTwitter} 
                                  color={`${post.platform === 'facebook' ? 'blue' : 
                                          post.platform === 'instagram' ? 'pink' : 
                                          'blue'}.500`}
                                />
                                <Text fontSize="sm" textTransform="capitalize">
                                  {post.platform}
                                </Text>
                              </HStack>
                            </Td>
                            <Td color="brand.navy.700">
                              {new Date(post.scheduledTime).toLocaleString()}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  post.status === 'published' ? 'green' :
                                  post.status === 'scheduled' ? 'blue' : 'red'
                                }
                                px={2}
                                py={1}
                                borderRadius="md"
                                textTransform="uppercase"
                                fontSize="xs"
                              >
                                {post.status}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                {post.status === 'scheduled' && (
                                  <Button size="sm" variant="outline" colorScheme="red">
                                    Cancel
                                  </Button>
                                )}
                                {post.status === 'published' && post.publishedTime && (
                                  <Text fontSize="xs" color="gray.600">
                                    Published: {new Date(post.publishedTime).toLocaleString()}
                                  </Text>
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                        {scheduledPosts.length === 0 && (
                          <Tr>
                            <Td colSpan={5}>
                              <Text textAlign="center" color="gray.500" py={4}>
                                No scheduled posts. Schedule content to see it here.
                              </Text>
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Schedule Post Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader color="brand.navy.500">Schedule Post</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Platforms Selected</AlertTitle>
                    <AlertDescription>
                      {selectedContent && selectedPlatforms[selectedContent]?.length > 0 
                        ? `Scheduling to: ${selectedPlatforms[selectedContent].join(', ')}`
                        : 'No platforms selected'
                      }
                    </AlertDescription>
                  </Box>
                </Alert>

                <FormControl>
                  <FormLabel color="brand.navy.700">Schedule Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => {
                      // Store the selected time in state
                      setScheduledTime(e.target.value);
                    }}
                  />
                </FormControl>

                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      Make sure your Make.com scenario is set up to handle scheduled posts. 
                      Watch for "Publish Status" = "Scheduled" and "Is_Scheduled" = true.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={() => {
                  if (selectedContent && selectedPlatforms[selectedContent]?.length > 0) {
                    const scheduledTime = (document.querySelector('input[type="datetime-local"]') as HTMLInputElement)?.value;
                    if (scheduledTime) {
                      handleScheduleSubmit(scheduledTime, selectedPlatforms[selectedContent]);
                    } else {
                      toast({
                        title: 'Please select a date and time',
                        description: 'You must choose when to schedule the post.',
                        status: 'warning',
                        duration: 3000,
                      });
                    }
                  }
                }}
                isLoading={schedulingContent === selectedContent}
                isDisabled={!selectedContent || !selectedPlatforms[selectedContent]?.length}
              >
                Schedule Post
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};
