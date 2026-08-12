import React from 'react';
import { Pedido, Prato } from '../../types';
import { cn, formatMoney } from '../../lib/utils';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { db, ROOT } from '../../lib/firebase';
import { ref, update } from 'firebase/database';
import { useDataStore } from '../../store/useDataStore';
import TempoDecorrido from './TempoDecorrido';

export default function ModalPedidoDetalhe({ pedidoId, pedido, onClose }: { pedidoId: string, pedido: Pedido, onClose: () => void }) {
  const { menuData } = useDataStore();
  const [expandedPratos, setExpandedPratos] = React.useState<Record<number, boolean>>({ 0: true });
  
  const handleStatusChange = async (st: string) => {
    await update(ref(db, `${ROOT}/pedidos/${pedidoId}`), { status: st });
    if (pedido.codigo) await update(ref(db, `${ROOT}/pedidoCodigos/${pedido.codigo}`), { status: st, updatedAt: Date.now() });
    onClose();
  };

  let parsedCart: Prato[] | null = null;
  try {
    if (pedido.cartJson) parsedCart = JSON.parse(pedido.cartJson);
  } catch (e) {}

  const getPratoIngredientes = (prato: Prato) => {
    const list: { category: string; items: { name: string; img?: string }[] }[] = [];

    // 1. Massas
    const massas = prato.massas && prato.massas.length > 0 
      ? prato.massas 
      : (prato.massa ? prato.massa.split(' + ') : []);
    if (massas.length > 0) {
      list.push({
        category: "Massas",
        items: massas.map(m => ({
          name: m,
          img: menuData.massasImgs?.[m]
        }))
      });
    }

    // 2. Molhos
    if (prato.molhos && prato.molhos.length > 0) {
      list.push({
        category: `Molhos (${prato.qtdMolho || 'Médio'})`,
        items: prato.molhos.map(m => ({
          name: m,
          img: menuData.molhosImgs?.[m]
        }))
      });
    }

    // 3. Sabores
    if (prato.sabores && prato.sabores.length > 0) {
      list.push({
        category: "Sabores / Recheios",
        items: prato.sabores.map(s => ({
          name: s.nome,
          img: s.img
        }))
      });
    }

    // 4. Adicionais
    if (prato.adicionais && prato.adicionais.length > 0) {
      list.push({
        category: "Adicionais",
        items: prato.adicionais.map(a => ({
          name: a.nome,
          img: a.img
        }))
      });
    }

    // 5. Bebidas
    if (prato.bebidas && prato.bebidas.length > 0) {
      list.push({
        category: "Bebidas",
        items: prato.bebidas.map(b => ({
          name: b.nome,
          img: b.img
        }))
      });
    }

    // 6. Complementos
    if (prato.complementos && prato.complementos.length > 0) {
      list.push({
        category: "Complementos",
        items: prato.complementos.map(cName => {
          const matchingComp = menuData.complementos?.find(c => c.nome === cName);
          return {
            name: cName,
            img: matchingComp?.img
          };
        })
      });
    }

    return list;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 p-6 text-center border-b border-slate-700 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mb-3">
             <i className="fa-solid fa-user text-2xl"></i>
          </div>
          <h4 className="text-xl font-extrabold text-white tracking-tight">{pedido.cliente || 'Cliente'}</h4>
          {pedido.codigo && <p className="text-2xl font-black text-orange-500 tracking-widest mt-1">#{pedido.codigo}</p>}
          {pedido.createdAt && (
            <p className="text-xs font-semibold text-slate-400 mt-2 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Pedido feito às {new Date(pedido.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <TempoDecorrido createdAt={pedido.createdAt} status={pedido.status} />
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4 bg-slate-900/50">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Endereço</p>
            <p className="text-sm text-slate-200">{pedido.endereco} {pedido.bairro ? `- ${pedido.bairro}` : ''}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Pagamento</p>
            <p className="text-sm text-slate-200">{pedido.pagamento || '—'} {pedido.trocoPara && ` (Troco para ${pedido.trocoPara})`}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total</p>
            <p className="text-lg font-black text-orange-500">{formatMoney((pedido.subtotal||0)+(pedido.taxa||0))}</p>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Itens do Pedido</h4>
            {parsedCart ? (
              <div className="space-y-4">
                {parsedCart.map((prato, i) => {
                  const ingredientsGroups = getPratoIngredientes(prato);
                  const isExpanded = !!expandedPratos[i];
                  return (
                    <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700/80 shadow-md overflow-hidden transition-all duration-200">
                       <button
                         type="button"
                         onClick={() => setExpandedPratos(prev => ({ ...prev, [i]: !prev[i] }))}
                         className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors focus:outline-none"
                       >
                         <div className="flex items-center gap-2.5">
                           <div className={cn("p-1 rounded-lg transition-colors", isExpanded ? "bg-orange-500/10 text-orange-500" : "bg-slate-900/60 text-slate-400")}>
                             {isExpanded ? (
                               <ChevronUp className="w-4 h-4" />
                             ) : (
                               <ChevronDown className="w-4 h-4" />
                             )}
                           </div>
                           <p className="text-orange-500 font-black text-sm uppercase tracking-wider">Prato #{i+1} ({prato.tamanho})</p>
                         </div>
                         <p className="text-white font-bold text-sm bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">{formatMoney(prato.total)}</p>
                       </button>

                       {isExpanded && (
                         <div className="p-4 pt-0 border-t border-slate-700/40 space-y-4 mt-3">
                           {ingredientsGroups.map((group, groupIdx) => (
                             <div key={groupIdx} className="space-y-2">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-orange-500 pl-2">{group.category}</p>
                               <div className="grid grid-cols-2 gap-2">
                                 {group.items.map((item, itemIdx) => (
                                   <div key={itemIdx} className="bg-slate-900/60 border border-slate-700/30 p-2 rounded-xl flex items-center gap-2.5 hover:border-slate-700 transition-colors">
                                     <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                                       {item.img ? (
                                         <img src={item.img} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                       ) : (
                                         <span className="text-slate-500 text-xs">🥘</span>
                                       )}
                                     </div>
                                     <div className="min-w-0 flex-1">
                                       <p className="text-xs font-semibold text-slate-100 truncate" title={item.name}>{item.name}</p>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
                 <p className="text-xs text-amber-500 mb-2 font-bold">Pedido Manual / Sem imagens</p>
                 <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{pedido.itens}</pre>
              </div>
            )}
            
            {pedido.notas && (
              <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                 <p className="text-xs font-bold text-slate-500 uppercase mb-1">Observações</p>
                 <p className="text-sm text-slate-300">{pedido.notas}</p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 p-5 border-t border-slate-700 flex flex-col gap-3 bg-slate-900/80">
          <div className="flex gap-2">
            <select id="modal-status-select" defaultValue={pedido.status} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white font-bold outline-none">
              <option value="novo">Novo</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="despachado">Saiu entrega</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <button onClick={() => {
              const el = document.getElementById('modal-status-select') as HTMLSelectElement;
              handleStatusChange(el.value);
            }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5" />
            </button>
          </div>
          {pedido.telefone && pedido.codigo && (() => {
            const telDigits = pedido.telefone.replace(/\D/g, '');
            const waNumber = telDigits.startsWith('55') ? telDigits : `55${telDigits}`;
            return (
              <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Olá! Vim do painel Massas da Bel. Seu pedido #${pedido.codigo} está sendo preparado!`)}`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-xl text-center flex justify-center items-center gap-2">
                <i className="fa-brands fa-whatsapp"></i> WhatsApp
              </a>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
