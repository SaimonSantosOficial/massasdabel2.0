import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  ReceiptText, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ShoppingBag, 
  ChevronRight, 
  Calendar,
  DollarSign,
  Award,
  Sparkles,
  HelpCircle,
  BadgeCheck,
  X,
  ChefHat,
  Truck,
  ShoppingCart,
  Check,
  AlertTriangle,
  Star
} from "lucide-react";
import { db, ROOT, auth } from "../lib/firebase";
import { ref, onValue, set, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { formatMoney, cn } from "../lib/utils";
import { Pedido } from "../types";
import { obterBadgesConquistadas, obterProximaBadge, BADGES_DE_MASSAS, Badge } from "../lib/badges";
import { useNotification } from "../components/NotificationProvider";

const getStepIndex = (st?: string) => {
  if (!st) return 0;
  if (st === 'entregue') return 4;
  if (st === 'despachado') return 3;
  if (st === 'pronto') return 2.5;
  if (st === 'preparando') return 2;
  if (st === 'novo') return 1;
  return 1;
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useNotification();
  const [userName, setUserName] = useState(() => localStorage.getItem("nome") || "");
  const [userWhatsapp, setUserWhatsapp] = useState(() => localStorage.getItem("whatsapp") || "");
  const [userPhotoURL, setUserPhotoURL] = useState(() => localStorage.getItem("photoURL") || "");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [fidelidadeResgatados, setFidelidadeResgatados] = useState<number>(() => Number(localStorage.getItem("fidelidadeResgatados") || "0"));
  const [inventarioBrindes, setInventarioBrindes] = useState<number>(() => Number(localStorage.getItem("inventarioBrindes") || "0"));
  const [fidelidadeAjuste, setFidelidadeAjuste] = useState<number>(() => Number(localStorage.getItem("fidelidadeAjuste") || "0"));
  
  // Form inputs for editing state
  const [inputName, setInputName] = useState("");
  const [inputWhatsapp, setInputWhatsapp] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<Badge | null>(null);
  const [fidelidadePontos, setFidelidadePontos] = useState(10);

  // Status mapping for visual styles
  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    novo: { label: "Recebido", bg: "bg-blue-50 border-blue-200 text-blue-800", text: "text-blue-700", icon: Clock },
    preparando: { label: "Em preparo", bg: "bg-indigo-50 border-indigo-200 text-indigo-800", text: "text-indigo-700", icon: Clock },
    pronto: { label: "Pronto para entrega", bg: "bg-yellow-50 border-yellow-200 text-yellow-800", text: "text-yellow-700", icon: CheckCircle },
    despachado: { label: "Saiu para entrega", bg: "bg-purple-50 border-purple-200 text-purple-800", text: "text-purple-700", icon: CheckCircle },
    entregue: { label: "Entregue", bg: "bg-emerald-50 border-emerald-200 text-emerald-800", text: "text-emerald-700", icon: CheckCircle },
    cancelado: { label: "Cancelado", bg: "bg-red-50 border-red-200 text-red-800", text: "text-red-700", icon: AlertCircle },
  };

  const normalizePhone = (num: string) => num.replace(/\D/g, "");

  const matchPhones = (phoneA: string, phoneB: string) => {
    const cleanA = normalizePhone(phoneA);
    const cleanB = normalizePhone(phoneB);
    if (!cleanA || !cleanB) return false;
    
    if (cleanA === cleanB) return true;
    
    // Compare suffixes of at least 8 digits to ignore country codes (e.g. 55)
    const minLength = Math.min(cleanA.length, cleanB.length);
    if (minLength >= 8) {
      return cleanA.endsWith(cleanB.substring(cleanB.length - 8)) || cleanB.endsWith(cleanA.substring(cleanA.length - 8));
    }
    return false;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Synchronize inputs when state values change
  useEffect(() => {
    setInputName(userName);
    setInputWhatsapp(userWhatsapp);
  }, [userName, userWhatsapp]);

  // Listen to Auth State and load db user details (auth user or whatsapp user)
  useEffect(() => {
    let unsubUser: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = ref(db, `${ROOT}/users/${user.uid}`);
        unsubUser = onValue(userRef, (snap) => {
          const data = snap.val();
          if (data) {
            if (data.banido || data.bloqueado) {
              navigate("/");
              return;
            }
            if (data.nome) {
              setUserName(data.nome);
              localStorage.setItem("nome", data.nome);
            }
            if (data.whatsapp) {
              setUserWhatsapp(data.whatsapp);
              localStorage.setItem("whatsapp", data.whatsapp);
            }
            if (data.photoURL) {
              setUserPhotoURL(data.photoURL);
              localStorage.setItem("photoURL", data.photoURL);
            }
            if (data.fidelidadeResgatados !== undefined) {
              setFidelidadeResgatados(Number(data.fidelidadeResgatados) || 0);
              localStorage.setItem("fidelidadeResgatados", String(data.fidelidadeResgatados));
            }
            if (data.inventarioBrindes !== undefined) {
              setInventarioBrindes(Number(data.inventarioBrindes) || 0);
              localStorage.setItem("inventarioBrindes", String(data.inventarioBrindes));
            }
            if (data.fidelidadeAjuste !== undefined) {
              setFidelidadeAjuste(Number(data.fidelidadeAjuste) || 0);
              localStorage.setItem("fidelidadeAjuste", String(data.fidelidadeAjuste));
            } else {
              setFidelidadeAjuste(0);
              localStorage.removeItem("fidelidadeAjuste");
            }
          }
        });
      } else {
        setCurrentUser(null);
        if (userWhatsapp) {
          const cleanWa = normalizePhone(userWhatsapp);
          const userRef = ref(db, `${ROOT}/users/wa_${cleanWa}`);
          unsubUser = onValue(userRef, (snap) => {
            const data = snap.val();
            if (data) {
              if (data.banido || data.bloqueado) {
                navigate("/");
                return;
              }
              if (data.nome) {
                setUserName(data.nome);
                localStorage.setItem("nome", data.nome);
              }
              if (data.fidelidadeResgatados !== undefined) {
                setFidelidadeResgatados(Number(data.fidelidadeResgatados) || 0);
                localStorage.setItem("fidelidadeResgatados", String(data.fidelidadeResgatados));
              }
              if (data.inventarioBrindes !== undefined) {
                setInventarioBrindes(Number(data.inventarioBrindes) || 0);
                localStorage.setItem("inventarioBrindes", String(data.inventarioBrindes));
              }
              if (data.fidelidadeAjuste !== undefined) {
                setFidelidadeAjuste(Number(data.fidelidadeAjuste) || 0);
                localStorage.setItem("fidelidadeAjuste", String(data.fidelidadeAjuste));
              }
            }
          });
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, [userWhatsapp]);

  // Listen to marketing config for fidelity points configuration
  useEffect(() => {
    const unsubMarketing = onValue(ref(db, `${ROOT}/config/marketing`), (snap) => {
      const v = snap.val();
      if (v && v.fidelidadePontos !== undefined) {
        setFidelidadePontos(Number(v.fidelidadePontos) || 10);
      } else {
        setFidelidadePontos(10);
      }
    });
    return () => unsubMarketing();
  }, []);

  // Listen to orders matching WhatsApp in Realtime Database
  useEffect(() => {
    if (!userWhatsapp) {
      setPedidos([]);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const pedidosRef = ref(db, `${ROOT}/pedidos`);
    const unsubscribe = onValue(
      pedidosRef,
      (snapshot) => {
        setLoading(false);
        const data = snapshot.val();
        if (data) {
          const list: Pedido[] = [];
          Object.keys(data).forEach((key) => {
            const ped = { ...data[key], id: key } as Pedido;
            if (ped.telefone && matchPhones(ped.telefone, userWhatsapp)) {
              list.push(ped);
            }
          });
          // Sort newest first
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setPedidos(list);
        } else {
          setPedidos([]);
        }
      },
      (error) => {
        setLoading(false);
        setErrorMsg("Erro ao carregar seus pedidos do servidor.");
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, [userWhatsapp]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = inputName.trim();
    const cleanPhone = normalizePhone(inputWhatsapp);

    if (!cleanName) {
      alert("Por favor, preencha seu nome.");
      return;
    }
    if (cleanPhone.length < 10) {
      alert("Por favor, preencha um número de WhatsApp válido com DDD.");
      return;
    }

    localStorage.setItem("nome", cleanName);
    localStorage.setItem("whatsapp", cleanPhone);
    setUserName(cleanName);
    setUserWhatsapp(cleanPhone);

    const userId = currentUser ? currentUser.uid : `wa_${cleanPhone}`;
    try {
      const userRef = ref(db, `${ROOT}/users/${userId}`);
      const isGoogleProvider = currentUser?.providerData?.some((p: any) => p.providerId === "google.com") || false;
      await update(userRef, {
        nome: cleanName,
        whatsapp: cleanPhone,
        photoURL: userPhotoURL || currentUser?.photoURL || "",
        email: currentUser?.email || "",
        isGoogle: isGoogleProvider,
        fidelidadeResgatados: fidelidadeResgatados,
        inventarioBrindes: inventarioBrindes,
        fidelidadeAjuste: fidelidadeAjuste,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error("Erro ao salvar no banco:", err);
    }

    setIsEditing(false);
  };

  const handleTrackOrder = (codigo?: string) => {
    if (!codigo) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFidelidade = () => {
    showConfirm({
      title: "Resgatar e Resetar Cartão",
      message: "Deseja resgatar seu prêmio e reiniciar o cartão fidelidade? Seu Cartão Fidelidade (Prato 100% Grátis) será adicionado ao seu inventário e suas estrelas voltarão a zero.",
      confirmText: "Sim, Resgatar!",
      cancelText: "Cancelar",
      onConfirm: async () => {
        const nextResgatados = fidelidadeResgatados + 1;
        const nextInventario = inventarioBrindes + 1;
        const nextAjuste = entregues;
        setFidelidadeResgatados(nextResgatados);
        setInventarioBrindes(nextInventario);
        setFidelidadeAjuste(nextAjuste);
        localStorage.setItem("fidelidadeResgatados", String(nextResgatados));
        localStorage.setItem("inventarioBrindes", String(nextInventario));
        localStorage.setItem("fidelidadeAjuste", String(nextAjuste));

        const userId = currentUser ? currentUser.uid : (userWhatsapp ? `wa_${normalizePhone(userWhatsapp)}` : null);
        if (userId) {
          try {
            const userRef = ref(db, `${ROOT}/users/${userId}`);
            const isGoogleProvider = currentUser?.providerData?.some((p: any) => p.providerId === "google.com") || false;
            await update(userRef, {
              nome: userName,
              whatsapp: userWhatsapp,
              photoURL: userPhotoURL || currentUser?.photoURL || "",
              email: currentUser?.email || "",
              isGoogle: isGoogleProvider,
              fidelidadeResgatados: nextResgatados,
              inventarioBrindes: nextInventario,
              fidelidadeAjuste: nextAjuste,
              updatedAt: Date.now()
            });
          } catch (err: any) {
            console.error("Erro ao salvar no banco:", err);
            showToast("Erro ao sincronizar com o banco: " + err.message, "error");
          }
        }
        showToast("Cartão zerado! Prato 100% Grátis adicionado ao seu Inventário.", "success");
      }
    });
  };

  const entregues = pedidos.filter(p => p.status === "entregue").length;
  const isGoogle = currentUser?.providerData?.some((p: any) => p.providerId === "google.com") || false;
  const isVerifiedGoogleClient = isGoogle && entregues >= 25;

  const hasCredentials = userName && userWhatsapp;  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <main className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl relative overflow-hidden flex flex-col pb-24">
        
        {/* Native App-Style Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all flex items-center justify-center text-slate-800 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          <div className="text-center flex-1 px-2">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Meu Perfil</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Massas da Bel</p>
          </div>

          <div className="w-10 h-10 shrink-0"></div> {/* Balanced spacing */}
        </header>

        {/* User identification card */}
        <div className="p-4">
          {!hasCredentials || isEditing ? (
            <form onSubmit={handleSaveProfile} className="bg-white border border-slate-150 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Identificação do Cliente</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Insira seus dados para encontrar e sincronizar seu histórico completo de pedidos das Massas da Bel.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Seu Nome Completo *</label>
                  <input 
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 border border-slate-150 rounded-2xl px-4 py-3 text-xs focus:border-orange-500 focus:bg-white outline-none font-bold text-slate-800 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Seu WhatsApp (com DDD) *</label>
                  <input 
                    type="tel"
                    required
                    value={inputWhatsapp}
                    onChange={(e) => setInputWhatsapp(e.target.value)}
                    placeholder="Ex: 85999999999"
                    className="w-full bg-slate-50 border border-slate-150 rounded-2xl px-4 py-3 text-xs focus:border-orange-500 focus:bg-white outline-none font-bold text-slate-800 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Confirmar Dados
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white border-b border-slate-100 p-5 flex flex-col">
              {/* Instagram Top Profile Section */}
              <div className="flex items-center gap-5">
                {/* Avatar with circular gradient border */}
                <div className="relative shrink-0">
                  <div className="w-[72px] h-[72px] rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full p-[2px] flex items-center justify-center">
                      <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden flex items-center justify-center text-slate-850 font-black text-xl">
                        {userPhotoURL ? (
                          <img src={userPhotoURL} alt="Foto de perfil" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          userName ? userName.substring(0, 2).toUpperCase() : "VS"
                        )}
                      </div>
                    </div>
                  </div>
                  {isVerifiedGoogleClient && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 p-0.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <BadgeCheck className="w-3.5 h-3.5 fill-blue-500 text-white shrink-0" />
                    </div>
                  )}
                </div>

                {/* Stats Columns (Pedidos, Selos, Entregues) */}
                <div className="flex-1 flex justify-around text-center select-none">
                  <div className="flex flex-col">
                    <span className="text-base font-black text-slate-900 leading-none">{pedidos.length}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Pedidos</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-black text-slate-900 leading-none">{obterBadgesConquistadas(entregues).length}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Selos</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-black text-slate-900 leading-none">{entregues}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Entregues</span>
                  </div>
                </div>
              </div>

              {/* Bio / Name Details */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{userName}</h3>
                  {isGoogle && (
                    <span className="inline-flex items-center gap-0.5 text-[8px] bg-blue-50 text-blue-600 font-extrabold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wide leading-none">
                      Google Auth
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-slate-600 leading-relaxed space-y-0.5 font-medium">
                  {(() => {
                    const conquistas = obterBadgesConquistadas(entregues);
                    const ultimaConquistada = conquistas.length > 0 ? conquistas[conquistas.length - 1] : null;
                    return (
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        🏆 {ultimaConquistada ? ultimaConquistada.nome : "Cliente Iniciante"}
                      </p>
                    );
                  })()}
                  <p className="text-slate-500">📞 WhatsApp: {userWhatsapp}</p>
                  <p className="text-slate-500">🍝 Apaixonado pelas Massas da Bel</p>
                  
                  {/* Cartão Fidelidade Integrado na Bio */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 select-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      ⭐ Cartão Fidelidade
                    </p>
                    {(() => {
                      const totalFidelidadePontos = fidelidadePontos;
                      const netEntregues = Math.max(0, entregues - fidelidadeAjuste);
                      const adjustedEntregues = Math.max(0, netEntregues);
                      const earnedInCurrentCycle = adjustedEntregues % totalFidelidadePontos;
                      const filledCount = (adjustedEntregues > 0 && earnedInCurrentCycle === 0) ? totalFidelidadePontos : earnedInCurrentCycle;
                      const isFull = filledCount === totalFidelidadePontos;
                      const remaining = totalFidelidadePontos - filledCount;

                      return (
                        <>
                          <div className="grid grid-cols-5 gap-y-4 gap-x-2 w-full my-3 select-none justify-items-center">
                            {Array.from({ length: totalFidelidadePontos }).map((_, index) => {
                              const starNum = index + 1;
                              const isFilled = starNum <= filledCount;

                              return (
                                <div 
                                  key={index} 
                                  className="relative flex items-center justify-center shrink-0"
                                >
                                  <Star 
                                    className={cn(
                                      "w-[30px] h-[30px] transition-all duration-500 drop-shadow-sm", 
                                      isFilled 
                                        ? "fill-amber-400 text-amber-500 scale-105" 
                                        : "fill-slate-100 text-slate-300"
                                    )} 
                                  />
                                  <span className={cn(
                                    "absolute text-[8px] font-black leading-none",
                                    isFilled ? "text-amber-950" : "text-slate-400"
                                  )}>
                                    {starNum}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-1">
                            {isFull ? (
                              <div className="space-y-3">
                                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border border-emerald-100 animate-pulse">
                                  🎉 Cartão Completo! Retire seu Brinde no próximo pedido!
                                </span>
                                <button
                                  type="button"
                                  onClick={handleResetFidelidade}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                                >
                                  🎁 Resgatar Brinde & Resetar Cartão
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9.5px] text-slate-500 font-bold block mt-1">
                                Faltam <strong className="text-orange-500 font-extrabold">{remaining}</strong> {remaining === 1 ? "pedido" : "pedidos"} para ganhar o brinde!
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {isVerifiedGoogleClient && (
                    <p className="text-blue-600 font-bold text-[10px] mt-1 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 fill-blue-500 text-white shrink-0" />
                      Cliente Verificado pelo Google
                    </p>
                  )}
                </div>
              </div>

              {/* Instagram Style Action Button */}
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg text-xs tracking-wide transition-all active:scale-98 text-center cursor-pointer border border-slate-200/40"
              >
                Editar Perfil
              </button>
            </div>
          )}
        </div>

        {/* Módulo de Acompanhamento Automático do Pedido Ativo */}
        {userWhatsapp && !isEditing && (() => {
          const activeOrders = pedidos.filter(p => p.status !== "entregue" && p.status !== "cancelado");
          if (activeOrders.length === 0) return null;
          
          const activePed = activeOrders[0];
          const currentStep = getStepIndex(activePed.status);
          
          const STATUS_LABELS: Record<string, string> = {
            novo: "Recebido",
            preparando: "Em preparo",
            pronto: "Pronto — saindo para entrega",
            despachado: "Saiu para entrega",
            entregue: "Entregue e finalizado",
            cancelado: "Cancelado"
          };

          return (
            <div className="mx-4 mt-2 mb-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2rem] p-5 shadow-xl border border-slate-800 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="absolute -right-6 -bottom-6 text-slate-800 text-8xl font-black pointer-events-none select-none opacity-10">
                🍝
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <ReceiptText className="w-4.5 h-4.5 text-orange-400 animate-pulse" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-200">Acompanhar Pedido</h3>
                </div>
                <span className="flex items-center gap-1.5 text-[8px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                  Tempo Real
                </span>
              </div>

              {/* Order code & Status detail */}
              <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800 mb-4 flex justify-between items-center">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Código</span>
                  <span className="text-sm font-black text-white tracking-wider">#{activePed.codigo}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className="text-xs font-black text-orange-400 uppercase tracking-wider">
                    {STATUS_LABELS[activePed.status] || "Processando..."}
                  </span>
                </div>
              </div>

              {/* Horizontal steps flow */}
              <div className="relative py-2">
                {/* Background line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0 rounded-full"></div>
                
                {/* Active line progress */}
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 -translate-y-1/2 z-0 rounded-full transition-all duration-1000 ease-out shadow-sm shadow-orange-400/50"
                  style={{ 
                    width: `${
                      currentStep === 4 ? 100 :
                      currentStep === 3 ? 75 :
                      currentStep === 2.5 ? 62.5 :
                      currentStep === 2 ? 37.5 :
                      currentStep === 1 ? 12.5 : 0
                    }%` 
                  }}
                ></div>

                {/* Steps circles */}
                <div className="relative z-10 flex justify-between items-center">
                  {[
                    { val: 1, label: "Recebido", icon: ShoppingCart },
                    { val: 2, label: "Preparo", icon: ChefHat },
                    { val: 3, label: "Entrega", icon: Truck },
                    { val: 4, label: "Entregue", icon: Check }
                  ].map((s) => {
                    const isDone = currentStep >= s.val;
                    const isCurrent = Math.floor(currentStep) === s.val;
                    const Icon = s.icon;
                    return (
                      <div key={s.val} className="flex flex-col items-center flex-1">
                        <div className={cn(
                          "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500",
                          isDone 
                            ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30 scale-105" 
                            : isCurrent
                              ? "bg-slate-900 border-orange-400 text-orange-400 animate-pulse scale-105 ring-4 ring-orange-500/10"
                              : "bg-slate-950 border-slate-800 text-slate-600"
                        )}>
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>
                        <span className={cn(
                          "text-[8px] uppercase tracking-wider font-extrabold mt-1.5 text-center block leading-tight",
                          isDone ? "text-slate-200" : "text-slate-500"
                        )}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery info summary inside the tracking box */}
              {activePed.tipoEntrega !== "retirada" && activePed.endereco && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Entregar em: {activePed.endereco}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Inventário de Brindes (Backpack/Inventory Style) */}
        {userWhatsapp && !isEditing && (
          <div className="bg-white border-b border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Seu Inventário</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Brindes e Recompensas</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {inventarioBrindes} {inventarioBrindes === 1 ? "Brinde" : "Brindes"}
              </span>
            </div>

            {inventarioBrindes > 0 ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 border border-emerald-150 rounded-2xl p-4 flex gap-3 items-center relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-sm shadow-emerald-500/20 shrink-0">
                    🍝
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-xs leading-snug">Cartão Fidelidade (Prato + 2 Adicionais)</p>
                    <p className="text-[10px] text-emerald-600 font-extrabold leading-none mt-1 uppercase tracking-wide">100% Grátis (Sem Custo)</p>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-1.5">
                      Use este cartão no seu carrinho para resgatar 1 prato + 2 adicionais totalmente grátis sem precisar pagar nada!
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-emerald-500 text-white font-black text-[10px] w-6 h-6 rounded-full border border-emerald-100 shadow-sm">
                    {inventarioBrindes}x
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    localStorage.setItem("autoUseBrinde", "true");
                    showToast("Cartão Fidelidade ativado com sucesso! Escolha seu prato no cardápio para resgatá-lo 100% grátis.", "success");
                    navigate("/");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  🎁 Resgatar Cartão Fidelidade
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-2xl p-5 text-center text-slate-400">
                <p className="text-xs font-bold text-slate-500 mb-1">Seu inventário está vazio</p>
                <p className="text-[10px] text-slate-400 font-medium leading-normal max-w-[280px] mx-auto">
                  Complete seu cartão fidelidade acumulando estrelas com novos pedidos para resgatar macarronadas de brinde!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Coleção de Selos (Instagram Highlights Style) */}
        {userWhatsapp && !isEditing && (
          <div className="bg-white border-b border-slate-100 py-3.5 px-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Conquistas & Selos (Destaques)</p>
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {BADGES_DE_MASSAS.map((badge) => {
                const conquistada = entregues >= badge.requisito;
                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadgeDetail(badge)}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-transform"
                  >
                    {/* Circular highlight border */}
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 relative transition-all",
                      conquistada 
                        ? "bg-slate-50 border-orange-500/80 shadow-sm" 
                        : "bg-slate-100 border-slate-200/50 opacity-40"
                    )}>
                      <span>{badge.emoji}</span>
                      {conquistada && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-extrabold max-w-[64px] truncate text-center leading-tight mt-0.5",
                      conquistada ? "text-slate-800" : "text-slate-400 font-medium"
                    )}>
                      {badge.nome.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}



        {/* Orders list area */}
        <div className="flex-1 px-4 pb-12">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-orange-500" />
              Histórico de Pedidos
            </h3>
            {userWhatsapp && (
              <span className="text-[10px] bg-white border border-slate-150 text-slate-600 font-black px-2.5 py-1 rounded-full shadow-sm">
                {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
              </span>
            )}
          </div>

          {!userWhatsapp ? (
            <div className="bg-white border border-slate-150 rounded-[2rem] p-8 text-center text-slate-400">
              <ReceiptText className="w-10 h-10 mx-auto mb-2 text-slate-350" />
              <p className="text-[11px] font-bold leading-relaxed max-w-xs mx-auto">
                Insira seu número de WhatsApp no campo de identificação acima para que possamos sincronizar seus pedidos automaticamente.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-xs font-bold">Buscando seus pedidos...</p>
            </div>
          ) : errorMsg ? (
            <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-[2rem] p-8 text-center text-slate-400">
              <ReceiptText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold leading-relaxed mb-1">Nenhum pedido encontrado.</p>
              <p className="text-[10px] text-slate-400 font-medium">Não há compras vinculadas ao WhatsApp {userWhatsapp}.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pedidos.map((ped) => {
                const statusInfo = STATUS_CONFIG[ped.status] || {
                  label: ped.status,
                  bg: "bg-slate-100 border-slate-200 text-slate-800",
                  text: "text-slate-600",
                  icon: Clock
                };
                const StatusIcon = statusInfo.icon;
                const isLive = ped.status !== "entregue" && ped.status !== "cancelado";

                return (
                  <div 
                    key={ped.id}
                    className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código</span>
                        <span className="text-xs font-black text-slate-800">#{ped.codigo || "S/C"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wide">
                        <Calendar className="w-3 h-3 text-slate-450" />
                        <span>{formatDate(ped.createdAt)}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Status and Delivery type */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                          statusInfo.bg
                        )}>
                          <StatusIcon className="w-3 h-3 shrink-0" />
                          {statusInfo.label}
                        </span>
                        
                        <span className="text-[9px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md border border-slate-150/50">
                          {ped.tipoEntrega === "retirada" ? "Retirada" : "Delivery"}
                        </span>
                      </div>

                      {/* Items description */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Itens do Pedido</span>
                        <p className="text-xs text-slate-700 font-semibold whitespace-pre-line leading-relaxed">
                          {ped.itens}
                        </p>
                      </div>

                      {/* Delivery Address Details */}
                      {ped.tipoEntrega !== "retirada" && ped.endereco && (
                        <div className="flex items-start gap-1.5 text-slate-500 text-[10px] leading-tight pt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="font-semibold truncate">
                            {ped.endereco} {ped.bairro ? `(${ped.bairro})` : ""}
                          </p>
                        </div>
                      )}

                      {/* Financial info summary */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs">
                        <div className="flex gap-3 font-bold text-slate-400 text-[10px]">
                          <span>Subtotal: {formatMoney(ped.subtotal)}</span>
                          {ped.tipoEntrega !== "retirada" && (
                            <span>Taxa: {formatMoney(ped.taxa)}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Total</span>
                          <span className="text-sm font-black text-slate-900 font-mono mt-0.5">
                            {formatMoney(ped.subtotal + (ped.tipoEntrega === "retirada" ? 0 : ped.taxa))}
                          </span>
                        </div>
                      </div>

                      {/* Live Tracking Link button */}
                      {isLive && ped.codigo && (
                        <button
                          onClick={() => handleTrackOrder(ped.codigo)}
                          className="w-full mt-2 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-2xl transition-all shadow-sm active:scale-95 uppercase tracking-wider cursor-pointer"
                        >
                          <span>Acompanhar ao Vivo</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Popover/Modal para exibição detalhada de selos individuais do usuário */}
      {selectedBadgeDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-100 flex flex-col items-center text-center">
            
            <button
              onClick={() => setSelectedBadgeDetail(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing big circular badge */}
            <div className="w-20 h-20 rounded-2xl bg-slate-950 flex items-center justify-center text-4xl mb-4 border border-slate-800 shadow-inner relative mt-4">
              {selectedBadgeDetail.emoji}
              <div className="absolute inset-0 rounded-2xl bg-amber-500/5 animate-ping duration-1000"></div>
            </div>

            <h3 className="font-black text-white text-lg tracking-tight leading-tight">
              {selectedBadgeDetail.nome}
            </h3>
            
            <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest font-mono mt-1">
              {selectedBadgeDetail.requisito} {selectedBadgeDetail.requisito === 1 ? "Pedido Entregue" : "Pedidos Entregues"}
            </p>

            <p className="text-xs text-slate-350 mt-4 mb-7 leading-relaxed px-2 font-semibold">
              "{selectedBadgeDetail.descricao}"
            </p>

            <button
              onClick={() => setSelectedBadgeDetail(null)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-lg active:scale-95 cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
