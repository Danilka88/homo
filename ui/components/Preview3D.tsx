
import React, { useMemo, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Wall, WallType, Furniture, FurnitureType, RoomLabel } from '../types';
import { PIXELS_PER_METER, ROOM_METADATA, CANVAS_SIZE } from '../constants';

interface Preview3DProps {
  walls: Wall[];
  furniture: Furniture[];
  rooms: RoomLabel[];
  backgroundImage: string | null;
  onBack: () => void;
}

const WALL_HEIGHT = 2.7; // meters
const M_TO_PX = 1 / PIXELS_PER_METER;

// --- FLOOR PLAN IMAGE ON GROUND ---
const FloorPlan: React.FC<{ imageUrl: string | null }> = ({ imageUrl }) => {
  const texture = useLoader(THREE.TextureLoader, imageUrl || '');
  
  // Need to know aspect ratio to set plane size correctly
  const { width, height } = useMemo(() => {
    if (!texture.image) return { width: CANVAS_SIZE * M_TO_PX, height: CANVAS_SIZE * M_TO_PX };
    
    // Original image dimensions
    const imgW = texture.image.width;
    const imgH = texture.image.height;
    
    // In EditorCanvas, we fit width to CANVAS_SIZE (2000px)
    // So 3D Width should be CANVAS_SIZE * M_TO_PX
    const scaleFactor = CANVAS_SIZE / imgW;
    const finalW = CANVAS_SIZE * M_TO_PX;
    const finalH = (imgH * scaleFactor) * M_TO_PX;
    
    return { width: finalW, height: finalH };
  }, [texture]);

  if (!imageUrl) return null;

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[width / 2, -0.02, height / 2]} // Center the plane at (W/2, H/2) because geometry is centered
      receiveShadow
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
};

const WallMesh: React.FC<{ wall: Wall }> = ({ wall }) => {
  const { length, angle, cx, cy, thicknessM } = useMemo(() => {
    const lengthPx = Math.sqrt(Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2));
    const angleRad = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
    
    // Calculate center in meters
    const centerPx = {
      x: (wall.start.x + wall.end.x) / 2,
      y: (wall.start.y + wall.end.y) / 2
    };
    
    return {
      length: lengthPx * M_TO_PX,
      angle: -angleRad, 
      cx: centerPx.x * M_TO_PX,
      cy: centerPx.y * M_TO_PX,
      thicknessM: wall.thickness * M_TO_PX
    };
  }, [wall]);

  let color = '#cbd5e1'; 
  let opacity = 1;
  let transparent = false;
  let height = WALL_HEIGHT;

  if (wall.type === WallType.BEARING) {
    color = '#4ade80'; 
  } else if (wall.type === WallType.DEMOLITION) {
    color = '#f87171'; 
    opacity = 0.3;
    transparent = true;
    height = WALL_HEIGHT; // Show ghost wall full height
  }

  return (
    <mesh
      position={[cx, height / 2, cy]}
      rotation={[0, angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, height, thicknessM]} />
      <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
};

// --- PROCEDURAL FURNITURE MODELS ---

const FurnitureModel: React.FC<{ item: Furniture }> = ({ item }) => {
  const widthM = item.width * M_TO_PX;
  const depthM = item.depth * M_TO_PX;
  const xM = item.x * M_TO_PX;
  const zM = item.y * M_TO_PX;
  const rotationRad = -(item.rotation * Math.PI) / 180;

  const groupProps = {
    position: [xM, 0, zM] as [number, number, number],
    rotation: [0, rotationRad, 0] as [number, number, number]
  };

  switch (item.type) {
    case FurnitureType.BED:
      return (
        <group {...groupProps}>
          <Box args={[widthM, 0.4, depthM]} position={[0, 0.2, 0]} castShadow receiveShadow>
             <meshStandardMaterial color="#e2e8f0" />
          </Box>
          <Box args={[widthM - 0.1, 0.15, depthM - 0.1]} position={[0, 0.475, 0.05]}>
             <meshStandardMaterial color="#f8fafc" />
          </Box>
          <Box args={[widthM, 0.9, 0.1]} position={[0, 0.45, -depthM/2 + 0.05]} castShadow>
             <meshStandardMaterial color="#94a3b8" />
          </Box>
          <Box args={[widthM * 0.4, 0.1, 0.2]} position={[-widthM*0.2, 0.55, -depthM/2 + 0.2]} rotation={[0.2,0,0]}>
             <meshStandardMaterial color="#fff" />
          </Box>
          <Box args={[widthM * 0.4, 0.1, 0.2]} position={[widthM*0.2, 0.55, -depthM/2 + 0.2]} rotation={[0.2,0,0]}>
             <meshStandardMaterial color="#fff" />
          </Box>
        </group>
      );

    case FurnitureType.SOFA:
      return (
        <group {...groupProps}>
          <Box args={[widthM, 0.35, depthM]} position={[0, 0.175, 0]} castShadow>
            <meshStandardMaterial color="#475569" />
          </Box>
          <Box args={[widthM, 0.5, 0.2]} position={[0, 0.5, -depthM/2 + 0.1]}>
             <meshStandardMaterial color="#334155" />
          </Box>
          <Box args={[0.15, 0.3, depthM]} position={[-widthM/2 + 0.075, 0.4, 0]}>
             <meshStandardMaterial color="#334155" />
          </Box>
          <Box args={[0.15, 0.3, depthM]} position={[widthM/2 - 0.075, 0.4, 0]}>
             <meshStandardMaterial color="#334155" />
          </Box>
        </group>
      );
      
    case FurnitureType.TABLE:
      return (
        <group {...groupProps}>
          <Box args={[widthM, 0.05, depthM]} position={[0, 0.75, 0]} castShadow>
             <meshStandardMaterial color="#a97142" />
          </Box>
          <Cylinder args={[0.04, 0.03, 0.73]} position={[-widthM/2 + 0.1, 0.365, -depthM/2 + 0.1]} castShadow>
             <meshStandardMaterial color="#553311" />
          </Cylinder>
          <Cylinder args={[0.04, 0.03, 0.73]} position={[widthM/2 - 0.1, 0.365, -depthM/2 + 0.1]} castShadow>
             <meshStandardMaterial color="#553311" />
          </Cylinder>
          <Cylinder args={[0.04, 0.03, 0.73]} position={[-widthM/2 + 0.1, 0.365, depthM/2 - 0.1]} castShadow>
             <meshStandardMaterial color="#553311" />
          </Cylinder>
          <Cylinder args={[0.04, 0.03, 0.73]} position={[widthM/2 - 0.1, 0.365, depthM/2 - 0.1]} castShadow>
             <meshStandardMaterial color="#553311" />
          </Cylinder>
        </group>
      );
      
    case FurnitureType.WARDROBE:
      return (
         <group {...groupProps}>
           <Box args={[widthM, 2.2, depthM]} position={[0, 1.1, 0]} castShadow>
              <meshStandardMaterial color="#d1d5db" />
           </Box>
           <Box args={[0.02, 2.1, 0.02]} position={[0, 1.1, depthM/2 + 0.01]}>
              <meshStandardMaterial color="#9ca3af" />
           </Box>
         </group>
      );

    case FurnitureType.TOILET:
       return (
          <group {...groupProps}>
             <Box args={[widthM, 0.8, 0.2]} position={[0, 0.4, -depthM/2 + 0.1]} castShadow>
                <meshStandardMaterial color="#fff" />
             </Box>
             <Box args={[widthM * 0.8, 0.45, depthM * 0.6]} position={[0, 0.225, 0.1]} castShadow>
                <meshStandardMaterial color="#fff" />
             </Box>
          </group>
       );

    case FurnitureType.BATHTUB:
        return (
           <group {...groupProps}>
              <Box args={[widthM, 0.6, depthM]} position={[0, 0.3, 0]} castShadow>
                 <meshStandardMaterial color="#fff" />
              </Box>
              <Box args={[widthM - 0.1, 0.02, depthM - 0.1]} position={[0, 0.5, 0]}>
                 <meshStandardMaterial color="#bfdbfe" />
              </Box>
           </group>
        );

    case FurnitureType.WASHER:
        return (
           <group {...groupProps}>
               <Box args={[widthM, 0.85, depthM]} position={[0, 0.425, 0]} castShadow>
                  <meshStandardMaterial color="#f8fafc" />
               </Box>
               <Cylinder args={[widthM * 0.35, widthM * 0.35, 0.05]} position={[0, 0.5, depthM/2]} rotation={[Math.PI/2, 0, 0]}>
                   <meshStandardMaterial color="#334155" />
               </Cylinder>
           </group>
        );
        
    case FurnitureType.DOOR:
         return (
            <group {...groupProps}>
               <Box args={[0.05, 2.1, 0.1]} position={[-widthM/2 + 0.025, 1.05, 0]} castShadow>
                  <meshStandardMaterial color="#78350f" />
               </Box>
               <Box args={[0.05, 2.1, 0.1]} position={[widthM/2 - 0.025, 1.05, 0]} castShadow>
                  <meshStandardMaterial color="#78350f" />
               </Box>
               <Box args={[widthM, 0.05, 0.1]} position={[0, 2.075, 0]} castShadow>
                  <meshStandardMaterial color="#78350f" />
               </Box>
               <group position={[-widthM/2, 0, 0]} rotation={[0, Math.PI/4, 0]}>
                   <Box args={[widthM, 2.0, 0.05]} position={[widthM/2, 1.0, 0]} castShadow>
                      <meshStandardMaterial color="#92400e" />
                   </Box>
               </group>
            </group>
         );
    
    case FurnitureType.WINDOW:
         return (
             <group {...groupProps}>
                 <Box args={[widthM, 1.4, 0.1]} position={[0, 1.5, 0]}>
                    <meshStandardMaterial color="#e0f2fe" transparent opacity={0.6} />
                 </Box>
                 <Box args={[widthM, 0.05, 0.15]} position={[0, 0.8, 0]}>
                     <meshStandardMaterial color="#fff" />
                 </Box>
             </group>
         )

    default:
      return (
        <group {...groupProps}>
           <Box args={[widthM, item.type === FurnitureType.TV ? 0.5 : 0.9, depthM]} position={[0, item.type === FurnitureType.TV ? 0.25 : 0.45, 0]} castShadow>
              <meshStandardMaterial color={item.type === FurnitureType.TV ? "#000" : "#d1d5db"} />
           </Box>
           {item.type === FurnitureType.TV && (
               <Box args={[widthM * 0.9, 0.6, 0.05]} position={[0, 0.8, 0]}>
                   <meshStandardMaterial color="#1f2937" />
               </Box>
           )}
        </group>
      );
  }
};


const Preview3D: React.FC<Preview3DProps> = ({ walls, furniture, rooms, backgroundImage, onBack }) => {
  // Calculate center to position camera properly
  const { centerX, centerZ } = useMemo(() => {
     if (walls.length === 0) return { centerX: 20, centerZ: 20 };
     let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
     walls.forEach(w => {
        minX = Math.min(minX, w.start.x, w.end.x);
        maxX = Math.max(maxX, w.start.x, w.end.x);
        minY = Math.min(minY, w.start.y, w.end.y);
        maxY = Math.max(maxY, w.start.y, w.end.y);
     });
     // Center of the bounding box of walls
     return {
        centerX: (minX + maxX) / 2 * M_TO_PX,
        centerZ: (minY + maxY) / 2 * M_TO_PX
     };
  }, [walls]);

  return (
    <div className="fixed inset-0 bg-slate-900">
       <div className="absolute top-4 left-4 z-50">
           <button onClick={onBack} className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 backdrop-blur-md border border-white/10 font-medium">
             ← Назад в 2D
           </button>
       </div>
       <div className="absolute bottom-4 left-4 z-50 text-white/50 text-xs pointer-events-none">
           Используйте мышь для вращения и колесико для зума
       </div>

       <Canvas shadows camera={{ position: [centerX, 15, centerZ + 15], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
          <Environment preset="apartment" />

          <OrbitControls target={[centerX, 0, centerZ]} makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />

          {/* Render user's plan image on the floor */}
          <Suspense fallback={null}>
            {backgroundImage && <FloorPlan imageUrl={backgroundImage} />}
          </Suspense>

          {/* Grid Helper (positioned slightly below image) */}
          <gridHelper args={[100, 100]} position={[centerX, -0.05, centerZ]} />

          {/* Walls */}
          {walls.map(wall => <WallMesh key={wall.id} wall={wall} />)}

          {/* Furniture */}
          {furniture.map(item => <FurnitureModel key={item.id} item={item} />)}

          {/* Room Labels */}
          {rooms.map(room => (
             <Html key={room.id} position={[room.x * M_TO_PX, 1.8, room.y * M_TO_PX]} center zIndexRange={[100, 0]}>
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-bold backdrop-blur-sm border border-white/20 whitespace-nowrap select-none">
                   {ROOM_METADATA[room.type].name}
                </div>
             </Html>
          ))}
       </Canvas>
    </div>
  );
};

export default Preview3D;
