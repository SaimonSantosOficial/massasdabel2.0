import React, { useState, useEffect } from "react";
import { Prato, Bairro } from "../types";
import { cn, formatMoney } from "../lib/utils";
import { X, Bike, Store, Wallet, QrCode } from "lucide-react";
import { db, ROOT, auth } from "../lib/firebase";
import { ref, push, set, get, onValue } from "firebase/database";
import { useDataStore } from "../store/useDataStore";


export default function CartModal({
  cart,
  setCart,
  bairros,
  onClose,
  showToast,
  onSuccess,
}: {
  cart: Prato[];
  setCart: any;
  bairros: Bairro[];
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSuccess: (cod: string, pagamento: string) => void;
}) {
  const { marketing } = useDataStore();
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

  const [tipoReceber, setTipoReceber] = useState<"entrega" | "retirada">(
    "entrega",
  );
  const [nome, setNome] = useState(() => localStorage.getItem("nome") || "");
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem("whatsapp") || "");
  const [retiradaNome, setRetiradaNome] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [num, setNum] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [trocoPara, setTrocoPara] = useState("");

  const [availableBrindes, setAvailableBrindes] = useState<number>(() => Number(localStorage.getItem("inventarioBrindes") || "0"));
  const [useBrinde, setUseBrinde] = useState(() => localStorage.getItem("autoUseBrinde") === "true");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(db, `${ROOT}/users/${user.uid}/inventarioBrindes`);
      const unsub = onValue(userRef, (snap) => {
        if (snap.exists()) {
          const val = Number(snap.val()) || 0;
          setAvailableBrindes(val);
          localStorage.setItem("inventarioBrindes", String(val));
        }
      });
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (availableBrindes > 0 && localStorage.getItem("autoUseBrinde") === "true") {
      setUseBrinde(true);
    }
  }, [availableBrindes]);

  const getFidelidadeDiscount = () => {
    if (!useBrinde || cart.length === 0) return 0;
    const plateBasePrices = cart.map((c) => {
      const adicSum = c.adicionais.reduce((s, a) => s + (a.preco || 0), 0);
      const bebSum = c.bebidas.reduce((s, b) => s + (b.preco || 0), 0);
      return Math.max(0, c.total - adicSum - bebSum);
    });
    const maxBasePlatePrice = Math.max(...plateBasePrices);
    const allAdicPrices = cart
      .flatMap((c) => c.adicionais.map((a) => a.preco || 0))
      .sort((a, b) => b - a);
    const top2AdicDiscount = allAdicPrices.slice(0, 2).reduce((s, p) => s + p, 0);
    return maxBasePlatePrice + top2AdicDiscount;
  };

  const freePlateDiscount = getFidelidadeDiscount();

  const subtotal = cart.reduce((acc, c) => acc + c.total, 0);
  const selectedBairro = bairros.find((b) => b.nome === bairro);
  const taxa =
    tipoReceber === "entrega" && selectedBairro ? selectedBairro.taxa : 0;
  const total = Math.max(0, subtotal - freePlateDiscount + taxa);

  const handleSendOrder = async () => {
    let finalPagamento = pagamento;
    if (!finalPagamento && (useBrinde || total === 0)) {
      finalPagamento = "Cartão Fidelidade (Grátis)";
    }
    if (!nome || !whatsapp || !finalPagamento) {
      showToast("Preencha todos os dados obrigatórios!", "warning");
      return;
    }
    if (tipoReceber === "entrega" && (!bairro || !rua || !num)) {
      showToast("Preencha o endereço completo!", "warning");
      return;
    }
    if (tipoReceber === "retirada" && !retiradaNome) {
      showToast("Informe quem irá retirar o pedido.", "warning");
      return;
    }
    if (whatsapp && !/^\d{10,11}$/.test(whatsapp.replace(/\D/g, ""))) {
      showToast("Por favor, informe um WhatsApp válido (com DDD).", "warning");
      return;
    }

    const geraCod = async () => {
      for (let i = 0; i < 20; i++) {
        const c = String(Math.floor(1000 + Math.random() * 9000));
        const s = await get(ref(db, `${ROOT}/pedidoCodigos/${c}`));
        if (!s.val()) return c;
      }
      return String(Date.now()).slice(-4);
    };

    try {
      const dbRef = ref(db, `${ROOT}/pedidos`);
      const cod = await geraCod();
      const newRef = push(dbRef);
      const k = newRef.key!;

      let itensStr = `*NOVO PEDIDO - MASSAS DA BEL* 🍝\n\n`;
      cart.forEach((it, i) => {
        const sizeLabel = it.tamanho === "P" ? "Pequeno (P)" : it.tamanho === "G" ? "Grande (G)" : it.tamanho;
        itensStr += `*Prato ${i + 1}:* ${sizeLabel} • ${it.massa}\n- Molhos: ${it.molhos.join(" + ")} (${it.qtdMolho})\n- Sabores: ${it.sabores.map((s) => s.nome).join(" e ")}\n`;
        if (it.adicionais.length)
          itensStr += `- Adic: ${it.adicionais.map((a) => a.nome).join(", ")}\n`;
        if (it.bebidas.length)
          itensStr += `- Bebidas: ${it.bebidas.map((b) => b.nome).join(", ")}\n`;
        if (it.complementos.length)
          itensStr += `- Comp: ${it.complementos.join(", ")}\n`;
        itensStr += `Valor: ${formatMoney(it.total)}\n---\n`;
      });

      if (useBrinde && cart.length >= 1) {
        itensStr += `*🎁 Cartão Fidelidade Aplicado:* -${formatMoney(freePlateDiscount)} (1 Prato 100% Grátis)\n---\n`;
      }

      itensStr += `\n*Subtotal:* ${formatMoney(subtotal)}\n`;
      if (useBrinde && cart.length >= 1) {
        itensStr += `*Desconto Fidelidade:* -${formatMoney(freePlateDiscount)}\n`;
      }
      itensStr += `*Taxa Entrega:* ${formatMoney(taxa)}\n*TOTAL: ${formatMoney(total)}*\n\n`;

      const pedido = {
        cliente: nome,
        telefone: whatsapp,
        endereco:
          tipoReceber === "retirada" ? "Retirada na loja" : `${rua}, ${num}`,
        bairro: tipoReceber === "retirada" ? "Retirada" : bairro,
        tipoEntrega: tipoReceber,
        retiradaNome: tipoReceber === "retirada" ? retiradaNome : "",
        itens: itensStr,
        cartJson: JSON.stringify(cart),
        subtotal,
        descontoBrinde: useBrinde && cart.length >= 1 ? freePlateDiscount : 0,
        taxa,
        pagamento: finalPagamento,
        trocoPara: finalPagamento === "Dinheiro" ? trocoPara : "",
        status: "novo",
        createdAt: Date.now(),
        source: "site",
        codigo: cod,
      };

      await set(newRef, pedido);
      await set(ref(db, `${ROOT}/pedidoCodigos/${cod}`), {
        pedidoId: k,
        status: "novo",
        updatedAt: Date.now(),
      });

      if (useBrinde && cart.length >= 1) {
        const nextBrindes = Math.max(0, availableBrindes - 1);
        setAvailableBrindes(nextBrindes);
        localStorage.setItem("inventarioBrindes", String(nextBrindes));
        const user = auth.currentUser;
        if (user) {
          await set(ref(db, `${ROOT}/users/${user.uid}/inventarioBrindes`), nextBrindes);
        }
      }

      const WHATSAPP_NUMBER = pagConfig.whatsappNumero;
      const waMsg = `${pedido.itens}\n\n*${tipoReceber === "retirada" ? "RETIRADA" : "ENTREGA"}*\nNome: ${nome}\n${pedido.endereco}${tipoReceber !== "retirada" ? ` - ${bairro}` : ""}\nPagamento: ${pagamento}\n\n*Código:* ${cod}`;
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`,
      );

      onSuccess(cod, pagamento);
    } catch (err: any) {
      showToast("Erro ao enviar pedido: " + err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex flex-col justify-end overflow-hidden">
      <div className="bg-slate-50 w-full h-full shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 relative">
        <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white z-10 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Meu Carrinho
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth hide-scrollbar bg-slate-50">
          <div className="space-y-4">
            {cart.map((it, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 relative"
              >
                <h4 className="font-black text-slate-800 text-sm">
                  Prato #{i + 1}
                </h4>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {it.tamanho === "P" ? "Pequeno (P)" : it.tamanho === "G" ? "Grande (G)" : it.tamanho} • {it.massa} • {it.molhos.join(" + ")} (
                  {it.qtdMolho})
                </p>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p>
                    <b>Sabores:</b> {it.sabores.map((s) => s.nome).join(" e ")}
                  </p>
                  {it.adicionais.length > 0 && (
                    <p>
                      <b>Adicionais:</b>{" "}
                      {it.adicionais.map((s) => s.nome).join(", ")}
                    </p>
                  )}
                  {it.bebidas.length > 0 && (
                    <p>
                      <b>Bebidas:</b> {it.bebidas.map((s) => s.nome).join(", ")}
                    </p>
                  )}
                  {it.complementos.length > 0 && (
                    <p>
                      <b>Complem.:</b> {it.complementos.join(", ")}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center pt-3 border-t border-slate-50">
                  <span className="font-black text-orange-500 text-lg">
                    {formatMoney(it.total)}
                  </span>
                  <button
                    onClick={() => {
                      const newCart = [...cart];
                      newCart.splice(i, 1);
                      setCart(newCart);
                    }}
                    className="text-[10px] text-red-500 font-black uppercase bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          {availableBrindes > 0 && (
            <div className={cn(
              "p-5 rounded-[2rem] border transition-all duration-300",
              useBrinde && cart.length >= 1
                ? "bg-emerald-50/70 border-emerald-300 shadow-sm"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">🎁</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-xs">Cartão Fidelidade Disponível!</p>
                  <p className="text-[10px] text-slate-500 font-bold leading-none mt-1 uppercase tracking-wide">
                    Você possui {availableBrindes}x cartão(ões) no inventário
                  </p>
                </div>
                {cart.length >= 1 ? (
                  <label className="relative flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useBrinde}
                      onChange={(e) => {
                        setUseBrinde(e.target.checked);
                        if (!e.target.checked) {
                          localStorage.removeItem("autoUseBrinde");
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                ) : (
                  <span className="text-[9px] text-orange-500 bg-orange-50 px-2.5 py-1.5 rounded-lg font-black uppercase tracking-wide border border-orange-100 animate-pulse">
                    Adicione 1 prato
                  </span>
                )}
              </div>
              <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed mt-2.5">
                "Resgate 1 prato + até 2 adicionais 100% grátis com seu Cartão Fidelidade!" {cart.length >= 1 
                  ? "Ative o botão acima para resgatar seu prato e adicionais de graça!" 
                  : "Adicione qualquer prato ao carrinho para usar seu cartão fidelidade."}
              </p>
            </div>
          )}

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-5">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg">
              <Bike className="text-orange-500" /> Como receber
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label
                className="cursor-pointer"
                onClick={() => setTipoReceber("entrega")}
              >
                <div
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-all",
                    tipoReceber === "entrega"
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-slate-100 bg-white",
                  )}
                >
                  <Bike className="mx-auto text-orange-500 mb-1" />
                  <p className="font-black text-sm text-slate-800">Entrega</p>
                </div>
              </label>
              <label
                className="cursor-pointer"
                onClick={() => setTipoReceber("retirada")}
              >
                <div
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-all",
                    tipoReceber === "retirada"
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-slate-100 bg-white",
                  )}
                >
                  <Store className="mx-auto text-slate-600 mb-1" />
                  <p className="font-black text-sm text-slate-800">Retirada</p>
                </div>
              </label>
            </div>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none font-bold"
              placeholder="Seu nome (quem fez o pedido)"
            />
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none font-bold"
              placeholder="WhatsApp (com DDD)"
            />

            {tipoReceber === "retirada" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={retiradaNome}
                  onChange={(e) => setRetiradaNome(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-amber-100 rounded-2xl p-4 text-sm outline-none font-bold placeholder:text-amber-700/50"
                  placeholder="Nome completo de quem retira"
                />
              </div>
            )}

            {tipoReceber === "entrega" && (
              <div className="space-y-4">
                <div className="relative">
                  <select
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Selecione o Bairro...</option>
                    {bairros.map((b) => (
                      <option key={b.nome} value={b.nome}>
                        {b.nome} (+ {formatMoney(b.taxa)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    className="col-span-2 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none font-bold"
                    placeholder="Rua"
                  />
                  <input
                    type="text"
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none font-bold"
                    placeholder="Nº"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-5">
            <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg">
              <Wallet className="text-orange-500" /> Pagamento
            </h3>
            <select
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="">Forma de Pagamento...</option>
              {useBrinde && total === 0 && (
                <option value="Cartão Fidelidade (Grátis)">🎁 Cartão Fidelidade (100% Grátis)</option>
              )}
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
            </select>
            {pagamento === "Dinheiro" && (
              <input
                type="number"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm outline-none font-bold"
                placeholder="Troco para quanto?"
              />
            )}
            {pagamento === "Pix" && (
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-200 rounded-2xl p-5 text-center">
                <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                  Informações do Pix
                </p>
                <p className="text-xs text-slate-600 font-bold mt-2">
                  A chave e os dados do Pix serão exibidos em uma janela
                  de confirmação após você clicar no botão abaixo "Enviar Pedido
                  via WhatsApp".
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-200 bg-white shadow-2xl z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Subtotal:</span>
            <span className="text-sm font-bold text-slate-700">
              {formatMoney(subtotal)}
            </span>
          </div>
          {useBrinde && cart.length >= 1 && (
            <div className="flex justify-between items-center mb-2 text-emerald-600 font-bold">
              <span className="text-xs">🎁 Cartão Fidelidade (100% Grátis):</span>
              <span className="text-sm">
                -{formatMoney(freePlateDiscount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500">
              Taxa de Entrega:
            </span>
            <span className="text-sm font-bold text-slate-700">
              {formatMoney(taxa)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Total a Pagar
            </span>
            <span className="text-4xl font-black text-orange-500">
              {formatMoney(total)}
            </span>
          </div>
          <button
            onClick={handleSendOrder}
            className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-black py-5 rounded-2xl shadow-xl transition-all flex justify-center items-center text-xl"
          >
            Enviar Pedido via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
