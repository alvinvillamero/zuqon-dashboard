import React, { useState, useEffect } from 'react';
import { Image, ImageProps, Spinner, Box } from '@chakra-ui/react';
import { processImageUrlAsync, isDalleUrlExpired } from '../services/graphics';

interface ProcessedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  contentId?: string;
  onImageProcessed?: (newUrl: string) => void;
}

export const ProcessedImage: React.FC<ProcessedImageProps> = ({
  src,
  contentId,
  onImageProcessed,
  ...imageProps
}) => {
  const [processedSrc, setProcessedSrc] = useState<string>(src);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processImage = async () => {
      // If it's an expired DALL-E URL and we have a contentId, process it
      if (isDalleUrlExpired(src) && contentId) {
        setIsProcessing(true);
        try {
          const newUrl = await processImageUrlAsync(src, contentId);
          setProcessedSrc(newUrl);
          onImageProcessed?.(newUrl);
        } catch (error) {
          console.error('Error processing image:', error);
        } finally {
          setIsProcessing(false);
        }
      } else {
        // For non-expired URLs, just use the original
        setProcessedSrc(src);
      }
    };

    processImage();
  }, [src, contentId, onImageProcessed]);

  if (isProcessing) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="200px"
        bg="gray.100"
        borderRadius="md"
        {...imageProps}
      >
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return <Image src={processedSrc} {...imageProps} />;
};
