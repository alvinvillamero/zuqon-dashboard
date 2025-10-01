import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, VStack, Heading, Text, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Button, Select, FormControl, FormLabel } from '@chakra-ui/react';
import { SocialMediaService } from '../services/socialMedia';
import { FacebookAPI } from '../services/socialMedia';

export const AuthCallbackPopup = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'page_selection' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallbackPopup: Starting callback handling');
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        console.log('AuthCallbackPopup: URL params:', { code, state, error });

        if (error) {
          throw new Error(`Authentication failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Determine platform from state
        let platform = '';
        if (state === 'facebook_auth') platform = 'facebook';
        else if (state === 'instagram_auth') platform = 'instagram';
        else if (state === 'twitter_auth') platform = 'twitter';
        else throw new Error('Invalid state parameter');

        console.log('AuthCallbackPopup: Detected platform:', platform);

        if (platform === 'facebook') {
          // Exchange code for token
          const tokenData = await FacebookAPI.exchangeCodeForToken(code);
          setAccessToken(tokenData.accessToken);
          
          // Get user's pages
          const userPages = await FacebookAPI.getUserPages(tokenData.accessToken);
          setPages(userPages);
          
          if (userPages.length === 0) {
            throw new Error('No Facebook pages found. Please create a Facebook page first.');
          }
          
          if (userPages.length === 1) {
            // Auto-select if only one page
            setSelectedPage(userPages[0].id);
            await handlePageSelection(userPages[0], tokenData.accessToken);
          } else {
            // Show page selection
            setStatus('page_selection');
          }
        } else {
          // For Instagram and Twitter, proceed normally
          console.log('AuthCallbackPopup: Calling SocialMediaService.handleAuthCallback for', platform);
          const account = await SocialMediaService.handleAuthCallback(platform, code);
          console.log('AuthCallbackPopup: Received account data:', account);
          
          // Send success message to parent window
          window.opener?.postMessage({
            type: 'OAUTH_SUCCESS',
            account: account
          }, window.location.origin);
          
          setStatus('success');
        }

      } catch (error) {
        console.error('AuthCallbackPopup: Auth callback error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setStatus('error');
        
        // Send error message to parent window
        window.opener?.postMessage({
          type: 'OAUTH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, window.location.origin);
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  const handlePageSelection = async (page: any, userToken: string) => {
    try {
      const account = {
        id: `fb_${page.id}`,
        platform: 'facebook' as const,
        name: page.name,
        username: page.name,
        accountId: page.id,
        accessToken: page.access_token, // Use page access token, not user token
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        isConnected: true,
        lastSync: new Date().toISOString(),
        permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'pages_manage_metadata']
      };
      
      // Send success message to parent window
      window.opener?.postMessage({
        type: 'OAUTH_SUCCESS',
        account: account
      }, window.location.origin);
      
      setStatus('success');
    } catch (error) {
      console.error('Page selection error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
      
      // Send error message to parent window
      window.opener?.postMessage({
        type: 'OAUTH_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }, window.location.origin);
    }
  };

  const handleSelectPage = () => {
    const selectedPageData = pages.find(p => p.id === selectedPage);
    if (selectedPageData && accessToken) {
      handlePageSelection(selectedPageData, accessToken);
    }
  };

  if (status === 'loading') {
    return (
      <Box p={8} textAlign="center">
        <VStack spacing={6}>
          <Spinner size="xl" color="brand.navy.500" />
          <VStack spacing={2}>
            <Heading size="md" color="brand.navy.900">Connecting your account...</Heading>
            <Text color="brand.navy.700">Please wait while we set up your social media account.</Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  if (status === 'page_selection') {
    return (
      <Box p={8}>
        <VStack spacing={6}>
          <Heading size="md" color="brand.navy.900">Select Facebook Page</Heading>
          <Text color="brand.navy.700">Choose which Facebook page you want to connect:</Text>
          
          <FormControl>
            <FormLabel color="brand.navy.700">Facebook Pages</FormLabel>
            <Select
              placeholder="Select a page"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <Button
            colorScheme="blue"
            onClick={handleSelectPage}
            isDisabled={!selectedPage}
          >
            Connect Page
          </Button>
        </VStack>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box p={8}>
        <VStack spacing={6}>
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Connection Failed!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
          <Button 
            colorScheme="blue" 
            onClick={() => window.close()}
          >
            Close
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={8} textAlign="center">
      <VStack spacing={6}>
        <Alert status="success">
          <AlertIcon />
          <Box>
            <AlertTitle>Account Connected Successfully!</AlertTitle>
            <AlertDescription>
              Your social media account has been connected and is ready to use.
            </AlertDescription>
          </Box>
        </Alert>
        <Text color="brand.navy.700">You can close this window now.</Text>
        <Button 
          colorScheme="blue" 
          onClick={() => window.close()}
        >
          Close
        </Button>
      </VStack>
    </Box>
  );
};
