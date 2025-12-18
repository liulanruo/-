
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette, Noise, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import Tree from './Tree';
import PhotoSpiral from './PhotoSpiral';
import { useStore } from '../store';

const CameraController: React.FC = () => {
  const { focusedPhotoId, photos } = useStore();
  const { camera, scene } = useThree();
  
  const defaultPos = new THREE.Vector3(0, 2, 16);
  const defaultTarget = new THREE.Vector3(0, 0, 0);
  const currentTarget = useRef(new THREE.Vector3().copy(defaultTarget));

  useFrame(() => {
    if (focusedPhotoId) {
      const photoIdx = photos.findIndex(p => p.id === focusedPhotoId);
      
      const spiralGroup = scene.children.find(c => 
        c.type === 'Group' && c.children.some(cc => cc.type === 'Group' && cc.children.length > 0)
      );
      
      const photoGroup = spiralGroup?.children[photoIdx];
      
      if (photoGroup) {
        const worldPos = new THREE.Vector3();
        photoGroup.getWorldPosition(worldPos);
        
        // 计算相机目标位置：在照片正前方 5.5 个单位
        const offsetDist = 5.5; 
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(photoGroup.quaternion);
        
        const targetCamPos = worldPos.clone().add(forward.multiplyScalar(offsetDist));
        
        camera.position.lerp(targetCamPos, 0.1);
        currentTarget.current.lerp(worldPos, 0.1);
        camera.lookAt(currentTarget.current);
      }
    } else {
      camera.position.lerp(defaultPos, 0.05);
      currentTarget.current.lerp(defaultTarget, 0.05);
      camera.lookAt(currentTarget.current);
    }
  });

  return null;
};

const Scene: React.FC = () => {
  const focusedPhotoId = useStore(state => state.focusedPhotoId);
  const orbitRef = useRef<any>(null);

  return (
    <div className="w-full h-screen bg-black">
      <Canvas 
        shadows 
        gl={{ 
          antialias: true,
          powerPreference: "high-performance",
          alpha: false
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 16]} fov={40} />
        <CameraController />
        
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />
          
          <ambientLight intensity={0.25} />
          <spotLight position={[15, 25, 15]} angle={0.3} penumbra={1} intensity={3.5} color="#fff4e6" castShadow />
          <pointLight position={[-20, 10, -15]} color="#059669" intensity={2.5} distance={45} />
          <spotLight position={[0, 20, 0]} angle={0.15} penumbra={1} intensity={8} color="#ffffff" />
          
          <Stars radius={150} depth={50} count={9000} factor={7} saturation={0.5} fade speed={0.5} />
          
          <Environment preset="city" />
          
          <group position={[0, -2.5, 0]}>
             <Tree />
             <PhotoSpiral />
          </group>

          <OrbitControls 
            ref={orbitRef}
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.7} 
            minDistance={4} 
            maxDistance={30}
            rotateSpeed={0.5}
            dampingFactor={0.05}
            enableDamping={true}
            enabled={!focusedPhotoId} 
          />

          <EffectComposer multisampling={4}>
            <Bloom 
              luminanceThreshold={0.8} 
              mipmapBlur 
              intensity={2.0} 
              radius={0.5} 
            />
            <Vignette eskil={false} offset={0.1} darkness={1.2} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Noise opacity={0.012} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
