
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PhotoGrid from './components/PhotoGrid';
import ImageViewer from './components/ImageViewer';
import PermissionModal from './components/PermissionModal';
import useLongPress from './hooks/useLongPress';
import { useShakeDetector } from './hooks/useShakeDetector';
import { useMultiTouchGesture } from './hooks/useMultiTouchGesture';
import { AppMode, Photo } from './types';
import { getAllPhotos, savePhoto, savePhotos, deletePhoto } from './services/storage';

// Default photos to show if device is empty or permission not yet used
const DECOY_DEFAULTS: Photo[] = [
  { id: 'd1', url: 'https://picsum.photos/id/11/800/800', timestamp: 1, isPrivate: false },
  { id: 'd2', url: 'https://picsum.photos/id/15/800/800', timestamp: 2, isPrivate: false },
];

// Removed invalid module augmentation for 'react' to fix compile error.
// Directory attributes will be handled via property spreading to avoid type conflicts.

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DECOY);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const singleInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const decoyImportRef = useRef<HTMLInputElement>(null);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  // --- Initial Setup ---
  useEffect(() => {
    const permStatus = localStorage.getItem('stealth_gallery_permission');
    if (!permStatus) {
      setTimeout(() => setShowPermissionModal(true), 1000);
    } else {
      loadPhotos();
    }
  }, []);

  const loadPhotos = async () => {
    try {
      const photos = await getAllPhotos();
      setAllPhotos(photos);
    } catch (error) {
      console.error("Storage error", error);
    }
  };

  // --- Real Mode Unlock Logic ---
  const switchToRealMode = useCallback(() => {
    if (mode === AppMode.REAL) return;
    vibrate([100, 50, 100]);
    setMode(AppMode.REAL);
  }, [mode, vibrate]);

  const lockApp = useCallback(() => {
    setMode(prev => {
      if (prev === AppMode.REAL) {
        setSelectedPhoto(null);
        return AppMode.DECOY;
      }
      return prev;
    });
  }, []);

  // --- Native Permission Simulation ---
  const handlePermissionAllow = () => {
    setShowPermissionModal(false);
    // Trigger directory picker (This is where the user selects their DCIM/Camera folder)
    decoyImportRef.current?.click();
  };

  const handleDecoyFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsScanning(true);
      setScanProgress(0);
      localStorage.setItem('stealth_gallery_permission', 'granted');

      const newPhotos: Photo[] = [];
      const timestamp = Date.now();
      // Explicitly cast Array.from result to File[] to fix 'unknown' type errors
      const imageFiles = (Array.from(files) as File[]).filter(f => f.type.startsWith('image/')).slice(0, 150); 

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const p = new Promise<Photo>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: `pub_${timestamp}_${i}`,
              url: reader.result as string,
              // file is now correctly typed as File
              timestamp: file.lastModified || (timestamp - i),
              isPrivate: false 
            });
          };
          reader.readAsDataURL(file);
        });
        newPhotos.push(await p);
        setScanProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      await savePhotos(newPhotos);
      await loadPhotos();
      
      setTimeout(() => {
        setIsScanning(false);
        vibrate(100);
      }, 500);
    } else {
      setShowPermissionModal(false);
    }
  };

  // --- Security: Auto Lock ---
  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) lockApp(); };
    const handleBlur = () => { if (!isScanning) lockApp(); };
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [lockApp, isScanning]);

  // --- Long Press Logic ---
  const longPressHandlers = useLongPress(switchToRealMode, {
    threshold: 2500,
    onStart: () => setLongPressActive(true),
    onFinish: () => setLongPressActive(false),
    onCancel: () => setLongPressActive(false),
  });

  useShakeDetector(switchToRealMode, mode === AppMode.DECOY);
  useMultiTouchGesture(switchToRealMode, mode === AppMode.DECOY);

  // --- CRUD (Real Mode Only) ---
  const handleAddPrivate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (mode !== AppMode.REAL || !event.target.files?.[0]) return;
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      await savePhoto({
        id: crypto.randomUUID(),
        url: reader.result as string,
        timestamp: Date.now(),
        isPrivate: true
      });
      loadPhotos();
      vibrate(50);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    if (mode === AppMode.REAL && window.confirm("Delete permanently?")) {
      await deletePhoto(id);
      setSelectedPhoto(null);
      loadPhotos();
    }
  };

  // Filtering
  const privatePhotos = allPhotos.filter(p => p.isPrivate);
  const publicPhotos = allPhotos.filter(p => !p.isPrivate);
  const displayPhotos = mode === AppMode.REAL ? privatePhotos : (publicPhotos.length > 0 ? publicPhotos : DECOY_DEFAULTS);

  return (
    <div className="min-h-screen bg-android-bg text-gray-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Hidden Native Access Point */}
      {/* Used spread with any cast to handle non-standard directory attributes */}
      <input 
        type="file" 
        ref={decoyImportRef} 
        onChange={handleDecoyFolderSelect} 
        className="hidden" 
        {...({ webkitdirectory: "", directory: "" } as any)} 
        multiple 
      />
      <input type="file" ref={singleInputRef} onChange={handleAddPrivate} className="hidden" accept="image/*" />
      <input type="file" ref={bulkInputRef} onChange={handleAddPrivate} className="hidden" accept="image/*" multiple />

      {showPermissionModal && <PermissionModal onAllow={handlePermissionAllow} onDeny={() => setShowPermissionModal(false)} />}

      {/* Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-5 py-4 shadow-lg transition-all duration-500 ${mode === AppMode.REAL ? 'bg-red-950/20 border-b border-red-500/20' : 'bg-android-surface'}`}>
        <div {...longPressHandlers} className="flex flex-col">
          <h1 className={`text-xl font-bold tracking-tight transition-colors duration-700 ${longPressActive ? 'text-android-primary scale-95' : 'text-white'}`}>
            Gallery
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            {mode === AppMode.REAL ? 'Vault Locked' : 'All Media'}
          </p>
        </div>
        
        {mode === AppMode.REAL && (
          <button onClick={lockApp} className="p-2 bg-white/5 rounded-full text-red-400 active:scale-90 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {isScanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-android-bg z-50 p-10">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-android-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-android-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-android-primary mb-2">Indexing Media...</h3>
            <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-android-primary h-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-4">{scanProgress}% completed</p>
          </div>
        ) : (
          <>
            <PhotoGrid photos={displayPhotos} onPhotoClick={setSelectedPhoto} />
            {mode === AppMode.REAL && displayPhotos.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-32 text-gray-600">
                <div className="p-6 bg-white/5 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <p className="text-sm">No private items yet</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Buttons (REAL MODE ONLY) */}
      {mode === AppMode.REAL && !isScanning && (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col space-y-4">
          <button 
            onClick={() => singleInputRef.current?.click()}
            className="w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      )}

      {/* Full Screen Viewer */}
      <ImageViewer 
        photo={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
        onDelete={mode === AppMode.REAL ? handleDelete : undefined}
      />

    </div>
  );
};

export default App;
