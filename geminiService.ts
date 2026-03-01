
import { GoogleGenAI } from "@google/genai";
import { ClientProfile, Visit } from "./types";

/**
 * Service pour interagir avec Gemini pour l'analyse des visites
 * Utilise la clé API fournie par l'environnement Vercel.
 */
export const generateAnalysis = async (visit: Visit, client: ClientProfile) => {
  // Initialisation avec la clé API de l'environnement (Configurée dans Vercel)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    En tant qu'expert en ingénierie photovoltaïque, analyse cette visite technique pour dimensionner une installation solaire :
    
    CLIENT: ${client.name}
    LIEU: ${visit.notes || 'Non spécifié'}
    
    MATÉRIELS RELEVÉS SUR SITE:
    ${JSON.stringify(visit.requirements, null, 2)}
    
    RAPPORT DE L'AGENT:
    ${visit.report || 'Aucun rapport détaillé fourni.'}
    
    OBJECTIFS:
    1. Résumer la consommation énergétique estimée.
    2. Proposer un dimensionnement de kit solaire adapté (Puissance Crête recommandée).
    3. Identifier les points de vigilance techniques.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    // Extraction directe du texte selon les guidelines @google/genai
    return response.text;
  } catch (error) {
    console.error("Erreur d'analyse Gemini:", error);
    throw new Error("L'analyse IA a échoué. Vérifiez votre configuration API.");
  }
};
