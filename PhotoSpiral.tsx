
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image, Text } from '@react-three/drei';
import * as THREE from 'temporary';
import * as THREE_ACTUAL from 'three';
const THREE = THREE_ACTUAL;
import { useStore } from '../store';
import { TreeState } from '../types';

const PhotoSpiral: React.FC = () => {
  const { photos, treeState, setFocusedPhoto, focusedPhotoId, rotationY } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 预计算两种状态下的布局位置
  const photoConfigs = useMemo(() => {
    return photos.map((_, i) => {
      const t = i / Math.max(photos.length - 1, 1);
      
      // 1. 聚拢模式: 螺旋缠绕
      const spiralAngle = t * Math.PI * 6; 
      const spiralHeight = t * 6.5 - 0.8; 
      const spiralRadius = (1 - t) * 2.8 + 1.2; 
      
      // 2. 散开模式: 屏幕前方扇形分布
      const cols = 5;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const totalRows = Math.ceil(photos.length / cols);
      
      const scatterPhi = (col / (cols - 1) - 0.5) * Math.PI * 0.5; 
      const scatterTheta = (row / (totalRows - 1) - 0.5) * Math.PI * 0.3; 
      const scatterDistance = 8.5; 
      
      return {
        clustered: { 
          x: Math.cos(spiralAngle) * spiralRadius, 
          y: spiralHeight, 
          z: Math.sin(spiralAngle) * spiralRadius 
        },
        scattered: { 
          x: Math.sin(scatterPhi) * Math.cos(scatterTheta) * scatterDistance,
          y: Math.sin(scatterTheta) * scatterDistance + 2.5,
          z: Math.cos(scatterPhi) * Math.cos(scatterTheta) * scatterDistance
        }
      };
    });
  }, [photos]);

  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, i) => {
      if (child.type !== 'Group') return;
      const config = photoConfigs[i];
      if (!config) return;

      const photoId = photos[i].id;
      const isFocused = focusedPhotoId === photoId;
      const isHovered = hoveredId === photoId;
      
      // 目标位置插值
      let targetPos = new THREE.Vector3(
        treeState === TreeState.CLUSTERED ? config.clustered.x : config.scattered.x,
        treeState === TreeState.CLUSTERED ? config.clustered.y : config.scattered.y,
        treeState === TreeState.CLUSTERED ? config.clustered.z : config.scattered.z
      );

      // 聚焦时，将照片从原本的位置往摄像机方向拉近一点，确保不被树体遮挡
      if (isFocused) {
        if (treeState === TreeState.CLUSTERED) {
          const pushDir = targetPos.clone().normalize();
          targetPos.add(pushDir.multiplyScalar(1.5));
        }
      }
      
      const lerpSpeed = isFocused ? 0.15 : 0.08;
      child.position.lerp(targetPos, lerpSpeed);

      // 缩放逻辑
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      const distToCamera = state.camera.position.distanceTo(worldPos);
      
      let baseScale = treeState === TreeState.CLUSTERED ? 1.0 : 1.6;
      if (isFocused) baseScale = 6.0; 
      else if (isHovered) baseScale *= 1.3;
      
      // 透视缩放补偿
      const distScale = THREE.MathUtils.clamp(14 / distToCamera, 0.5, 3.0);
      const finalScale = baseScale * (isFocused ? 1.0 : distScale);
      
      child.scale.lerp(new THREE.Vector3(finalScale, finalScale, 1), 0.1);

      // 朝向逻辑
      if (isFocused) {
        // 聚焦时锁定摄像机朝向
        const lookTarget = new THREE.Vector3();
        state.camera.getWorldPosition(lookTarget);
        child.lookAt(lookTarget);
      } else if (treeState === TreeState.CLUSTERED) {
        // 聚拢模式：向外发散
        const lookAtCenter = new THREE.Vector3(0, child.position.y, 0);
        child.lookAt(lookAtCenter);
        child.rotateY(Math.PI);
      } else {
        // 散开模式：面向全局中心点
        const lookAtCenter = new THREE.Vector3(0, 2.5, 0);
        child.lookAt(lookAtCenter);
        child.rotateY(Math.PI);
      }
    });

    // 旋转逻辑
    if (!focusedPhotoId) {
      const targetRot = treeState === TreeState.CLUSTERED ? rotationY : rotationY * 0.4;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {photos.map((photo, i) => (
        <group 
          key={photo.id} 
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!focusedPhotoId) setHoveredId(photo.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredId(null);
            document.body.style.cursor = 'default';
          }}
          onClick={(e) => {
            e.stopPropagation();
            setFocusedPhoto(focusedPhotoId === photo.id ? null : photo.id);
          }}
        >
          {/* 高级玻璃边框 */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[1.12, 1.12]} />
            <meshPhysicalMaterial 
              color={focusedPhotoId === photo.id ? "#ffd700" : "#ffffff"} 
              transparent 
              opacity={focusedPhotoId === photo.id || hoveredId === photo.id ? 0.95 : 0.3} 
              metalness={0.9}
              roughness={0.05}
              transmission={0.4}
              thickness={0.1}
              emissive={focusedPhotoId === photo.id ? "#ffd700" : "#ffffff"}
              emissiveIntensity={focusedPhotoId === photo.id ? 0.8 : 0}
            />
          </mesh>
          
          {/* Fix: Removed depthTest prop as it is not supported by @react-three/drei Image component */}
          <Image 
            url={photo.url} 
            transparent 
            side={THREE.DoubleSide}
            renderOrder={focusedPhotoId === photo.id ? 1000 : 10}
          />
          
          {focusedPhotoId === photo.id && (
             <Text
               position={[0, -0.72, 0.1]}
               fontSize={0.12}
               color="white"
               anchorY="top"
               font="https://fonts.gstatic.com/s/notoserifsc/v23/3ia9v8vXW_S6W1iV6K-P-S2W.woff"
               outlineWidth={0.02}
               outlineColor="#000000"
             >
               这段记忆，永远留在圣诞树上
             </Text>
          )}
        </group>
      ))}
    </group>
  );
};

export default PhotoSpiral;
