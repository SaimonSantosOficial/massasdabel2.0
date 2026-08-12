import React, { createContext, useContext, useState, useEffect } from 'react';
import { MENU_DATA as INITIAL_MENU_DATA } from '../data/menu';

type MenuDataType = typeof INITIAL_MENU_DATA;

interface MenuContextType {
  menuData: MenuDataType;
  setMenuData: React.Dispatch<React.SetStateAction<MenuDataType>>;
  resetMenuData: () => void;
}

export const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuData, setMenuData] = useState<MenuDataType>(() => {
    const saved = localStorage.getItem('massas_bel_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU_DATA;
  });

  useEffect(() => {
    localStorage.setItem('massas_bel_menu', JSON.stringify(menuData));
  }, [menuData]);

  return (
    <MenuContext.Provider value={{ menuData, setMenuData, resetMenuData: () => setMenuData(INITIAL_MENU_DATA) }}>
      {children}
    </MenuContext.Provider>
  );
}

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within a MenuProvider');
  return context;
};
