import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PresentationControls, Html, Text3D, Environment, Grid } from '@react-three/drei';
import { Layout, Typography, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getMachinesURL, fetchMachineStatus, fetchAllMachineStates } from './apiEndpoints';
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

// Status tooltips for better UX
const STATUS_TOOLTIPS = {
  OFF: "Machine is currently offline",
  ON: "Machine is powered on",
  PRODUCTION: "Machine is in production"
};

// Animated Central SMDDC Component
function CentralHub() {
  return (
    <group position={[0, 0, 0]}>
      {/* SMDDC Text with enhanced styling */}
      <group position={[0, 4.5, 0]}>
        <Html center>
          <div 
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white 
                      px-8 py-4 rounded-full text-2xl font-bold whitespace-nowrap 
                      transform scale-150 shadow-xl border-2 border-blue-400
                      animate-pulse relative group"
           
          >
            SMDDC
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-pulse" 
                 style={{ backgroundColor: '#10B981' }} />
            {/* <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 
                         bg-white text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 
                         transition-opacity duration-200 whitespace-nowrap">
              Smart Manufacturing and Digital Design Center
            </div> */}
          </div>
        </Html>
      </group>
    </group>
  );
}

// Add this new component for a floating effect around machines
function GlowEffect({ statusColor, scale = 1 }) {
  return (
    <mesh scale={[scale, scale, scale]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial
        color={statusColor}
        transparent
        opacity={0.25}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Enhanced CNC Machine Model
function MachineModel({ position, rotation, scale, name, onClick, hovered, status }) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.OFF;
  const tooltip = STATUS_TOOLTIPS[status] || 'Status unknown';
  
  // Define vibrant color variations based on status
  const enhanceColor = (baseColor, opacity = 1) => {
    const hex = baseColor.replace('#', '');
    // Increase saturation and brightness for more vibrant colors
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) * 1.3);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) * 1.3);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) * 1.3);
    return `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${opacity})`;
  };
  
  const MACHINE_COLORS = {
    base: enhanceColor(statusColor, 1),        // Base color with full opacity
    mainBody: enhanceColor(statusColor, 0.9),  // Slightly transparent for main body
    accent: enhanceColor(statusColor, 1),      // Full color for accents
    metal: enhanceColor(statusColor, 0.9),     // Slightly metallic
    glass: enhanceColor(statusColor, 0.4),     // Transparent for glass
    details: enhanceColor(statusColor, 1)      // Full color for details
  };
  
  // Status-based effects
  const pulseIntensity = (status === 'ON' || status === 'PRODUCTION') ? 0.2 : 0;
  const pulseEffect = pulseIntensity;
  
  const { opacity } = useSpring({
    opacity: 1,
    config: { mass: 1, tension: 100, friction: 26 }
  });

  return (
    <animated.group
      position={position}
      rotation={rotation}
      onClick={onClick}
      opacity={opacity}
      className="relative group"
    >
      {/* Glow effect for machines that are ON or in PRODUCTION */}
      {(status === 'ON' || status === 'PRODUCTION') && (
        <pointLight
          color={statusColor}
          intensity={1.5}
          distance={8}
          position={[0, 2, 0]}
        />
      )}
      
      {/* Status indicator with tooltip */}
      <Html center>
        <div 
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                    w-4 h-4 rounded-full border-2 border-white shadow-lg"
          style={{ 
            backgroundColor: statusColor,
            boxShadow: `0 0 10px ${statusColor}, 0 0 20px ${statusColor}`,
            animation: pulseEffect > 0 ? `pulse 1.5s infinite` : 'none'
          }}
          title={`${name || 'Machine'} - ${tooltip}`}
        />
      </Html>
      {/* Industrial Base Platform with Texture */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[5, 0.2, 4]} />
        <meshPhysicalMaterial 
          color={MACHINE_COLORS.base}
          metalness={0.6}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.2}
          emissive={MACHINE_COLORS.base}
          emissiveIntensity={pulseEffect}
        />
      </mesh>

      {/* Anti-vibration Feet */}
      {[[-2.2, -2], [-2.2, 2], [2.2, -2], [2.2, 2]].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.3, z]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 0.4, 8]} />
          <meshPhysicalMaterial 
            color={MACHINE_COLORS.accent}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Main Machine Base with Industrial Details */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[4.5, 1.8, 3.5]} />
        <meshPhysicalMaterial 
          color={MACHINE_COLORS.mainBody}
          metalness={0.8}
          roughness={0.2}
          clearcoat={0.8}
          envMapIntensity={1}
        />
      </mesh>

      {/* Main Machine Body with Enhanced Details */}
      <group position={[0, 3, 0]}>
        {/* Status-based ambient light */}
        <ambientLight 
          color={statusColor} 
          intensity={pulseEffect * 0.5} 
        />
        {/* Main Housing with Ventilation */}
        <mesh castShadow>
          <boxGeometry args={[4, 3.2, 3]} />
          <meshPhysicalMaterial 
            color={MACHINE_COLORS.mainBody}
            metalness={0.85}
            roughness={0.3}
            clearcoat={0.5}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Ventilation Grills */}
        {[-1.5, 0, 1.5].map((x, index) => (
          <mesh key={index} position={[x, 0, -1.51]} castShadow>
            <planeGeometry args={[0.8, 2]} />
            <meshPhysicalMaterial 
              color={MACHINE_COLORS.accent}
              metalness={0.9}
              roughness={0.4}
            />
          </mesh>
        ))}

        {/* Enhanced Sliding Door with Frame */}
        <group position={[0, 0, 1.51]}>
          {/* Door Frame */}
          <mesh castShadow>
            <boxGeometry args={[3.8, 3, 0.1]} />
            <meshPhysicalMaterial 
              color={MACHINE_COLORS.metal}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Glass Door */}
          <mesh position={[0, 0, 0.05]} castShadow>
            <boxGeometry args={[3.5, 2.7, 0.05]} />
            <meshPhysicalMaterial 
              color={MACHINE_COLORS.glass}
              metalness={0.9}
              roughness={0.2}
              transparent
              opacity={0.3}
              envMapIntensity={2}
            />
          </mesh>
        </group>

        {/* Enhanced Control Panel */}
        <group position={[2.01, 0, 0]}>
          {/* Main Panel Housing */}
          <mesh castShadow>
            <boxGeometry args={[0.4, 2.5, 2]} />
            <meshPhysicalMaterial 
              color={MACHINE_COLORS.metal}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {/* LCD Screen */}
          <mesh position={[0.21, 0.5, 0]} castShadow>
            <boxGeometry args={[0.05, 1.2, 1.5]} />
            <meshPhysicalMaterial 
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={0.8}
              metalness={0.3}
              roughness={0.2}
            />
          </mesh>

          {/* Control Buttons with LED Indicators */}
          {[-0.4, 0, 0.4].map((y, index) => (
            <group key={index} position={[0.21, -0.8, y]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
                <meshPhysicalMaterial 
                  color={MACHINE_COLORS.details}
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>
              {/* LED Indicator */}
              <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshPhysicalMaterial 
                  emissive={statusColor}
                  emissiveIntensity={0.5}
                  color={statusColor}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Enhanced Spindle System */}
        <group position={[0, 0, 0]}>
          {/* Spindle Housing */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[2, 2, 2.5]} />
            <meshPhysicalMaterial 
              color={MACHINE_COLORS.metal}
              metalness={0.9}
              roughness={0.2}
              clearcoat={1}
            />
          </mesh>

          {/* Main Spindle */}
          <group position={[0, -0.8, 0]}>
            {/* Spindle Motor */}
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.25, 1.2, 32]} />
              <meshPhysicalMaterial 
                color={MACHINE_COLORS.details}
                metalness={0.95}
                roughness={0.1}
                clearcoat={1}
              />
            </mesh>

            {/* Tool Holder */}
            <mesh position={[0, -0.8, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.12, 0.6, 32]} />
              <meshPhysicalMaterial 
                color={MACHINE_COLORS.metal}
                metalness={0.95}
                roughness={0.1}
              />
            </mesh>

            {/* Cutting Tool */}
            <mesh position={[0, -1.1, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.02, 0.4, 32]} />
              <meshPhysicalMaterial 
                color={MACHINE_COLORS.details}
                metalness={1}
                roughness={0.1}
              />
            </mesh>
          </group>
        </group>

        {/* Coolant System */}
        <group position={[-2.01, 0, 0]}>
          {/* Main Housing */}
          <mesh castShadow>
            <boxGeometry args={[0.4, 2.5, 2]} />
            <meshPhysicalMaterial 
              color={MACHINE_COLORS.metal}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
          
          {/* Coolant Nozzles */}
          {[-0.6, 0, 0.6].map((z, index) => (
            <group key={index} position={[-0.21, 0.5, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.06, 0.4, 16]} rotation={[0, 0, Math.PI / 2]} />
                <meshPhysicalMaterial 
                  color={MACHINE_COLORS.details}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
              {/* Nozzle Tip */}
              <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.04, 0.1, 16]} />
                <meshPhysicalMaterial 
                  color={MACHINE_COLORS.metal}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Status Glow Effect */}
      {hovered && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Enhanced Machine Label */}
      <Html position={[0, 5.2, 0]} center>
        <div className={`
          transform transition-all duration-300 select-none
          ${hovered ? 'scale-110' : 'scale-100'}
        `}>
          <div className={`
            bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg
            border-2 ${hovered ? `border-${getStatusColor(status)}-400 shadow-lg` : 'border-gray-200/50 shadow'}
            min-w-[140px] max-w-[180px]
          `}>
            <div className={`
              text-sm font-bold mb-1 text-center
              ${hovered ? `text-${getStatusColor(status)}-600` : 'text-gray-800'}
            `}>
              {name}
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status)} animate-pulse`}></div>
              <span className="text-xs font-medium text-gray-600">{status}</span>
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
@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

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
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[10, 20, 15]}
        intensity={1.5}
        castShadow
      />
      <directionalLight
        position={[-10, 15, -10]}
        intensity={1.2}
      />
      <pointLight 
        position={[20, 10, -20]} 
        intensity={0.8}
        color="#ef4444"
      />
      <pointLight 
        position={[-20, 10, 20]} 
        intensity={0.8}
        color="#3b82f6"
      />
      <spotLight
        position={[0, 20, 0]}
        angle={0.5}
        penumbra={1}
        intensity={1.2}
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
      console.log('Fetching machine data...');
      try {
        // Fetch all machine states first
        const allMachineStatesData = await fetchAllMachineStates();
        console.log('Fetched machine states:', allMachineStatesData);

        // Create a map of machine ID to status for easy lookup
        const machineStatusMap = new Map();
        
        // Process all machine states data to create the status map
        if (allMachineStatesData && Array.isArray(allMachineStatesData)) {
          allMachineStatesData.forEach(stateData => {
            const machineId = stateData.id; // Using the processed ID from fetchAllMachineStates
            if (machineId) {
              // Status is already processed in fetchAllMachineStates
              const status = stateData.status || 'OFF';
              machineStatusMap.set(Number(machineId), status);
            }
          });
        }

        // Fetch machines and merge with statuses
        try {
          const machinesResponse = await fetch(getMachinesURL());
          const machinesData = await machinesResponse.json();
          
          const machinesWithStatus = machinesData.map(machine => {
            const machineId = Number(machine.id);
            const status = machineStatusMap.get(machineId) || 'OFF';
            
            return {
              ...machine,
              status: status,
              // Ensure machine_name is always available
              machine_name: machine.machine_name || `Machine ${machineId}`
            };
          });

          console.log('Machines with status:', machinesWithStatus);
          setMachines(machinesWithStatus);
          
        } catch (machinesError) {
          console.error('Error fetching machines:', machinesError);
          // If we have states data but couldn't fetch machines, create minimal machine objects
          if (allMachineStatesData.length > 0) {
            const minimalMachines = allMachineStatesData.map(state => ({
              id: state.id,
              machine_name: state.machine_name || `Machine ${state.id}`,
              status: state.status || 'OFF'
            }));
            console.log('Using machine states as fallback:', minimalMachines);
            setMachines(minimalMachines);
          } else {
            setMachines([]);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        // Try to fetch just the machines as last resort
        try {
          const machinesResponse = await fetch(getMachinesURL());
          const machinesData = await machinesResponse.json();
          
          const machinesWithDefaultStatus = machinesData.map(machine => ({
            ...machine,
            status: 'OFF',
            machine_name: machine.machine_name || `Machine ${machine.id}`
          }));
          
          console.log('Fallback - Machines with default status:', machinesWithDefaultStatus);
          setMachines(machinesWithDefaultStatus);
        } catch (fetchError) {
          console.error('Failed to fetch machines as fallback:', fetchError);
          setMachines([]);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  const handleMachineClick = (machineId) => {
    console.log(`Machine ${machineId} clicked`);
    // First trigger the hover effect
    setHoveredMachine(machineId);
    
    // Then navigate after a short delay to allow the animation to play
    setTimeout(() => {
      navigate(`/energymonitoring/machine/${machineId}`);
    }, 300); // Reduced delay for better responsiveness
  };

  // Define RotatingMachine component inside the Canvas
  const Scene = () => {
    // Simple wrapper component without rotation
    function RotatingMachine({ children }) {
      return <group>{children}</group>;
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