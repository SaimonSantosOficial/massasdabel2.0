import React, { useState } from 'react';
import { Sparkles, Send, X, ChefHat, Loader2 } from 'lucide-react';
import { getChefRecommendation } from '../services/geminiService';

interface AIChefProps {
  onClose: () => void;
}

export const AIChef: React.FC<AIChefProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setSuggestion('');
    try {
      const result = await getChefRecommendation(input);
      setSuggestion(result);
    } catch (e) {
      setSuggestion("Desculpe, o chef está ocupado na cozinha!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-brand-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Chef Virtual da Bel</h3>
              <p className="text-xs text-brand-100">IA especializada em massas</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-brand-700 p-1 rounded transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          {!suggestion && !loading && (
            <div className="text-center text-gray-500 py-8">
              <ChefHat size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="mb-2">Não sabe o que pedir?</p>
              <p className="text-sm">Diga como você está se sentindo ou o que gosta (ex: "gosto de algo leve", "quero muita carne") e eu montarei o prato perfeito!</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-brand-600">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm font-medium animate-pulse">Consultando o livro de receitas...</p>
            </div>
          )}

          {suggestion && (
            <div className="bg-white border border-brand-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-brand-800 mb-2 flex items-center gap-2">
                <ChefHat size={18} /> Sugestão do Chef:
              </h4>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{suggestion}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ex: Quero algo com frango e bacon..."
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm text-sm"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};