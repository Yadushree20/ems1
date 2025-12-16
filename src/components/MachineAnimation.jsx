import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';

function CNCMachine({ position }) {
  const groupRef = useRef();
  const drillRef = useRef();
  const mainRef = useRef();
  const [status, setStatus] = useState('ON');

  const STATUS_COLORS = {
    OFF: "#64748B",
    ON: "#F59E0B",
    PRODUCTION: "#10B981"
  };

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
    if (drillRef.current && status !== 'OFF') {
      drillRef.current.rotation.y += status === 'PRODUCTION' ? 0.2 : 0.05;
    }
  });

  return (
    <group ref={mainRef}>
      <group ref={groupRef} position={position}>
        {/* Base Platform */}
        <mesh position={[0, -1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[5, 0.5, 3.5]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Main Frame */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Control Panel */}
        <group position={[1.8, 0.5, 0.8]} rotation={[0, -Math.PI / 6, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 1.2, 1]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
          </mesh>
          
          {/* Screen */}
          <mesh position={[0.21, 0.2, 0]}>
            <planeGeometry args={[0.3, 0.4]} />
            <meshBasicMaterial 
              color="#1E293B"
              emissive={STATUS_COLORS[status]}
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Status Display */}
          <Text
            position={[0.21, 0.2, 0.01]}
            scale={[0.1, 0.1, 0.1]}
            color="white"
          >
            {status}
          </Text>

          {/* Status Buttons */}
          {Object.entries(STATUS_COLORS).map(([buttonStatus, color], index) => (
            <group key={buttonStatus} position={[0.21, -0.2 + index * 0.2, 0]}>
              <mesh 
                onClick={() => setStatus(buttonStatus)}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'default'}
              >
                <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
                <meshStandardMaterial 
                  color={color}
                  emissive={color}
                  emissiveIntensity={status === buttonStatus ? 1 : 0.2}
                />
              </mesh>
              
              <Text
                position={[0.15, 0, 0]}
                scale={[0.08, 0.08, 0.08]}
                color="white"
              >
                {buttonStatus}
              </Text>
            </group>
          ))}
        </group>

        {/* Drill Assembly */}
        <group ref={drillRef} position={[0, 0.5, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.8, 2, 0.8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
          </mesh>

          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.1} />
          </mesh>

          <mesh position={[0, -0.8, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.05, 0.8, 16]} />
            <meshStandardMaterial color="#475569" metalness={1} roughness={0.1} />
          </mesh>
        </group>

        {/* Rails */}
        <mesh position={[0, -0.2, -1.2]} castShadow>
          <boxGeometry args={[3.5, 0.3, 0.3]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh position={[-1.6, -0.2, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 2.4]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Status Light */}
        <pointLight
          position={[1.8, 1.2, 0.8]}
          intensity={0.5}
          color={STATUS_COLORS[status]}
          distance={2}
        />
      </group>
    </group>
  );
}

function MachineAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows camera={{ position: [10, 5, 15], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={1} 
          castShadow
        />
        
        <CNCMachine position={[0, 0, 0]} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}

export default MachineAnimation;