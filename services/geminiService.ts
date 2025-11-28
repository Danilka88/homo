
import { GoogleGenAI } from "@google/genai";
import { Wall, Furniture, Violation, RoomLabel, RoomType, WallType } from '../types';
import { ROOM_METADATA } from "../constants";

// Safe Initialization
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn("GoogleGenAI init failed, falling back to local mode");
  }
}

export const GeminiService = {
  /**
   * Checks layout against SNiP rules. Uses AI if available, otherwise local heuristics.
   */
  async checkCompliance(walls: Wall[], furniture: Furniture[], rooms: RoomLabel[]): Promise<Violation[]> {
    if (!ai) {
      return this.localComplianceCheck(walls, furniture, rooms);
    }

    try {
      // Enrich room data for the prompt
      const enrichedRooms = rooms.map(r => ({
         type: r.type,
         name: ROOM_METADATA[r.type].name,
         isWetZone: ROOM_METADATA[r.type].isWet,
         x: r.x,
         y: r.y
      }));

      const prompt = `
        You are an expert in Russian Building Codes (SNiP) and Housing Code (Жилищный кодекс РФ).
        Analyze the following floor plan data (JSON) for renovation violations.
        
        Rules to check:
        1. Removal of load-bearing walls (WallType.BEARING) is strictly forbidden.
        2. Wet zones (Kitchen, Bathroom) CANNOT be expanded over living areas.
        3. Gas stoves requires a door between kitchen and living room.
        
        Data:
        Walls: ${JSON.stringify(walls)}
        Furniture: ${JSON.stringify(furniture)}
        Room Zones: ${JSON.stringify(enrichedRooms)}
        
        Return a JSON array of violations. Each object: { "id": string, "severity": "critical"|"warning"|"info", "title": string, "description": string }.
        Do not use markdown code blocks. Just raw JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || "[]";
      return JSON.parse(text);

    } catch (error) {
      console.warn("AI Check failed, using local fallback", error);
      return this.localComplianceCheck(walls, furniture, rooms);
    }
  },

  /**
   * Fallback for offline/no-key usage
   */
  localComplianceCheck(walls: Wall[], furniture: Furniture[], rooms: RoomLabel[]): Promise<Violation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const violations: Violation[] = [];
        
        // 1. Check Demolition of Bearing Walls (Heuristic: Demolition wall connecting to Bearing wall?) 
        // Or simply warn if ANY demolition wall is present to check passport
        const demolitionWalls = walls.filter(w => w.type === WallType.DEMOLITION);
        if (demolitionWalls.length > 0) {
          violations.push({
            id: 'loc-1',
            severity: 'warning',
            title: 'Снос стен',
            description: 'Вы отметили стены под снос. Обязательно сверьтесь с техническим паспортом БТИ: снос несущих стен и диафрагм жесткости запрещен.'
          });
        }

        // 2. Check Wet Zones
        const wetRooms = rooms.filter(r => ROOM_METADATA[r.type].isWet);
        if (wetRooms.length > 0) {
           violations.push({
             id: 'loc-2',
             severity: 'info',
             title: 'Гидроизоляция',
             description: 'Для помещений "' + wetRooms.map(r => ROOM_METADATA[r.type].name).join(', ') + '" требуется устройство гидроизоляции пола с заходом на стены.'
           });
        }

        // 3. Check Gas/Kitchen Door (Heuristic: If Stove exists, check for Door)
        const hasStove = furniture.some(f => f.type === 'STOVE');
        const hasDoor = furniture.some(f => f.type === 'DOOR');
        if (hasStove && !hasDoor) {
           violations.push({
             id: 'loc-3',
             severity: 'warning',
             title: 'Газифицированная кухня',
             description: 'Кухня с газовым оборудованием должна быть изолирована от жилых комнат плотной перегородкой с дверью.'
           });
        }

        if (violations.length === 0) {
           violations.push({
             id: 'loc-ok',
             severity: 'info',
             title: 'Базовая проверка пройдена',
             description: 'Явных нарушений конфигурации не обнаружено, но требуется детальный инженерный расчет.'
           });
        }

        resolve(violations);
      }, 500);
    });
  },

  /**
   * Generates ideas. Uses AI if available, otherwise generic advice.
   */
  async generateIdeas(userPrompt: string, currentWalls: Wall[]): Promise<string> {
    if (!ai) {
       return "Режим без AI: \n1. Попробуйте объединить кухню и гостиную, если стена не несущая.\n2. В маленьких санузлах используйте душевой трап вместо ванны.\n3. Светлые тона визуально расширят пространство.";
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          User wants renovation ideas for this layout: ${JSON.stringify(currentWalls)}.
          User request: "${userPrompt}".
          Provide a short, structured list of 3 specific architectural suggestions in Russian.
        `
      });
      return response.text || "Нет идей.";
    } catch (error) {
      return "Не удалось получить идеи от AI. Проверьте соединение.";
    }
  }
};
