
import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Wall, WallType, Point, Furniture, FurnitureType, EditorTool, RoomLabel } from '../types';
import { PIXELS_PER_METER, CANVAS_SIZE, ROOM_METADATA } from '../constants';

interface EditorCanvasProps {
  walls: Wall[];
  setWalls: React.Dispatch<React.SetStateAction<Wall[]>>;
  furniture: Furniture[];
  setFurniture: React.Dispatch<React.SetStateAction<Furniture[]>>;
  rooms: RoomLabel[];
  setRooms: React.Dispatch<React.SetStateAction<RoomLabel[]>>;
  activeTool: EditorTool;
  activeRoomType: string | null; // For placing new labels
  backgroundImage: string | null;
  scale: number;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  walls,
  setWalls,
  furniture,
  setFurniture,
  rooms,
  setRooms,
  activeTool,
  activeRoomType,
  backgroundImage,
  scale
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point>({ x: 0, y: 0 });
  
  // Selection & Dragging
  const [draggedItem, setDraggedItem] = useState<{ type: 'wall' | 'furniture' | 'room', id: string, offset: Point } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Resizing
  const [isResizing, setIsResizing] = useState(false);
  
  // Image Loading State
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  
  // Canvas Dimensions State
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_SIZE, height: CANVAS_SIZE });

  // Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });

  // Load Background Image and Adjust Canvas Size
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        setLoadedImage(img);
        const aspect = img.height / img.width;
        const newHeight = Math.max(CANVAS_SIZE, Math.ceil(CANVAS_SIZE * aspect));
        setCanvasSize({ width: CANVAS_SIZE, height: newHeight });
      };
    } else {
      setLoadedImage(null);
      setCanvasSize({ width: CANVAS_SIZE, height: CANVAS_SIZE });
    }
  }, [backgroundImage]);

  // Helper: Get pointer position relative to canvas
  const getPointerPos = (e: React.PointerEvent | PointerEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const distance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  // --- HIT DETECTION HELPERS ---
  
  // Rotate a point around a center by -angle (to check Axis Aligned bounds)
  const rotatePoint = (point: Point, center: Point, angleDeg: number): Point => {
    const angleRad = -angleDeg * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: cos * dx - sin * dy + center.x,
      y: sin * dx + cos * dy + center.y
    };
  };

  const getHoveredWall = (p: Point): string | null => {
    for (const wall of walls) {
      const l2 = Math.pow(distance(wall.start, wall.end), 2);
      if (l2 === 0) continue;
      const t = ((p.x - wall.start.x) * (wall.end.x - wall.start.x) + (p.y - wall.start.y) * (wall.end.y - wall.start.y)) / l2;
      const tClamped = Math.max(0, Math.min(1, t));
      const projection = {
        x: wall.start.x + tClamped * (wall.end.x - wall.start.x),
        y: wall.start.y + tClamped * (wall.end.y - wall.start.y)
      };
      if (distance(p, projection) < wall.thickness / 2 + 15) { // Increased tolerance
        return wall.id;
      }
    }
    return null;
  };

  const getHoveredFurniture = (p: Point): string | null => {
    const PADDING = 15; // Hit padding
    for (const item of furniture) {
      // Rotate mouse point around item center to checking simple bounds
      const localP = rotatePoint(p, { x: item.x, y: item.y }, item.rotation);
      
      const halfW = item.width / 2;
      const halfD = item.depth / 2;

      if (
        localP.x >= item.x - halfW - PADDING &&
        localP.x <= item.x + halfW + PADDING &&
        localP.y >= item.y - halfD - PADDING &&
        localP.y <= item.y + halfD + PADDING
      ) {
        return item.id;
      }
    }
    return null;
  };

  const getHoveredRoomLabel = (p: Point): string | null => {
    for (const room of rooms) {
      // Assuming label is roughly 100x40
      if (Math.abs(p.x - room.x) < 50 && Math.abs(p.y - room.y) < 20) {
        return room.id;
      }
    }
    return null;
  };

  // --- EVENT HANDLERS ---

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = getPointerPos(e);

    // HAND Tool
    if (activeTool === 'HAND') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // CHECK RESIZE HANDLE (If item selected)
    if (selectedItemId && activeTool === 'SELECT') {
      const item = furniture.find(f => f.id === selectedItemId);
      if (item) {
        // Calculate handle position in world space
        const halfW = item.width / 2;
        const halfD = item.depth / 2;
        // The handle is at local (halfW, halfD)
        const angleRad = item.rotation * (Math.PI / 180);
        const handleX = item.x + halfW * Math.cos(angleRad) - halfD * Math.sin(angleRad);
        const handleY = item.y + halfW * Math.sin(angleRad) + halfD * Math.cos(angleRad);
        
        if (distance(pos, { x: handleX, y: handleY }) < 15) {
          setIsResizing(true);
          return; // Stop processing other clicks
        }
      }
    }

    setStartPoint(pos);

    // ERASER
    if (activeTool === 'ERASER') {
      if (getHoveredWall(pos)) {
        setWalls(prev => prev.filter(w => w.id !== getHoveredWall(pos)));
        return;
      }
      if (getHoveredFurniture(pos)) {
        setFurniture(prev => prev.filter(f => f.id !== getHoveredFurniture(pos)));
        setSelectedItemId(null);
        return;
      }
      const rId = getHoveredRoomLabel(pos);
      if (rId) {
        setRooms(prev => prev.filter(r => r.id !== rId));
        return;
      }
    }

    // ROOM LABEL PLACEMENT
    if (activeTool === 'ROOM_LABEL' && activeRoomType) {
      setRooms(prev => [...prev, {
        id: Date.now().toString(),
        x: pos.x,
        y: pos.y,
        type: activeRoomType as any
      }]);
      return;
    }

    // SELECT / DRAG
    if (activeTool === 'SELECT') {
       // Check Furniture
       const fId = getHoveredFurniture(pos);
       if (fId) {
         setSelectedItemId(fId); // Select it
         const item = furniture.find(f => f.id === fId);
         if (item) {
           setDraggedItem({ type: 'furniture', id: fId, offset: { x: pos.x - item.x, y: pos.y - item.y } });
           return;
         }
       }
       
       // Check Rooms (Labels)
       const rId = getHoveredRoomLabel(pos);
       if (rId) {
         const room = rooms.find(r => r.id === rId);
         if (room) {
           setDraggedItem({ type: 'room', id: rId, offset: { x: pos.x - room.x, y: pos.y - room.y } });
           return;
         }
       }

       // Deselect if clicked empty space
       setSelectedItemId(null);
    }

    // DRAW WALL
    if (activeTool === 'WALL_BEARING' || activeTool === 'WALL_PARTITION' || activeTool === 'WALL_DEMOLITION') {
      setIsDrawing(true);
      setCurrentMousePos(pos);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pos = getPointerPos(e);
    
    // Panning
    if (activeTool === 'HAND' && isPanning) {
      const scrollContainer = containerRef.current?.closest('.overflow-auto');
      if (scrollContainer) {
        scrollContainer.scrollLeft -= (e.clientX - lastPanPoint.x);
        scrollContainer.scrollTop -= (e.clientY - lastPanPoint.y);
      }
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Resizing Furniture
    if (isResizing && selectedItemId) {
      const item = furniture.find(f => f.id === selectedItemId);
      if (item) {
        // Rotate mouse position back to local space relative to center
        const localPos = rotatePoint(pos, { x: item.x, y: item.y }, item.rotation);
        
        // Calculate new half-widths based on distance from center
        // We use Math.abs to allow dragging across center, but generally we expect dragging outward
        // We multiply by 2 because localPos is distance from center
        const newWidth = Math.max(20, Math.abs(localPos.x - item.x) * 2); 
        const newDepth = Math.max(20, Math.abs(localPos.y - item.y) * 2);

        setFurniture(prev => prev.map(f => f.id === selectedItemId ? { ...f, width: newWidth, depth: newDepth } : f));
      }
      return;
    }

    setCurrentMousePos(pos);

    if (draggedItem && activeTool === 'SELECT') {
      if (draggedItem.type === 'furniture') {
        setFurniture(prev => prev.map(f => 
          f.id === draggedItem.id ? { ...f, x: pos.x - draggedItem.offset.x, y: pos.y - draggedItem.offset.y } : f
        ));
      } else if (draggedItem.type === 'room') {
        setRooms(prev => prev.map(r => 
          r.id === draggedItem.id ? { ...r, x: pos.x - draggedItem.offset.x, y: pos.y - draggedItem.offset.y } : r
        ));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (activeTool === 'HAND') {
      setIsPanning(false);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      return;
    }

    if (isDrawing && startPoint) {
      // Finalize Wall
      const length = distance(startPoint, currentMousePos);
      if (length > 10) { 
        let type = WallType.PARTITION;
        let thickness = 10;

        if (activeTool === 'WALL_BEARING') {
          type = WallType.BEARING;
          thickness = 20;
        } else if (activeTool === 'WALL_DEMOLITION') {
          type = WallType.DEMOLITION;
          thickness = 10;
        }

        const newWall: Wall = {
          id: Date.now().toString(),
          start: startPoint,
          end: currentMousePos,
          type: type,
          thickness: thickness
        };
        setWalls(prev => [...prev, newWall]);
      }
    }
    setIsDrawing(false);
    setStartPoint(null);
    setDraggedItem(null);
  };

  // --- DRAWING LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Fill Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw Image
    if (loadedImage) {
      const drawWidth = canvasSize.width;
      const drawHeight = canvasSize.width * (loadedImage.height / loadedImage.width);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(loadedImage, 0, 0, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;
    }

    // 3. Draw Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += PIXELS_PER_METER) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += PIXELS_PER_METER) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // 4. Draw Rooms (Labels) - UNDER walls
    rooms.forEach(room => {
       const meta = ROOM_METADATA[room.type];
       ctx.save();
       ctx.translate(room.x, room.y);
       
       // Badge Background
       ctx.fillStyle = meta.color || '#f1f5f9';
       ctx.beginPath();
       ctx.roundRect(-60, -15, 120, 30, 15);
       ctx.fill();
       ctx.strokeStyle = '#94a3b8';
       ctx.lineWidth = 1;
       ctx.stroke();

       // Text
       ctx.fillStyle = '#0f172a';
       ctx.font = 'bold 14px sans-serif';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       
       let label = meta.name;
       if (meta.isWet) label += ' 💧';
       
       ctx.fillText(label, 0, 0);
       ctx.restore();
    });

    // 5. Draw Walls
    walls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      
      if (wall.type === WallType.BEARING) {
        ctx.strokeStyle = '#14532d'; 
        ctx.setLineDash([]);
      } else if (wall.type === WallType.DEMOLITION) {
        ctx.strokeStyle = '#7f1d1d'; 
        ctx.setLineDash([10, 10]); 
      } else {
        ctx.strokeStyle = '#475569'; 
        ctx.setLineDash([]);
      }
      
      ctx.lineWidth = wall.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      
      if (wall.type === WallType.BEARING) {
        ctx.strokeStyle = '#22c55e'; 
      } else if (wall.type === WallType.DEMOLITION) {
        ctx.strokeStyle = '#ef4444'; 
      } else {
        ctx.strokeStyle = '#94a3b8'; 
      }
      
      ctx.lineWidth = wall.thickness - 4;
      ctx.stroke();
      ctx.setLineDash([]); 
    });

    // 6. Draw Furniture
    furniture.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate((item.rotation * Math.PI) / 180);
      
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 5;

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;

      if (item.type === FurnitureType.TOILET) {
         ctx.fillRect(-item.width/2, -item.depth/2, item.width, item.depth/2);
         ctx.beginPath();
         ctx.arc(0, 10, item.width/2, 0, Math.PI * 2);
         ctx.fill();
         ctx.stroke();
      } else if (item.type === FurnitureType.DOOR) {
        ctx.beginPath();
        ctx.moveTo(-item.width/2, 0);
        ctx.lineTo(-item.width/2, -item.width);
        ctx.arc(-item.width/2, 0, item.width, -Math.PI/2, 0);
        ctx.stroke();
        ctx.fillStyle = 'transparent'; // Door swing area is clear
      } else if (item.type === FurnitureType.WINDOW) {
         ctx.fillStyle = '#e0f2fe'; 
         ctx.fillRect(-item.width/2, -item.depth/2, item.width, item.depth);
         ctx.strokeRect(-item.width/2, -item.depth/2, item.width, item.depth);
         ctx.beginPath();
         ctx.moveTo(0, -item.depth/2);
         ctx.lineTo(0, item.depth/2);
         ctx.stroke();
      } else {
        ctx.fillRect(-item.width/2, -item.depth/2, item.width, item.depth);
        ctx.strokeRect(-item.width/2, -item.depth/2, item.width, item.depth);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#64748b';
        ctx.font = '20px sans-serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.type.charAt(0), 0, 0);
      }
      
      // SELECTION OVERLAY & RESIZE HANDLES
      if (selectedItemId === item.id) {
        ctx.strokeStyle = '#3b82f6'; // Blue selection
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        // Draw slightly larger box
        ctx.strokeRect(-item.width/2 - 5, -item.depth/2 - 5, item.width + 10, item.depth + 10);
        ctx.setLineDash([]);

        // Resize Handle (Bottom Right)
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(item.width/2, item.depth/2, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 7. Ghost Wall
    if (isDrawing && startPoint) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentMousePos.x, currentMousePos.y);
      
      if (activeTool === 'WALL_BEARING') {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.lineWidth = 20;
      } else if (activeTool === 'WALL_DEMOLITION') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 10;
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 10;
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      const d = distance(startPoint, currentMousePos);
      const midX = (startPoint.x + currentMousePos.x) / 2;
      const midY = (startPoint.y + currentMousePos.y) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.font = '24px sans-serif'; 
      ctx.fillText(`${(d / PIXELS_PER_METER).toFixed(2)}м`, midX + 10, midY);
    }

  }, [walls, furniture, rooms, isDrawing, startPoint, currentMousePos, scale, loadedImage, activeTool, canvasSize, selectedItemId]);

  return (
    <div 
      ref={containerRef} 
      className={`relative touch-none ${
        activeTool === 'HAND' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
      }`}
      style={{ 
        width: canvasSize.width * scale, 
        height: canvasSize.height * scale 
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="block origin-top-left touch-none"
        style={{ width: canvasSize.width * scale, height: canvasSize.height * scale }}
      />
    </div>
  );
};

export default EditorCanvas;
