import React from 'react';
import { Photo } from '../types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoClick }) => {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>No photos yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 pb-20">
      {photos.map((photo) => (
        <div 
          key={photo.id} 
          className="relative aspect-square cursor-pointer overflow-hidden bg-gray-800"
          onClick={() => onPhotoClick(photo)}
        >
          <img 
            src={photo.url} 
            alt="Gallery item" 
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;