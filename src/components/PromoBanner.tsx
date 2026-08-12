import { Flame, Tag } from 'lucide-react';

export function PromoBanner() {
  const isTuesday = new Date().getDay() === 2;
  
  if (!isTuesday) return null;

  return (
    <div className="bg-gradient-to-br from-brand to-brand-dark text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <Tag size={120} className="absolute -right-6 -bottom-6 text-black/10 rotate-[-15deg] pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-lg font-black tracking-tight mb-2 flex items-center gap-2">
          <span className="bg-yellow-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md animate-bounce">
            <Flame size={16} />
          </span>
          Promoção de Terça-feira!
        </h3>
        <p className="text-sm font-bold opacity-95 mb-3 leading-tight">
          Hoje é dia de promoção aqui no{' '}
          <a href="https://www.instagram.com/massa.sdabel" target="_blank" rel="noreferrer" className="text-yellow-300 underline hover:text-yellow-400 transition-colors">
            @massa.sdabel
          </a>
        </p>
        <p className="text-xs bg-black/20 p-3 rounded-2xl mb-5 font-bold border border-white/10 shadow-inner">
          Confira aqui os preços das macarronadas no tamanho G, hoje na promoção!!!
        </p>

        <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs font-black uppercase tracking-wider">
          <div className="bg-white/10 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/20 flex flex-col justify-center shadow-sm">
            <span className="opacity-80 mb-1 text-[9px] sm:text-[10px]">Frango</span>
            <span className="text-sm sm:text-base text-yellow-300">R$ 19,00</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/20 flex flex-col justify-center shadow-sm">
            <span className="opacity-80 mb-1 text-[9px] sm:text-[10px]">Calabresa</span>
            <span className="text-sm sm:text-base text-yellow-300">R$ 21,00</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/20 flex flex-col justify-center shadow-sm">
            <span className="opacity-80 mb-1 text-[9px] sm:text-[10px]">Carne moída</span>
            <span className="text-sm sm:text-base text-yellow-300">R$ 23,00</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/20 flex flex-col justify-center shadow-sm">
            <span className="opacity-80 mb-1 text-[9px] sm:text-[10px]">Carne do sol</span>
            <span className="text-sm sm:text-base text-yellow-300">R$ 25,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
