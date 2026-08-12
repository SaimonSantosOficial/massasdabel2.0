import React from "react";
import { ConfigMarketing } from "../types";
import { Store, Clock, HandPlatter } from "lucide-react";

export default function ClientHeader({
  marketing,
  aberto,
}: {
  marketing: ConfigMarketing | null;
  aberto: boolean;
}) {
  // Função para obter o texto descritivo dos horários de funcionamento configurados
  const obterHorarioTexto = () => {
    if (!marketing?.loja) return "Terça a Sábado: 18:00 às 23:00";

    const { textoHorarioHeader, horarioSemana } = marketing.loja;

    // Se NÃO estiver configurado para usar o horário automático da semana,
    // retorna o texto manual que o usuário digitou no campo correspondente,
    // com um fallback padrão caso esteja vazio.
    if (!horarioSemana?.usar || !horarioSemana?.dias) {
      return textoHorarioHeader || "Terça a Sábado: 18:00 às 23:00";
    }

    const diasNomesCompleto = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado"
    ];

    const diasNomesCurto = [
      "Dom",
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb"
    ];

    // Mapeia e filtra apenas os dias ativos na semana
    const diasAtivos = horarioSemana.dias
      .map((d, idx) => ({ ...d, idx }))
      .filter(d => d.ativo);

    if (diasAtivos.length === 0) {
      return "Fechado temporariamente";
    }

    // Verifica se todos os dias ativos têm o mesmo horário de funcionamento
    const primeiro = diasAtivos[0];
    const mesmoHorario = diasAtivos.every(
      d => d.inicio === primeiro.inicio && d.fim === primeiro.fim
    );

    if (mesmoHorario) {
      const formattedTime = `${primeiro.inicio} às ${primeiro.fim}`;

      // Todos os dias ativos
      if (diasAtivos.length === 7) {
        return `Todos os dias: ${formattedTime}`;
      }

      // Se formarem uma sequência contínua (ex: Segunda a Sexta)
      const indices = diasAtivos.map(d => d.idx);
      const minIdx = Math.min(...indices);
      const maxIdx = Math.max(...indices);

      if (maxIdx - minIdx === diasAtivos.length - 1) {
        return `${diasNomesCompleto[minIdx]} a ${diasNomesCompleto[maxIdx]}: ${formattedTime}`;
      }

      // Caso seja intercalado, lista os dias resumidos
      const listaDias = diasAtivos.map(d => diasNomesCurto[d.idx]).join(", ");
      return `${listaDias}: ${formattedTime}`;
    } else {
      // Se tiver horários diferentes, mostramos o horário do dia de hoje para ser limpo e dinâmico,
      // ou listamos os horários de forma compactada.
      const hojeIdx = new Date().getDay();
      const diaHoje = horarioSemana.dias[hojeIdx];

      if (diaHoje && diaHoje.ativo) {
        return `Hoje (${diasNomesCompleto[hojeIdx]}): ${diaHoje.inicio} às ${diaHoje.fim}`;
      } else {
        // Pega o próximo dia da semana que estará ativo
        const proximoDia = diasAtivos.find(d => d.idx > hojeIdx) || diasAtivos[0];
        return `Abre ${diasNomesCompleto[proximoDia.idx]}: ${proximoDia.inicio} às ${proximoDia.fim}`;
      }
    }
  };

  const horarioText = obterHorarioTexto();

  return (
    <header className="relative h-72 bg-slate-900 overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        alt="Fundo"
        className="w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>

      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-lg flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
          <img
            src="https://wsrv.nl/?url=drive.google.com/uc?id=1GnljzD2SK_5vJst8HZW3DUmbe6IZ86pq&w=800&h=800&fit=contain"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={`text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest text-white border-2 border-white/20 ${aberto ? "bg-emerald-500" : "bg-red-600"}`}
          >
            {aberto ? "Aberto" : "Fechado"}
          </div>
          <div className="bg-white/15 backdrop-blur-md border border-white/30 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-2 flex-wrap justify-end">
            <span className="inline-flex items-center gap-1">
              <Store className="w-3 h-3 text-cyan-300" />
              Retirada
            </span>
            <span className="text-white/45 font-bold">e</span>
            <span className="inline-flex items-center gap-1">
              <HandPlatter className="w-3 h-3 text-orange-300" />
              Delivery
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 text-white">
        <h1 className="text-3xl font-black tracking-tight mb-2">
          Massas da Bel
        </h1>
        <div className="space-y-1">
          <p className="text-[11px] text-slate-300 flex items-center gap-2 font-medium">
            <Clock className="w-3 h-3 text-orange-500" />{" "}
            <span>{horarioText}</span>
          </p>
          <p className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium leading-snug">
            <span className="inline-flex items-center gap-1.5">
              <Store className="w-3 h-3 text-cyan-400/90 shrink-0" /> Retirada
              na loja
            </span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <HandPlatter className="w-3 h-3 text-orange-500 shrink-0" />{" "}
              Delivery em Maranguape
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
