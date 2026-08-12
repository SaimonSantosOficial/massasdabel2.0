export interface ConfigMarketing {
  anuncio: { ativo: boolean; titulo: string; mensagem: string };
  fidelidadePontos?: number;
  compreGanhe?: {
    ativo: boolean;
    massaAlvo?: string;
    massasAlvo?: string[];
    bebidaPremio: string;
    textoDestaque: string;
  };
  descontosPorSabor: Record<string, { p: number; g: number }>;
  promocoesSabores?: Array<{
    ativo: boolean;
    sabor: string;
    desconto: number; // Single discount field, since size is always G
    diasSemana: string[]; // ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  }>;
  loja: {
    aberto: boolean;
    mensagem: string;
    textoHorarioHeader: string;
    modoManutencao?: boolean;
    horarioSemana: {
      usar: boolean;
      mensagemForaHorario: string;
      dias: Array<{ ativo: boolean; inicio: string; fim: string }>;
    };
  };
  pagamentoConfig?: {
    pixChave: string;
    pixNome: string;
    pixBanco: string;
    pixCidade: string;
    whatsappNumero: string;
  };
}

export interface Adicional {
  nome: string;
  preco: number;
  img: string;
  esgotado?: boolean;
}

export interface Sabor {
  nome: string;
  p: number;
  g: number;
  img: string;
  esgotado?: boolean;
}

export interface Complemento {
  nome: string;
  img: string;
  esgotado?: boolean;
}

export interface MenuData {
  massas: string[];
  massasImgs: Record<string, string>;
  massasEsgotadas?: Record<string, boolean>;
  massasPrecos?: Record<string, { p: number; g: number }>;
  molhos: string[];
  molhosImgs: Record<string, string>;
  molhosEsgotados?: Record<string, boolean>;
  adicionais: Adicional[];
  bebidas: Adicional[];
  sabores: Sabor[];
  complementos: Complemento[];
}

export interface Bairro {
  nome: string;
  taxa: number;
}

export interface Prato {
  massa: string | null;
  massas?: string[];
  molhos: string[];
  qtdMolho: "Pouco" | "Muito";
  tamanho: "P" | "G" | null;
  sabores: Sabor[];
  adicionais: Adicional[];
  bebidas: Adicional[];
  complementos: string[];
  total: number;
}

export interface Pedido {
  id?: string;
  cliente: string;
  telefone: string;
  endereco: string;
  bairro: string;
  itens: string;
  cartJson?: string;
  subtotal: number;
  taxa: number;
  pagamento: string;
  status:
    | "novo"
    | "preparando"
    | "pronto"
    | "despachado"
    | "entregue"
    | "cancelado";
  notas?: string;
  tipoEntrega?: "entrega" | "retirada";
  retiradaNome?: string;
  createdAt?: number;
  updatedAt?: number;
  source?: string;
  codigo?: string;
  trocoPara?: string;
  entregueEm?: number;
}
