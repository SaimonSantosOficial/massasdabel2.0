export const formatMoney = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export const WHATSAPP_NUMBER = "5585994167945"; 

import { CartItem } from './types';

export function getMolhosLabel(it: CartItem) {
  if (it.molhos && it.molhos.length) return it.molhos.join(' + ');
  if (it.massa) return 'Nenhum'; // Just a fallback, we force molho selection
  return '—';
}
