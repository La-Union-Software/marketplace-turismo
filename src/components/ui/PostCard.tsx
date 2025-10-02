'use client';

import { BasePost } from '@/types';
import PostImages from './PostImages';
import { MapPin, Calendar } from 'lucide-react';
import { formatAddressForDisplay } from '@/lib/utils';

interface PostCardProps {
  post: BasePost;
  className?: string;
  showImages?: boolean;
  isGridView?: boolean;
}

export default function PostCard({ post, className = '', showImages = true, isGridView = false }: PostCardProps) {
  return (
    <div className={`glass rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${isGridView ? 'w-full max-w-sm' : ''} ${className}`}>
      {/* Images */}
      {showImages && (
        <div className="mb-4">
          <PostImages 
            postId={post.id} 
            className="w-full"
            showMainImageOnly={true}
            showGallery={false}
            aspectRatio={isGridView ? 'square' : 'tall'}
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {post.description}
          </p>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{formatAddressForDisplay(post.location)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Desde ${post.price}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {post.category}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            post.status === 'published' || post.status === 'approved'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : post.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {post.status === 'published' || post.status === 'approved' ? 'Activo' : 
             post.status === 'pending' ? 'Pendiente' : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
}
