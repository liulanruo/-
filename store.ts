
import { create } from 'zustand';
import { AppState, TreeState, Gesture, PhotoData } from './types';
import { INITIAL_PHOTOS } from './constants';

const loadPhotos = (): PhotoData[] => {
  const saved = localStorage.getItem('christmas_tree_photos');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load photos", e);
    }
  }
  return INITIAL_PHOTOS;
};

export const useStore = create<AppState>((set) => ({
  photos: loadPhotos(),
  gesture: Gesture.NONE,
  treeState: TreeState.CLUSTERED,
  rotationY: 0,
  isCameraOn: false,
  focusedPhotoId: null,
  currentWish: null,
  isPlaying: false,

  setPhotos: (photos) => {
    set({ photos });
    localStorage.setItem('christmas_tree_photos', JSON.stringify(photos));
  },
  setGesture: (gesture) => set({ gesture }),
  setTreeState: (treeState) => set({ treeState }),
  setRotationY: (rotationY) => set({ rotationY }),
  toggleCamera: () => set((state) => ({ isCameraOn: !state.isCameraOn })),
  setFocusedPhoto: (focusedPhotoId) => set({ focusedPhotoId }),
  setWish: (currentWish) => set({ currentWish }),
  setPlaying: (isPlaying) => set({ isPlaying }),
}));
