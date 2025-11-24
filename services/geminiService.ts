import { GoogleGenAI } from "@google/genai";
import { ACADEMIC_SYSTEM_INSTRUCTION } from '../constants';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAcademicPaper = async (topic: string, overview: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Using gemini-2.5-flash for speed and reliability in a demo context, 
    // but the system prompt is engineered to force high-quality output.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: ACADEMIC_SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly higher for "variance" and creativity in sentence structure
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: `TOPIC: ${topic}\nOVERVIEW: ${overview}\n\nExpand on this seed using logical inference and your internal knowledge base to fill in the "Deep Research" gaps.` }
          ]
        }
      ]
    });

    return response.text || "Error: No content generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};