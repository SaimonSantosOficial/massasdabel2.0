import React, { useState, useEffect } from "react";
import { db, ROOT } from "../../lib/firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { 
  Users, 
  Search, 
  Trash2, 
  Ban, 
  Unlock, 
  Lock, 
  CheckCircle, 
  Phone, 
  Mail, 
  UserX,
  UserCheck,
  ShoppingBag,
  Award,
  Sparkles,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  BadgeCheck,
  RotateCcw,
  Gift
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useNotification } from "../NotificationProvider";
import { useDataStore } from "../../store/useDataStore";
import { obterBadgesConquistadas, obterProximaBadge, BADGES_DE_MASSAS } from "../../lib/badges";

interface Cliente {
  id: string;
  nome?: string;
  whatsapp?: string;
  email?: string;
  photoURL?: string;
  banido?: boolean;
  bloqueado?: boolean;
  updatedAt?: number;
  fidelidadeResgatados?: number;
  inventarioBrindes?: number;
  fidelidadeAjuste?: number;
}

interface Pedido {
  id: string;
  telefone: string;
  status: string;
  userId?: string;
}

export default function TabClientes() {
  const { showToast, showConfirm } = useNotification();
  const { marketing } = useDataStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClienteBadges, setSelectedClienteBadges] = useState<Cliente | null>(null);

  useEffect(() => {
    // Carrega usuários
    const clientesRef = ref(db, `${ROOT}/users`);
    const unsubClientes = onValue(
      clientesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list: Cliente[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
          setClientes(list);
        } else {
          setClientes([]);
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        showToast("Erro ao carregar clientes.", "error");
        console.error(error);
      }
    );

    // Carrega pedidos
    const pedidosRef = ref(db, `${ROOT}/pedidos`);
    const unsubPedidos = onValue(pedidosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: Pedido[] = Object.keys(data).map((key) => ({
          id: key,
          telefone: data[key].telefone || "",
          status: data[key].status || "",
          userId: data[key].userId || "",
        }));
        setPedidos(list);
      } else {
        setPedidos([]);
      }
    });

    return () => {
      unsubClientes();
      unsubPedidos();
    };
  }, []);

  const handleExcluir = async (uid: string, nome: string) => {
    showConfirm({
      title: "Excluir Conta",
      message: `⚠️ ATENÇÃO: Tem certeza de que deseja EXCLUIR permanentemente a conta de "${nome}"? Esta ação não pode ser desfeita.`,
      confirmText: "Sim, Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await remove(ref(db, `${ROOT}/users/${uid}`));
          showToast(`Conta de ${nome} excluída com sucesso!`, "success");
        } catch (err: any) {
          showToast("Erro ao excluir conta: " + err.message, "error");
        }
      }
    });
  };

  const handleToggleBan = async (uid: string, nome: string, currentBan: boolean) => {
    const action = currentBan ? "desbanir" : "banir";
    showConfirm({
      title: `${currentBan ? "Desbanir" : "Banir"} Cliente`,
      message: `Tem certeza de que deseja ${action} o cliente "${nome}"?`,
      confirmText: "Sim",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await update(ref(db, `${ROOT}/users/${uid}`), {
            banido: !currentBan,
          });
          showToast(`Cliente "${nome}" ${currentBan ? "desbanido" : "banido"} com sucesso!`, "success");
        } catch (err: any) {
          showToast("Erro ao atualizar status de banimento: " + err.message, "error");
        }
      }
    });
  };

  const handleToggleBlock = async (uid: string, nome: string, currentBlock: boolean) => {
    const action = currentBlock ? "desbloquear" : "bloquear";
    showConfirm({
      title: `${currentBlock ? "Desbloquear" : "Bloquear"} Cliente`,
      message: `Tem certeza de que deseja ${action} o cliente "${nome}"?`,
      confirmText: "Sim",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await update(ref(db, `${ROOT}/users/${uid}`), {
            bloqueado: !currentBlock,
          });
          showToast(`Cliente "${nome}" ${currentBlock ? "desbloqueado" : "bloqueado"} com sucesso!`, "success");
        } catch (err: any) {
          showToast("Erro ao atualizar status de bloqueio: " + err.message, "error");
        }
      }
    });
  };

  const handleResetCard = async (cliente: Cliente, entregues: number) => {
    showConfirm({
      title: "Resetar Cartão Fidelidade",
      message: `Tem certeza de que deseja resetar (zerar) o cartão fidelidade do cliente "${cliente.nome}"? O progresso atual será perdido e não poderá ser recuperado.`,
      confirmText: "Sim, Resetar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await update(ref(db, `${ROOT}/users/${cliente.id}`), {
            fidelidadeAjuste: entregues,
            fidelidadeResgatados: 0,
          });
          showToast(`Cartão fidelidade de "${cliente.nome}" foi resetado.`, "success");
        } catch (err: any) {
          showToast("Erro ao resetar cartão: " + err.message, "error");
        }
      }
    });
  };

  const handleClearInventory = async (uid: string, nome: string) => {
    showConfirm({
      title: "Limpar Inventário",
      message: `Tem certeza de que deseja remover TODOS os cartões fidelidade do inventário de "${nome}"? Isso removerá os prêmios já resgatados.`,
      confirmText: "Sim, Remover",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await update(ref(db, `${ROOT}/users/${uid}`), {
            inventarioBrindes: 0,
          });
          showToast(`Inventário de brindes de "${nome}" zerado com sucesso!`, "success");
        } catch (err: any) {
          showToast("Erro ao limpar inventário: " + err.message, "error");
        }
      }
    });
  };

  const handleResetAllCards = async () => {
    showConfirm({
      title: "Resetar Todos os Cartões",
      message: `ATENÇÃO: Você está prestes a resetar (zerar) os cartões fidelidade de TODOS os clientes. O progresso atual de todos os clientes será perdido. Deseja continuar?`,
      confirmText: "Sim, Resetar Todos",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          let count = 0;
          const updates: any = {};
          
          for (const cliente of clientes) {
            const { entregues } = obterDadosPedidos(cliente);
            updates[`users/${cliente.id}/fidelidadeAjuste`] = entregues;
            updates[`users/${cliente.id}/fidelidadeResgatados`] = 0;
            count++;
          }
          
          if (Object.keys(updates).length > 0) {
            await update(ref(db, ROOT), updates);
            showToast(`${count} cartões fidelidade foram resetados.`, "success");
          } else {
            showToast(`Nenhum cliente para resetar.`, "warning");
          }
        } catch (err: any) {
          showToast("Erro ao resetar cartões: " + err.message, "error");
        }
      }
    });
  };

  const handleClearAllInventories = async () => {
    showConfirm({
      title: "Limpar Todos os Inventários",
      message: `ATENÇÃO: Você está prestes a remover TODOS os cartões fidelidade do inventário de TODOS os clientes. Deseja continuar?`,
      confirmText: "Sim, Limpar Todos",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          let count = 0;
          const updates: any = {};
          
          for (const cliente of clientes) {
            updates[`users/${cliente.id}/inventarioBrindes`] = 0;
            count++;
          }
          
          if (Object.keys(updates).length > 0) {
            await update(ref(db, ROOT), updates);
            showToast(`Inventário de brindes de ${count} clientes foram zerados!`, "success");
          } else {
            showToast(`Nenhum cliente para limpar inventário.`, "warning");
          }
        } catch (err: any) {
          showToast("Erro ao limpar inventários: " + err.message, "error");
        }
      }
    });
  };

  // Retorna estatísticas de pedidos de um cliente
  const obterDadosPedidos = (cliente: Cliente) => {
    const limpo = cliente.whatsapp ? cliente.whatsapp.replace(/\D/g, "") : "";
    
    const clientePedidos = pedidos.filter(p => {
      const matchUserId = p.userId === cliente.id;
      const pTel = (p.telefone || "").replace(/\D/g, "");
      const matchPhone = limpo && (pTel === limpo || (limpo.length === 11 && pTel === limpo.substring(2)));
      return matchUserId || matchPhone;
    });

    const entregues = clientePedidos.filter(p => p.status === "entregue").length;
    return {
      total: clientePedidos.length,
      entregues
    };
  };

  // Filtragem dos clientes pelo campo de busca
  const filteredClientes = clientes.filter((c) => {
    const name = (c.nome || "").toLowerCase();
    const phone = (c.whatsapp || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

  // Estatísticas Gerais de Badges para o Topo
  const statsGerais = () => {
    let bronzeCount = 0;
    let goldCount = 0;
    let rubyCount = 0;
    let purpleCount = 0;
    let emeraldCount = 0;
    let supremeCount = 0;

    clientes.forEach(c => {
      const { entregues } = obterDadosPedidos(c);
      if (entregues >= 25) supremeCount++;
      else if (entregues >= 15) emeraldCount++;
      else if (entregues >= 10) purpleCount++;
      else if (entregues >= 5) rubyCount++;
      else if (entregues >= 3) goldCount++;
      else if (entregues >= 1) bronzeCount++;
    });

    return { bronzeCount, goldCount, rubyCount, purpleCount, emeraldCount, supremeCount };
  };

  const gStats = statsGerais();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Resumo de Badges no Topo */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {BADGES_DE_MASSAS.map((badge, idx) => {
          const counts = [
            gStats.bronzeCount,
            gStats.goldCount,
            gStats.rubyCount,
            gStats.purpleCount,
            gStats.emeraldCount,
            gStats.supremeCount
          ];
          const count = counts[idx] || 0;
          return (
            <div key={badge.id} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col items-center text-center">
              <span className="text-2xl animate-pulse" style={{ animationDelay: `${idx * 150}ms` }}>{badge.emoji}</span>
              <p className="text-[10px] font-extrabold text-white mt-1.5 truncate max-w-full leading-tight">{badge.nome}</p>
              <p className="text-[9px] text-slate-500 font-bold font-mono mt-0.5">+{badge.requisito} Pedidos</p>
              <span className="mt-2 text-xs font-black bg-slate-900 px-2 py-0.5 rounded-full text-orange-400">
                {count} {count === 1 ? 'cliente' : 'clientes'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-3xl border border-slate-700/80">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Clientes & Selos de Fidelidade
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie as contas, banimentos, bloqueios e confira os selos conquistados pelos clientes da Massas da Bel.
          </p>
        </div>

        {/* Barra de Pesquisa e Botões Globais */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
               onClick={handleResetAllCards}
               className="flex-1 sm:flex-none bg-slate-700/50 hover:bg-orange-500/10 text-slate-300 hover:text-orange-400 border border-slate-600 hover:border-orange-500/30 font-bold py-2.5 px-3 rounded-2xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
               title="Resetar Todos os Cartões Fidelidade"
            >
               <RotateCcw className="w-3.5 h-3.5" />
               <span className="hidden xl:inline">Resetar Cartões</span>
            </button>
            
            <button
               onClick={handleClearAllInventories}
               className="flex-1 sm:flex-none bg-slate-700/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-600 hover:border-rose-500/30 font-bold py-2.5 px-3 rounded-2xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
               title="Remover Todos os Brindes do Inventário"
            >
               <Gift className="w-3.5 h-3.5" />
               <span className="hidden xl:inline">Zerar Inventários</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-slate-500 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-12 text-center text-slate-400 font-bold">
          Carregando clientes...
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-12 text-center text-slate-400 font-semibold">
          Nenhum cliente cadastrado correspondente encontrado.
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">WhatsApp / E-mail</th>
                  <th className="px-6 py-4 text-center">Fidelidade & Selos</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-300">
                {filteredClientes.map((cliente) => {
                  const isBanned = !!cliente.banido;
                  const isBlocked = !!cliente.bloqueado;
                  
                  // Dados de pedidos
                  const pStats = obterDadosPedidos(cliente);
                  const badgesConquistadas = obterBadgesConquistadas(pStats.entregues);
                  const proxima = obterProximaBadge(pStats.entregues);
                  const badgePrincipal = badgesConquistadas.length > 0 ? badgesConquistadas[badgesConquistadas.length - 1] : null;

                  return (
                    <tr
                      key={cliente.id}
                      className={cn(
                        "hover:bg-slate-750/30 transition-colors duration-150",
                        isBanned && "bg-red-950/10",
                        isBlocked && "bg-amber-950/10"
                      )}
                    >
                      {/* Avatar e Nome */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          {cliente.photoURL ? (
                            <img
                              src={cliente.photoURL}
                              alt={cliente.nome}
                              className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm uppercase">
                              {(cliente.nome || "US").substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                              <span>{cliente.nome || "Sem Nome"}</span>
                              {!!cliente.isGoogle && pStats.entregues >= 25 && (
                                <BadgeCheck className="w-4 h-4 fill-blue-500 text-slate-900 shrink-0" title="Cliente Verificado via Google (Mais de 25 pedidos)" />
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              ID: {cliente.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp e Email */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col gap-1">
                          {cliente.whatsapp ? (
                            <a
                              href={`https://wa.me/${cliente.whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline text-xs font-mono font-bold"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {cliente.whatsapp}
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Sem WhatsApp</span>
                          )}
                          {cliente.email && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[200px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {cliente.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fidelidade e Selos Criativos */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          <div className="flex items-center gap-2.5">
                            {/* Contador de Pedidos Entregues */}
                            <div className="bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 flex items-center gap-1.5" title="Pedidos Entregues / Total de Pedidos">
                              <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                              <span className="text-xs font-black text-white font-mono">
                                {pStats.entregues} <span className="text-[10px] text-slate-500 font-normal">({pStats.total} total)</span>
                              </span>
                            </div>

                            {/* Badge Principal */}
                            {badgePrincipal ? (
                              <button
                                onClick={() => setSelectedClienteBadges(cliente)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm transition-transform active:scale-95",
                                  badgePrincipal.corBg,
                                  badgePrincipal.corBorda,
                                  badgePrincipal.corTexto
                                )}
                                title="Ver todos os selos conquistados"
                              >
                                <span>{badgePrincipal.emoji}</span>
                                <span>{badgePrincipal.nome}</span>
                                <Sparkles className="w-3 h-3 animate-pulse" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold italic bg-slate-900/40 px-2.5 py-1 rounded-full border border-dashed border-slate-700/60">
                                Sem selo ainda
                              </span>
                            )}
                          </div>

                          {/* Fidelidade Cards Status */}
                          {(() => {
                            const totalFidelidadePontos = marketing?.fidelidadePontos || 10;
                            const fidelidadeAjuste = cliente.fidelidadeAjuste || 0;
                            const fidelidadeResgatados = cliente.fidelidadeResgatados || 0;
                            const inventarioBrindes = cliente.inventarioBrindes || 0;
                            const adjustedEntregues = Math.max(0, pStats.entregues - (fidelidadeResgatados * totalFidelidadePontos) - fidelidadeAjuste);
                            const earnedInCurrentCycle = adjustedEntregues % totalFidelidadePontos;
                            const filledCount = (adjustedEntregues > 0 && earnedInCurrentCycle === 0) ? totalFidelidadePontos : earnedInCurrentCycle;
                            
                            return (
                              <div className="flex gap-2 items-center w-full max-w-[200px] mt-1">
                                <div className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1 text-center">
                                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Cartão</div>
                                  <div className="text-xs font-black text-amber-400 font-mono">{filledCount}/{totalFidelidadePontos}</div>
                                </div>
                                <div className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1 text-center">
                                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Inventário</div>
                                  <div className="text-xs font-black text-emerald-400 font-mono">{inventarioBrindes} 🎁</div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Progresso para a Próxima Badge */}
                          {proxima && (
                            <div className="w-full max-w-[200px] flex flex-col gap-0.5 mt-0.5">
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                <span className="flex items-center gap-0.5">
                                  Próximo: {proxima.badge.emoji} {proxima.badge.nome}
                                </span>
                                <span className="font-mono text-amber-400">Falta {proxima.falta}</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-1 rounded-full"
                                  style={{ 
                                    width: `${Math.min(100, (pStats.entregues / proxima.badge.requisito) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="px-6 py-4.5 text-center">
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {isBanned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400 shadow-sm animate-pulse">
                              <Ban className="w-3 h-3" /> Banido
                            </span>
                          )}
                          {isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
                              <Lock className="w-3 h-3" /> Bloqueado
                            </span>
                          )}
                          {!isBanned && !isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              <CheckCircle className="w-3 h-3" /> Ativo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Banir/Desbanir */}
                          <button
                            onClick={() => handleToggleBan(cliente.id, cliente.nome || "Cliente", isBanned)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 border",
                              isBanned
                                ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300"
                                : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                            )}
                            title={isBanned ? "Desbanir Cliente" : "Banir Cliente"}
                          >
                            {isBanned ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> Desbanir
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" /> Banir
                              </>
                            )}
                          </button>

                          {/* Botão Bloquear/Desbloquear */}
                          <button
                            onClick={() => handleToggleBlock(cliente.id, cliente.nome || "Cliente", isBlocked)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1 border",
                              isBlocked
                                ? "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300"
                                : "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300"
                            )}
                            title={isBlocked ? "Desbloquear Cliente" : "Bloquear Cliente"}
                          >
                            {isBlocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Desbloquear
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Bloquear
                              </>
                            )}
                          </button>

                          {/* Botões de Fidelidade */}
                          <button
                            onClick={() => handleResetCard(cliente, pStats.entregues)}
                            className="p-2 bg-slate-900 hover:bg-orange-500/10 text-slate-500 hover:text-orange-400 border border-slate-750 hover:border-orange-500/20 rounded-xl transition-all duration-150"
                            title="Resetar (Zerar) Cartão Fidelidade"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleClearInventory(cliente.id, cliente.nome || "Cliente")}
                            className="p-2 bg-slate-900 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-slate-750 hover:border-rose-500/20 rounded-xl transition-all duration-150"
                            title="Remover todos os Cartões do Inventário"
                          >
                            <Gift className="w-4 h-4" />
                          </button>

                          {/* Botão Excluir Conta */}
                          <button
                            onClick={() => handleExcluir(cliente.id, cliente.nome || "Cliente")}
                            className="p-2 bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-750 hover:border-red-500/20 rounded-xl transition-all duration-150"
                            title="Excluir Conta Permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalhado de Conquistas/Selos do Cliente */}
      {selectedClienteBadges && (() => {
        const pStats = obterDadosPedidos(selectedClienteBadges);
        const conquistas = obterBadgesConquistadas(pStats.entregues);
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-100">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2 text-white">
                    <Award className="w-5 h-5 text-amber-400" />
                    Selos de Fidelidade
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{selectedClienteBadges.nome}</p>
                </div>
                <button
                  onClick={() => setSelectedClienteBadges(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-colors"
                >
                  Fechar
                </button>
              </div>

              {/* Estatísticas resumidas do cliente */}
              <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Histórico de Pedidos</p>
                  <p className="text-2xl font-black text-orange-500 mt-1 font-mono">{pStats.entregues} <span className="text-xs text-slate-400 font-sans font-normal">entregues</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Selos Conquistados</p>
                  <p className="text-xl font-black text-white mt-1 font-mono">{conquistas.length} <span className="text-xs text-slate-400 font-sans font-normal">de {BADGES_DE_MASSAS.length}</span></p>
                </div>
              </div>

              {/* Lista de todos os selos possíveis com status de conquistado */}
              <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
                {BADGES_DE_MASSAS.map((badge) => {
                  const conquistada = pStats.entregues >= badge.requisito;
                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex items-center gap-3",
                        conquistada
                          ? "bg-slate-800/60 border-slate-700/60"
                          : "bg-slate-900/30 border-slate-800/40 opacity-45"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-2xl border",
                        conquistada ? "bg-slate-900 border-slate-700" : "bg-slate-950/20 border-slate-900"
                      )}>
                        {badge.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-xs font-extrabold", conquistada ? "text-white" : "text-slate-400")}>
                            {badge.nome}
                          </p>
                          <span className={cn(
                            "text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest",
                            conquistada ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-950/50 text-slate-500 border border-slate-850"
                          )}>
                            {conquistada ? "Conquistado" : `Requer ${badge.requisito}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed truncate-2-lines">
                          {badge.descricao}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

