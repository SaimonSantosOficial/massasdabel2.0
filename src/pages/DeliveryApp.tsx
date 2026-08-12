import React, { useState, useEffect } from 'react';
import { auth, db, ROOT } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, set, update, onValue } from 'firebase/database';
import { cn, formatMoney, emailKey } from '../lib/utils';
import { Bike, Box, CheckCircle, Clock, MapPin, CreditCard, ShoppingBag, Phone, LogOut, Search, UserCheck, Navigation, Copy, Map, ArrowRight, DollarSign, Gift } from 'lucide-react';
import { Pedido } from '../types';
import TempoDecorrido from '../components/admin/TempoDecorrido';

export default function DeliveryApp() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [tab, setTab] = useState<'prontos' | 'rota' | 'historico'>('prontos');
  const [busca, setBusca] = useState('');
  const [pedidos, setPedidos] = useState<any>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snapRole = await get(ref(db, `${ROOT}/roles/${u.uid}`));
        const roleVal = snapRole.val();
        setRole(roleVal);
        
        if (!roleVal) {
          const snapPend = await get(ref(db, `${ROOT}/pendingEntregadores/${u.uid}`));
          if (snapPend.val()) setIsPending(true);
          else setIsPending(false);
        }
      } else {
        setRole(null);
        setIsPending(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && role === 'entregador') {
      const u = onValue(ref(db, `${ROOT}/pedidos`), s => setPedidos(s.val() || {}));
      return () => u();
    }
  }, [user, role]);

  const handleAuth = async () => {
    setError('');
    try {
      if (isSignup) {
        if (!nome || !email || password.length < 6) throw new Error("Preencha todos os campos.");
        const ek = emailKey(email);
        const inv = await get(ref(db, `${ROOT}/entregadoresAutorizados/${ek}`));
        if (!inv.val() || !inv.val().ativo) throw new Error("E-mail não está na lista de autorizados.");
        if (inv.val().registeredUid) throw new Error("E-mail já está em uso.");

        const c = await createUserWithEmailAndPassword(auth, email, password);
        await set(ref(db, `${ROOT}/pendingEntregadores/${c.user.uid}`), {
          email: email.toLowerCase(),
          nome,
          createdAt: Date.now()
        });
        await signOut(auth);
        setError("Cadastro submetido! O admin precisa aprovar na aba 'Entregadores' do painel do Admin, depois você poderá fazer Login.");
        setIsSignup(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) { setError(e.message); }
  };

  const atualizarStatus = async (id: string, st: string, cod?: string) => {
    await update(ref(db, `${ROOT}/pedidos/${id}`), { status: st });
    if (cod) await update(ref(db, `${ROOT}/pedidoCodigos/${cod}`), { status: st });
  };

  if (!user || (role !== 'entregador' && !isPending)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-800/80 relative z-10">
           <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-2xl mb-4 border border-orange-500/20">
               <Bike className="w-10 h-10 text-orange-500" />
             </div>
             <h1 className="text-2xl font-extrabold text-white tracking-tight">Massas da Bel</h1>
             <p className="text-slate-400 text-sm mt-1">Painel do Entregador</p>
           </div>

           <div className="space-y-4">
             {isSignup && (
               <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Nome Completo</label>
                 <input 
                   type="text" 
                   value={nome} 
                   onChange={e=>setNome(e.target.value)} 
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 placeholder:text-slate-600 text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm" 
                   placeholder="Seu nome" 
                 />
               </div>
             )}
             
             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">E-mail Autorizado</label>
               <input 
                 type="email" 
                 value={email} 
                 onChange={e=>setEmail(e.target.value)} 
                 className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 placeholder:text-slate-600 text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm" 
                 placeholder="exemplo@email.com" 
               />
             </div>

             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Senha</label>
               <input 
                 type="password" 
                 value={password} 
                 onChange={e=>setPassword(e.target.value)} 
                 className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 placeholder:text-slate-600 text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm" 
                 placeholder="Sua senha secreta" 
               />
             </div>
             
             <button 
               onClick={handleAuth} 
               className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/15 active:scale-[0.98] mt-2 text-sm"
             >
               {isSignup ? 'Cadastrar' : 'Entrar no Painel'}
             </button>
             
             <button 
               onClick={() => {
                 setIsSignup(!isSignup);
                 setError('');
               }} 
               className="w-full text-slate-400 hover:text-slate-200 text-sm py-1 transition-colors mt-2"
             >
               {isSignup ? 'Já sou cadastrado? Faça Login' : 'Não tem cadastro? Registre-se aqui'}
             </button>

             {error && (
               <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-xl p-3 text-center font-medium leading-relaxed">
                 {error}
               </div>
             )}
           </div>
        </div>
      </div>
    );
  }

  if (isPending && role !== 'entregador') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-slate-200 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 space-y-5">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
            <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Aguardando Aprovação</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            Seu cadastro foi enviado com sucesso! Agora o administrador precisa aprovar o seu acesso no painel administrativo principal antes que você possa começar a receber entregas.
          </p>
          <div className="pt-4 border-t border-slate-800/80">
            <button 
              onClick={() => signOut(auth)} 
              className="text-slate-400 hover:text-white font-semibold text-sm transition-colors"
            >
              Voltar para a tela de Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isToday = (timestamp?: number) => {
    if (!timestamp) return false;
    const orderDate = new Date(timestamp);
    const today = new Date();
    return orderDate.getDate() === today.getDate() &&
           orderDate.getMonth() === today.getMonth() &&
           orderDate.getFullYear() === today.getFullYear();
  };

  const handleCopyAddress = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allFiltered = (Object.entries(pedidos) as [string, any][])
    .filter(([, p]) => p.tipoEntrega === 'entrega' || !p.tipoEntrega)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

  const prontos = allFiltered.filter(x => x[1].status === 'pronto');
  const emRota = allFiltered.filter(x => x[1].status === 'despachado');
  const historico = allFiltered.filter(x => x[1].status === 'entregue' || x[1].status === 'cancelado');
  
  const concluidosHojeCount = historico.filter(x => x[1].status === 'entregue' && isToday(x[1].createdAt)).length;
  const taxasHojeTotal = historico
    .filter(x => x[1].status === 'entregue' && isToday(x[1].createdAt))
    .reduce((acc, x) => acc + (Number(x[1].taxa) || 0), 0);

  let currentList = prontos;
  if (tab === 'rota') currentList = emRota;
  if (tab === 'historico') {
    currentList = historico.filter(x => {
      if (!busca) return true;
      const p = x[1];
      const text = [p.cliente, p.codigo, p.endereco, p.bairro, p.itens].join(' ').toLowerCase();
      return text.includes(busca.toLowerCase());
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Header */}
      <header className="bg-slate-900/95 backdrop-blur-md px-5 py-4 border-b border-slate-800/60 flex justify-between items-center sticky top-0 z-40 shadow-lg">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
             <Bike className="w-5.5 h-5.5 text-white animate-bounce" />
           </div>
           <div>
             <h1 className="font-black text-white tracking-tight text-base">Massas da Bel</h1>
             <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{user.email}</p>
             </div>
           </div>
         </div>
         <button 
           onClick={() => signOut(auth)} 
           className="text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-500/10 p-2.5 rounded-xl transition-all duration-200 border border-slate-700/50"
           title="Sair"
         >
           <LogOut className="w-5 h-5" />
         </button>
      </header>

      {/* Driver Dashboard Stats & Balance Row */}
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Quick Driver Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ganhos em Taxas Hoje</p>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mt-1 tracking-tight">
                {formatMoney(taxasHojeTotal)}
              </h2>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl flex items-center gap-1.5 font-bold text-sm">
              <DollarSign className="w-5 h-5" />
              <span>Hoje</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80">
            <div className="text-center bg-slate-950/50 p-2 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 block mb-0.5">Disponíveis</span>
              <strong className="text-lg font-black text-orange-400">{prontos.length}</strong>
            </div>
            <div className="text-center bg-slate-950/50 p-2 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 block mb-0.5">Em Rota</span>
              <strong className="text-lg font-black text-amber-400">{emRota.length}</strong>
            </div>
            <div className="text-center bg-slate-950/50 p-2 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 block mb-0.5">Entregues</span>
              <strong className="text-lg font-black text-emerald-400">{concluidosHojeCount}</strong>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="bg-slate-900 p-1.5 rounded-2xl flex gap-1 border border-slate-800/80 shadow-md">
           <button 
             onClick={() => setTab('prontos')} 
             className={cn(
               "flex-1 py-3 px-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5", 
               tab==='prontos' 
                 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10' 
                 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
             )}
           >
             <Box className="w-4 h-4 shrink-0" />
             <span>Coleta ({prontos.length})</span>
           </button>
           
           <button 
             onClick={() => setTab('rota')} 
             className={cn(
               "flex-1 py-3 px-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5", 
               tab==='rota' 
                 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' 
                 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
             )}
           >
             <Bike className="w-4 h-4 shrink-0 animate-pulse" />
             <span>Em Rota ({emRota.length})</span>
           </button>
           
           <button 
             onClick={() => setTab('historico')} 
             className={cn(
               "flex-1 py-3 px-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5", 
               tab==='historico' 
                 ? 'bg-slate-800 text-slate-200 shadow-sm border border-slate-700/50' 
                 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
             )}
           >
             <CheckCircle className="w-4 h-4 shrink-0" />
             <span>Histórico ({historico.length})</span>
           </button>
        </div>
      </div>

      {/* Interactive Search Bar for History */}
      {tab === 'historico' && (
        <div className="px-4 mb-4 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={busca} 
              onChange={e=>setBusca(e.target.value)} 
              placeholder="Buscar por cliente, código ou endereço..."
              className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm transition-all shadow-inner"
            />
          </div>
        </div>
      )}

      {/* Delivery Cards List */}
      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        {currentList.length === 0 ? (
          <div className="bg-slate-900/20 border border-slate-900/60 rounded-3xl p-12 text-center max-w-md mx-auto mt-6">
            <Box className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-40" />
            <p className="text-slate-400 text-sm font-semibold">Nenhum pedido nesta aba.</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {tab === 'prontos' && "Aguarde os pedidos serem marcados como 'Prontos' na cozinha."}
              {tab === 'rota' && "Você não tem entregas em andamento. Vá na aba Coleta para iniciar uma."}
              {tab === 'historico' && "Suas entregas entregues ou canceladas serão mostradas aqui."}
            </p>
          </div>
        ) : (
          currentList.map(([id, p]) => (
            <div 
              key={id} 
              className={cn(
                "bg-slate-900 rounded-3xl border shadow-xl overflow-hidden transition-all duration-300",
                p.status === 'despachado' 
                  ? 'border-amber-500/20 shadow-amber-500/5' 
                  : 'border-slate-800/60'
              )}
            >
              {/* Card Header Status Row */}
              <div className="p-4 bg-slate-900/80 border-b border-slate-800/40 flex justify-between items-center gap-3">
                 <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", 
                      p.status==='pronto' 
                        ? 'bg-orange-500/10 text-orange-400' 
                        : p.status==='despachado'
                          ? 'bg-amber-500/15 text-amber-400'
                          : p.status==='entregue'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                    )}>
                      {p.status === 'pronto' ? 'Pronto para Coleta' : p.status === 'despachado' ? 'Em Rota' : p.status}
                    </span>
                    <span className="text-orange-500 font-mono text-xs font-black bg-orange-500/5 px-2.5 py-1 rounded-lg border border-orange-500/10">
                      #{p.codigo}
                    </span>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total a Receber</p>
                   <span className="font-extrabold text-white text-lg tracking-tight">
                     {formatMoney(p.subtotal + p.taxa)}
                   </span>
                 </div>
              </div>

              {/* Card Content Details */}
              <div className="p-5 space-y-4">
                {/* Client Name & Elapsed Time row */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Cliente</p>
                    <p className="font-extrabold text-white text-base tracking-tight">{p.cliente}</p>
                  </div>
                  {p.createdAt && p.status !== 'entregue' && (
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Tempo na Fila</p>
                      <TempoDecorrido createdAt={p.createdAt} status={p.status} />
                    </div>
                  )}
                </div>
                
                {/* Visual Timeline Address & Items Block */}
                <div className="space-y-3">
                  {/* Address Box */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
                    {/* Visual line marker */}
                    <div className="absolute left-[25px] top-[40px] bottom-[40px] w-[2px] bg-dashed border-l border-slate-800 pointer-events-none hidden"></div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Endereço de Entrega</p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleCopyAddress(id, `${p.endereco}, Bairro ${p.bairro}`)}
                              className={cn(
                                "p-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all",
                                copiedId === id 
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                                  : 'bg-slate-900 border-slate-700/50 text-slate-400 hover:text-white'
                              )}
                              title="Copiar endereço"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedId === id ? 'Copiado' : 'Copiar'}</span>
                            </button>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.endereco}, Bairro ${p.bairro}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 px-2 rounded-lg bg-slate-900 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                              title="Ver no mapa / GPS"
                            >
                              <Navigation className="w-3 h-3 text-sky-400" />
                              <span>Rotear</span>
                            </a>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-100 mt-1 leading-relaxed">{p.endereco}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/80 inline-block">
                          Bairro: {p.bairro}
                        </p>
                      </div>
                    </div>

                    {/* Order Items Section */}
                    <div className="flex items-start gap-3 pt-3.5 border-t border-slate-800/60">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Conteúdo da Entrega</p>
                        <div className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/80">
                          {p.itens ? p.itens.replace(/\*NOVO PEDIDO - MASSAS DA BEL\* 🍝\n\n/g, '') : 'Nenhum item informado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Info & Warnings Box */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/30 p-3 rounded-2xl border border-slate-900">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold">Pagamento:</span>
                      <span className={cn(
                        "font-black px-2 py-0.5 rounded text-[11px]",
                        p.pagamento === 'Pix' 
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                          : p.pagamento === 'Cartão' 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      )}>
                        {p.pagamento}
                      </span>
                    </div>

                    {p.createdAt && (
                      <div className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Feito às {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Cash Change Warning */}
                  {p.pagamento === 'Dinheiro' && p.trocoPara && (
                    <div className="bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs font-bold animate-pulse">
                      <Gift className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                      <div>
                        <p>PREPARAR TROCO PARA: <strong className="text-white text-sm font-black">{formatMoney(Number(p.trocoPara))}</strong></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Troco a devolver: {formatMoney(Number(p.trocoPara) - (p.subtotal + p.taxa))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-5 pt-0">
                {tab === 'prontos' && (
                  <button 
                    onClick={() => atualizarStatus(id, 'despachado', p.codigo)} 
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black py-4 text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 tracking-wider uppercase text-[12px]"
                  >
                    <span>Coletar e Iniciar Entrega</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                )}
                {tab === 'rota' && (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                     <button 
                       onClick={() => atualizarStatus(id, 'entregue', p.codigo)} 
                       className="w-full sm:flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 text-sm rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 tracking-wider uppercase text-[12px]"
                     >
                       <CheckCircle className="w-4.5 h-4.5" />
                       Confirmar Entregue
                     </button>
                     {p.telefone && (
                       <a 
                         href={`https://wa.me/${p.telefone.replace(/\D/g,'')}`} 
                         target="_blank" 
                         rel="noreferrer" 
                         className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-500/10 tracking-wider uppercase text-[11px]"
                       >
                         <Phone className="w-4.5 h-4.5 fill-white" />
                         <span>Falar com Cliente</span>
                       </a>
                     )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


