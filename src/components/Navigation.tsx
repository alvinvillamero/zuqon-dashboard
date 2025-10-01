import { Box, VStack, Text, Icon, Link, Flex, Heading } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBookOpen, FiZap, FiSettings, FiSend } from 'react-icons/fi';

export const Navigation = () => {
  const navItems = [
    { name: 'Dashboard', icon: FiHome, path: '/' },
    { name: 'Articles', icon: FiBookOpen, path: '/articles' },
    { name: 'Generate Content', icon: FiZap, path: '/generate' },
    { name: 'To Publish', icon: FiSend, path: '/publish' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      h="100vh"
      w="250px"
      bg="brand.navy.500"
      color="white"
      p={4}
      borderRight="1px"
      borderColor="brand.navy.600"
      zIndex="sticky"
    >
      <VStack align="stretch" h="full" spacing={8}>
        {/* Logo */}
        <Flex align="center" justify="flex-start" py={4}>
          <Heading
            size="lg"
            bgGradient="linear(to-r, brand.orange.500, brand.orange.300)"
            bgClip="text"
            fontWeight="bold"
            letterSpacing="tight"
          >
            ZUQON <Text as="span" color="white">AI</Text>
          </Heading>
        </Flex>

        {/* Navigation Links */}
        <VStack align="stretch" spacing={2}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end
              style={({ isActive }) => ({
                display: 'block',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <Flex
                  align="center"
                  px={4}
                  py={3}
                  borderRadius="md"
                  transition="all 0.2s"
                  bg={isActive ? 'brand.navy.600' : 'transparent'}
                  color={isActive ? 'brand.orange.500' : 'white'}
                  _hover={{
                    bg: 'brand.navy.600',
                    color: isActive ? 'brand.orange.500' : 'brand.orange.300',
                  }}
                >
                  <Icon as={item.icon} boxSize={5} mr={4} />
                  <Text fontSize="md">{item.name}</Text>
                </Flex>
              )}
            </NavLink>
          ))}
        </VStack>

        {/* Footer */}
        <Box mt="auto" pt={8} borderTop="1px" borderColor="brand.navy.600">
          <Text fontSize="sm" color="whiteAlpha.600" textAlign="center">
            Zuqon AI © {new Date().getFullYear()}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};