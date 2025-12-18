
import React, { useEffect } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import HandDetector from './components/HandDetector';
import { useStore } from './store';
import { INITIAL_PHOTOS } from './constants';

const App: React.FC = () => {
  const setPhotos = useStore(state => state.setPhotos);

  useEffect(() => {
    // Initial photos
    setPhotos(INITIAL_PHOTOS);
  }, [setPhotos]);

  return (
    <div className="relative w-full h-screen">
      <Scene />
      <UIOverlay />
      <HandDetector />
      
      {/* Loading Overlay */}
      <div className="absolute inset-0 bg-black z-[100] flex items-center justify-center transition-opacity duration-1000 pointer-events-none opacity-0">
        <div className="text-center">
           <div className="w-16 h-16 border-4 border-white/20 border-t-pink-400 rounded-full animate-spin mx-auto mb-4" />
           <p className="text-white/60 tracking-widest text-sm">正在布置专属圣诞树...</p>
        </div>
      </div>
    </div>
  );
};

export default App;
