import React, { useState, useEffect } from 'react';
import { db, ROOT } from '../../lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Route as RouteIcon, MapPin, Trash, Bike } from 'lucide-react';
import { Bairro, Pedido } from '../../types';
import { formatMoney } from '../../lib/utils';
import { useNotification } from '../NotificationProvider';

export default function TabEntregas() {
  const { showToast, showConfirm } = useNotification();
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [emRota, setEmRota] = useState<Pedido[]>([]);

  useEffect(() => {
    const unsubB = onValue(ref(db, `${ROOT}/bairros`), (snap) => {
      const v = snap.val();
      if (v) {
         if (Array.isArray(v)) setBairros(v);
         else setBairros(Object.values(v));
      }
    });
    
    const unsubP = onValue(ref(db, `${ROOT}/pedidos`), (snap) => {
       const v = snap.val();
       if (v) {
         const list = Object.values(v) as Pedido[];
         setEmRota(list.filter(x => x.status === 'despachado'));
       }
    });

    return () => { unsubB(); unsubP(); };
  }, []);

  const handleUpdate = (idx: number, field: keyof Bairro, value: string|number) => {
    const next = [...bairros];
    next[idx] = { ...next[idx], [field]: value };
    setBairros(next);
  };

  const handleRemove = (idx: number) => {
    const bairroNome = bairros[idx]?.nome || 'este bairro';
    showConfirm({
      title: "Excluir Bairro",
      message: `Tem certeza que deseja remover ${bairroNome}? Lembre-se de clicar em "Salvar Alterações" para aplicar as mudanças permanentemente.`,
      confirmText: "Remover",
      cancelText: "Voltar",
      onConfirm: () => {
        const next = [...bairros];
        next.splice(idx, 1);
        setBairros(next);
        showToast(`${bairroNome} removido da lista!`, "info");
      }
    });
  };

  const handleAdd = () => {
    setBairros([...bairros, { nome: '', taxa: 0 }]);
  };

  const handleSave = async () => {
    try {
      const valid = bairros.filter(b => b.nome.trim() !== '');
      await set(ref(db, `${ROOT}/bairros`), valid);
      showToast('Bairros salvos com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white">Entregas e Bairros</h2>
        <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-xl">Salvar Alterações</button>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500" /> Bairros e Taxas</h3>
        
        <div className="space-y-3">
          {bairros.map((b, i) => (
            <div key={i} className="flex gap-4 items-center">
              <input value={b.nome} onChange={(e) => handleUpdate(i, 'nome', e.target.value)} type="text" placeholder="Nome do Bairro" className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200" />
              <input value={b.taxa} onChange={(e) => handleUpdate(i, 'taxa', parseFloat(e.target.value) || 0)} type="number" step="0.5" placeholder="Taxa (R$)" className="w-32 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200" />
              <button onClick={() => handleRemove(i)} className="p-3 text-red-400 hover:bg-slate-900 rounded-xl"><Trash className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
        <button onClick={handleAdd} className="mt-4 text-orange-500 font-bold hover:text-orange-400">+ Adicionar Bairro</button>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Bike className="w-5 h-5 text-amber-500" /> Pedidos Em Rota</h3>
        {emRota.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum pedido em rota.</p>
        ) : (
          <div className="space-y-2">
            {emRota.map(p => (
              <div key={p.id || p.codigo} className="flex justify-between items-center bg-slate-900 p-4 rounded-xl">
                 <div>
                   <p className="font-bold text-white">{p.cliente}</p>
                   <p className="text-xs text-slate-400">{p.bairro} · {p.endereco}</p>
                 </div>
                 <div className="flex items-center gap-4">
                   {p.telefone && (() => {
                     const telDigits = p.telefone.replace(/\D/g, '');
                     const waNumber = telDigits.startsWith('55') ? telDigits : `55${telDigits}`;
                     return (
                       <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-400">
                         <i className="fa-brands fa-whatsapp text-xl"></i>
                       </a>
                     );
                   })()}
                   <span className="text-orange-500 font-extrabold">{formatMoney((p.subtotal||0)+(p.taxa||0))}</span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
