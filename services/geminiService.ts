
import { GoogleGenAI } from "@google/genai";
import { Wall, Furniture, Violation, RoomLabel, RoomType } from '../types';
import { ROOM_METADATA } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const GeminiService = {
  /**
   * Simulates checking the layout against SNiP rules using Gemini 2.5 Flash
   */
  async checkCompliance(walls: Wall[], furniture: Furniture[], rooms: RoomLabel[]): Promise<Violation[]> {
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
        2. Wet zones (Kitchen, Bathroom) CANNOT be expanded over living areas (Living, Bedroom) of neighbors below.
        3. Bathrooms/Toilets cannot be placed over Kitchens or Living rooms.
        4. Gas stoves requires a door between kitchen and living room if there is no partition.
        
        Data:
        Walls: ${JSON.stringify(walls)}
        Furniture: ${JSON.stringify(furniture)}
        Room Zones: ${JSON.stringify(enrichedRooms)}
        
        Return a JSON array of violations. Each object: { "id": string, "severity": "critical"|"warning"|"info", "title": string, "description": string, "relatedWallId": string (optional) }.
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
      console.error("Gemini Compliance Check Failed:", error);
      return [{
        id: 'err1',
        severity: 'warning',
        title: 'Ошибка проверки',
        description: 'Не удалось связаться с ИИ сервисом. Проверьте соединение или API ключ.'
      }];
    }
  },

  /**
   * Generates a renovation idea based on a text prompt
   */
  async generateIdeas(userPrompt: string, currentWalls: Wall[]): Promise<string> {
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
      return "Ошибка генерации идей.";
    }
  }
};
