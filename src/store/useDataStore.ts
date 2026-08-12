import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, ROOT } from '../lib/firebase';
import { MenuData, ConfigMarketing, Bairro } from '../types';

export const DEFAULT_MENU_DATA: MenuData = {
  massas: ["Spaguetti", "Penne", "Fettuccine (Ninho)", "Parafuso"],
  massasImgs: {},
  massasPrecos: {},
  molhos: ["Molho Vermelho", "Molho Branco"],
  molhosImgs: {},
  adicionais: [],
  bebidas: [],
  sabores: [],
  complementos: []
};

export function useDataStore() {
  const [menuData, setMenuData] = useState<MenuData>(DEFAULT_MENU_DATA);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [marketing, setMarketing] = useState<ConfigMarketing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubMenu = onValue(ref(db, `${ROOT}/menu`), (snap) => {
      if (snap.val()) setMenuData(snap.val());
    });
    
    const unsubBairros = onValue(ref(db, `${ROOT}/bairros`), (snap) => {
      const v = snap.val();
      if (v) {
         if (Array.isArray(v)) setBairros(v);
         else setBairros(Object.values(v));
      }
    });

    const unsubMkt = onValue(ref(db, `${ROOT}/config/marketing`), (snap) => {
      setMarketing(snap.val());
    });

    setLoading(false);

    return () => {
      unsubMenu();
      unsubBairros();
      unsubMkt();
    };
  }, []);

  return { menuData, bairros, marketing, loading };
}
