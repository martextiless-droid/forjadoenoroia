
import { GoogleGenAI } from "@google/genai";
import { GiftSuggestionResponse } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Imagen de respaldo elegante por si falla la generación de imagen (Fallback)
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1617038224531-ab627b5f0f64?q=80&w=1000&auto=format&fit=crop";

export const getGiftSuggestion = async (description: string): Promise<GiftSuggestionResponse> => {
  // 1. INTENTO PRINCIPAL: Generar Imagen con IA
  try {
    console.log("Intentando generar imagen con gemini-2.5-flash-image...");
    
    const prompt = `
      Diseña una imagen fotorrealista de una joya exclusiva de alta gama (anillo, collar, pulsera, etc) para la marca "Forjado en Oro".
      La joya debe estar diseñada específicamente basándose en esta personalidad/descripción del cliente: "${description}".
      Estilo visual: Fotografía de producto de lujo, macro, iluminación cinematográfica. Materiales: Oro, piedras preciosas.
      Fondo: Elegante, oscuro o neutro.
      Además de la imagen, proporciona un breve texto explicando el nombre de la pieza y por qué encaja.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    let imageUrl = "";
    let textContent = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          textContent += part.text;
        }
      }
    }

    if (!imageUrl) throw new Error("No image generated");

    const titleMatch = textContent.match(/Nombre:?\s*(.+?)(\n|$)/i) || textContent.split('\n')[0]; 
    const title = titleMatch ? (typeof titleMatch === 'string' ? titleMatch : titleMatch[1]) : "Diseño Exclusivo IA";
    
    return {
      imageUrl: imageUrl,
      title: title.replace(/[*"]/g, '').trim(),
      description: textContent.replace(title, '').trim() || "Diseño único basado en tu descripción."
    };

  } catch (imageError) {
    // 2. PLAN B (FALLBACK): Si falla la imagen (ej. Error 429), usamos solo texto
    console.warn("Falló la generación de imagen (posible cuota excedida). Cambiando a modo texto.", imageError);

    try {
      const textPrompt = `
        Eres el diseñador experto de "Forjado en Oro".
        El cliente quiere una joya basada en: "${description}".
        La generación de imagen falló por alta demanda, pero necesito que describas la joya conceptualmente.
        
        Genera un JSON con este formato (sin markdown):
        {
          "title": "Nombre Creativo de la Joya",
          "description": "Descripción seductora y breve de la joya (máx 40 palabras)."
        }
      `;

      const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Modelo de texto mucho más rápido y estable
        contents: textPrompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const jsonText = textResponse.text || "{}";
      const parsed = JSON.parse(jsonText);

      return {
        imageUrl: FALLBACK_IMAGE, // Usamos la imagen genérica de lujo
        title: parsed.title || "Diseño Conceptual",
        description: (parsed.description || "Una pieza exclusiva diseñada conceptualmente para ti.") + " (Nota: Imagen referencial por alta demanda del sistema de diseño)."
      };

    } catch (textError) {
      console.error("Error fatal en ambos modelos:", textError);
      throw new Error("El servicio de diseño está momentáneamente saturado. Por favor intenta en unos minutos.");
    }
  }
};
