
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { WISHES, MAX_PHOTOS, MUSIC_URL, MUSIC_TITLE } from '../constants';
import { PhotoData } from '../types';

const UIOverlay: React.FC = () => {
  const { 
    photos, setPhotos, isCameraOn, toggleCamera, gesture, 
    currentWish, setWish, focusedPhotoId, setFocusedPhoto,
    isPlaying, setPlaying
  } = useStore();
  
  const [showUploader, setShowUploader] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const getWish = () => {
    const randomWish = WISHES[Math.floor(Math.random() * WISHES.length)];
    setWish(randomWish);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, MAX_PHOTOS - photos.length);
    
    const newPhotosPromises = files.map((file) => {
      return new Promise<PhotoData>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: reader.result as string 
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newPhotos = await Promise.all(newPhotosPromises);
    setPhotos([...photos, ...newPhotos].slice(0, MAX_PHOTOS));
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // If we are currently playing, wait for the previous play request to finish before pausing
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // Start playing and store the promise
      try {
        playPromiseRef.current = audioRef.current.play();
        await playPromiseRef.current;
        setPlaying(true);
      } catch (err) {
        console.error("Audio playback failed:", err);
        setPlaying(false);
      } finally {
        playPromiseRef.current = null;
      }
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none flex flex-col items-center justify-between p-8 z-40 transition-all duration-700 ${focusedPhotoId ? 'bg-black/40 backdrop-blur-sm' : ''}`}>
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={MUSIC_URL} loop preload="auto" />

      {/* 圣诞文案背景 */}
      <div className={`absolute inset-0 flex flex-col items-start justify-center pl-12 md:pl-24 opacity-30 select-none transition-opacity duration-1000 ${focusedPhotoId ? 'opacity-0' : 'opacity-30'}`}>
        <h1 className="text-5xl md:text-8xl font-cursive text-white drop-shadow-[0_0_40px_rgba(255,215,0,0.5)] tracking-tight leading-[0.85]">
          Merry <br /> 
          Christmas
        </h1>
        <div className="mt-16 py-2">
          <p className="text-xl md:text-4xl font-handwriting text-white drop-shadow-md text-left">
            To LS —— <br className="md:hidden" />
            愿每一片雪都温柔落在你肩上
          </p>
        </div>
      </div>

      {/* 顶部: 手势状态 */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl min-w-[180px] group transition-all">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
            <h2 className="text-emerald-300 font-bold tracking-widest text-[10px] uppercase font-mono">交互状态</h2>
          </div>
          <p className="text-white text-xl font-light">
            {gesture === 'PALM' ? '👐 散开树体' : gesture === 'FIST' ? '✊ 聚拢树体' : '👋 等待手势'}
          </p>
        </div>
        
        {focusedPhotoId && (
          <button 
            onClick={() => setFocusedPhoto(null)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-xl px-6 py-3 rounded-full text-white font-bold tracking-widest uppercase text-xs border border-white/20 transition-all pointer-events-auto"
          >
            返回树下 ✕
          </button>
        )}
      </div>

      {/* 祝福弹窗 */}
      {currentWish && (
        <div className="pointer-events-auto fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl transform transition-all border border-white/50 relative">
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">🎁</div>
               <div className="space-y-2">
                 <h3 className="text-pink-400 font-bold uppercase tracking-[0.2em] text-xs font-mono">圣诞祝福</h3>
                 <p className="text-neutral-800 text-3xl font-handwriting leading-relaxed">{currentWish}</p>
               </div>
               <button 
                 onClick={() => setWish(null)}
                 className="bg-neutral-900 text-pink-50 px-10 py-3 rounded-full font-bold hover:bg-neutral-800 transition-all shadow-xl uppercase tracking-widest text-xs"
               >
                 收下这份温暖
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部控制栏 */}
      <div className={`w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 pointer-events-auto transition-opacity duration-500 ${focusedPhotoId ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        
        {/* Left: Action Buttons */}
        <div className="flex items-center space-x-6 bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/10 shadow-2xl">
           <button onClick={() => setShowUploader(!showUploader)} className="w-16 h-16 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group">
             <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
           </button>
           <div className="w-px h-8 bg-white/10" />
           <button onClick={toggleCamera} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group ${isCameraOn ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10'}`}>
             <span className={`text-2xl group-hover:scale-110 transition-transform ${isCameraOn ? 'animate-pulse' : ''}`}>📷</span>
           </button>
           <div className="w-px h-8 bg-white/10" />
           <button onClick={getWish} className="w-16 h-16 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group">
             <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
           </button>
        </div>

        {/* Center: Music Player */}
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-white/5 backdrop-blur-3xl px-10 py-4 rounded-full border border-white/10 shadow-2xl flex items-center space-x-6 min-w-[340px]">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400/20 to-pink-400/20 flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'animate-spin-slow' : 'opacity-50'}`}>
               <span className="text-2xl">❄️</span>
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="whitespace-nowrap animate-scroll text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-100/80 font-mono">
                 {MUSIC_TITLE}
               </div>
            </div>
            <button 
              onClick={togglePlay}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-emerald-400 text-black shadow-emerald-400/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
          <div className={`h-1 rounded-full transition-all duration-1000 ${isPlaying ? 'w-48 bg-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.6)] pulse-glow' : 'w-12 bg-white/10'}`} />
        </div>

        {/* Right: Spacer for balance */}
        <div className="hidden md:block w-48" />

        {/* 上传面板 */}
        {showUploader && (
          <div className="absolute bottom-28 left-8 bg-black/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] shadow-2xl animate-fade-in w-80">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-sm tracking-widest uppercase font-mono">记忆相册</h3>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/40 font-mono">{photos.length}/20</span>
            </div>
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-emerald-400/40 transition-all group">
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📤</span>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-mono">选择并保存照片</span>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <div className="mt-6 grid grid-cols-4 gap-3 max-h-40 overflow-y-auto pr-2">
               {photos.map(p => (
                 <div key={p.id} className="relative aspect-square group">
                    <img src={p.url} className="w-full h-full object-cover rounded-xl border border-white/10 group-hover:border-emerald-400 transition-all" alt="thumb" />
                    <button 
                      onClick={() => setPhotos(photos.filter(ph => ph.id !== p.id))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-[8px] flex items-center justify-center"
                    >✕</button>
                 </div>
               ))}
            </div>
            <button onClick={() => setShowUploader(false)} className="mt-6 w-full py-2 text-[10px] font-bold text-white/20 hover:text-white transition-colors tracking-[0.5em] uppercase font-mono">关闭面板</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-scroll { animation: scroll 20s linear infinite; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default UIOverlay;
