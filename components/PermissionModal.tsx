import React from 'react';

interface PermissionModalProps {
  onAllow: () => void;
  onDeny: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ onAllow, onDeny }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="bg-[#2d2d2d] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Icon / Graphic */}
        <div className="pt-8 pb-4 flex justify-center text-android-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        </div>

        {/* Text Content */}
        <div className="px-6 text-center">
          <h2 className="text-lg font-medium text-white mb-2">
            Allow Gallery to access photos and media on your device?
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Gallery needs access to your photos to display them and provide secure vault functionality.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col border-t border-gray-700">
          <button 
            onClick={onAllow}
            className="py-4 text-android-primary font-medium active:bg-white/5 transition-colors"
          >
            Allow access
          </button>
          <button 
            onClick={onDeny}
            className="py-4 text-gray-400 font-medium active:bg-white/5 transition-colors border-t border-gray-700"
          >
            Don't allow
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;