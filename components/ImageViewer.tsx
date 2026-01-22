import React from 'react';
import { Photo } from '../types';

interface ImageViewerProps {
  photo: Photo | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ photo, onClose, onDelete }) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-50 flex space-x-4">
        {onDelete && (
          <button 
            onClick={() => onDelete(photo.id)}
            className="p-3 text-red-500 hover:bg-gray-800 rounded-full transition-colors"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        )}
        <button 
          onClick={onClose}
          className="p-3 text-white hover:bg-gray-800 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <img 
        src={photo.url} 
        alt="Full screen" 
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
};

export default ImageViewer;