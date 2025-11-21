
import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Download, AlertCircle } from 'lucide-react';
import { getGiftSuggestion } from '../services/geminiService';
import { GiftSuggestionResponse } from '../types';

export const GiftAssistant: React.FC = () => {
  const [description, setDescription] = useState('');
  const [suggestion, setSuggestion] = useState<GiftSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuggestion(null);

    try {
      const result = await getGiftSuggestion(description);
      setSuggestion(result);
    } catch (err: any) {
      console.error("Error en componente:", err);
      setErrorMessage(err.message || "Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const sendToWhatsApp = () => {
    if (!suggestion) return;
    const text = `Hola Forjado en Oro. Su Inteligencia Artificial me sugirió el diseño "${suggestion.title}". Me gustaría cotizar una pieza con estas características: ${suggestion.description}`;
    window.open(`https://wa.me/3003214664?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section id="ai-assistant" className="py-24 bg-stone-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-stone-700/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-stretch">
          
          {/* Left Column: Input */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-300 text-xs uppercase tracking-widest mb-6 w-fit">
              <Sparkles className="w-3 h-3" />
              Diseñador IA Gemini
            </div>
            <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
              Diseña tu <span className="text-gold-400 italic">Joya Ideal</span>
            </h2>
            <p className="text-stone-300 text-lg mb-8 font-light leading-relaxed">
              Describe la personalidad, gustos o la historia de quien recibirá la joya. 
              Nuestra IA visualizará la pieza perfecta para esa persona especial.
            </p>
            
            <div className="bg-white/5 backdrop-blur-sm p-1 rounded-lg border border-white/10 focus-within:border-gold-500/50 transition-colors">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Es una mujer emprendedora, le gusta la naturaleza, el color verde esmeralda y el estilo minimalista pero elegante..."
                className="w-full bg-transparent text-white p-4 min-h-[120px] outline-none placeholder:text-stone-500 resize-none"
              />
              <div className="flex justify-between items-center p-2">
                 <span className="text-xs text-stone-500 px-2 hidden md:inline-block">
                    Powered by Gemini 2.5 Flash
                 </span>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !description.trim()}
                  className={`px-8 py-3 rounded bg-gold-500 text-stone-900 font-bold uppercase tracking-wider text-sm hover:bg-gold-400 transition-all flex items-center gap-2 ${
                    loading || !description.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(204,160,62,0.4)]'
                  }`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Diseñando...' : 'Generar Diseño'}
                </button>
              </div>
            </div>
            
            {errorMessage && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:w-1/2 w-full flex flex-col">
            <div className="flex-grow relative min-h-[400px] bg-black/20 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/80 z-20 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
                  <p className="text-gold-100 text-sm tracking-widest animate-pulse">FORJANDO SU DISEÑO...</p>
                  <p className="text-stone-500 text-xs mt-2">Esto puede tomar unos segundos</p>
                </div>
              )}
              
              {suggestion ? (
                <div className="relative w-full h-full flex flex-col animate-fade-in">
                   <div className="relative flex-grow bg-stone-800 flex items-center justify-center overflow-hidden">
                      <img 
                        src={suggestion.imageUrl} 
                        alt="Diseño generado por IA" 
                        className="w-full h-full object-contain max-h-[400px]"
                      />
                   </div>
                  <div className="p-6 bg-white text-stone-900">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-serif font-bold text-gold-700">{suggestion.title}</h3>
                      {!suggestion.imageUrl.startsWith('http') && (
                        <a 
                          href={suggestion.imageUrl} 
                          download={`ForjadoEnOro-${Date.now()}.png`}
                          className="text-stone-400 hover:text-gold-600 transition-colors"
                          title="Descargar imagen"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 mb-6 line-clamp-3">{suggestion.description}</p>
                    <button
                      onClick={sendToWhatsApp}
                      className="w-full py-4 bg-stone-900 text-white uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center justify-center gap-3 group"
                    >
                      <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                      Cotizar este diseño
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-stone-600">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm uppercase tracking-widest opacity-50">Su diseño exclusivo aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
