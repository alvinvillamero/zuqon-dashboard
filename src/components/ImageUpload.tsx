import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Image,
  Badge
} from '@chakra-ui/react';
import { FiUpload, FiX, FiImage, FiCheck } from 'react-icons/fi';
import { validateImageFile, fileToDataUrl, resizeImage } from '../services/graphics';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, fileName: string) => void;
  onCancel?: () => void;
  isUploading?: boolean;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onCancel,
  isUploading = false,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      // Create preview
      const preview = await fileToDataUrl(file);
      setPreviewUrl(preview);
      setFileName(file.name);

      // Resize image for better performance
      const resizedBlob = await resizeImage(file, 1024, 1024, 0.8);
      const resizedUrl = await fileToDataUrl(resizedBlob);
      
      onImageUpload(resizedUrl, file.name);
    } catch (err) {
      setError('Failed to process image');
      console.error('Image processing error:', err);
    }
  };

  const clearFile = () => {
    setPreviewUrl(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Upload Area */}
      <Box
        border="2px dashed"
        borderColor={dragActive ? "brand.navy.500" : "gray.300"}
        borderRadius="lg"
        p={8}
        textAlign="center"
        bg={dragActive ? "brand.navy.50" : "gray.50"}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          borderColor: "brand.navy.400",
          bg: "brand.navy.25"
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <VStack spacing={3}>
          <Icon as={FiUpload} boxSize={8} color="brand.navy.500" />
          <Text color="brand.navy.700" fontWeight="medium">
            Drop your image here or click to browse
          </Text>
          <Text fontSize="sm" color="brand.navy.600">
            Supports JPEG, PNG, GIF, WebP (max {maxSize}MB)
          </Text>
        </VStack>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Error Display */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {previewUrl && fileName && (
        <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="white">
          <VStack spacing={3}>
            <HStack justify="space-between" w="full">
              <HStack spacing={2}>
                <Icon as={FiImage} color="brand.navy.500" />
                <Text fontSize="sm" color="brand.navy.700" fontWeight="medium">
                  {fileName}
                </Text>
                <Badge colorScheme="green" variant="subtle">
                  <Icon as={FiCheck} mr={1} />
                  Ready
                </Badge>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Icon as={FiX} />}
                onClick={clearFile}
                color="gray.500"
                _hover={{ color: "red.500" }}
              >
                Remove
              </Button>
            </HStack>
            
            <Image
              src={previewUrl}
              alt="Preview"
              maxH="200px"
              maxW="100%"
              objectFit="contain"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            />
          </VStack>
        </Box>
      )}

      {/* Action Buttons */}
      <HStack justify="flex-end" spacing={3}>
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            isDisabled={isUploading}
          >
            Cancel
          </Button>
        )}
        <Button
          colorScheme="brand.navy"
          leftIcon={isUploading ? <Spinner size="sm" /> : <Icon as={FiUpload} />}
          onClick={openFileDialog}
          isDisabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
        </Button>
      </HStack>
    </VStack>
  );
};

