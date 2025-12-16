import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PresentationControls, Html, Text3D, Environment, Grid } from '@react-three/drei';
import { Layout, Typography, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getMachinesURL, fetchMachineStatus } from './apiEndpoints';
import Navbar from './Navbar';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import moment from 'moment';

const { Content } = Layout;
const { Title } = Typography;

// Enhanced status colors with better visual hierarchy
const STATUS_COLORS = {
  OFF: "#64748B",      // Softer gray
  ON: "#F59E0B",       // Warmer orange
  PRODUCTION: "#10B981" // Richer green
};

// Animated Central SMDDC Component
function CentralHub() {
  return (
    <group position={[0, 0, 0]}>
      {/* SMDDC Text with enhanced styling */}
      <group position={[0, 4.5, 0]}>
        <Html center>
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white 
                        px-8 py-4 rounded-full text-2xl font-bold whitespace-nowrap 
                        transform scale-150 shadow-xl border-2 border-blue-400
                        animate-pulse">
            SMDDC
          </div>
        </Html>
      </group>
    </group>
  );
}

// Add this new component for a floating effect around machines
function GlowEffect({ color, scale }) {
  return (
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Enhanced CNC Machine Model
function MachineModel({ position, rotation, scale, name, onClick, hovered, status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.OFF;
  const hoverScale = hovered ? 1.1 : 1;
  const yOffset = hovered ? 1 : 0;
  
  const { opacity, modelScale, modelY } = useSpring({
    opacity: hovered ? 1 : 0.3,
    modelScale: hovered ? hoverScale : 1,
    modelY: hovered ? yOffset : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  return (
    <animated.group
      position-y={modelY}
      scale={modelScale}
      position={position}
      rotation={rotation}
      onClick={onClick}
      opacity={opacity}
    >
      {/* Base Platform with Industrial Look */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.4, 3]} />
        <meshPhysicalMaterial 
          color="#1E293B"
          metalness={0.9}
          roughness={0.2}
          clearcoat={0.5}
        />
      </mesh>

      {/* Machine Base Frame */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3.8, 1.2, 2.8]} />
        <meshPhysicalMaterial 
          color="#334155"
          metalness={0.8}
          roughness={0.3}
          clearcoat={1}
        />
      </mesh>

      {/* Main Machine Body */}
      <group position={[0, 2.5, 0]}>
        {/* Main Housing */}
        <mesh castShadow>
          <boxGeometry args={[3.5, 3, 2.5]} />
          <meshPhysicalMaterial 
            color="#475569"
            metalness={0.7}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>

        {/* Sliding Door */}
        <mesh position={[0, 0, 1.26]} castShadow>
          <boxGeometry args={[3, 2.8, 0.1]} />
          <meshPhysicalMaterial 
            color="#94A3B8"
            metalness={0.6}
            roughness={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Control Panel */}
        <group position={[1.76, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 2, 1.5]} />
            <meshPhysicalMaterial 
              color="#1E293B"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* Screen */}
          <mesh position={[0.16, 0.3, 0]} castShadow>
            <boxGeometry args={[0.05, 1, 1]} />
            <meshPhysicalMaterial 
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              metalness={0.3}
              roughness={0.2}
            />
          </mesh>

          {/* Control Buttons */}
          {[-0.2, 0, 0.2].map((y) => (
            <mesh key={y} position={[0.16, -0.8, y]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
              <meshPhysicalMaterial 
                color="#E2E8F0"
                metalness={0.7}
                roughness={0.1}
              />
            </mesh>
          ))}
        </group>

        {/* Spindle Housing */}
        <group position={[0, 0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 1.5, 2]} />
            <meshPhysicalMaterial 
              color="#334155"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Spindle */}
          <mesh position={[0, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.15, 1, 16]} />
            <meshPhysicalMaterial 
              color="#CBD5E1"
              metalness={0.9}
              roughness={0.1}
              clearcoat={1}
            />
          </mesh>

          {/* Tool Holder */}
          <mesh position={[0, -1.2, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
            <meshPhysicalMaterial 
              color="#94A3B8"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>

        {/* Cooling System */}
        <group position={[-1.76, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 2, 1.5]} />
            <meshPhysicalMaterial 
              color="#334155"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* Cooling Vents */}
          {[-0.5, 0, 0.5].map((z) => (
            <mesh key={z} position={[-0.16, 0, z]} castShadow>
              <boxGeometry args={[0.05, 1.5, 0.3]} />
              <meshPhysicalMaterial 
                color="#94A3B8"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* Status Glow Effect */}
      {hovered && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Machine Label */}
      <Html position={[0, 4.5, 0]} center>
        <div className={`
          transform transition-all duration-300 select-none
          ${hovered ? 'scale-110' : 'scale-100'}
        `}>
          <div className={`
            bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg
            border ${hovered ? `border-${getStatusColor(status)}-400 shadow-lg` : 'border-gray-200/50 shadow'}
            min-w-[120px] max-w-[150px]
          `}>
            <div className={`
              text-sm font-bold mb-1 text-center
              ${hovered ? `text-${getStatusColor(status)}-600` : 'text-gray-800'}
            `}>
              {name}
            </div>
          </div>
        </div>
      </Html>
    </animated.group>
  );
}

// Add this new component for rotation animation
function RotatingMachine({ children, speed = 0.001, hovered }) {
  const groupRef = useRef();
  
  useFrame(() => {
    if (groupRef.current) {
      // Faster rotation when hovered
      groupRef.current.rotation.y += hovered ? speed * 3 : speed;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Add these helper functions
function getStatusColor(status) {
  switch(status) {
    case 'PRODUCTION': return 'green';
    case 'ON': return 'orange';
    default: return 'gray';
  }
}

function getStatusStyles(status) {
  switch(status) {
    case 'PRODUCTION':
      return 'bg-green-100/80 text-green-600 border border-green-300';
    case 'ON':
      return 'bg-orange-100/80 text-orange-600 border border-orange-300';
    default:
      return 'bg-gray-100/80 text-gray-600 border border-gray-300';
  }
}

function getStatusDotColor(status) {
  switch(status) {
    case 'PRODUCTION': return 'bg-green-500';
    case 'ON': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

// Add this CSS to your styles
const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.machine-card {
  backdrop-filter: blur(12px);
  transition: all 0.3s ease-in-out;
}

.machine-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
`;

// Add this new component for the enhanced floor with grid
function EnhancedFloor() {
  return (
    <group>
      {/* Reflective base floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          metalness={0.8}
          roughness={0.1}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Stylized grid overlay */}
      <Grid
        position={[0, 0.01, 0]}
        args={[100, 100]}
        cellSize={5}
        cellThickness={1}
        cellColor="#6366f1"
        sectionSize={20}
        sectionThickness={1.5}
        sectionColor="#3730a3"
        fadeDistance={80}
        fadeStrength={1}
        followCamera={false}
      />
    </group>
  );
}

// Update the lighting setup in your Canvas section
function EnhancedLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {/* Add colored rim lights for dramatic effect */}
      <pointLight 
        position={[20, 10, -20]} 
        intensity={0.5} 
        color="#ef4444"
      />
      <pointLight 
        position={[-20, 10, 20]} 
        intensity={0.5} 
        color="#3b82f6"
      />
      <spotLight
        position={[0, 20, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.8}
        color="#818CF8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}

function Machine() {
  const [machines, setMachines] = useState([]);
  const [hoveredMachine, setHoveredMachine] = useState(null);
  const navigate = useNavigate();

  // Add this handler for the back button
  const handleBack = () => {
    navigate('/energymonitoring/map');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch machines
        const machinesResponse = await fetch(getMachinesURL());
        const machinesData = await machinesResponse.json();

        // Fetch status data
        const today = moment().format('YYYY-MM-DD');
        const statusData = await fetchMachineStatus(today);

        console.log('Machines Data:', machinesData);
        console.log('Status Data:', statusData);

        // Check if statusData has dataPoints property
        const dataPoints = statusData.dataPoints || [];

        // Create a map of latest status for each machine_id
        const latestStatusMap = {};
        dataPoints.forEach(status => {
          // Only update if this is a more recent status for this machine
          if (!latestStatusMap[status.machine_id] || 
              status.value[1] > latestStatusMap[status.machine_id].timestamp) {
            latestStatusMap[status.machine_id] = {
              status: status.name,
              timestamp: status.value[1]
            };
          }
        });

        // Combine machine data with their latest status
        const machinesWithStatus = machinesData.map(machine => {
          const machineStatus = latestStatusMap[machine.id];
          return {
            ...machine,
            status: machineStatus ? machineStatus.status : 'OFF' // Default to 'OFF' if no status found
          };
        });

        console.log('Machines with status:', machinesWithStatus);
        setMachines(machinesWithStatus);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        setMachines([]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  const handleMachineClick = (machineId) => {
    // First trigger the hover effect
    setHoveredMachine(machineId);
    
    // Then navigate after a short delay to allow the animation to play
    setTimeout(() => {
      navigate(`/energymonitoring/machine/${machineId}`);
    }, 800); // 800ms delay for animation
  };

  // Define RotatingMachine component inside the Canvas
  const Scene = () => {
    // Move RotatingMachine here
    function RotatingMachine({ children, speed = 0.001, hovered }) {
      const groupRef = useRef();
      
      useFrame(() => {
        if (groupRef.current) {
          groupRef.current.rotation.y += hovered ? speed * 3 : speed;
        }
      });

      return <group ref={groupRef}>{children}</group>;
    }

    return (
      <>
        <EnhancedLighting />
        <PresentationControls
          global
          zoom={0.8}
          rotation={[0, -Math.PI / 4, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
          config={{ mass: 2, tension: 400 }}
        >
          <CentralHub />
          
          {machines.map((machine, index) => {
            const angle = (index / machines.length) * Math.PI * 2;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const isHovered = hoveredMachine === machine.id;

            return (
              <group key={machine.id}>
                <RotatingMachine speed={0.001} hovered={isHovered}>
                  <MachineModel
                    position={[x, 0, z]}
                    rotation={[0, -angle + Math.PI, 0]}
                    scale={1.2}
                    name={machine.machine_name}
                    status={machine.status}
                    onClick={() => handleMachineClick(machine.id)}
                    hovered={isHovered}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      setHoveredMachine(machine.id);
                      document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={(e) => {
                      setHoveredMachine(null);
                      document.body.style.cursor = 'default';
                    }}
                  />
                </RotatingMachine>
              </group>
            );
          })}

          <EnhancedFloor />
        </PresentationControls>

        <Environment preset="city" />
        <fog attach="fog" args={['#f8fafc', 30, 80]} />
        
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={20}
          maxDistance={50}
          dampingFactor={0.05}
          rotateSpeed={0.8}
        />
      </>
    );
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50">
      <Navbar onBack={handleBack} />
      <Content className="p-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <Title level={2} className="text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            SMDDC Factory Control Center
          </Title>
          <div className="flex justify-center gap-6 mb-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-600 text-sm font-medium">{status}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Enhanced 3D Viewport - Made fullscreen */}
        <div className="w-full h-[calc(100vh-200px)] rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 
                      bg-gradient-to-b from-gray-50/50 via-white/50 to-gray-50/50 backdrop-blur-sm">
          <Canvas
            camera={{ position: [0, 30, 40], fov: 40 }}
            shadows
            gl={{ 
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2
            }}
          >
            <Suspense fallback={null}>
              <color attach="background" args={['#f8fafc']} />
              <Scene />
            </Suspense>
          </Canvas>
        </div>
      </Content>
    </Layout>
  );
}

export default Machine;