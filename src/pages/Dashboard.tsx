import { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  Text,
  Heading,
  VStack,
  HStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiBookOpen, FiZap, FiClock, FiTrendingUp } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { getArticles, getGeneratedContent } from '../services/airtable';

export const Dashboard = () => {
  const toast = useToast();

  // Fetch articles
  const { data: articles = [] } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  // Fetch generated content
  const { data: generatedContent = [] } = useQuery({
    queryKey: ['generatedContent'],
    queryFn: getGeneratedContent,
  });

  // Calculate statistics
  const totalArticles = articles.length;
  const newToday = articles.filter(article => {
    const articleDate = new Date(article.dateFetched);
    const today = new Date();
    return articleDate.toDateString() === today.toDateString();
  }).length;

  const totalGenerated = generatedContent.length;
  const pendingGeneration = totalArticles - totalGenerated;
  const generationRate = totalArticles > 0 ? Math.round((totalGenerated / totalArticles) * 100) : 0;

  // Format current time
  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        {/* Statistics Grid */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          <Card bg="white" shadow="sm">
            <CardBody>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={FiBookOpen} color="brand.navy.500" boxSize={5} />
                  <Text color="gray.600">Total Articles</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="brand.navy.500">
                  {totalArticles}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {newToday} new today
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="white" shadow="sm">
            <CardBody>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={FiZap} color="brand.navy.500" boxSize={5} />
                  <Text color="gray.600">Generated Content</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="brand.navy.500">
                  {totalGenerated}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {pendingGeneration} pending
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="white" shadow="sm">
            <CardBody>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={FiClock} color="brand.navy.500" boxSize={5} />
                  <Text color="gray.600">Last Update</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="brand.navy.500">
                  {formattedTime}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Today
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="white" shadow="sm">
            <CardBody>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={FiTrendingUp} color="brand.navy.500" boxSize={5} />
                  <Text color="gray.600">Generation Rate</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="brand.navy.500">
                  {generationRate}%
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Of total articles
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Recent Articles */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="brand.navy.500">Recent Articles</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>TITLE</Th>
                    <Th>SOURCE</Th>
                    <Th>DATE</Th>
                    <Th>STATUS</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {articles.slice(0, 5).map((article) => (
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
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};