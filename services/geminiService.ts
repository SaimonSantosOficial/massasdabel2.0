import { GoogleGenAI } from "@google/genai";
import { PASTAS, SAUCES, FLAVORS, COMPLEMENTS, ADDONS } from '../constants';

// Fix: Strictly follow guidelines for API key usage (must use process.env.API_KEY directly)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getChefRecommendation = async (userPreference: string): Promise<string> => {
  // Fix: Removed manual API key check as per guidelines; assume environment is valid.
  
  const menuContext = `
    Nós somos a "Massas da Bel". Nosso cardápio:
    Massas: ${PASTAS.map(p => p.name).join(', ')}.
    Molhos: ${SAUCES.map(s => s.name).join(', ')}.
    Sabores (Proteínas): ${FLAVORS.map(f => f.name).join(', ')}.
    Complementos Grátis: ${COMPLEMENTS.join(', ')}.
    Adicionais Pagos: ${ADDONS.map(a => a.name).join(', ')}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Você é o "Chef Virtual da Bel", um especialista em massas italianas com um toque brasileiro.
        Use o contexto do cardápio abaixo para sugerir UMA combinação deliciosa para o cliente.
        
        Contexto do Cardápio:
        ${menuContext}
        
        Preferência do usuário: "${userPreference}"
        
        Se a preferência for vaga (ex: "algo picante", "estou com muita fome"), sugira algo criativo usando SOMENTE os itens do menu.
        Seja breve, amigável e vendedor. Responda em português.
        Não invente ingredientes que não estão na lista.
        Formate a resposta como uma sugestão direta.
      `,
    });
    // Fix: Access text property directly
    return response.text || "Que tal experimentar nosso Penne com Molho Branco e Frango? É um clássico!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Estou tendo problemas para pensar em uma receita agora, mas garanto que qualquer escolha será deliciosa!";
  }
};