import { PastaOption, SauceOption, AddonOption, FlavorOption } from './types';
import React from 'react';
import { ChefHat, Utensils, Zap, Star } from 'lucide-react';

export const PASTAS: PastaOption[] = [
  { id: 'spaguetti', name: 'Spaguetti' },
  { id: 'penne', name: 'Penne' },
  { id: 'fettuccine', name: 'Fettuccine (Ninho)' },
  { id: 'parafuso', name: 'Parafuso' },
];

export const SAUCES: SauceOption[] = [
  { id: 'vermelho', name: 'Molho Vermelho', color: 'bg-red-500' },
  { id: 'branco', name: 'Molho Branco', color: 'bg-yellow-100' },
];

export const ADDONS: AddonOption[] = [
  { id: 'azeitonas', name: 'Azeitonas', price: 3.00 },
  { id: 'ovo_codorna', name: 'Ovo de Codorna', price: 1.50 },
  { id: 'parmesao', name: 'Queijo Parmesão Ralado', price: 3.00 },
  { id: 'batata_palha', name: 'Batata Palha', price: 3.00 },
];

export const FLAVORS: FlavorOption[] = [
  { id: 'frango', name: 'Frango', priceP: 12.00, priceG: 22.00 },
  { id: 'calabresa', name: 'Calabresa', priceP: 13.00, priceG: 24.00 },
  { id: 'carne_moida', name: 'Carne Moída', priceP: 14.00, priceG: 26.00 },
  { id: 'carne_sol', name: 'Carne de Sol', priceP: 15.00, priceG: 28.00 },
];

export const COMPLEMENTS: string[] = [
  "Mussarela", "Cebola", "Pimentinha", "Tomate", 
  "Presunto", "Coentro", "Óregano", "Bacon", "Milho"
];

export const STEPS = [
  { id: 1, title: 'Massa', icon: <Utensils size={20} /> },
  { id: 2, title: 'Molho', icon: <ChefHat size={20} /> },
  { id: 3, title: 'Sabor & Tam.', icon: <Star size={20} /> }, // Flavor and Size combined for logic
  { id: 4, title: 'Extras', icon: <Zap size={20} /> }, // Complements and Addons
  { id: 5, title: 'Finalizar', icon: <Utensils size={20} /> },
];