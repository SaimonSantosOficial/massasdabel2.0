import React, { useState, useEffect } from 'react';
import { Pedido } from '../../types';
import { formatMoney } from '../../lib/utils';
import { ref, update, remove } from 'firebase/database';
import { db, ROOT } from '../../lib/firebase';
import { Eye, Edit, Trash, Plus, Check, Search, X } from 'lucide-react';
import ModalPedido from './ModalPedido';
import ModalPedidoDetalhe from './ModalPedidoDetalhe';
import { useNotification } from '../NotificationProvider';
import TempoDecorrido from './TempoDecorrido';

export default function TabPedidos({ pedidos }: { pedidos: Record<string, Pedido> }) {
  const { showConfirm, showToast } = useNotification();
  const [filter, setFilter] = useState('');
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalViewId, setModalViewId] = useState<string | null>(null);

  // Sound notification
  const [lastCount, setLastCount] = useState(Object.keys(pedidos).length);

  useEffect(() => {
    const currentNovos = Object.values(pedidos).filter(p => p.status === 'novo').length;
    // Basic way to play sound if new order arrives (needs user interaction first usually)
    // We just keep this simple for now. 
  }, [pedidos]);

  const isToday = (timestamp?: number) => {
    if (!timestamp) return false;
    const orderDate = new Date(timestamp);
    const today = new Date();
    return orderDate.getDate() === today.getDate() &&
           orderDate.getMonth() === today.getMonth() &&
           orderDate.getFullYear() === today.getFullYear();
  };

  const sorted = Object.entries(pedidos)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .filter(([, p]) => {
      const matchStatus = !filter || p.status === filter;
      const matchDay = !showOnlyToday || isToday(p.createdAt);
      
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query || 
        (p.cliente && p.cliente.toLowerCase().includes(query)) ||
        (p.codigo && p.codigo.toLowerCase().includes(query)) ||
        (p.endereco && p.endereco.toLowerCase().includes(query)) ||
        (p.bairro && p.bairro.toLowerCase().includes(query));

      return matchStatus && matchDay && matchSearch;
    });

  const handleDelete = (id: string, codigo?: string) => {
    showConfirm({
      title: "Excluir Pedido",
      message: `Tem certeza que deseja excluir permanentemente o pedido #${codigo || ''}? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Voltar",
      onConfirm: async () => {
        try {
          await remove(ref(db, `${ROOT}/pedidos/${id}`));
          if (codigo) await remove(ref(db, `${ROOT}/pedidoCodigos/${codigo}`));
          showToast("Pedido excluído com sucesso!", "success");
        } catch (err: any) {
          showToast("Erro ao excluir: " + err.message, "error");
        }
      }
    });
  };

  const handleStatusChange = async (id: string, st: string, codigo?: string) => {
    await update(ref(db, `${ROOT}/pedidos/${id}`), { status: st });
    if (codigo) await update(ref(db, `${ROOT}/pedidoCodigos/${codigo}`), { status: st, updatedAt: Date.now() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Pedidos</h2>
            <p className="text-slate-400 text-sm">Gerencie os pedidos em tempo real.</p>
          </div>
          <button onClick={() => setModalCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-sm w-full sm:w-auto justify-center sm:justify-start">
            <Plus className="w-4 h-4" /> Novo Pedido
          </button>
        </div>

        {/* Filtros e Barra de Pesquisa */}
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, nº pedido, bairro ou endereço..."
              className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-750">
              <button
                onClick={() => setShowOnlyToday(true)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  showOnlyToday
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setShowOnlyToday(false)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !showOnlyToday
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Todos
              </button>
            </div>

            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none flex-1 sm:flex-none"
            >
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="despachado">Saiu entrega</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl border border-blue-500/20 text-slate-300 text-sm">
        <p className="font-bold text-white mb-1">Como usar</p>
        <ul className="list-disc pl-5">
          <li>Toque na <strong className="text-orange-500">lupa</strong> para ver a montagem com fotos.</li>
          <li>Use o dropdown na lista para alterar o status rapidamente.</li>
        </ul>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 && <p className="text-slate-500 text-center py-10">Nenhum pedido encontrado.</p>}
        {sorted.map(([id, p]) => (
          <div key={id} className="bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center justify-between hover:bg-slate-800/80 transition-colors">
            
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                p.status === 'novo' ? 'bg-blue-500/20 text-blue-400' :
                p.status === 'preparando' ? 'bg-purple-500/20 text-purple-400' :
                p.status === 'pronto' ? 'bg-cyan-500/20 text-cyan-400' :
                p.status === 'despachado' ? 'bg-yellow-500/20 text-yellow-400' :
                p.status === 'entregue' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-300'
              }`}>{p.status}</span>
              {p.codigo && <span className="text-orange-500 font-mono text-xs font-bold">#{p.codigo}</span>}
              <div className="w-32 truncate font-bold text-white text-sm" title={p.cliente}>{p.cliente}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span>{new Date(p.createdAt || 0).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                <TempoDecorrido createdAt={p.createdAt} status={p.status} />
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block truncate w-40">{p.bairro} - {p.endereco}</div>
            </div>

            <div className="flex flex-1 sm:flex-none justify-end gap-3 items-center ml-auto">
              <select 
                value={p.status}
                onChange={(e) => handleStatusChange(id, e.target.value, p.codigo)}
                className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white font-semibold outline-none focus:border-orange-500"
              >
                <option value="novo">Novo</option>
                <option value="preparando">Prep.</option>
                <option value="pronto">Pronto</option>
                <option value="despachado">Saiu</option>
                <option value="entregue">Entreg.</option>
                <option value="cancelado">Cancel.</option>
              </select>

              <div className="text-right min-w-[4rem]">
                <p className="text-sm font-extrabold text-orange-500">{formatMoney((p.subtotal||0)+(p.taxa||0))}</p>
                <p className="text-[9px] text-slate-500">{p.pagamento}</p>
              </div>

              <div className="flex gap-1.5">
                <button onClick={() => setModalViewId(id)} className="bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg text-slate-300"><Eye className="w-4 h-4" /></button>
                <button onClick={() => setModalEditId(id)} className="bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg text-slate-300"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(id, p.codigo)} className="bg-red-900/40 hover:bg-red-800 p-1.5 rounded-lg text-red-400"><Trash className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalCreateOpen && <ModalPedido onClose={() => setModalCreateOpen(false)} />}
      {modalEditId && <ModalPedido pedidoId={modalEditId} pedido={pedidos[modalEditId]} onClose={() => setModalEditId(null)} />}
      {modalViewId && <ModalPedidoDetalhe pedido={pedidos[modalViewId]} pedidoId={modalViewId} onClose={() => setModalViewId(null)} />}
    </div>
  );
}
