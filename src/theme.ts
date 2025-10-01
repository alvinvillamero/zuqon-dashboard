import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      navy: {
        50: '#E6E8F0',
        100: '#BEC3D9',
        200: '#939BC0',
        300: '#6974A6',
        400: '#4C558C',
        500: '#1E2B5E', // Primary navy
        600: '#182248',
        700: '#121A37',
        800: '#0C1225',
        900: '#060914',
      },
      orange: {
        50: '#FFF0E6',
        100: '#FFD6B8',
        200: '#FFBA8A',
        300: '#FF9D5C',
        400: '#FF842E',
        500: '#FF6B00', // Primary orange
        600: '#CC5500',
        700: '#994000',
        800: '#662B00',
        900: '#331500',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.navy.500',
          color: 'white',
          _hover: { bg: 'brand.navy.600' },
          _active: { bg: 'brand.navy.700' },
          _disabled: {
            bg: 'gray.300',
            _hover: { bg: 'gray.300' },
          },
        },
        outline: {
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'brand.navy.500',
          color: 'brand.navy.500',
          _hover: {
            bg: 'brand.navy.50',
          },
        },
        ghost: {
          color: 'brand.navy.500',
          _hover: {
            bg: 'brand.navy.50',
          },
        },
        link: {
          color: 'brand.orange.500',
          _hover: {
            color: 'brand.orange.600',
            textDecoration: 'none',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
        colorScheme: 'brand.navy',
      },
    },
    IconButton: {
      baseStyle: {
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.navy.500',
          color: 'white',
          _hover: { bg: 'brand.navy.600' },
          _active: { bg: 'brand.navy.700' },
        },
        outline: {
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'brand.navy.500',
          color: 'brand.navy.500',
          _hover: {
            bg: 'brand.navy.50',
          },
        },
        ghost: {
          color: 'brand.navy.500',
          _hover: {
            bg: 'brand.navy.50',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
        colorScheme: 'brand.navy',
      },
    },
    Select: {
      baseStyle: {
        field: {
          bg: 'brand.navy.500',
          color: 'white',
          borderColor: 'brand.navy.500',
          _hover: {
            borderColor: 'brand.navy.600',
            bg: 'brand.navy.600',
          },
          _focus: {
            borderColor: 'brand.navy.600',
            boxShadow: 'none',
          },
          _placeholder: {
            color: 'white',
          },
        },
        icon: {
          color: 'white',
        },
      },
      variants: {
        filled: {
          field: {
            bg: 'brand.navy.500',
            color: 'white',
            _hover: {
              bg: 'brand.navy.600',
            },
            _focus: {
              bg: 'brand.navy.500',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Link: {
      baseStyle: {
        color: 'brand.orange.500',
        _hover: {
          color: 'brand.orange.600',
          textDecoration: 'none',
        },
      },
    },
    Icon: {
      defaultProps: {
        color: 'current',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'brand.navy.500',
      },
    },
  },
});

export default theme;