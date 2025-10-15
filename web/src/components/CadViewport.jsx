import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore.js';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

function Model({ url, opacity = 1, highlight = false }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  scene.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = opacity < 1;
      child.material.opacity = opacity;
      child.material.color = highlight ? new THREE.Color('#4c9aff') : new THREE.Color('#d4d4d8');
      child.material.emissive = highlight ? new THREE.Color('#4c9aff') : new THREE.Color('#000000');
      child.material.emissiveIntensity = highlight ? 0.6 : 0;
    }
  });

  return <primitive object={scene} />;
}

export default function CadViewport({ modelUrl, selectionUrl }) {
  const highlightOnly = useAppStore((state) => state.highlightOnly);

  return (
    <div className="h-96 w-full overflow-hidden rounded-lg border border-border bg-background">
      <Canvas camera={{ position: [150, 150, 150], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[50, 100, 50]} intensity={0.8} />
        <Suspense fallback={null}>
          {modelUrl && !highlightOnly && <Model url={modelUrl} opacity={0.25} />}
          {selectionUrl && <Model url={selectionUrl} highlight opacity={0.95} />}
        </Suspense>
        <Environment preset="city" />
        <OrbitControls enableDamping />
        <gridHelper args={[200, 10]} position={[0, -60, 0]} />
      </Canvas>
    </div>
  );
}
