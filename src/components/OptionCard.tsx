import { Check, Utensils } from 'lucide-react';
import { MenuItem } from '../types';

interface OptionCardProps {
  item: MenuItem | string;
  selected: boolean;
  onClick: () => void;
  type?: 'massa' | 'molho' | 'adicional' | 'sabor' | 'complemento';
  disabled?: boolean;
  priceLabel?: string;
}

export function OptionCard({ item, selected, onClick, type = 'massa', disabled = false, priceLabel }: OptionCardProps) {
  const nome = typeof item === 'string' ? item : item.nome;
  const img = typeof item === 'string' ? undefined : item.img;
  
  if (type === 'adicional' || type === 'sabor') {
    return (
      <div 
        onClick={onClick}
        className={`option-card border-2 rounded-3xl p-3 cursor-pointer flex items-center gap-4 bg-white shadow-sm transition-all ${selected ? 'border-brand bg-brand-light !translate-y-[-2px] shadow-brand/10' : 'border-slate-100'} ${disabled && !selected ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0">
          {img ? <img src={img} alt={nome} className="w-full h-full object-cover" /> : null}
        </div>
        <div className="flex-1 flex justify-between pr-2 gap-2">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${selected ? 'bg-brand border-brand' : 'bg-white border-slate-200'}`}>
                <Check size={12} className={`text-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
              </div>
              <span className="font-bold text-slate-800 text-sm leading-tight">{nome}</span>
            </div>
          </div>
          {priceLabel && (
            <div className="flex items-center shrink-0">
               <span className={`text-brand text-xs font-black ${type === 'sabor' ? 'bg-brand/5 px-3 py-2 rounded-xl' : ''}`}>
                 {priceLabel}
               </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'complemento') {
    return (
      <div 
        onClick={onClick}
        className={`option-card border-2 rounded-3xl p-2 cursor-pointer flex items-center gap-3 bg-white shadow-sm transition-all ${selected ? 'border-brand bg-brand-light !translate-y-[-2px] shadow-brand/10' : 'border-slate-100'} ${disabled && !selected ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-slate-100 border relative">
          {img && <img src={img} alt={nome} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-brand border-brand' : 'bg-white border-slate-200'}`}>
            <Check size={10} className={`text-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
          </div>
          <span className="text-slate-800 font-bold text-xs leading-tight">{nome}</span>
        </div>
      </div>
    );
  }

  // default: massa, molho
  return (
    <div 
      onClick={onClick}
      className={`option-card bg-white border-2 rounded-3xl overflow-hidden cursor-pointer shadow-sm transition-all ${selected ? 'border-brand bg-brand-light !translate-y-[-2px] shadow-brand/10' : 'border-slate-100'}`}
    >
      <div className="h-32 w-full bg-slate-100 relative">
        {img ? (
          <img src={img} alt={nome} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Utensils size={32} />
          </div>
        )}
      </div>
      <div className="p-3 flex items-center justify-between">
        <span className="font-black text-slate-700 text-xs">{nome}</span>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'bg-brand border-brand' : 'bg-white border-slate-200'}`}>
          <Check size={12} className={`text-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
        </div>
      </div>
    </div>
  );
}
