import React, { useState, useEffect, useRef } from 'react';
import { auth, db, ROOT } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, set, update, onValue, remove } from 'firebase/database';
import { cn, formatMoney } from '../lib/utils';
import { LogOut, LayoutDashboard, ReceiptText, Megaphone, Menu as MenuIcon, Route as RouteIcon, Users, Settings, X, Volume2, VolumeX } from 'lucide-react';
import { MenuData, ConfigMarketing, Bairro, Pedido } from '../types';

import TabEntregadores from '../components/admin/TabEntregadores';
import TabEntregas from '../components/admin/TabEntregas';
import TabMarketing from '../components/admin/TabMarketing';
import TabCardapio from '../components/admin/TabCardapio';
import TabDashboard from '../components/admin/TabDashboard';
import TabPedidos from '../components/admin/TabPedidos';
import TabClientes from '../components/admin/TabClientes';

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data
  const [pedidos, setPedidos] = useState<Record<string, Pedido>>({});
  const [clientesCount, setClientesCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('adminSoundEnabled') !== 'false';
  });

  interface AlertaPedido {
    id: string;
    codigo: string;
    cliente: string;
    total: number;
    bairro: string;
  }
  const [alertasVisuais, setAlertasVisuais] = useState<AlertaPedido[]>([]);

  const isFirstLoad = useRef(true);
  const knownOrderIds = useRef<string[]>([]);

  const playSound = () => {
    try {
      // Usamos a Web Audio API para gerar um som de sino duplo cristalino de alta fidelidade.
      // Isso garante 100% de confiabilidade, sem depender de links temporários do MediaFire
      // que expiram rapidamente, sem atrasos de rede e sem bloqueios de CORS do navegador.
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Função interna para tocar um tom ressonante de sino
        const playBellNote = (freq: number, startTime: number, duration: number, volume: number) => {
          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(0, startTime);
          // Ataque ultra rápido (característico de impacto físico/percussão)
          masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.004);
          // Decaimento exponencial suave para criar a reverberação natural
          masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          masterGain.connect(ctx.destination);

          // Harmônicos metálicos típicos de um sino real para um som rico e realista
          const harmonics = [1, 2, 2.4, 3, 4.2];
          const relativeGains = [0.8, 0.4, 0.3, 0.2, 0.1];

          harmonics.forEach((ratio, index) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * ratio, startTime);

            // Harmônicos mais altos decaem mais rapidamente
            const partialDecay = duration / (ratio * 0.4 + 0.6);
            oscGain.gain.setValueAtTime(relativeGains[index], startTime);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + partialDecay);

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);
          });
        };

        // Tocando um elegante sino duplo de notificação (Ding-Dong cristalino)
        // Primeiro tom: Brilhante e alegre (G5 - Sol 5 / 783.99 Hz)
        playBellNote(783.99, now, 1.4, 0.4);
        // Segundo tom: Complementar (B5 - Si 5 / 987.77 Hz) tocado 120ms depois
        playBellNote(987.77, now + 0.12, 1.8, 0.35);

        console.log("Som de sino gerado via Web Audio API!");
        return;
      }
    } catch (err) {
      console.warn("Falha ao usar Web Audio API, tentando fallback de arquivo:", err);
    }

    // Fallback caso a Web Audio API não esteja disponível no navegador
    try {
      const fallbackAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
      fallbackAudio.volume = 0.8;
      fallbackAudio.play().catch(e => console.warn("Erro ao reproduzir áudio de fallback:", e));
    } catch (e) {
      console.error("Falha geral ao reproduzir áudio:", e);
    }
  };

  useEffect(() => {
    get(ref(db, `${ROOT}/config/hasAdmin`)).then(s => setHasAdmin(!!s.val()));
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await get(ref(db, `${ROOT}/roles/${u.uid}`));
        const r = snap.val();
        setRole(r);
        if (r === 'admin') {
          localStorage.setItem('adminLogado', 'true');
        } else {
          localStorage.removeItem('adminLogado');
        }
      } else {
        setRole(null);
        localStorage.removeItem('adminLogado');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && role === 'admin') {
      const u = onValue(ref(db, `${ROOT}/pedidos`), s => {
        const data: Record<string, Pedido> = s.val() || {};
        const ids = Object.keys(data);

        if (isFirstLoad.current) {
          knownOrderIds.current = ids;
          isFirstLoad.current = false;
        } else {
          const newIds = ids.filter(id => !knownOrderIds.current.includes(id));
          if (newIds.length > 0) {
            const newOrders = newIds
              .map(id => ({ id, ...data[id] }))
              .filter(p => p?.status === 'novo');

            if (newOrders.length > 0) {
              if (soundEnabled) {
                playSound();
              }
              // Adiciona as notificações visuais no painel administrativo
              const novosAlertas = newOrders.map(p => ({
                id: p.id,
                codigo: p.codigo || 'S/N',
                cliente: p.cliente || 'Cliente',
                total: Number(p.subtotal || 0) + Number(p.taxa || 0),
                bairro: p.bairro || 'Não informado'
              }));
              setAlertasVisuais(prev => [...novosAlertas, ...prev].slice(0, 5)); // Mantém no máximo as 5 mais recentes
            }
          }
          knownOrderIds.current = ids;
        }

        setPedidos(data);
      });
      return () => u();
    }
  }, [user, role, soundEnabled]);

  useEffect(() => {
    if (user && role === 'admin') {
      const usersRef = ref(db, `${ROOT}/users`);
      const unsub = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setClientesCount(Object.keys(data).length);
        } else {
          setClientesCount(0);
        }
      });
      return () => unsub();
    }
  }, [user, role]);

  const handleLogin = async () => {
    setError('');
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e: any) { setError(e.message); }
  };

  const handleCreateAdmin = async () => {
    setError('');
    try {
      const c = await createUserWithEmailAndPassword(auth, email, password);
      await update(ref(db), {
        [`${ROOT}/roles/${c.user.uid}`]: 'admin',
        [`${ROOT}/config/hasAdmin`]: true
      });
      setHasAdmin(true);
    } catch (e: any) { setError(e.message); }
  };

  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-200">
        <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-700">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-white">Massas da Bel Admin</h1>
          </div>
          
          {user && role !== 'admin' && (
             <div className="mb-4 p-4 rounded-xl bg-amber-900/40 border border-amber-600/50 text-amber-200 text-sm">
                Logado com {user.email} e perfil '{role || 'nenhum'}'. Precisa ser admin.
                <button onClick={() => signOut(auth)} className="mt-2 w-full bg-slate-700 py-2 rounded-lg font-bold text-white">Sair desta conta</button>
             </div>
          )}

          {(!user || role !== 'admin') && (
            <div className="space-y-3">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none" placeholder="Admin Email" />
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none" placeholder="Senha" />
              <button onClick={handleLogin} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-2">Entrar</button>
              
              {!hasAdmin && (
                <div className="pt-6 mt-6 border-t border-slate-700">
                  <p className="text-amber-400 text-sm font-bold mb-3">Primeiro acesso (Criar Admin)</p>
                  <button onClick={handleCreateAdmin} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Criar conta admin</button>
                </div>
              )}
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (tab) {
      case 'dashboard': return <TabDashboard pedidos={pedidos} clientesCount={clientesCount} />;
      case 'pedidos': return <TabPedidos pedidos={pedidos} />;
      case 'cardapio': return <TabCardapio />;
      case 'marketing': return <TabMarketing />;
      case 'entregas': return <TabEntregas />;
      case 'entregadores': return <TabEntregadores />;
      case 'clientes': return <TabClientes />;
      default:
        return <div className="text-slate-400 p-6">Trabalhando nesta aba...</div>;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-900 flex flex-col md:flex-row text-slate-200 text-sm relative">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-all"
            title="Abrir Menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-white text-base tracking-tight">Massas da Bel <span className="text-xs text-orange-500 font-bold ml-1">Admin</span></span>
        </div>
        <button 
          onClick={() => signOut(auth)} 
          className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Mobile Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 flex flex-col shrink-0 border-r border-slate-700 transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0 md:z-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-slate-700 font-black text-lg text-white flex items-center justify-between">
          <span>Massas da Bel</span>
          <button 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
            onClick={() => setIsSidebarOpen(false)}
            title="Fechar Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <button 
            onClick={() => { setTab('dashboard'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='dashboard'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0"/> Dashboard
          </button>
          <button 
            onClick={() => { setTab('pedidos'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='pedidos'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <ReceiptText className="w-4 h-4 shrink-0"/> Pedidos
          </button>
          <button 
            onClick={() => { setTab('cardapio'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='cardapio'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <MenuIcon className="w-4 h-4 shrink-0"/> Cardápio
          </button>
          <button 
            onClick={() => { setTab('marketing'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='marketing'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <Megaphone className="w-4 h-4 shrink-0"/> Marketing
          </button>
          <button 
            onClick={() => { setTab('entregas'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='entregas'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <RouteIcon className="w-4 h-4 shrink-0"/> Entregas
          </button>
          <button 
            onClick={() => { setTab('entregadores'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='entregadores'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <Users className="w-4 h-4 shrink-0"/> Entregadores
          </button>
          <button 
            onClick={() => { setTab('clientes'); setIsSidebarOpen(false); }} 
            className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold transition-all text-left", tab==='clientes'? "bg-orange-500 text-white shadow-lg shadow-orange-500/15" : "hover:bg-slate-700 text-slate-400")}
          >
            <span className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0"/> Clientes
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black",
              tab === 'clientes' ? "bg-white/20 text-white" : "bg-slate-900 text-slate-300 border border-slate-700/50"
            )}>
              {clientesCount}
            </span>
          </button>
        </nav>
        
        <div className="p-3 border-t border-slate-700 shrink-0 bg-slate-800/50 space-y-3">
          {/* Painel de Alertas e Notificações */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 flex flex-col gap-2.5">
            {/* Audio Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                Som de Pedidos
              </span>
              <button
                onClick={() => {
                  const newVal = !soundEnabled;
                  setSoundEnabled(newVal);
                  localStorage.setItem('adminSoundEnabled', String(newVal));
                }}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  soundEnabled ? "bg-orange-500" : "bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    soundEnabled ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Test button */}
            <button
              onClick={playSound}
              className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700/50 flex items-center justify-center gap-1.5"
              title="Testar Som de Notificação"
            >
              🔊 Testar Som
            </button>
          </div>

          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all text-left">
            <LogOut className="w-4 h-4 shrink-0"/> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Container de Alertas Visuais de Novos Pedidos */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        {alertasVisuais.map(alerta => (
          <div 
            key={alerta.id} 
            className="bg-slate-900/95 border-2 border-orange-500 rounded-2xl p-4 shadow-2xl shadow-orange-500/10 backdrop-blur-md flex flex-col gap-3 relative overflow-hidden"
            style={{ animation: 'slideIn 0.3s ease-out forwards' }}
          >
            {/* Efeito luminoso de fundo */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <span className="text-base">🍝</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Novo Pedido Recebido!</h4>
                  <p className="text-orange-400 font-mono text-xs font-extrabold mt-0.5">#{alerta.codigo}</p>
                </div>
              </div>
              <button 
                onClick={() => setAlertasVisuais(prev => prev.filter(x => x.id !== alerta.id))}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
                title="Fechar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <p><span className="text-slate-500 font-semibold">Cliente:</span> <strong className="text-white">{alerta.cliente}</strong></p>
              <p><span className="text-slate-500 font-semibold">Bairro:</span> {alerta.bairro}</p>
              <p><span className="text-slate-500 font-semibold">Valor Total:</span> <strong className="text-emerald-400 font-bold">{formatMoney(alerta.total)}</strong></p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTab('pedidos');
                  setAlertasVisuais(prev => prev.filter(x => x.id !== alerta.id));
                  setIsSidebarOpen(false);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-orange-500/10 uppercase"
              >
                Ver Pedido
              </button>
              <button
                onClick={() => setAlertasVisuais(prev => prev.filter(x => x.id !== alerta.id))}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
              >
                Dispensar
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

