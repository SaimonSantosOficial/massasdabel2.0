import React, { useState, useEffect } from "react";
import { ShoppingCart, LogIn, Save, Ban, Lock, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../store/useDataStore";
import ClientHeader from "../components/ClientHeader";
import AcompanharPedido from "../components/AcompanharPedido";
import Builder from "../components/Builder";
import CartModal from "../components/CartModal";
import { Prato, Pedido } from "../types";
import { cn, formatMoney } from "../lib/utils";
import { db, ROOT, auth } from "../lib/firebase";
import { useNotification } from "../components/NotificationProvider";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { ref, get, set, onValue } from "firebase/database";

export default function ClientApp() {
  const { showToast, showConfirm } = useNotification();
  const { menuData, bairros, marketing, loading } = useDataStore();
  const pagConfigRaw = marketing?.pagamentoConfig || {
    pixChave: "85994190258",
    pixNome: "Milena Barbosa da Silva",
    pixBanco: "Nubank",
    pixCidade: "MARANGUAPE",
    whatsappNumero: "5585994167945",
  };
  const pagConfig = {
    ...pagConfigRaw,
    whatsappNumero: pagConfigRaw.whatsappNumero === "5585994190258" ? "5585994167945" : pagConfigRaw.whatsappNumero
  };
  const [cart, setCart] = useState<Prato[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [pedidoSuccess, setPedidoSuccess] = useState<string | null>(null);
  const [showPixPopout, setShowPixPopout] = useState(false);
  const [activeOrderCode, setActiveOrderCode] = useState<string | null>(() => {
    return localStorage.getItem("ultimo_pedido_codigo") || null;
  });
  const navigate = useNavigate();

  // Authentication & WhatsApp constraint states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userWhatsapp, setUserWhatsapp] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userPhotoURL, setUserPhotoURL] = useState<string>(() => localStorage.getItem("photoURL") || "");
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [whatsappStep, setWhatsappStep] = useState(false);
  const [tempWhatsapp, setTempWhatsapp] = useState("");
  const [tempNome, setTempNome] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [userBanned, setUserBanned] = useState(false);
  const [userBlocked, setUserBlocked] = useState(false);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (user) {
        setCurrentUser(user);
        
        // Listen to the user's specific data in real-time
        const userRef = ref(db, `${ROOT}/users/${user.uid}`);
        unsubUser = onValue(userRef, (snap) => {
          const userData = snap.val();
          if (userData) {
            setUserBanned(!!userData.banido);
            setUserBlocked(!!userData.bloqueado);

            // Sincroniza flag isGoogle se logado com Google
            const isGoogleProvider = user.providerData?.some(p => p.providerId === "google.com") || false;
            if (isGoogleProvider && userData.isGoogle !== true) {
              set(ref(db, `${ROOT}/users/${user.uid}/isGoogle`), true);
            }

            if (userData.whatsapp) {
              setUserWhatsapp(userData.whatsapp);
              setUserName(userData.nome || user.displayName || "");
              const photo = userData.photoURL || user.photoURL || "";
              setUserPhotoURL(photo);
              localStorage.setItem("whatsapp", userData.whatsapp);
              localStorage.setItem("nome", userData.nome || user.displayName || "");
              if (photo) localStorage.setItem("photoURL", photo);
              
              if (!userData.banido && !userData.bloqueado) {
                setShowLoginModal(false);
              }
            } else {
              setTempNome(user.displayName || "");
              setWhatsappStep(true);
              setShowLoginModal(true);
            }
          } else {
            setUserBanned(false);
            setUserBlocked(false);
            setTempNome(user.displayName || "");
            setWhatsappStep(true);
            setShowLoginModal(true);

            // Já pré-grava isGoogle true se for Google
            const isGoogleProvider = user.providerData?.some(p => p.providerId === "google.com") || false;
            if (isGoogleProvider) {
              set(ref(db, `${ROOT}/users/${user.uid}/isGoogle`), true);
            }
          }
          setAuthLoading(false);
        }, (err) => {
          console.error("Erro ao escutar dados do usuário:", err);
          setAuthLoading(false);
        });

      } else {
        setCurrentUser(null);
        setUserBanned(false);
        setUserBlocked(false);
        const localWa = localStorage.getItem("whatsapp");
        const localName = localStorage.getItem("nome");
        const localPhoto = localStorage.getItem("photoURL") || "";
        if (localWa && localName) {
          setUserWhatsapp(localWa);
          setUserName(localName);
          setUserPhotoURL(localPhoto);
          setShowLoginModal(false);
        } else {
          setUserWhatsapp("");
          setUserName("");
          setUserPhotoURL("");
          setWhatsappStep(false);
          const skipLogin = sessionStorage.getItem("skipLogin") === "true";
          if (skipLogin) {
            setShowLoginModal(false);
          } else {
            setShowLoginModal(true);
          }
        }
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        showToast(`Bem-vindo, ${result.user.displayName}!`, "success");
      }
    } catch (err: any) {
      console.error("Erro no Google Login:", err);
      showToast("Erro ao fazer login com o Google: " + err.message, "error");
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!tempWhatsapp.trim()) {
      showToast("Por favor, informe seu número de WhatsApp.", "warning");
      return;
    }
    const cleanWa = tempWhatsapp.replace(/\D/g, "");
    if (cleanWa.length < 10 || cleanWa.length > 11) {
      showToast("Por favor, informe um WhatsApp válido com DDD.", "warning");
      return;
    }
    if (!tempNome.trim()) {
      showToast("Por favor, digite seu nome completo.", "warning");
      return;
    }

    setSavingWhatsapp(true);
    try {
      if (currentUser) {
        const isGoogleProvider = currentUser.providerData?.some(p => p.providerId === "google.com") || false;
        await set(ref(db, `${ROOT}/users/${currentUser.uid}`), {
          whatsapp: cleanWa,
          nome: tempNome,
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          isGoogle: isGoogleProvider,
          updatedAt: Date.now()
        });
      }
      setUserWhatsapp(cleanWa);
      setUserName(tempNome);
      localStorage.setItem("whatsapp", cleanWa);
      localStorage.setItem("nome", tempNome);
      showToast("Perfil atualizado! Bem-vindo ao cardápio! 🍝", "success");
      setShowLoginModal(false);
    } catch (err: any) {
      showToast("Erro ao salvar dados: " + err.message, "error");
    } finally {
      setSavingWhatsapp(false);
    }
  };

  useEffect(() => {
    // Redireciona para manutenção se estiver ativo e não for admin
    if (
      marketing?.loja?.modoManutencao &&
      localStorage.getItem("adminLogado") !== "true"
    ) {
      navigate("/manutencao");
    }
  }, [marketing?.loja?.modoManutencao, navigate]);

  const checkLojaStatus = () => {
    if (!marketing?.loja) return { aberto: true, msg: "" };
    if (marketing.loja.aberto === false) {
      return {
        aberto: false,
        msg:
          marketing.loja.mensagem ||
          "No momento não estamos aceitando pedidos. Volte mais tarde!",
      };
    }
    const hs = marketing.loja.horarioSemana;
    if (hs?.usar) {
      const now = new Date();
      const dia = hs.dias[now.getDay()];
      if (!dia?.ativo)
        return {
          aberto: false,
          msg: hs.mensagemForaHorario || "Fechado hoje.",
        };
      const cur = now.getHours() * 60 + now.getMinutes();
      const pIni = dia.inicio.split(":");
      const pFim = dia.fim.split(":");
      const start = parseInt(pIni[0]) * 60 + parseInt(pIni[1]);
      const end = parseInt(pFim[0]) * 60 + parseInt(pFim[1]);

      const isWithin =
        end < start ? cur >= start || cur <= end : cur >= start && cur <= end;
      if (!isWithin) {
        return {
          aberto: false,
          msg: hs.mensagemForaHorario || "Fechado no momento.",
        };
      }
    }
    return { aberto: true, msg: "" };
  };

  const { aberto, msg: msgFechada } = checkLojaStatus();
  const cartTotal = cart.reduce((acc, curr) => acc + curr.total, 0);

  if (loading || authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
        Carregando...
      </div>
    );

  if (userBanned || userBlocked) {
    return (
      <div className="text-slate-800 antialiased relative bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <main className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
          
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            userBanned ? "bg-red-50 text-red-500 border border-red-200" : "bg-amber-50 text-amber-500 border border-amber-200"
          )}>
            {userBanned ? <Ban className="w-10 h-10 animate-pulse" /> : <Lock className="w-10 h-10" />}
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {userBanned ? "Acesso Suspenso" : "Acesso Bloqueado"}
          </h2>
          
          <p className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase mt-1">
            Massas da Bel
          </p>

          <p className="text-sm text-slate-600 mt-4 mb-8 leading-relaxed px-2">
            {userBanned 
              ? "Infelizmente, sua conta foi banida permanentemente por decisão da administração. Se você acredita que houve um erro, entre em contato para solicitar uma revisão."
              : "Sua conta está temporariamente bloqueada para novas compras e acesso ao cardápio. Para regularizar seu acesso, por favor fale conosco."}
          </p>

          <div className="w-full space-y-3">
            <a
              href={`https://wa.me/${pagConfig.whatsappNumero}?text=${encodeURIComponent(
                userBanned 
                  ? "Olá, meu acesso à Massas da Bel foi suspenso e gostaria de solicitar uma revisão." 
                  : "Olá, meu acesso à Massas da Bel foi bloqueado e gostaria de regularizar meu cadastro."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-95"
            >
              Falar no Suporte <Phone className="w-4 h-4" />
            </a>

            <button
              onClick={async () => {
                await signOut(auth);
                localStorage.removeItem("whatsapp");
                localStorage.removeItem("nome");
                localStorage.removeItem("photoURL");
                setUserWhatsapp("");
                setUserName("");
                setUserPhotoURL("");
                setTempWhatsapp("");
                setTempNome("");
                setWhatsappStep(false);
                setUserBanned(false);
                setUserBlocked(false);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Entrar com outra conta
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="text-slate-800 antialiased relative pb-24 bg-slate-50 min-h-screen">
      <main className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden">
        <ClientHeader marketing={marketing} aberto={aberto} />

        {currentUser && (
          <div className="mx-4 mt-4 mb-1 bg-slate-900 text-slate-100 rounded-3xl p-4 shadow-md flex flex-col gap-3 border border-slate-800">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                {userPhotoURL || currentUser.photoURL ? (
                  <img src={userPhotoURL || currentUser.photoURL} alt="Foto" className="w-9 h-9 rounded-full border border-slate-700 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm uppercase">
                    {userName ? userName.substring(0, 2) : "US"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-black truncate leading-tight text-white">Olá, {userName}!</p>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">WhatsApp: {userWhatsapp}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  showConfirm({
                    title: "Sair da Conta",
                    message: "Deseja mesmo sair da sua conta?",
                    confirmText: "Sair",
                    cancelText: "Cancelar",
                    onConfirm: async () => {
                      await signOut(auth);
                      localStorage.removeItem("whatsapp");
                      localStorage.removeItem("nome");
                      localStorage.removeItem("photoURL");
                      setUserWhatsapp("");
                      setUserName("");
                      setUserPhotoURL("");
                      setTempWhatsapp("");
                      setTempNome("");
                      setWhatsappStep(false);
                      setShowLoginModal(true);
                    }
                  });
                }}
                className="text-[10px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-wider bg-red-500/10 px-3 py-2 rounded-xl active:scale-95 transition-transform"
              >
                Sair
              </button>
            </div>
            
            <button
              onClick={() => navigate("/perfil")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>👤 Ver Meu Perfil & Histórico de Pedidos</span>
            </button>
          </div>
        )}

        {!currentUser && (
          <div className="mx-4 mt-4 mb-1 bg-slate-900 text-slate-100 rounded-3xl p-4 shadow-md border border-slate-800/80">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-sm uppercase">
                  {userName ? userName.substring(0, 2) : "VS"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black truncate leading-tight text-white">
                    {userName ? `Visitante: ${userName}` : "Acessando sem Login"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">
                    {userWhatsapp ? `WhatsApp: ${userWhatsapp}` : "Nenhum WhatsApp salvo"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem("skipLogin");
                  setWhatsappStep(false);
                  setShowLoginModal(true);
                }}
                className="text-[10px] bg-orange-500 hover:bg-orange-600 text-white font-extrabold uppercase tracking-wider px-3.5 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
              >
                Identificar-se / Login
              </button>
            </div>
          </div>
        )}
        {marketing?.anuncio?.ativo && (
          <div className="mx-4 mt-2 mb-1 rounded-2xl border-2 border-orange-500/30 bg-orange-50 px-4 py-3 shadow-sm">
            <p className="font-black text-slate-900 text-sm">
              {marketing.anuncio.titulo}
            </p>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {marketing.anuncio.mensagem}
            </p>
          </div>
        )}

        {!aberto && (
          <div className="mx-4 mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 shadow-sm text-center">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">
              Cardápio fechado
            </p>
            <p className="text-sm font-bold text-red-700 leading-relaxed">
              {msgFechada}
            </p>
          </div>
        )}

        {/* O acompanhamento do pedido agora é feito automaticamente no perfil */}

        {pedidoSuccess && (
          <div className="mx-6 mt-4 rounded-2xl p-6 border-2 border-orange-500 bg-white text-center shadow-lg">
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
              Pedido anotado
            </p>
            <p className="text-sm font-bold text-slate-800 mb-1">
              Obrigado pela preferência!
            </p>
            <p className="text-xs text-slate-500 mb-2">
              Seu código do pedido é:
            </p>
            <p className="text-4xl font-black text-orange-500 tracking-[0.25em] font-mono">
              {pedidoSuccess}
            </p>
            <button
              onClick={() => setPedidoSuccess(null)}
              className="mt-4 text-xs font-bold text-slate-500 hover:text-orange-500"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="relative">
          {!aberto && (
            <div className="absolute inset-0 z-[12] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm px-6 text-center">
              <div className="max-w-xs rounded-2xl border-2 border-slate-200 bg-white px-5 py-6 shadow-xl">
                <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-2">
                  Cardápio fechado
                </p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {msgFechada}
                </p>
              </div>
            </div>
          )}
          <Builder
            menuData={menuData}
            marketing={marketing}
            onAddToCart={(prato) => {
              setCart([...cart, prato]);
              showToast("Prato Adicionado!");
            }}
          />
        </div>

        {/* Floating Cart (Native App Circle Capsule style, positioned so it does not overlap builder bottom bar) */}
        {aberto && cart.length > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="fixed bottom-[96px] right-4 bg-slate-900 hover:bg-black text-white px-4 py-3 rounded-full shadow-2xl z-40 flex items-center gap-2.5 border border-slate-800/80 active:scale-95 transition-all cursor-pointer"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-2.5 -right-2.5 bg-orange-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900">
                {cart.length}
              </span>
            </div>
            <div className="flex flex-col items-start pr-1 text-left">
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Minha Sacola</span>
              <span className="text-xs font-black font-mono leading-none mt-1 text-white">
                {formatMoney(cartTotal)}
              </span>
            </div>
          </button>
        )}
      </main>

      {/* Cart Modal */}
      {cartOpen && (
        <CartModal
          cart={cart}
          setCart={setCart}
          bairros={bairros}
          onClose={() => setCartOpen(false)}
          showToast={showToast}
          onSuccess={(cod, pag) => {
            setCartOpen(false);
            setPedidoSuccess(cod);
            setActiveOrderCode(cod);
            localStorage.setItem("ultimo_pedido_codigo", cod);
            setCart([]);
            if (pag === "Pix") {
              setShowPixPopout(true);
            } else {
              navigate("/perfil");
            }
          }}
        />
      )}

      {/* Pix Popout Modal */}
      {showPixPopout && (
        <div
          id="pix-popout-modal"
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h3 className="font-black text-slate-800 text-xl text-center mb-2">
              Chave Pix para Pagamento
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Realize a transferência Pix para os dados abaixo e envie o
              comprovante no WhatsApp!
            </p>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-3.5 text-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Titular
                </span>
                <span className="font-black text-slate-800 text-right">
                  {pagConfig.pixNome}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Banco
                </span>
                <span className="font-black text-slate-800">{pagConfig.pixBanco}</span>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-200/60">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                  Chave Pix
                </span>
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-sm">
                  <span className="font-mono text-xs font-black text-indigo-600 select-all">
                    {pagConfig.pixChave}
                  </span>
                  <button
                    id="copy-pix-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(pagConfig.pixChave);
                      showToast("Chave Pix copiada!", "success");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <button
              id="close-pix-btn"
              onClick={() => {
                setShowPixPopout(false);
                navigate("/perfil");
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl text-sm transition-colors shadow-lg active:scale-95 transition-transform duration-75"
            >
              Fechar Janela
            </button>
          </div>
        </div>
      )}

      {/* Login & WhatsApp Registration Modal Popout */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 flex flex-col items-center">
            
            <div className="w-16 h-16 bg-orange-100/80 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <span className="text-3xl">🍝</span>
            </div>

            {!whatsappStep ? (
              <>
                <h3 className="font-black text-slate-800 text-xl text-center mb-2 leading-tight">
                  Bem-vindo ao Massas da Bel!
                </h3>
                <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                  Para acessar o cardápio e realizar seus pedidos de forma prática, entre com a sua conta do Google.
                </p>

                {/* Google login (Optional) */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-md active:scale-95 duration-75"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.856 5.856 0 0 1 8.1 12.75a5.856 5.856 0 0 1 5.89-5.85c1.47 0 2.8.5 3.84 1.493l3.254-3.253C18.992 3.1 16.591 2 13.99 2 8.473 2 4 6.473 4 12s4.473 10 9.99 10c5.76 0 9.605-4.045 9.605-9.76a9.54 9.54 0 0 0-.166-1.955H12.24z"
                    />
                  </svg>
                  <span>Entrar com o Google</span>
                </button>

                {/* Elegant separator */}
                <div className="w-full flex items-center gap-3 my-5">
                  <div className="h-[1px] bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ou</span>
                  <div className="h-[1px] bg-slate-100 flex-1"></div>
                </div>

                <button
                  onClick={() => {
                    sessionStorage.setItem("skipLogin", "true");
                    setShowLoginModal(false);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-3.5 rounded-2xl text-xs transition-all active:scale-95 duration-75 text-center uppercase tracking-wider"
                >
                  Acessar sem Google
                </button>
              </>
            ) : (
              <>
                <h3 className="font-black text-slate-800 text-xl text-center mb-2 leading-tight">
                  Preencha seus Dados
                </h3>
                <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                  Informe seu nome e WhatsApp para poder realizar seus pedidos no cardápio de forma automática.
                </p>

                <div className="w-full space-y-4 mb-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={tempNome}
                      onChange={(e) => setTempNome(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:border-orange-500 outline-none font-bold text-slate-800"
                      placeholder="Ex: João Silva"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      Seu WhatsApp (com DDD) *
                    </label>
                    <input
                      type="tel"
                      value={tempWhatsapp}
                      onChange={(e) => setTempWhatsapp(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:border-orange-500 outline-none font-bold text-slate-800"
                      placeholder="Ex: 85999999999"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveWhatsapp}
                  disabled={savingWhatsapp}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 duration-75"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingWhatsapp ? "Salvando..." : "Salvar e Acessar Cardápio"}</span>
                </button>

                {!currentUser && (
                  <button
                    onClick={() => setWhatsappStep(false)}
                    className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
                  >
                    Voltar
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
