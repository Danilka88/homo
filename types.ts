
export type Point = {
  x: number;
  y: number;
};

export enum WallType {
  BEARING = 'BEARING', // Несущая
  PARTITION = 'PARTITION', // Перегородка
  GAS_PARTITION = 'GAS_PARTITION', // Газовая перегородка
  DEMOLITION = 'DEMOLITION' // Снос
}

export type Wall = {
  id: string;
  start: Point;
  end: Point;
  type: WallType;
  thickness: number;
};

export enum FurnitureType {
  BED = 'BED',
  SOFA = 'SOFA',
  TOILET = 'TOILET',
  SINK = 'SINK',
  STOVE = 'STOVE',
  TABLE = 'TABLE',
  DOOR = 'DOOR',
  WINDOW = 'WINDOW'
}

export type Furniture = {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  rotation: number; // in degrees
  width: number;
  depth: number;
};

export enum RoomType {
  KITCHEN = 'KITCHEN',
  BATHROOM = 'BATHROOM',
  LIVING = 'LIVING',
  BEDROOM = 'BEDROOM',
  CORRIDOR = 'CORRIDOR',
  BALCONY = 'BALCONY',
  CLOSET = 'CLOSET'
}

export type RoomLabel = {
  id: string;
  x: number;
  y: number;
  type: RoomType;
};

export type Violation = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  relatedWallId?: string;
};

export enum AppMode {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  PREVIEW_3D = 'PREVIEW_3D'
}

export type EditorTool = 'SELECT' | 'HAND' | 'WALL_BEARING' | 'WALL_PARTITION' | 'WALL_DEMOLITION' | 'ERASER' | 'DOOR' | 'WINDOW' | 'FURNITURE' | 'ROOM_LABEL';
