import React, { useState, useEffect } from "react";
import { db, ROOT } from "../../lib/firebase";
import { ref, onValue, set } from "firebase/database";
import {
  Megaphone,
  Store,
  Wrench,
  Clock,
  Tags,
  Tag,
  Check,
} from "lucide-react";
import { ConfigMarketing, Sabor, Adicional } from "../../types";
import { cn } from "../../lib/utils";
import { useNotification } from "../NotificationProvider";

const defaultVal: ConfigMarketing = {
  anuncio: { ativo: false, titulo: "", mensagem: "" },
  fidelidadePontos: 10,
  compreGanhe: {
    ativo: false,
    massaAlvo: "",
    bebidaPremio: "",
    textoDestaque: "",
  },
  descontosPorSabor: {},
  promocoesSabores: [],
  loja: {
    aberto: true,
    mensagem: "",
    textoHorarioHeader: "",
    modoManutencao: false,
    horarioSemana: {
      usar: false,
      mensagemForaHorario: "",
      dias: Array(7).fill({ ativo: false, inicio: "18:00", fim: "23:00" }),
    },
  },
  pagamentoConfig: {
    pixChave: "85994190258",
    pixNome: "Milena Barbosa da Silva",
    pixBanco: "Nubank",
    pixCidade: "MARANGUAPE",
    whatsappNumero: "5585994167945",
  },
};

const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function TabMarketing() {
  const { showToast } = useNotification();
  const [data, setData] = useState<ConfigMarketing>(defaultVal);
  const [massas, setMassas] = useState<string[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [bebidas, setBebidas] = useState<Adicional[]>([]);

  useEffect(() => {
    const unsub = onValue(ref(db, `${ROOT}/config/marketing`), (snap) => {
      const v = snap.val();
      if (v)
        setData({
          ...defaultVal,
          ...v,
          fidelidadePontos: v.fidelidadePontos !== undefined ? v.fidelidadePontos : 10,
          loja: {
            ...defaultVal.loja,
            ...v?.loja,
            horarioSemana: {
              ...defaultVal.loja.horarioSemana,
              ...v?.loja?.horarioSemana,
            },
          },
          pagamentoConfig: {
            ...defaultVal.pagamentoConfig,
            ...v?.pagamentoConfig,
            whatsappNumero: v?.pagamentoConfig?.whatsappNumero === "5585994190258"
              ? "5585994167945"
              : (v?.pagamentoConfig?.whatsappNumero || defaultVal.pagamentoConfig?.whatsappNumero),
          },
          compreGanhe: { ...defaultVal.compreGanhe, ...v?.compreGanhe },
          promocoesSabores: v?.promocoesSabores || [],
        });
    });
    const unsubMenu = onValue(ref(db, `${ROOT}/menu/sabores`), (snap) => {
      const v = snap.val();
      if (v) setSabores(v);
    });
    const unsubBebidas = onValue(ref(db, `${ROOT}/menu/bebidas`), (snap) => {
      const v = snap.val();
      if (v) setBebidas(v);
    });
    const unsubMassas = onValue(ref(db, `${ROOT}/menu/massas`), (snap) => {
      const v = snap.val();
      if (v) setMassas(v);
    });
    return () => {
      unsub();
      unsubMenu();
      unsubBebidas();
      unsubMassas();
    };
  }, []);

  const handleSave = async () => {
    try {
      await set(ref(db, `${ROOT}/config/marketing`), data);
      showToast("Marketing salvo com sucesso!", "success");
    } catch (err: any) {
      showToast("Erro ao salvar: " + err.message, "error");
    }
  };



  const updateDia = (idx: number, key: string, value: any) => {
    const newDias = [...data.loja.horarioSemana.dias];
    newDias[idx] = { ...newDias[idx], [key]: value };
    setData({
      ...data,
      loja: {
        ...data.loja,
        horarioSemana: { ...data.loja.horarioSemana, dias: newDias },
      },
    });
  };

  const updateDesconto = (
    nome: string,
    tamanho: "p" | "g",
    value: number | null,
  ) => {
    const nextDescontos = { ...(data.descontosPorSabor || {}) };
    if (!nextDescontos[nome]) nextDescontos[nome] = { p: 0, g: 0 };

    if (value === null || value === 0) {
      if (tamanho === "p") nextDescontos[nome].p = 0;
      else nextDescontos[nome].g = 0;

      if (nextDescontos[nome].p === 0 && nextDescontos[nome].g === 0) {
        delete nextDescontos[nome];
      }
    } else {
      if (tamanho === "p") nextDescontos[nome].p = value;
      else nextDescontos[nome].g = value;
    }

    setData({ ...data, descontosPorSabor: nextDescontos });
  };

  const addPromo = () => {
    const next = [...(data.promocoesSabores || [])];
    next.push({
      ativo: true,
      sabor: "",
      desconto: 0,
      diasSemana: [
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
        "Domingo",
      ],
    });
    setData({ ...data, promocoesSabores: next });
  };

  const removePromo = (idx: number) => {
    const next = (data.promocoesSabores || []).filter((_, i) => i !== idx);
    setData({ ...data, promocoesSabores: next });
  };

  const updatePromo = (idx: number, key: string, val: any) => {
    const next = [...(data.promocoesSabores || [])];
    next[idx] = { ...next[idx], [key]: val };
    setData({ ...data, promocoesSabores: next });
  };

  const togglePromoDia = (idx: number, dia: string) => {
    const promo = (data.promocoesSabores || [])[idx];
    if (!promo) return;
    const dias = promo.diasSemana || [];
    const nextDias = dias.includes(dia)
      ? dias.filter((d) => d !== dia)
      : [...dias, dia];
    updatePromo(idx, "diasSemana", nextDias);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-black text-white">Marketing & Horários</h2>
        <button
          onClick={handleSave}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-xl"
        >
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-500" /> Status da Loja
            </h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer bg-slate-900 p-4 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                checked={data.loja.aberto}
                onChange={(e) =>
                  setData({
                    ...data,
                    loja: { ...data.loja, aberto: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500"
              />
              <div>
                <span className="text-white font-bold block">
                  Loja Aberta para pedidos{" "}
                </span>
                <span className="text-slate-400 text-xs text-wrap">
                  Se desmarcado, bloqueará novos pedidos e mostrará a mensagem
                  de fechado.
                </span>
              </div>
            </label>

            {!data.loja.aberto && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Mensagem quando fechada
                </label>
                <input
                  value={data.loja.mensagem}
                  onChange={(e) =>
                    setData({
                      ...data,
                      loja: { ...data.loja, mensagem: e.target.value },
                    })
                  }
                  type="text"
                  placeholder="Ex: Voltamos amanhã!"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200"
                />
              </div>
            )}

            <label className="flex items-center gap-3 mb-4 cursor-pointer bg-red-900/10 p-4 rounded-xl border border-red-500/20 mt-4">
              <input
                type="checkbox"
                checked={!!data.loja.modoManutencao}
                onChange={(e) =>
                  setData({
                    ...data,
                    loja: { ...data.loja, modoManutencao: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-red-500"
              />
              <div>
                <span className="text-red-400 font-bold block">
                  Modo Manutenção Geral
                </span>
                <span className="text-slate-400 text-xs text-wrap">
                  Clientes verão uma tela de manutenção e não poderão usar o
                  site. Admin ainda terá acesso normal (ao site principal e ao
                  painel).
                </span>
              </div>
            </label>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Texto Resumo (Cabeçalho)
              </label>
              <input
                value={data.loja.textoHorarioHeader}
                onChange={(e) =>
                  setData({
                    ...data,
                    loja: { ...data.loja, textoHorarioHeader: e.target.value },
                  })
                }
                type="text"
                placeholder="Ex: Aberto - 18h às 23h"
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200"
              />
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> Horário Automático da
              Semana
            </h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={data.loja.horarioSemana.usar}
                onChange={(e) =>
                  setData({
                    ...data,
                    loja: {
                      ...data.loja,
                      horarioSemana: {
                        ...data.loja.horarioSemana,
                        usar: e.target.checked,
                      },
                    },
                  })
                }
                className="w-5 h-5 accent-blue-500"
              />
              <span className="text-slate-200">
                Habilitar controle automático por dia/hora
              </span>
            </label>

            {data.loja.horarioSemana.usar && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Mensagem Fora de Horário / Fechado no dia
                  </label>
                  <input
                    value={data.loja.horarioSemana.mensagemForaHorario}
                    onChange={(e) =>
                      setData({
                        ...data,
                        loja: {
                          ...data.loja,
                          horarioSemana: {
                            ...data.loja.horarioSemana,
                            mensagemForaHorario: e.target.value,
                          },
                        },
                      })
                    }
                    type="text"
                    placeholder="Ex: Estamos fechados agora. Voltaremos..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  {data.loja.horarioSemana.dias.map((dia, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-xl border border-slate-700",
                        dia.ativo
                          ? "bg-slate-700/50"
                          : "bg-slate-900 opacity-60",
                      )}
                    >
                      <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dia.ativo}
                          onChange={(e) =>
                            updateDia(idx, "ativo", e.target.checked)
                          }
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-sm font-bold text-white">
                          {DIAS_SEMANA[idx]}
                        </span>
                      </div>
                      <div className="col-span-6 sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold sm:hidden mb-1">Início</label>
                        <input
                          type="time"
                          value={dia.inicio}
                          onChange={(e) =>
                            updateDia(idx, "inicio", e.target.value)
                          }
                          disabled={!dia.ativo}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold sm:hidden mb-1">Fim</label>
                        <input
                          type="time"
                          value={dia.fim}
                          onChange={(e) =>
                            updateDia(idx, "fim", e.target.value)
                          }
                          disabled={!dia.ativo}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  *Se ativo, no momento que ficar fora do horário, o sistema
                  ativará o botão "Loja Aberta" para OFF e aplicará a mensagem.
                </p>
              </>
            )}
          </div>

          {/* NOVO CARD: Cartão Fidelidade */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">⭐</span> Cartão Fidelidade
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Quantidade de Pedidos para Brinde (Estrelas)
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={data.fidelidadePontos || 10}
                onChange={(e) =>
                  setData({
                    ...data,
                    fidelidadePontos: Math.max(3, Math.min(20, parseInt(e.target.value) || 10)),
                  })
                }
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200"
                placeholder="Ex: 10"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                Define quantas estrelas o cliente precisará preencher para ganhar o brinde de fidelidade. O valor padrão é 10 e os limites são entre 3 e 20 estrelas.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" /> Anúncio no Site
            </h3>

            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={data.anuncio.ativo}
                onChange={(e) =>
                  setData({
                    ...data,
                    anuncio: { ...data.anuncio, ativo: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-orange-500"
              />
              <span className="text-slate-200">Mostrar Banner de Anúncio</span>
            </label>

            {data.anuncio.ativo && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Título do Anúncio
                  </label>
                  <input
                    value={data.anuncio.titulo}
                    onChange={(e) =>
                      setData({
                        ...data,
                        anuncio: { ...data.anuncio, titulo: e.target.value },
                      })
                    }
                    type="text"
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={data.anuncio.mensagem}
                    onChange={(e) =>
                      setData({
                        ...data,
                        anuncio: { ...data.anuncio, mensagem: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-slate-200 resize-none h-24"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" /> Promoções & Tamanhos
            </h3>

            <div className="space-y-6">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-600">
                <h4 className="font-bold text-white mb-3">Compre e Ganhe</h4>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.compreGanhe?.ativo || false}
                    onChange={(e) =>
                      setData({
                        ...data,
                        compreGanhe: {
                          ...(data.compreGanhe || defaultVal.compreGanhe!),
                          ativo: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span className="text-slate-200 text-sm">
                    Oferecer bebida grátis ao escolher uma massa específica
                  </span>
                </label>
                {data.compreGanhe?.ativo && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">
                        Massa(s) Alvo (Escolha uma ou mais)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {massas.map((m) => {
                          const currentList =
                            data.compreGanhe?.massasAlvo ||
                            (data.compreGanhe?.massaAlvo
                              ? [data.compreGanhe.massaAlvo]
                              : []);
                          const selected = currentList.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                let nextList: string[];
                                if (selected) {
                                  nextList = currentList.filter((x) => x !== m);
                                } else {
                                  nextList = [...currentList, m];
                                }
                                setData({
                                  ...data,
                                  compreGanhe: {
                                    ...data.compreGanhe!,
                                    massasAlvo: nextList,
                                    massaAlvo: nextList[0] || "",
                                  },
                                });
                              }}
                              className={cn(
                                "text-xs font-bold px-3 py-2 rounded-xl transition-all border flex items-center gap-1.5",
                                selected
                                  ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/40"
                                  : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-3 h-3 rounded border flex items-center justify-center shrink-0",
                                  selected
                                    ? "bg-white border-white text-purple-600"
                                    : "border-slate-500",
                                )}
                              >
                                {selected && (
                                  <Check className="w-2.5 h-2.5 stroke-[4]" />
                                )}
                              </div>
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Bebida Brinde (Prêmio)
                        </label>
                        <select
                          value={data.compreGanhe.bebidaPremio}
                          onChange={(e) =>
                            setData({
                              ...data,
                              compreGanhe: {
                                ...data.compreGanhe!,
                                bebidaPremio: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="">Selecione uma bebida...</option>
                          {bebidas.map((b) => (
                            <option key={b.nome} value={b.nome}>
                              {b.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        Texto de Destaque na Massa
                      </label>
                      <input
                        value={data.compreGanhe.textoDestaque}
                        onChange={(e) =>
                          setData({
                            ...data,
                            compreGanhe: {
                              ...data.compreGanhe!,
                              textoDestaque: e.target.value,
                            },
                          })
                        }
                        type="text"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="Ex: Ganhe 1 Guaraná 2L"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Tags className="w-5 h-5 text-indigo-400" /> Agenda de Promoções
                de Sabor
              </h3>
              <button
                type="button"
                onClick={addPromo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
              >
                + Adicionar Promoção
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Defina o desconto de cada sabor e selecione os dias da semana da
              promoção de forma dinâmica.
            </p>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {(!data.promocoesSabores ||
                data.promocoesSabores.length === 0) && (
                <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 text-xs">
                  Nenhuma promoção agendada criada. Clique em "+ Adicionar
                  Promoção" acima para começar!
                </div>
              )}
              {(data.promocoesSabores || []).map((promo, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-3 relative"
                >
                  <button
                    type="button"
                    onClick={() => removePromo(idx)}
                    className="absolute top-4 right-4 text-xs text-red-500 hover:text-red-400 font-bold"
                  >
                    Excluir
                  </button>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={promo.ativo}
                      onChange={(e) =>
                        updatePromo(idx, "ativo", e.target.checked)
                      }
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                      id={`p-active-${idx}`}
                    />
                    <label
                      htmlFor={`p-active-${idx}`}
                      className="text-xs font-black text-white cursor-pointer uppercase tracking-wider"
                    >
                      Promoção Ativa
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Sabor Escolhido
                      </label>
                      <select
                        value={promo.sabor}
                        onChange={(e) =>
                          updatePromo(idx, "sabor", e.target.value)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Selecione...</option>
                        {sabores.map((s) => (
                          <option key={s.nome} value={s.nome}>
                            {s.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Desconto (R$)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={promo.desconto || ""}
                        onChange={(e) =>
                          updatePromo(
                            idx,
                            "desconto",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="0.00"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Dias da Semana Ativos
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {DIAS_SEMANA.map((dia) => {
                        const isSelected = promo.diasSemana?.includes(dia);
                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => togglePromoDia(idx, dia)}
                            className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded transition-all",
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-755",
                            )}
                          >
                            {dia.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NOVO CARD: Pagamento e Contato */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Store className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Pagamento e Contato
                </h3>
                <p className="text-sm font-medium text-slate-400">
                  Configure os dados do Pix e WhatsApp para pedidos
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={data.pagamentoConfig?.pixChave || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      pagamentoConfig: {
                        ...(data.pagamentoConfig as any),
                        pixChave: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: 85999999999 ou email@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Nome do Titular (Pix)
                </label>
                <input
                  type="text"
                  value={data.pagamentoConfig?.pixNome || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      pagamentoConfig: {
                        ...(data.pagamentoConfig as any),
                        pixNome: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Milena Barbosa da Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={data.pagamentoConfig?.pixBanco || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        pagamentoConfig: {
                          ...(data.pagamentoConfig as any),
                          pixBanco: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: Nubank"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={data.pagamentoConfig?.pixCidade || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        pagamentoConfig: {
                          ...(data.pagamentoConfig as any),
                          pixCidade: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: MARANGUAPE"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Número do WhatsApp (receber pedidos)
                </label>
                <input
                  type="text"
                  value={data.pagamentoConfig?.whatsappNumero || ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      pagamentoConfig: {
                        ...(data.pagamentoConfig as any),
                        whatsappNumero: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="Ex: 5585999999999 (Código do País + DDD + Número)"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Inclua o código do país (55 para Brasil) e o DDD. Apenas
                  números.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
