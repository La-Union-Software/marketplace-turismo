'use client';

import { usePostImages } from '@/hooks/usePostImages';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PostImagesProps {
  postId: string;
  className?: string;
  showMainImageOnly?: boolean;
  showGallery?: boolean;
}

export default function PostImages({ 
  postId, 
  className = '', 
  showMainImageOnly = false,
  showGallery = true 
}: PostImagesProps) {
  const { images, loading, error } = usePostImages(postId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brown"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-red-500">Error loading images: {error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No images available</p>
      </div>
    );
  }

  const displayImages = showMainImageOnly ? [images[0]] : images;

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const openFullscreen = (index: number) => {
    setSelectedImageIndex(index);
    setShowFullscreen(true);
  };

  const closeFullscreen = () => {
    setShowFullscreen(false);
  };

  return (
    <>
      <div className={`space-y-4 ${className} overflow-hidden`}>
        {/* Main Image Display */}
        <div className="relative">
          <img
            src={displayImages[selectedImageIndex]?.data}
            alt={`Post image ${selectedImageIndex + 1}`}
            className="w-full h-64 object-cover rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
            onClick={() => showGallery && openFullscreen(selectedImageIndex)}
          />
          
          {/* Navigation arrows for multiple images */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {displayImages.length > 1 && !showMainImageOnly && (
          <div className="grid grid-cols-4 gap-2">
            {displayImages.map((image, index) => (
              <img
                key={image.id}
                src={image.data}
                alt={`Thumbnail ${index + 1}`}
                className={`w-full h-16 object-cover rounded cursor-pointer border-2 transition-all ${
                  index === selectedImageIndex
                    ? 'border-primary-brown'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-brown/50'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={displayImages[selectedImageIndex]?.data}
              alt={`Fullscreen image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation in fullscreen */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
