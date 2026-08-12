import React, { useState, useEffect } from 'react';
import { Search, ReceiptText, Check, ChefHat, Truck, ShoppingCart, AlertTriangle } from 'lucide-react';
import { db, ROOT } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { cn } from '../lib/utils';

interface AcompanharPedidoProps {
  activeCode?: string | null;
  setActiveCode?: (code: string | null) => void;
}

export default function AcompanharPedido({ activeCode, setActiveCode }: AcompanharPedidoProps) {
  const [codigoInput, setCodigoInput] = useState('');
  const [livePedido, setLivePedido] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    novo: "Recebido",
    preparando: "Em preparo",
    pronto: "Pronto — em breve sairá para entrega",
    despachado: "Saiu para entrega",
    entregue: "Entregue e finalizado",
    cancelado: "Cancelado"
  };

  useEffect(() => {
    if (!activeCode) {
      setLivePedido(null);
      setErrorMsg(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const orderRef = ref(db, `${ROOT}/pedidoCodigos/${activeCode}`);

    const unsubscribe = onValue(orderRef, (snapshot) => {
      setLoading(false);
      const data = snapshot.val();
      if (data) {
        setLivePedido(data);
      } else {
        setLivePedido(null);
        setErrorMsg('Pedido não encontrado no banco de dados. Verifique o código e tente novamente.');
      }
    }, (error) => {
      setLoading(false);
      setErrorMsg('Erro de conexão ao receber atualizações em tempo real.');
      console.error(error);
    });

    return () => unsubscribe();
  }, [activeCode]);

  const handleConsultar = () => {
    const cod = codigoInput.replace(/\D/g, '').slice(0, 4);
    if (cod.length !== 4) {
      setErrorMsg('Digite 4 números.');
      return;
    }
    setErrorMsg(null);
    if (setActiveCode) {
      setActiveCode(cod);
      localStorage.setItem("ultimo_pedido_codigo", cod);
    }
  };

  const handleClear = () => {
    setCodigoInput('');
    setLivePedido(null);
    setErrorMsg(null);
    if (setActiveCode) {
      setActiveCode(null);
      localStorage.removeItem("ultimo_pedido_codigo");
    }
  };

  // Helper to determine active step
  const getStepIndex = (st?: string) => {
    if (!st) return 0;
    if (st === 'entregue') return 4;
    if (st === 'despachado') return 3;
    if (st === 'pronto') return 2.5; // halfway pronto but not yet dispatched/despachado
    if (st === 'preparando') return 2;
    if (st === 'novo') return 1;
    return 1;
  };

  const currentStep = getStepIndex(livePedido?.status);
  const isCanceled = livePedido?.status === 'cancelado';

  return (
    <div className="px-6 pt-6 -mt-4 relative z-10 scroll-mt-4" id="sec-acompanhar">
      <div className="bg-white rounded-[2rem] border-2 border-orange-500/10 shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ReceiptText className={cn("w-5 h-5", activeCode ? "text-indigo-600 animate-pulse" : "text-orange-500")} /> 
            {activeCode ? 'Pedido em Andamento' : 'Acompanhar seu pedido'}
          </h2>
          {activeCode && (
            <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              Tempo Real
            </span>
          )}
        </div>

        {/* Static input panel when there is no active code */}
        {!activeCode ? (
          <>
            <p className="text-xs text-slate-500 leading-relaxed">
              Consulte seu pedido de <strong>4 dígitos</strong> para acompanhar a preparação e entrega ao vivo.
            </p>

            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/20 border-2 border-slate-100 p-4 shadow-inner">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Código do pedido</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  maxLength={4} 
                  inputMode="numeric" 
                  placeholder="• • • •" 
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
                  className="w-full min-w-0 flex-1 bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-center text-2xl sm:text-3xl font-black tracking-widest text-slate-800 placeholder:text-slate-300 placeholder:tracking-normal focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 outline-none transition-shadow"
                />
                <button 
                  onClick={handleConsultar} 
                  className="w-full sm:w-auto sm:min-w-[120px] shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" /> Consultar
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-2xl p-4 text-xs font-bold border bg-red-50 text-red-800 border-red-200/60 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </>
        ) : (
          /* Live Tracking screen when active code exists */
          <div className="space-y-5">
            {/* Header statistics block */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Código</span>
                <span className="text-xl font-black text-slate-800 tracking-wider">#{activeCode}</span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Atual</span>
                <span className={cn(
                  "text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider inline-block",
                  isCanceled ? "bg-red-100 text-red-800" :
                  livePedido?.status === 'entregue' ? "bg-green-100 text-green-800" :
                  livePedido?.status === 'despachado' ? "bg-amber-100 text-amber-800" :
                  "bg-indigo-100 text-indigo-800"
                )}>
                  {STATUS_LABELS[livePedido?.status || 'novo'] || 'Carregando...'}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-2xl p-4 text-xs font-bold border bg-red-50 text-red-800 border-red-200/60">
                {errorMsg}
              </div>
            )}

            {/* Cancelled state UI */}
            {isCanceled && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center space-y-2">
                <span className="text-3xl">⚠️</span>
                <h4 className="font-black text-red-800 text-sm uppercase">Pedido Cancelado</h4>
                <p className="text-xs text-red-600 font-bold leading-relaxed">
                  Este pedido foi cancelado pelo estabelecimento. Entre em contato se precisar de informações.
                </p>
              </div>
            )}

            {/* Standard progress flow UI (non-cancelled) */}
            {!isCanceled && (
              <div className="relative py-4">
                {/* Background line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
                
                {/* Fill line with animation and glow */}
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 -translate-y-1/2 z-0 rounded-full transition-all duration-1000 ease-out shadow-sm shadow-indigo-400/50"
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

                {/* Circles / steps */}
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
                          "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                          isDone 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-110" 
                            : isCurrent
                              ? "bg-white border-indigo-500 text-indigo-500 animate-pulse scale-110 ring-4 ring-indigo-500/10"
                              : "bg-white border-slate-200 text-slate-400"
                        )}>
                          <Icon className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-extrabold mt-2 text-center block leading-tight",
                          isDone ? "text-slate-800" : "text-slate-400"
                        )}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-black text-slate-400 hover:text-red-500 py-2 px-4 transition-colors uppercase tracking-wider"
              >
                Consultar outro pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

