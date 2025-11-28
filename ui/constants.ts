
import { Wall, WallType, Furniture, FurnitureType, RoomType } from './types';

export const PIXELS_PER_METER = 50; // 1 meter = 50 pixels on canvas
export const CANVAS_SIZE = 2000;

export const ROOM_METADATA: Record<RoomType, { name: string; isWet: boolean; color: string }> = {
  [RoomType.KITCHEN]: { name: 'Кухня', isWet: true, color: '#fef08a' }, // Yellow
  [RoomType.BATHROOM]: { name: 'Санузел', isWet: true, color: '#bae6fd' }, // Blue
  [RoomType.LIVING]: { name: 'Гостиная', isWet: false, color: '#dcfce7' }, // Green
  [RoomType.BEDROOM]: { name: 'Спальня', isWet: false, color: '#f3e8ff' }, // Purple
  [RoomType.CORRIDOR]: { name: 'Коридор', isWet: false, color: '#f1f5f9' }, // Gray
  [RoomType.BALCONY]: { name: 'Балкон', isWet: false, color: '#e2e8f0' }, // Slate
  [RoomType.CLOSET]: { name: 'Гардероб', isWet: false, color: '#ffedd5' }, // Orange
};

export const INITIAL_WALLS: Wall[] = [
  // Outer Box
  { id: 'w1', start: { x: 200, y: 200 }, end: { x: 800, y: 200 }, type: WallType.BEARING, thickness: 20 },
  { id: 'w2', start: { x: 800, y: 200 }, end: { x: 800, y: 600 }, type: WallType.BEARING, thickness: 20 },
  { id: 'w3', start: { x: 800, y: 600 }, end: { x: 200, y: 600 }, type: WallType.BEARING, thickness: 20 },
  { id: 'w4', start: { x: 200, y: 600 }, end: { x: 200, y: 200 }, type: WallType.BEARING, thickness: 20 },
  // Inner Partition (Bathroom)
  { id: 'w5', start: { x: 200, y: 400 }, end: { x: 400, y: 400 }, type: WallType.PARTITION, thickness: 10 },
  { id: 'w6', start: { x: 400, y: 400 }, end: { x: 400, y: 200 }, type: WallType.PARTITION, thickness: 10 },
];

export const INITIAL_FURNITURE: Furniture[] = [
  { id: 'f1', type: FurnitureType.TOILET, x: 250, y: 250, width: 20, depth: 30, rotation: 0 },
  { id: 'f2', type: FurnitureType.DOOR, x: 400, y: 300, width: 40, depth: 10, rotation: 90 },
  { id: 'f3', type: FurnitureType.WINDOW, x: 500, y: 200, width: 75, depth: 10, rotation: 0 },
];

// Scaled sizes: 50px = 1 meter
export const FURNITURE_CATALOG = [
  { type: FurnitureType.BED, name: 'Кровать', width: 80, depth: 100, icon: 'BedDouble' }, // 1.6x2.0m
  { type: FurnitureType.SOFA, name: 'Диван', width: 100, depth: 45, icon: 'Armchair' }, // 2.0x0.9m
  { type: FurnitureType.ARMCHAIR, name: 'Кресло', width: 45, depth: 45, icon: 'Armchair' }, // 0.9x0.9m
  { type: FurnitureType.TABLE, name: 'Стол', width: 60, depth: 40, icon: 'Table' }, // 1.2x0.8m
  { type: FurnitureType.WARDROBE, name: 'Шкаф', width: 60, depth: 30, icon: 'Box' }, // 1.2x0.6m
  { type: FurnitureType.TV, name: 'ТВ Тумба', width: 75, depth: 20, icon: 'Tv' }, // 1.5x0.4m
  { type: FurnitureType.FRIDGE, name: 'Холодильник', width: 30, depth: 30, icon: 'Refrigerator' }, // 60x60cm
  { type: FurnitureType.STOVE, name: 'Плита', width: 30, depth: 30, icon: 'Flame' }, // 60x60cm
  { type: FurnitureType.SINK, name: 'Раковина', width: 30, depth: 25, icon: 'Droplets' }, // 60x50cm
  { type: FurnitureType.TOILET, name: 'Унитаз', width: 20, depth: 30, icon: 'Bath' }, // 40x60cm
  { type: FurnitureType.BATHTUB, name: 'Ванна', width: 85, depth: 35, icon: 'Bath' }, // 170x70cm
  { type: FurnitureType.SHOWER, name: 'Душ', width: 45, depth: 45, icon: 'ShowerHead' }, // 90x90cm
  { type: FurnitureType.WASHER, name: 'Стир.маш', width: 30, depth: 30, icon: 'Waves' }, // 60x60cm
];

export const MOCK_ANALYSIS_RESPONSE = `
[
  {
    "severity": "critical",
    "title": "Снос несущей стены",
    "description": "Обнаружено удаление участка несущей стены. Это категорически запрещено Жилищным кодексом РФ."
  },
  {
    "severity": "warning",
    "title": "Мокрая зона",
    "description": "Расширение санузла возможно только за счет коридора. Убедитесь, что вы не заходите на жилую зону."
  }
]
`;
