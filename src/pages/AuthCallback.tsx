import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, VStack, Heading, Text, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Button } from '@chakra-ui/react';
import { SocialMediaService } from '../services/socialMedia';
import { saveSocialAccount } from '../services/socialAccountsLocal';
import { useToast } from '@chakra-ui/react';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

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

        // Exchange code for token and get account info
        const account = await SocialMediaService.handleAuthCallback(platform, code);
        
        // Save account to Airtable
        await saveSocialAccount(account);

        setStatus('success');
        
        toast({
          title: 'Account connected successfully!',
          description: `Your ${platform} account "${account.name}" has been connected.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Redirect to ToPublish page after 2 seconds
        setTimeout(() => {
          navigate('/publish');
        }, 2000);

      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setStatus('error');
        
        toast({
          title: 'Connection failed',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

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
            onClick={() => navigate('/publish')}
          >
            Return to To Publish
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
        <Text color="brand.navy.700">Redirecting to To Publish page...</Text>
      </VStack>
    </Box>
  );
};
