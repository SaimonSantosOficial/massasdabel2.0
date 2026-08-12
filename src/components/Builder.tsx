import React, { useState } from "react";
import { MenuData, ConfigMarketing, Sabor, Prato, Adicional } from "../types";
import { cn, formatMoney } from "../lib/utils";
import { 
  Check, 
  ShoppingCart, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Sparkles, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useNotification } from "./NotificationProvider";
import { motion, AnimatePresence } from "motion/react";

export default function Builder({
  menuData,
  marketing,
  onAddToCart,
}: {
  menuData: MenuData;
  marketing: ConfigMarketing | null;
  onAddToCart: (p: Prato) => void;
}) {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [current, setCurrent] = useState<Prato>({
    massa: null,
    massas: [],
    molhos: [],
    qtdMolho: "Muito",
    tamanho: "G",
    sabores: [],
    adicionais: [],
    bebidas: [],
    complementos: [],
    total: 0,
  });

  const calcPrecoSabor = (sab: Sabor, tam: "P" | "G") => {
    let base = tam === "P" ? sab.p : sab.g;

    // Check if there is an active scheduled promotion for this flavor
    let off = 0;
    const now = new Date();
    const diaSemanaArray = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    const diaHoje = diaSemanaArray[now.getDay()];

    const promoAtiva = marketing?.promocoesSabores?.find((p) => {
      const matchesDay = p.diasSemana?.includes(diaHoje);
      return p.ativo && p.sabor === sab.nome && matchesDay;
    });

    if (promoAtiva) {
      off = Number(promoAtiva.desconto) || 0;
    } else {
      // Fallback to legacy static discount
      const desc = marketing?.descontosPorSabor?.[sab.nome];
      if (desc) {
        off = tam === "P" ? Number(desc.p) || 0 : Number(desc.g) || 0;
      }
    }

    if (off > 0) {
      base = Math.max(0, base - off);
    }
    return base;
  };

  const update = (changes: Partial<Prato>) => {
    const next = { ...current, ...changes };
    let t = 0;

    if (next.tamanho && next.sabores.length > 0) {
      t = Math.max(
        ...next.sabores.map((s) => calcPrecoSabor(s, next.tamanho!)),
      );
    }

    next.adicionais.forEach((a) => (t += a.preco));
    next.bebidas.forEach((a) => (t += a.preco));
    next.total = t;
    setCurrent(next);
  };

  const toggleMassa = (m: string) => {
    const currentMassas = current.massas || [];
    const exists = currentMassas.includes(m);
    let nextMassas: string[];
    if (exists) {
      nextMassas = [];
    } else {
      nextMassas = [m];
    }
    update({
      massas: nextMassas,
      massa: nextMassas.length > 0 ? nextMassas[0] : null,
    });
  };

  const toggleSabor = (s: Sabor) => {
    if (s.esgotado) return;
    const exists = current.sabores.find((x) => x.nome === s.nome);
    if (exists) {
      update({ sabores: current.sabores.filter((x) => x.nome !== s.nome) });
    } else if (current.sabores.length < 2) {
      update({ sabores: [...current.sabores, s] });
    } else {
      showToast("Máximo de 2 sabores permitidos.", "warning");
    }
  };

  const handleAdd = () => {
    if (!current.massa) {
      showToast("Selecione pelo menos uma Massa!", "warning");
      setActiveTab(0);
      return;
    }
    if (current.molhos.length === 0) {
      showToast("Escolha pelo menos 1 molho!", "warning");
      setActiveTab(1);
      return;
    }
    if (!current.tamanho) {
      showToast("Selecione o Tamanho!", "warning");
      return;
    }
    if (current.sabores.length === 0) {
      showToast("Selecione pelo menos 1 Sabor!", "warning");
      setActiveTab(2);
      return;
    }

    const pratoPayload = { ...current, bebidas: [...current.bebidas] };

    const targetMassas =
      marketing?.compreGanhe?.massasAlvo ||
      (marketing?.compreGanhe?.massaAlvo
        ? [marketing.compreGanhe.massaAlvo]
        : []);
    const hasMassaPromo =
      (pratoPayload.massa && targetMassas.includes(pratoPayload.massa)) ||
      (pratoPayload.massas || []).some((m) => targetMassas.includes(m));

    if (marketing?.compreGanhe?.ativo && hasMassaPromo) {
      pratoPayload.bebidas.push({
        nome: `BRINDE: ${marketing.compreGanhe.bebidaPremio}`,
        preco: 0,
        img: "",
      });
    }

    onAddToCart(pratoPayload);
    setCurrent({
      massa: null,
      massas: [],
      molhos: [],
      qtdMolho: "Muito",
      tamanho: "G",
      sabores: [],
      adicionais: [],
      bebidas: [],
      complementos: [],
      total: 0,
    });
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const steps = [
    { id: 0, label: "Massa", emoji: "🍝", isCompleted: () => !!current.massa },
    { id: 1, label: "Molhos", emoji: "🍅", isCompleted: () => current.molhos.length > 0 },
    { id: 2, label: "Sabores", emoji: "😋", isCompleted: () => current.sabores.length > 0 },
    { id: 3, label: "Adicionais", emoji: "🧀", isCompleted: () => current.adicionais.length > 0, count: () => current.adicionais.length },
    { id: 4, label: "Bebidas", emoji: "🥤", isCompleted: () => current.bebidas.length > 0, count: () => current.bebidas.length },
    { id: 5, label: "Extras", emoji: "🥬", isCompleted: () => current.complementos.length > 0, count: () => current.complementos.length },
  ];

  const handleNext = () => {
    if (activeTab === 0 && !current.massa) {
      showToast("Selecione a Massa para prosseguir.", "warning");
      return;
    }
    if (activeTab === 1 && current.molhos.length === 0) {
      showToast("Selecione ao menos 1 molho para prosseguir.", "warning");
      return;
    }
    if (activeTab === 2 && current.sabores.length === 0) {
      showToast("Selecione ao menos 1 sabor para prosseguir.", "warning");
      return;
    }

    if (activeTab < 5) {
      setActiveTab((prev) => prev + 1);
      // Auto-scroll inside mobile container
      const container = document.getElementById("builder-content-area");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      handleAdd();
    }
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
      const container = document.getElementById("builder-content-area");
      if (container) {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div id="builder-content-area" className="flex flex-col bg-slate-50 min-h-[500px]">
      
      {/* Horizontal Native Category Selector */}
      <div className="sticky top-[56px] z-20 bg-white border-b border-slate-100 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex px-4 py-3 gap-2.5 min-w-max">
          {steps.map((s) => {
            const isActive = activeTab === s.id;
            const isDone = s.isCompleted();
            const count = s.count ? s.count() : 0;

            return (
              <button
                key={s.id}
                onClick={() => {
                  // Allow clicking back freely, or moving forward if validated
                  if (s.id < activeTab) {
                    setActiveTab(s.id);
                  } else {
                    // Quick validation checklist
                    if (s.id > 0 && !current.massa) {
                      showToast("Escolha a Massa antes!", "warning");
                      return;
                    }
                    if (s.id > 1 && current.molhos.length === 0) {
                      showToast("Escolha os Molhos antes!", "warning");
                      return;
                    }
                    if (s.id > 2 && current.sabores.length === 0) {
                      showToast("Escolha os Sabores antes!", "warning");
                      return;
                    }
                    setActiveTab(s.id);
                  }
                }}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border",
                  isActive
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-[1.03]"
                    : isDone
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50"
                    : "bg-slate-100 text-slate-500 border-slate-100 hover:bg-slate-200/60"
                )}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold font-mono",
                    isActive ? "bg-white text-orange-500" : "bg-emerald-200 text-emerald-800"
                  )}>
                    {count}
                  </span>
                )}
                {isDone && !isActive && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Dynamic Order Preview Header */}
      <div className="mx-4 mt-4 bg-white border border-slate-150 rounded-2xl p-3.5 shadow-sm flex flex-col gap-1.5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Monte o seu Prato</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className={cn("px-2 py-1 rounded-lg font-bold border", current.tamanho ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-slate-100 border-dashed")}>
            📏 Tamanho {current.tamanho === "P" ? "P (Pequeno)" : current.tamanho === "G" ? "G (Grande)" : "Selecione"}
          </span>
          <span className={cn("px-2 py-1 rounded-lg font-bold border", current.massa ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-slate-100 border-dashed")}>
            🍝 {current.massa || "Sem massa"}
          </span>
          <span className={cn("px-2 py-1 rounded-lg font-bold border", current.molhos.length > 0 ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-slate-100 border-dashed")}>
            🍅 {current.molhos.length > 0 ? current.molhos.join(" & ") : "Sem molho"}
          </span>
          <span className={cn("px-2 py-1 rounded-lg font-bold border", current.sabores.length > 0 ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-slate-100 border-dashed")}>
            😋 {current.sabores.length > 0 ? current.sabores.map(s => s.nome).join(" & ") : "Sem sabores"}
          </span>
        </div>
      </div>

      {/* Interactive Tabs Content Rendered with Smooth Slide Transitions */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="space-y-6 pb-28"
          >
            
            {/* Step 0: Escolha a Massa */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">1. Escolha a Massa</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione 1 massa deliciosa para sua base.</p>
                  </div>
                  <span className="text-[10px] bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-600 font-extrabold uppercase">
                    Obrigatório
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {menuData.massas.map((m) => {
                    const targetList =
                      marketing?.compreGanhe?.massasAlvo ||
                      (marketing?.compreGanhe?.massaAlvo
                        ? [marketing.compreGanhe.massaAlvo]
                        : []);
                    const isCompreGanhe =
                      marketing?.compreGanhe?.ativo && targetList.includes(m);
                    const isSelected = !!current.massas?.includes(m);
                    const esgotado = menuData.massasEsgotadas?.[m];

                    return (
                      <motion.div
                        key={m}
                        whileTap={{ scale: esgotado ? 1 : 0.97 }}
                        onClick={() => !esgotado && toggleMassa(m)}
                        className={cn(
                          "bg-white border rounded-[1.75rem] overflow-hidden cursor-pointer shadow-sm transition-all duration-200 relative flex flex-col justify-between",
                          isSelected ? "border-orange-500 ring-2 ring-orange-500/15 bg-orange-50/20" : "border-slate-200",
                          esgotado && "opacity-45 grayscale pointer-events-none"
                        )}
                      >
                        {isCompreGanhe && (
                          <div className="bg-purple-600 text-white text-[9px] font-black rounded-bl-xl px-2 py-1 absolute top-0 right-0 tracking-wider z-10 uppercase">
                            {marketing.compreGanhe?.textoDestaque || "Brinde"}
                          </div>
                        )}
                        
                        {/* Image area */}
                        <div className="h-32 w-full bg-slate-100 relative">
                          {menuData.massasImgs[m] ? (
                            <img src={menuData.massasImgs[m]} alt={m} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              🍝
                            </div>
                          )}
                        </div>

                        {/* Text and selection state */}
                        <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-slate-50">
                          <span className="font-extrabold text-slate-800 text-xs">
                            {m} {esgotado && <span className="text-red-500 block text-[9px] font-normal">(Esgotado)</span>}
                          </span>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                              isSelected
                                ? "bg-orange-500 border-orange-500 scale-110 shadow-md shadow-orange-500/10"
                                : "bg-white border-slate-300"
                            )}
                          >
                            <Check className={cn("w-3 h-3 text-white stroke-[3]", isSelected ? "opacity-100" : "opacity-0")} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Escolha os Molhos */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">2. Escolha os Molhos</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione até 2 molhos artesanais para sua massa.</p>
                  </div>
                  <span className="text-[10px] bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-600 font-extrabold uppercase">
                    Mínimo 1
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {menuData.molhos.map((m) => {
                    const isSelected = current.molhos.includes(m);
                    const esgotado = menuData.molhosEsgotados?.[m];
                    const disabled = !isSelected && current.molhos.length >= 2;

                    return (
                      <motion.div
                        key={m}
                        whileTap={{ scale: esgotado || disabled ? 1 : 0.97 }}
                        onClick={() => {
                          if (esgotado) return;
                          const ex = current.molhos.includes(m);
                          if (ex) {
                            update({ molhos: current.molhos.filter((x) => x !== m) });
                          } else if (current.molhos.length < 2) {
                            update({ molhos: [...current.molhos, m] });
                          } else {
                            showToast("Escolha no máximo 2 molhos.", "warning");
                          }
                        }}
                        className={cn(
                          "bg-white border rounded-[1.75rem] overflow-hidden cursor-pointer shadow-sm transition-all duration-200 relative flex flex-col justify-between",
                          isSelected ? "border-orange-500 ring-2 ring-orange-500/15 bg-orange-50/20" : "border-slate-200",
                          (esgotado || disabled) && "opacity-45 grayscale pointer-events-none"
                        )}
                      >
                        {/* Image area */}
                        <div className="h-32 w-full bg-slate-100 relative">
                          {menuData.molhosImgs[m] ? (
                            <img src={menuData.molhosImgs[m]} alt={m} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              🍅
                            </div>
                          )}
                        </div>

                        {/* Text and selection */}
                        <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-slate-50">
                          <span className="font-extrabold text-slate-800 text-xs">
                            {m} {esgotado && <span className="text-red-500 block text-[9px] font-normal">(Esgotado)</span>}
                          </span>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                              isSelected
                                ? "bg-orange-500 border-orange-500 scale-110 shadow-md shadow-orange-500/10"
                                : "bg-white border-slate-300"
                            )}
                          >
                            <Check className={cn("w-3 h-3 text-white stroke-[3]", isSelected ? "opacity-100" : "opacity-0")} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Nice Segmented Toggler for Molho Quantity */}
                <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-sm mt-2">
                  <div className="flex items-center gap-1.5 mb-3.5 justify-center">
                    <Info className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Preferência de Molho
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl relative">
                    <button
                      onClick={() => update({ qtdMolho: "Pouco" })}
                      className={cn(
                        "flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 z-10",
                        current.qtdMolho === "Pouco"
                          ? "bg-white text-orange-500 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Pouco Molho
                    </button>
                    <button
                      onClick={() => update({ qtdMolho: "Muito" })}
                      className={cn(
                        "flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 z-10",
                        current.qtdMolho === "Muito"
                          ? "bg-white text-orange-500 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Muito Molho
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Escolha de Sabores */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">3. Sabores</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione até 2 sabores espetaculares.</p>
                  </div>
                  <span className="text-[10px] bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-600 font-extrabold uppercase">
                    Mínimo 1
                  </span>
                </div>

                {/* Seleção de Tamanho */}
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                        Tamanho do Prato
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Escolha a porção Pequena (P) ou Grande (G).
                      </p>
                    </div>
                    <span className="text-[10px] bg-orange-500/10 px-2.5 py-1 rounded-full text-orange-600 font-extrabold uppercase">
                      {current.tamanho === "P" ? "Pequeno (P)" : "Grande (G)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => update({ tamanho: "P" })}
                      className={cn(
                        "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer",
                        current.tamanho === "P"
                          ? "border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/15"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800 text-xs uppercase">
                          Pequeno (P)
                        </span>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                            current.tamanho === "P"
                              ? "bg-orange-500 border-orange-500"
                              : "bg-white border-slate-300"
                          )}
                        >
                          <Check
                            className={cn(
                              "w-3 h-3 text-white stroke-[3]",
                              current.tamanho === "P" ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        Porção individual (P)
                      </p>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => update({ tamanho: "G" })}
                      className={cn(
                        "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer",
                        current.tamanho === "G"
                          ? "border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/15"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800 text-xs uppercase">
                          Grande (G)
                        </span>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                            current.tamanho === "G"
                              ? "bg-orange-500 border-orange-500"
                              : "bg-white border-slate-300"
                          )}
                        >
                          <Check
                            className={cn(
                              "w-3 h-3 text-white stroke-[3]",
                              current.tamanho === "G" ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        Porção generosa (G)
                      </p>
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-3">
                  {menuData.sabores.map((s) => {
                    const selected = current.sabores.some((x) => x.nome === s.nome);
                    const currentTam = current.tamanho || "G";
                    const eff = calcPrecoSabor(s, currentTam);
                    const base = currentTam === "P" ? s.p : s.g;
                    const limit = !selected && current.sabores.length >= 2;

                    return (
                      <motion.div
                        key={s.nome}
                        whileTap={{ scale: s.esgotado || limit ? 1 : 0.98 }}
                        onClick={() => !s.esgotado && toggleSabor(s)}
                        className={cn(
                          "border rounded-2xl p-3.5 cursor-pointer flex items-center gap-4 bg-white shadow-sm transition-all relative",
                          selected
                            ? "border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/10"
                            : "border-slate-150",
                          (s.esgotado || limit) && "opacity-45 pointer-events-none grayscale"
                        )}
                      >
                        {/* Flavor Image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-150 shrink-0">
                          {s.img ? (
                            <img src={s.img} alt={s.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              🍝
                            </div>
                          )}
                        </div>

                        {/* Content area */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-slate-800 text-sm truncate leading-snug">
                              {s.nome}
                            </span>
                            <span className="text-orange-500 text-xs font-black bg-orange-50 px-2 py-1 rounded-lg font-mono shrink-0">
                              {eff !== base && (
                                <span className="line-through text-slate-400 mr-1.5 font-normal">
                                  {formatMoney(base)}
                                </span>
                              )}
                              {formatMoney(eff)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div
                              className={cn(
                                "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                selected
                                  ? "bg-orange-500 border-orange-500"
                                  : "bg-white border-slate-300"
                              )}
                            >
                              <Check className={cn("w-3 h-3 text-white stroke-[4]", selected ? "opacity-100" : "opacity-0")} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {selected ? "Selecionado" : s.esgotado ? "Esgotado" : "Tocar para adicionar"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Adicionais */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">4. Adicionais</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Complemente com acompanhamentos extras.</p>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-extrabold uppercase">
                    Opcional
                  </span>
                </div>

                <div className="space-y-3">
                  {menuData.adicionais.map((item) => {
                    const selected = current.adicionais.some((x) => x.nome === item.nome);
                    return (
                      <motion.div
                        key={item.nome}
                        whileTap={{ scale: item.esgotado ? 1 : 0.98 }}
                        onClick={() => {
                          if (item.esgotado) return;
                          if (selected) {
                            update({
                              adicionais: current.adicionais.filter((x) => x.nome !== item.nome),
                            });
                          } else {
                            update({ adicionais: [...current.adicionais, item] });
                          }
                        }}
                        className={cn(
                          "border rounded-2xl p-3.5 cursor-pointer flex items-center gap-4 bg-white shadow-sm transition-all",
                          selected
                            ? "border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/10"
                            : "border-slate-150",
                          item.esgotado && "opacity-45 grayscale pointer-events-none"
                        )}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-150 shrink-0">
                          {item.img ? (
                            <img src={item.img} alt={item.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              🧀
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm block">
                              {item.nome}
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div
                                className={cn(
                                  "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                  selected ? "bg-orange-500 border-orange-500" : "bg-white border-slate-300"
                                )}
                              >
                                <Check className={cn("w-3 h-3 text-white stroke-[4]", selected ? "opacity-100" : "opacity-0")} />
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold">
                                {selected ? "Adicionado" : "Adicionar"}
                              </span>
                            </div>
                          </div>
                          
                          <span className="text-orange-600 font-black text-xs font-mono bg-orange-50 px-2.5 py-1 rounded-lg">
                            + {formatMoney(item.preco)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Bebidas */}
            {activeTab === 4 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">5. Bebidas</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Adicione bebidas para acompanhar sua refeição.</p>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full text-slate-600 font-extrabold uppercase">
                    Opcional
                  </span>
                </div>

                <div className="space-y-3">
                  {menuData.bebidas.map((item) => {
                    const selected = current.bebidas.some((x) => x.nome === item.nome);
                    return (
                      <motion.div
                        key={item.nome}
                        whileTap={{ scale: item.esgotado ? 1 : 0.98 }}
                        onClick={() => {
                          if (item.esgotado) return;
                          if (selected) {
                            update({
                              bebidas: current.bebidas.filter((x) => x.nome !== item.nome),
                            });
                          } else {
                            update({ bebidas: [...current.bebidas, item] });
                          }
                        }}
                        className={cn(
                          "border rounded-2xl p-3.5 cursor-pointer flex items-center gap-4 bg-white shadow-sm transition-all",
                          selected
                            ? "border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/10"
                            : "border-slate-150",
                          item.esgotado && "opacity-45 grayscale pointer-events-none"
                        )}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-150 shrink-0">
                          {item.img ? (
                            <img src={item.img} alt={item.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              🥤
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm block">
                              {item.nome}
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div
                                className={cn(
                                  "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                  selected ? "bg-orange-500 border-orange-500" : "bg-white border-slate-300"
                                )}
                              >
                                <Check className={cn("w-3 h-3 text-white stroke-[4]", selected ? "opacity-100" : "opacity-0")} />
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold">
                                {selected ? "Adicionado" : "Adicionar"}
                              </span>
                            </div>
                          </div>
                          
                          <span className="text-orange-600 font-black text-xs font-mono bg-orange-50 px-2.5 py-1 rounded-lg">
                            + {formatMoney(item.preco)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Complementos */}
            {activeTab === 5 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">6. Complementos Gratuitos</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione até 5 temperos ou finalizações.</p>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase",
                    current.complementos.length >= 5 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {current.complementos.length} / 5
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {menuData.complementos.map((item) => {
                    const selected = current.complementos.includes(item.nome);
                    const limit = !selected && current.complementos.length >= 5;

                    return (
                      <motion.div
                        key={item.nome}
                        whileTap={{ scale: item.esgotado || limit ? 1 : 0.97 }}
                        onClick={() => {
                          if (item.esgotado) return;
                          if (selected) {
                            update({
                              complementos: current.complementos.filter((x) => x !== item.nome),
                            });
                          } else if (current.complementos.length < 5) {
                            update({
                              complementos: [...current.complementos, item.nome],
                            });
                          } else {
                            showToast("Escolha no máximo 5 complementos.", "warning");
                          }
                        }}
                        className={cn(
                          "border rounded-2xl p-3 cursor-pointer flex items-center gap-3 bg-white shadow-sm transition-all",
                          selected
                            ? "border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/10"
                            : "border-slate-150",
                          (item.esgotado || limit) && "opacity-45 grayscale pointer-events-none"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden border bg-slate-50 shrink-0">
                          {item.img ? (
                            <img src={item.img} alt={item.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                              🌿
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-slate-800 font-extrabold text-xs leading-tight block truncate">
                            {item.nome}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className={cn(
                                "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all",
                                selected ? "bg-orange-500 border-orange-500" : "bg-white border-slate-300"
                              )}
                            >
                              <Check className={cn("w-2.5 h-2.5 text-white stroke-[4]", selected ? "opacity-100" : "opacity-0")} />
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold">
                              {selected ? "Ativo" : "Incluir"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Bottom Navigation Actions Panel (iOS/Android Native Style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 py-4 border-t border-slate-150 flex items-center justify-between gap-4 z-30 lg:max-w-md lg:mx-auto shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Subtotal Prato</span>
          <span className="text-2xl font-black text-slate-900 font-mono leading-none mt-1">
            {formatMoney(current.total)}
          </span>
          <span className="text-[9px] text-orange-500 font-extrabold uppercase mt-0.5 tracking-widest">
            Passo {activeTab + 1} de 6
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab > 0 && (
            <button
              onClick={handlePrev}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0"
              title="Voltar etapa"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3]" />
            </button>
          )}

          <button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-4.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-orange-500/10"
          >
            <span>{activeTab === 5 ? "Adicionar ao Pedido" : "Avançar"}</span>
            {activeTab === 5 ? (
              <ShoppingCart className="w-4 h-4 shrink-0 stroke-[3]" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0 stroke-[3]" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
