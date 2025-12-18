
import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { Gesture, TreeState } from '../types';

const HandDetector: React.FC = () => {
  const { isCameraOn, setGesture, setTreeState, setRotationY } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      // Fix: landmarkerRef.ref is incorrect React ref usage, must be landmarkerRef.current
      landmarkerRef.current = landmarker;
    };
    init();
  }, []);

  useEffect(() => {
    if (!isCameraOn) {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          detect();
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    const detect = () => {
      // Fix: Access landmarker via landmarkerRef.current
      if (videoRef.current && landmarkerRef.current) {
        const startTimeMs = performance.now();
        const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Detect gesture: distance between thumb tip and index tip vs other fingers
          // Simple logic: if distance is small -> FIST, if large -> PALM
          const yDist = Math.abs(landmarks[8].y - landmarks[0].y);
          const xPos = landmarks[0].x; // 0 is palm base

          if (yDist < 0.3) {
            setGesture(Gesture.FIST);
            setTreeState(TreeState.CLUSTERED);
          } else {
            setGesture(Gesture.PALM);
            setTreeState(TreeState.SCATTERED);
          }

          // X position controls rotation (normalized 0 to 1)
          const rotationFactor = (xPos - 0.5) * Math.PI * 2;
          setRotationY(rotationFactor);
        } else {
          setGesture(Gesture.NONE);
        }
      }
      rafRef.current = requestAnimationFrame(detect);
    };

    startCamera();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isCameraOn, setGesture, setTreeState, setRotationY]);

  return (
    <div className={`fixed top-4 left-4 z-50 transition-all duration-500 overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl ${isCameraOn ? 'w-48 h-36 opacity-100' : 'w-0 h-0 opacity-0'}`}>
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
      <div className="absolute bottom-1 right-1 bg-black/50 px-2 py-0.5 rounded text-[10px]">
        手势检测激活
      </div>
    </div>
  );
};

export default HandDetector;
