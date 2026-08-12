import React, { useState } from 'react';
import { Pedido } from '../../types';
import { db, ROOT } from '../../lib/firebase';
import { ref, update, push, set, get } from 'firebase/database';
import { X, Save } from 'lucide-react';
import { useNotification } from '../NotificationProvider';

export default function ModalPedido({ pedidoId, pedido, onClose }: { pedidoId?: string, pedido?: Pedido, onClose: () => void }) {
  const { showToast } = useNotification();
  const [data, setData] = useState<Partial<Pedido>>(pedido || {
    cliente: '',
    telefone: '',
    endereco: '',
    bairro: '',
    itens: '',
    subtotal: 0,
    taxa: 0,
    pagamento: '',
    status: 'novo',
    notas: ''
  });

  const handleSave = async () => {
    if (!data.cliente) {
      showToast("Nome do cliente é obrigatório!", "warning");
      return;
    }
    try {
      if (pedidoId) {
        // Edit
        await update(ref(db, `${ROOT}/pedidos/${pedidoId}`), data);
        if (pedido?.codigo && data.status) {
          await update(ref(db, `${ROOT}/pedidoCodigos/${pedido.codigo}`), { status: data.status, updatedAt: Date.now() });
        }
        showToast("Pedido atualizado com sucesso!", "success");
      } else {
        // Create manual
        let cod = '';
        for (let i = 0; i < 20; i++) {
          const c = String(Math.floor(1000 + Math.random() * 9000));
          const s = await get(ref(db, `${ROOT}/pedidoCodigos/${c}`));
          if (!s.val()) { cod = c; break; }
        }
        if (!cod) cod = String(Date.now()).slice(-4);

        const newRef = push(ref(db, `${ROOT}/pedidos`));
        const payload = {
          ...data,
          codigo: cod,
          createdAt: Date.now(),
          source: 'manual'
        };
        await set(newRef, payload);
        await set(ref(db, `${ROOT}/pedidoCodigos/${cod}`), {
          pedidoId: newRef.key,
          status: data.status,
          updatedAt: Date.now()
        });
        showToast("Pedido criado com sucesso!", "success");
      }
      onClose();
    } catch (e: any) {
      showToast("Erro ao salvar: " + e.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-black text-xl text-white">{pedidoId ? 'Editar Pedido' : 'Novo Pedido'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pedidoId && pedido?.codigo && (
             <div className="mb-2">
               <label className="text-xs font-bold text-slate-400 uppercase">Código</label>
               <input type="text" readOnly className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-orange-500 font-mono font-black mt-1" value={`#${pedido.codigo}`} />
             </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Cliente</label>
              <input value={data.cliente} onChange={e=>setData({...data, cliente: e.target.value})} type="text" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Telefone</label>
              <input value={data.telefone} onChange={e=>setData({...data, telefone: e.target.value})} type="text" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Endereço</label>
              <input value={data.endereco} onChange={e=>setData({...data, endereco: e.target.value})} type="text" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Bairro</label>
              <input value={data.bairro} onChange={e=>setData({...data, bairro: e.target.value})} type="text" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Itens / Resumo</label>
            <textarea value={data.itens} onChange={e=>setData({...data, itens: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1 h-24" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Subtotal R$</label>
              <input type="number" step="0.5" value={data.subtotal} onChange={e=>setData({...data, subtotal: parseFloat(e.target.value)||0})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Taxa R$</label>
              <input type="number" step="0.5" value={data.taxa} onChange={e=>setData({...data, taxa: parseFloat(e.target.value)||0})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Pagamento</label>
              <select value={data.pagamento} onChange={e=>setData({...data, pagamento: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1">
                 <option value="">--</option>
                 <option value="Pix">Pix</option>
                 <option value="Dinheiro">Dinheiro</option>
                 <option value="Cartão de Crédito">Cartão de Crédito</option>
                 <option value="Cartão de Débito">Cartão de Débito</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
              <select value={data.status} onChange={e=>setData({...data, status: e.target.value as any})} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1">
                 <option value="novo">Novo</option>
                 <option value="preparando">Preparando</option>
                 <option value="pronto">Pronto</option>
                 <option value="despachado">Saiu entrega</option>
                 <option value="entregue">Entregue</option>
                 <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-400 uppercase">Observações</label>
             <input value={data.notas} onChange={e=>setData({...data, notas: e.target.value})} type="text" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 mt-1" />
          </div>

        </div>

        <div className="p-5 border-t border-slate-700 bg-slate-900/50 flex gap-4">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">Cancelar</button>
          <button onClick={handleSave} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2"><Save className="w-5 h-5"/> Salvar</button>
        </div>
      </div>
    </div>
  );
}
