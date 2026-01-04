
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async suggestProgram(eventName: string, description: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a 4-item program schedule for the event: "${eventName}". Description: "${description}". For each segment, provide a title, short description, and specific actions/technical cues (like "turn on stage lights", "start intro music").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startTime: { type: Type.STRING, description: "HH:mm format" },
              endTime: { type: Type.STRING, description: "HH:mm format" },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              actions: { type: Type.STRING, description: "Technical cues or specific actions" },
              durationMinutes: { type: Type.NUMBER }
            },
            required: ["startTime", "endTime", "title", "description", "actions"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("AI parse error", e);
      return [];
    }
  }

  async suggestTasks(eventName: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 5 critical setup tasks for the event: "${eventName}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  }
}

export const gemini = new GeminiService();
