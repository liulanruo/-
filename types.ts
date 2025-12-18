
export enum TreeState {
  CLUSTERED = 'CLUSTERED',
  SCATTERED = 'SCATTERED'
}

export enum Gesture {
  NONE = 'NONE',
  PALM = 'PALM',
  FIST = 'FIST'
}

export interface PhotoData {
  id: string;
  url: string;
}

export interface AppState {
  photos: PhotoData[];
  gesture: Gesture;
  treeState: TreeState;
  rotationY: number;
  isCameraOn: boolean;
  focusedPhotoId: string | null;
  currentWish: string | null;
  isPlaying: boolean;
  
  setPhotos: (photos: PhotoData[]) => void;
  setGesture: (gesture: Gesture) => void;
  setTreeState: (state: TreeState) => void;
  setRotationY: (rotation: number) => void;
  toggleCamera: () => void;
  setFocusedPhoto: (id: string | null) => void;
  setWish: (wish: string | null) => void;
  setPlaying: (playing: boolean) => void;
}
