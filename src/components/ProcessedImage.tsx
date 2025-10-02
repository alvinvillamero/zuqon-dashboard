import React from 'react';
import { Image, ImageProps } from '@chakra-ui/react';

interface ProcessedImageProps extends ImageProps {
  // Since images are now stored as Airtable attachments, 
  // they provide permanent URLs and don't need processing
}

export const ProcessedImage: React.FC<ProcessedImageProps> = ({
  ...imageProps
}) => {
  // With Airtable attachments, images are permanent and don't need processing
  return <Image {...imageProps} />;
};
