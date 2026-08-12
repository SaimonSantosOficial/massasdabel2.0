import { Clock, Download, Bike } from 'lucide-react';

export function Header() {
  return (
    <header className="relative h-72 bg-slate-900 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
        alt="Fundo" 
        className="w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
      
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-brand p-1">
          <img 
            src="https://wsrv.nl/?url=drive.google.com/uc?id=1GnljzD2SK_5vJst8HZW3DUmbe6IZ86pq" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="bg-brand text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest animate-pulse">
            Entrega & Retirada
          </div>
          <button className="hidden bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-white/30 transition-all items-center gap-2">
            <Download size={14} /> Instalar App
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 text-white">
        <h1 className="text-3xl font-black tracking-tight mb-2">Massas da Bel</h1>
        <div className="space-y-1">
          <p className="text-[11px] text-slate-300 flex items-center gap-2 font-medium">
            <Clock size={12} className="text-brand" /> Terça a Sábado: 18:00 às 23:00
          </p>
          <p className="text-[11px] text-slate-300 flex items-center gap-2 font-medium">
            <Bike size={12} className="text-brand" /> Entrega Rápida • Maranguape
          </p>
        </div>
      </div>
    </header>
  );
}
