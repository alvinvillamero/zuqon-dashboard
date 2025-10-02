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
  Switch,
  useToast,
  Image,
  Collapse,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { 
  FiSend, 
  FiPlus, 
  FiFacebook, 
  FiInstagram, 
  FiTwitter, 
  FiCalendar, 
  FiClock, 
  FiCheck, 
  FiX,
  FiExternalLink,
  FiChevronDown,
  FiChevronRight,
  FiSettings,
  FiRefreshCw
} from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGeneratedContent, getPublishingStatus } from '../services/airtable';
import { simulateFacebookPublishSuccess, simulateFacebookPublishFailure } from '../services/makeWebhook';
import { testAirtablePublishingConnection } from '../services/testAirtableConnection';
import { debugMakecomData } from '../services/debugMakecom';
import { getSocialAccounts, updateSocialAccountStatus, deleteSocialAccount, saveSocialAccount } from '../services/socialAccountsLocal';
import { SocialMediaService, SocialMediaAccount, PostData } from '../services/socialMedia';
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

  // Fetch social media accounts
  const { data: socialAccounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: getSocialAccounts
  });

  // Fetch generated content
  const { data: generatedContent = [], isLoading } = useQuery({
    queryKey: ['generatedContent'],
    queryFn: getGeneratedContent
  });

  const handleConnectAccount = async (platform: 'facebook' | 'instagram' | 'twitter') => {
    console.log('Connect button clicked for platform:', platform);
    
    try {
      toast({
        title: `${platform} connection initiated`,
        description: `Opening ${platform} authentication popup...`,
        status: 'info',
        duration: 3000,
      });
      
      console.log('About to call SocialMediaService.connectAccountWithPopup');
      
      // Use popup OAuth flow
      const account = await SocialMediaService.connectAccountWithPopup(platform);
      
      console.log('Account received from popup:', account);
      
      // Save account to localStorage
      await saveSocialAccount(account);
      
      // Refresh the accounts list
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
      
      toast({
        title: `${platform} connected successfully!`,
        description: `Your ${platform} account "${account.name}" has been connected.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error in handleConnectAccount:', error);
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : `Failed to connect ${platform} account. Please try again.`,
        status: 'error',
        duration: 5000,
      });
    }
  };

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

  // Enhanced publish now function
  const handlePublishNow = async (contentId: string, platform?: 'facebook' | 'instagram' | 'twitter') => {
    try {
      setSchedulingContent(contentId);
      
      // Find the content and account
      const content = generatedContent.find(c => c.id === contentId);
      const account = socialAccounts.find(a => a.platform === platform && a.isConnected);
      
      if (!content) {
        throw new Error('Content not found');
      }
      
      if (!account) {
        throw new Error(`No connected ${platform} account found`);
      }
      
      // Prepare post data
      const postData: PostData = {
        content: platform === 'facebook' ? content.facebookPost : 
                platform === 'instagram' ? content.instagramPost : 
                content.twitterPost,
        imageUrl: content.graphicUrl,
        platform: platform
      };
      
      // Publish the content
      const result = await SocialMediaService.publishContent(account, postData);
      
      if (result.success) {
        toast({
          title: 'Content published successfully',
          description: `Your content has been published to ${platform}.`,
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
    } catch (error) {
      toast({
        title: 'Publishing failed',
        description: error instanceof Error ? error.message : `Failed to publish to ${platform}. Please try again.`,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSchedulingContent(null);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await deleteSocialAccount(accountId);
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
      
      toast({
        title: 'Account disconnected',
        description: 'The social media account has been disconnected.',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error disconnecting account',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      await updateSocialAccountStatus(accountId, true);
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
      
      toast({
        title: 'Account synced',
        description: 'Account information has been updated.',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error syncing account',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };


  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return FiFacebook;
      case 'instagram': return FiInstagram;
      case 'twitter': return FiTwitter;
      default: return FiSend;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'blue';
      case 'instagram': return 'pink';
      case 'twitter': return 'blue';
      default: return 'gray';
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
            {publishStatus.publishPlatforms.map((platform) => (
              <Badge
                key={platform}
                colorScheme={getPlatformColor(platform.toLowerCase())}
                size="sm"
                fontSize="xs"
              >
                {platform}
              </Badge>
            ))}
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
            <Tab>Social Media Accounts</Tab>
            <Tab>Generated Content</Tab>
            <Tab>Scheduled Posts</Tab>
          </TabList>

          <TabPanels>
            {/* Social Media Accounts Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md" color="brand.navy.500">Connected Accounts</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {socialAccounts.length > 0 ? (
                        socialAccounts.map((account) => (
                          <Card key={account.id} variant="outline">
                            <CardBody>
                              <HStack justify="space-between">
                                <HStack spacing={4}>
                                  <Icon 
                                    as={getPlatformIcon(account.platform)} 
                                    color={`${getPlatformColor(account.platform)}.500`}
                                    boxSize={6}
                                  />
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium" color="brand.navy.900">
                                      {account.name}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {account.username}
                                    </Text>
                                    {account.lastSync && (
                                      <Text fontSize="xs" color="gray.500">
                                        Last sync: {new Date(account.lastSync).toLocaleString()}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                                <VStack spacing={2}>
                                  <Badge
                                    colorScheme={account.isConnected ? 'green' : 'red'}
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                  >
                                    {account.isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                                  </Badge>
                                  {!account.isConnected ? (
                                    <Button
                                      size="sm"
                                      colorScheme={getPlatformColor(account.platform)}
                                      onClick={() => handleConnectAccount(account.platform)}
                                    >
                                      Connect
                                    </Button>
                                  ) : (
                                    <HStack spacing={2}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        leftIcon={<Icon as={FiRefreshCw} />}
                                        onClick={() => handleSyncAccount(account.id)}
                                      >
                                        Sync
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        leftIcon={<Icon as={FiSettings} />}
                                      >
                                        Settings
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        colorScheme="red"
                                        leftIcon={<Icon as={FiX} />}
                                        onClick={() => handleDisconnectAccount(account.id)}
                                      >
                                        Disconnect
                                      </Button>
                                    </HStack>
                                  )}
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))
                      ) : (
                        <VStack spacing={4} align="stretch">
                          <Text color="brand.navy.600" textAlign="center" py={4}>
                            No social media accounts connected yet. Connect your accounts below to start publishing.
                          </Text>
                          
                          {/* Default platform options */}
                          <VStack spacing={3} align="stretch">
                            <Card variant="outline" bg="gray.50">
                              <CardBody>
                                <HStack justify="space-between">
                                  <HStack spacing={4}>
                                    <Icon as={FiFacebook} color="blue.500" boxSize={6} />
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium" color="brand.navy.900">
                                        Facebook
                                      </Text>
                                      <Text fontSize="sm" color="gray.600">
                                        Connect your Facebook Page
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => handleConnectAccount('facebook')}
                                  >
                                    Connect
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>

                            <Card variant="outline" bg="gray.50">
                              <CardBody>
                                <HStack justify="space-between">
                                  <HStack spacing={4}>
                                    <Icon as={FiInstagram} color="pink.500" boxSize={6} />
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium" color="brand.navy.900">
                                        Instagram
                                      </Text>
                                      <Text fontSize="sm" color="gray.600">
                                        Connect your Instagram Business account
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="sm"
                                    colorScheme="pink"
                                    onClick={() => handleConnectAccount('instagram')}
                                  >
                                    Connect
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>

                            <Card variant="outline" bg="gray.50">
                              <CardBody>
                                <HStack justify="space-between">
                                  <HStack spacing={4}>
                                    <Icon as={FiTwitter} color="blue.500" boxSize={6} />
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium" color="brand.navy.900">
                                        Twitter/X
                                      </Text>
                                      <Text fontSize="sm" color="gray.600">
                                        Connect your Twitter/X account
                                      </Text>
                                      <Text fontSize="xs" color="orange.600">
                                        Temporarily disabled
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="sm"
                                    colorScheme="gray"
                                    isDisabled
                                  >
                                    Temporarily Disabled
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>
                          </VStack>
                        </VStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Social Media Integration</AlertTitle>
                    <AlertDescription>
                      Connect your social media accounts to publish and schedule content directly from Zuqon AI. 
                      We support Facebook Pages, Instagram Business accounts, and Twitter/X profiles.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </TabPanel>

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
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handlePlatformChange(content.id, 'Facebook', e.target.checked);
                                          }}
                                        />
                                        <label htmlFor={`facebook-${content.id}`}>
                                          <HStack spacing={1}>
                                            <Icon as={FiFacebook} color="blue.600" boxSize={3} />
                                            <Text fontSize="xs">FB</Text>
                                          </HStack>
                                        </label>
                                      </HStack>
                                      <HStack spacing={1}>
                                        <input 
                                          type="checkbox" 
                                          id={`instagram-${content.id}`}
                                          checked={selectedPlatforms[content.id]?.includes('Instagram') || false}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handlePlatformChange(content.id, 'Instagram', e.target.checked);
                                          }}
                                        />
                                        <label htmlFor={`instagram-${content.id}`}>
                                          <HStack spacing={1}>
                                            <Icon as={FiInstagram} color="pink.600" boxSize={3} />
                                            <Text fontSize="xs">IG</Text>
                                          </HStack>
                                        </label>
                                      </HStack>
                                      <HStack spacing={1}>
                                        <input 
                                          type="checkbox" 
                                          id={`twitter-${content.id}`}
                                          checked={selectedPlatforms[content.id]?.includes('Twitter') || false}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handlePlatformChange(content.id, 'Twitter', e.target.checked);
                                          }}
                                        />
                                        <label htmlFor={`twitter-${content.id}`}>
                                          <HStack spacing={1}>
                                            <Icon as={FiTwitter} color="blue.400" boxSize={3} />
                                            <Text fontSize="xs">TW</Text>
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
                                        isDisabled={!selectedPlatforms[content.id]?.length}
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
                                        isDisabled={!selectedPlatforms[content.id]?.length}
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
                                  as={getPlatformIcon(post.platform)} 
                                  color={`${getPlatformColor(post.platform)}.500`}
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
                <FormControl>
                  <FormLabel color="brand.navy.700">Select Platform</FormLabel>
                  <Select placeholder="Choose platform">
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel color="brand.navy.700">Select Account</FormLabel>
                  <Select placeholder="Choose account">
                    {socialAccounts.filter(acc => acc.isConnected).map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.platform})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color="brand.navy.700">Schedule Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
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
                onClick={() => {
                  // Mock schedule action
                  handleSchedulePost(selectedContent!, 'facebook', new Date().toISOString());
                }}
                isLoading={schedulingContent === selectedContent}
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
