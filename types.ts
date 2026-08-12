export type Size = 'P' | 'G';

export interface PastaOption {
  id: string;
  name: string;
  image?: string;
}

export interface SauceOption {
  id: string;
  name: string;
  color: string;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface FlavorOption {
  id: string;
  name: string;
  priceP: number;
  priceG: number;
}

export interface OrderState {
  step: number;
  pasta: string | null;
  sauce: string | null;
  size: Size | null;
  flavors: string[]; // Max 2
  complements: string[];
  addons: string[];
  customerName: string;
  location: string;
  addressDetails: string;
  paymentMethod: string;
}

// New Interface for Stored Orders
export interface StoredOrder extends Omit<OrderState, 'step'> {
  id: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
}

export const LOCATIONS = [
  "Aldeoma", "Amanari", "Antônio Marques", "Área Rural de Maranguape", "Cachoeira",
  "Centro", "Coité", "Cônego Raimundo Pinto", "Gavião", "Guabiraba", "Itapebussu",
  "Jubaia", "Ladeira Grande", "Lages", "Lagoa do Juvenal", "Lameirão", "Manoel Guedes",
  "Novo Maranguape I", "Novo Maranguape II", "Novo Parque Iracema", "Outra Banda",
  "Papara", "Parque Iracema", "Parque Santa Fé", "Parque São João", "Pirapora",
  "Preguiça", "Santos Dumont", "São João do Amanari", "Sapupara", "Tangueira",
  "Tanques", "Umarizeiras", "Urucará", "Vertentes do Lagedo"
];