import { ChakraProvider, Box, Container, useToast } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Articles } from './pages/Articles';
import { ContentGeneration } from './pages/ContentGeneration';
import { ToPublish } from './pages/ToPublish';
import { Settings } from './pages/Settings';
import { AuthCallbackPopup } from './pages/AuthCallbackPopup';
import { ErrorBoundary } from './components/ErrorBoundary';

// Services
import { testAirtableConnection, verifyEnhancedPrompt } from './services/airtable';

// Theme
import theme from './theme';

// React hooks
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const toast = useToast();

  useEffect(() => {
    // Test Airtable connection on startup
    const checkConnection = async () => {
      try {
        const isConnected = await testAirtableConnection();
        console.log('Airtable connection test:', isConnected ? 'Success' : 'Failed');
        
        if (isConnected) {
          // Verify prompt existence
          await verifyEnhancedPrompt();
        } else {
          toast({
            title: 'Airtable Connection Failed',
            description: 'Please check your Airtable API key and configuration',
            status: 'error',
            duration: 10000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error testing Airtable connection:', error);
        toast({
          title: 'Airtable Connection Error',
          description: 'Failed to test connection. Please check your configuration.',
          status: 'error',
          duration: 10000,
          isClosable: true,
        });
      }
    };

    checkConnection();
  }, [toast]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Router>
            <Box minH="100vh" bg="gray.50">
              {/* Left Sidebar */}
              <Navigation />
              
              {/* Main Content */}
              <Box
                as="main"
                ml={{ base: 0, md: "250px" }}
                p={4}
                transition="margin 0.3s"
              >
                <Container maxW="container.xl">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="/generate" element={
                      <ErrorBoundary>
                        <ContentGeneration />
                      </ErrorBoundary>
                    } />
                    <Route path="/publish" element={
                      <ErrorBoundary>
                        <ToPublish />
                      </ErrorBoundary>
                    } />
                    <Route path="/auth/:platform/callback" element={
                      <ErrorBoundary>
                        <AuthCallbackPopup />
                      </ErrorBoundary>
                    } />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Container>
              </Box>
            </Box>
          </Router>
        </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;