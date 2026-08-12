export interface Badge {
  id: string;
  nome: string;
  emoji: string;
  requisito: number;
  descricao: string;
  corTexto: string;
  corBg: string;
  corBorda: string;
  classeGradiente: string;
}

export const BADGES_DE_MASSAS: Badge[] = [
  {
    id: "iniciante",
    nome: "Primeira Garfada",
    emoji: "🍝",
    requisito: 1,
    descricao: "Você começou sua jornada deliciosa! Seja muito bem-vindo à nossa mesa.",
    corTexto: "text-amber-700 dark:text-amber-400",
    corBg: "bg-amber-500/10",
    corBorda: "border-amber-500/20",
    classeGradiente: "from-amber-500 to-amber-600"
  },
  {
    id: "gourmet",
    nome: "Prato Cheio",
    emoji: "🧀",
    requisito: 3,
    descricao: "Seu paladar já sabe exatamente onde encontrar o melhor tempero caseiro!",
    corTexto: "text-yellow-700 dark:text-yellow-400",
    corBg: "bg-yellow-500/10",
    corBorda: "border-yellow-500/20",
    classeGradiente: "from-yellow-400 to-amber-500"
  },
  {
    id: "duque",
    nome: "Mestre do Molho",
    emoji: "🍅",
    requisito: 5,
    descricao: "Você já é íntimo do nosso molho artesanal. Sabor inconfundível!",
    corTexto: "text-red-700 dark:text-red-400",
    corBg: "bg-red-500/10",
    corBorda: "border-red-500/20",
    classeGradiente: "from-rose-500 to-red-600"
  },
  {
    id: "sommelier",
    nome: "Viciado em Massa",
    emoji: "😋",
    requisito: 10,
    descricao: "Não passa uma semana sem aquela deliciosa e quentinha macarronada!",
    corTexto: "text-purple-700 dark:text-purple-400",
    corBg: "bg-purple-500/10",
    corBorda: "border-purple-500/20",
    classeGradiente: "from-purple-500 to-indigo-600"
  },
  {
    id: "rei",
    nome: "Rei do Macarrão",
    emoji: "👑",
    requisito: 15,
    descricao: "Um dos clientes mais fiéis, queridos e amados de toda a nossa cozinha!",
    corTexto: "text-emerald-700 dark:text-emerald-400",
    corBg: "bg-emerald-500/10",
    corBorda: "border-emerald-500/20",
    classeGradiente: "from-emerald-500 to-teal-600"
  },
  {
    id: "imperador",
    nome: "Sócio da Bel",
    emoji: "🤝",
    requisito: 25,
    descricao: "Nível supremo de paixão! Você é de casa e faz parte da nossa história!",
    corTexto: "text-fuchsia-700 dark:text-fuchsia-400",
    corBg: "bg-fuchsia-500/10",
    corBorda: "border-fuchsia-500/20",
    classeGradiente: "from-fuchsia-500 via-orange-500 to-yellow-500"
  }
];

export function obterBadgesConquistadas(totalPedidosEntregues: number): Badge[] {
  return BADGES_DE_MASSAS.filter(badge => totalPedidosEntregues >= badge.requisito);
}

export function obterProximaBadge(totalPedidosEntregues: number): { badge: Badge; falta: number } | null {
  const proximas = BADGES_DE_MASSAS.filter(badge => totalPedidosEntregues < badge.requisito);
  if (proximas.length === 0) return null;
  
  // Ordena por requisito para pegar a mais próxima
  proximas.sort((a, b) => a.requisito - b.requisito);
  const proxima = proximas[0];
  return {
    badge: proxima,
    falta: proxima.requisito - totalPedidosEntregues
  };
}
