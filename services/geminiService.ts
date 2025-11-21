
import { GoogleGenAI } from "@google/genai";
import { GiftSuggestionResponse } from '../types';

// Initialize the Gemini API client
// Nota: Si la API Key falla o se agota la cuota, el sistema usará automáticamente el modo offline.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'dummy_key_to_force_fallback' });

// Datos de respaldo de alta calidad (Modo Offline / Catálogo Exclusivo)
const OFFLINE_SUGGESTIONS = [
  {
    imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=1000&auto=format&fit=crop",
    title: "Anillo Legado Imperial",
    description: "Una pieza atemporal forjada en oro de 18k. Su diseño entrelazado simboliza la perseverancia y la unión de la fuerza con la elegancia. Perfecto para alguien que construye su propio destino."
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=1000&auto=format&fit=crop",
    title: "Collar Horizonte Dorado",
    description: "Inspirado en los amaneceres que prometen nuevas oportunidades. Este collar con pendiente minimalista captura la luz para recordar que brillar es una decisión diaria."
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop",
    title: "Pendientes Fuerza Serena",
    description: "El equilibrio perfecto entre audacia y sofisticación. Estos pendientes están diseñados para la mujer moderna que lidera con el ejemplo y brilla sin esfuerzo."
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1617038224531-ab627b5f0f64?q=80&w=1000&auto=format&fit=crop",
    title: "Brazalete Eternidad",
    description: "Un diseño continuo sin principio ni fin, representando la resiliencia infinita. Oro sólido pulido a mano para un acabado espejo inigualable."
  }
];

/**
 * Función auxiliar para simular tiempo de espera y dar sensación de procesamiento
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getGiftSuggestion = async (description: string): Promise<GiftSuggestionResponse> => {
  // 1. PLAN A: Intentar generar Imagen con IA
  try {
    // Si no hay API KEY real configurada, saltar directamente al fallback para evitar timeout
    if (!process.env.API_KEY || process.env.API_KEY === 'undefined') throw new Error("No API Key");

    console.log("Iniciando diseño con IA...");
    
    const prompt = `
      Diseña una imagen fotorrealista de una joya exclusiva de alta gama (anillo, collar, pulsera, etc) para la marca "Forjado en Oro".
      La joya debe estar diseñada específicamente basándose en esta personalidad/descripción del cliente: "${description}".
      Estilo visual: Fotografía de producto de lujo, macro, iluminación cinematográfica, fondo oscuro elegante. 
      Materiales: Oro amarillo o blanco, piedras preciosas sutiles.
      IMPORTANTE: Proporciona un breve texto explicando el nombre de la pieza y por qué encaja.
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

    if (!imageUrl) throw new Error("No image generated in Plan A");

    const titleMatch = textContent.match(/Nombre:?\s*(.+?)(\n|$)/i) || textContent.split('\n')[0]; 
    const title = titleMatch ? (typeof titleMatch === 'string' ? titleMatch : titleMatch[1]) : "Diseño Exclusivo IA";
    
    return {
      imageUrl: imageUrl,
      title: title.replace(/[*"]/g, '').trim(),
      description: textContent.replace(title, '').trim() || "Diseño único basado en tu descripción."
    };

  } catch (planAError: any) {
    // Si el error es de cuota (429), no saturamos la consola con warnings, solo procedemos.
    const isQuotaError = planAError.toString().includes('429') || planAError.message?.includes('429');
    
    if (!isQuotaError) {
      console.warn("Nota: IA de imagen no disponible momentáneamente, cambiando a estrategia alternativa.");
    }

    // 2. PLAN B: Intentar Texto (más ligero)
    try {
        if (!process.env.API_KEY || process.env.API_KEY === 'undefined') throw new Error("No API Key");

      const textPrompt = `
        Eres el diseñador experto de "Forjado en Oro".
        El cliente quiere una joya basada en: "${description}".
        Genera un JSON con:
        {
          "title": "Nombre Creativo de la Joya",
          "description": "Descripción seductora y breve (máx 40 palabras)."
        }
      `;

      const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt,
        config: { responseMimeType: "application/json" }
      });

      const jsonText = textResponse.text || "{}";
      const parsed = JSON.parse(jsonText);

      return {
        imageUrl: "https://images.unsplash.com/photo-1617038224531-ab627b5f0f64?q=80&w=1000&auto=format&fit=crop",
        title: parsed.title || "Diseño Conceptual",
        description: (parsed.description || "Una pieza exclusiva diseñada conceptualmente para ti.")
      };

    } catch (planBError) {
      // 3. PLAN C (ULTIMATE FALLBACK): Modo Catálogo Offline
      // Esperamos un poco para simular que la IA "pensó" y dar una mejor UX
      await delay(1500);
      
      // Selección aleatoria inteligente basada en la longitud de la descripción (pseudo-aleatorio)
      const index = description.length % OFFLINE_SUGGESTIONS.length;
      const fallback = OFFLINE_SUGGESTIONS[index];
      
      return {
        ...fallback,
        description: fallback.description + " (Selección exclusiva de nuestra colección privada)."
      };
    }
  }
};
