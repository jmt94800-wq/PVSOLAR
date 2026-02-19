
import { GoogleGenAI } from "@google/genai";
import { ClientProfile, QuoteConfig } from "./types";

export const getEnergyAnalysis = async (
  profile: ClientProfile, 
  config: QuoteConfig, 
  financials: {
    totalMaterialHT: number,
    totalMaterialTTC: number,
    installHT: number,
    installTTC: number,
    grandTotal: number,
    discountAmount: number
  }
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "### ⚠️ Clé API manquante\n\nVeuillez configurer votre clé API pour bénéficier de l'analyse IA.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Filtrage ultra-strict : uniquement les articles facturés
    const itemsFactures = profile.items.filter(i => i.quantite > 0 && (i.unitPrice || 0) > 0);

    const prompt = `
      TU ES UN SYSTÈME D'AUDIT SÉCURISÉ. TU NE DOIS UTILISER QUE LES DONNÉES FOURNIES CI-DESSOUS.
      INTERDICTION FORMELLE : N'utilise pas de valeurs par défaut (ex: 425W) si elles ne sont pas spécifiées dans la CONFIGURATION RÉELLE.

      === CONFIGURATION RÉELLE (VALEURS SOURCES) ===
      - PUISSANCE PANNEAU UTILISÉE : ${config.panelPowerW} W (⚠️ C'est la SEULE valeur valable. N'évoque jamais 425W si ce n'est pas ce chiffre).
      - RENDEMENT SYSTÈME : ${config.efficiencyPercent} %
      - CONSOMMATION CIBLE : ${profile.totalDailyKWh.toFixed(2)} kWh/jour
      - PUISSANCE CRÊTE REQUISE : ${profile.totalMaxW} W

      === BILAN FINANCIER COMPLET (VÉRITÉ TERRAIN) ===
      1. MATÉRIEL HT : ${financials.totalMaterialHT.toFixed(2)} $ (Inclut déjà la marge de ${config.marginPercent}%)
      2. REMISE MATÉRIEL : -${financials.discountAmount.toFixed(2)} $
      3. TAXES MATÉRIEL : ${(financials.totalMaterialTTC - (financials.totalMaterialHT - financials.discountAmount)).toFixed(2)} $
      4. INSTALLATION & MAIN D'ŒUVRE HT : ${financials.installHT.toFixed(2)} $ (⚠️ OBLIGATOIRE : Doit être inclus dans le coût total)
      5. TAXES INSTALLATION : ${(financials.installTTC - financials.installHT).toFixed(2)} $
      6. MONTANT TOTAL NET À PAYER (TTC) : ${financials.grandTotal.toFixed(2)} $ (C'est la somme de TOUS les postes ci-dessus)

      === LISTE DES ARTICLES FACTURÉS ===
      ${itemsFactures.map(i => `- ${i.appareil} : Qte ${i.quantite} x P.U. Base ${i.unitPrice}$ HT`).join('\n')}
      - SERVICE : Installation et Main d'œuvre (${financials.installHT.toFixed(2)}$ HT)

      === INSTRUCTIONS D'ANALYSE ===
      1. CALCUL DU ROI : Calcule le temps de retour sur investissement en divisant le MONTANT TOTAL TTC (${financials.grandTotal.toFixed(2)}$) par l'économie générée (base: 0.50$/kWh). 
         *Note: Économie journalière = ${profile.totalDailyKWh.toFixed(2)} kWh * 0.50$ = ${(profile.totalDailyKWh * 0.50).toFixed(2)}$ / jour.*
      2. CONTRÔLE DE COHÉRENCE : 
         - Vérifie si les articles listés permettent de produire l'énergie nécessaire avec des panneaux de ${config.panelPowerW}W.
         - Confirme que le prix final de ${financials.grandTotal.toFixed(2)}$ inclut bien les ${financials.installTTC.toFixed(2)}$ de l'installation.
      3. CRITIQUE TECHNIQUE : L'onduleur et les batteries sont-ils adaptés au pic de ${profile.totalMaxW}W ?
      4. ALERTES : Signale si un élément vital (onduleur/batterie/panneau) manque dans la liste des articles facturés.

      Rédige une réponse structurée en Markdown. Ne mentionne JAMAIS de puissance de panneau autre que ${config.panelPowerW}W.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error: any) {
    console.error("Erreur Gemini:", error);
    return `### ⚠️ Analyse indisponible\n\n**Erreur :** ${error.message}`;
  }
};
