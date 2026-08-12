import React, { useState, useEffect } from 'react';
import { db, ROOT } from '../../lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Menu as MenuIcon, Wheat, Droplets, Flame, Plus, CupSoda, Leaf, Image as ImageIcon, Trash } from 'lucide-react';
import { MenuData, Sabor, Adicional, Complemento } from '../../types';
import { DEFAULT_MENU_DATA } from '../../store/useDataStore';
import { cn } from '../../lib/utils';
import { useNotification } from '../NotificationProvider';

export default function TabCardapio() {
  const { showToast, showConfirm } = useNotification();
  // Use separate states instead of raw JSON
  const [data, setData] = useState<MenuData>(DEFAULT_MENU_DATA);

  useEffect(() => {
    const unsub = onValue(ref(db, `${ROOT}/menu`), (snap) => {
      const v = snap.val();
      if (v) setData({...DEFAULT_MENU_DATA, ...v});
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      await set(ref(db, `${ROOT}/menu`), data);
      showToast('Cardápio atualizado com sucesso!', 'success');
    } catch (err: any) {
      showToast("Erro ao salvar: " + err.message, 'error');
    }
  };

  const handleImport = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setData({...DEFAULT_MENU_DATA, ...parsed});
        showToast("JSON importado com sucesso! Clique em Salvar para aplicar.", 'success');
      } catch (err) {
        showToast("JSON Inválido", 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cardapio.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const renderSimpleList = (tipo: 'massas' | 'molhos', items: string[], mapImgs: any, mapEsgotadas: any) => {
    return (
      <div className="space-y-2">
        {items.map((n, i) => (
          <div key={i} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-slate-900 p-2 rounded-xl">
             <input type="text" value={n} onChange={(e) => {
                const next = [...items]; next[i] = e.target.value; setData({...data, [tipo]: next});
             }} className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" placeholder="Nome" />
             <input type="text" value={mapImgs[n] || ''} onChange={(e) => {
                const nextMap = {...mapImgs}; nextMap[n] = e.target.value;
                if (tipo === 'massas') setData({...data, massasImgs: nextMap});
                else setData({...data, molhosImgs: nextMap});
             }} className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" placeholder="URL da imagem (ex: https://...)" />
             <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={!!mapEsgotadas?.[n]} onChange={(e) => {
                   const nextMap = {...(mapEsgotadas||{})};
                   if (e.target.checked) nextMap[n] = true; else delete nextMap[n];
                   if (tipo === 'massas') setData({...data, massasEsgotadas: nextMap});
                   else setData({...data, molhosEsgotados: nextMap});
                }} className="accent-red-500 rounded w-4 h-4" /> <span className="text-red-400 whitespace-nowrap">Esgotado</span>
             </label>
             <button onClick={() => {
                const next = [...items]; next.splice(i, 1); setData({...data, [tipo]: next});
             }} className="p-2 text-red-400 hover:text-red-300"><Trash className="w-4 h-4"/></button>
          </div>
        ))}
        <button onClick={() => {
           setData({...data, [tipo]: [...items, '']});
        }} className="text-orange-500 text-sm font-bold mt-2">+ Adicionar</button>
      </div>
    );
  };

  const renderSaborList = () => (
    <div className="space-y-3">
      {data.sabores.map((s, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-900 p-2.5 rounded-xl">
           <input type="text" value={s.nome} onChange={(e) => {
              const next = [...data.sabores]; next[i].nome = e.target.value; setData({...data, sabores: next});
           }} className="md:col-span-3 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-medium" placeholder="Nome do Sabor" />
           <label className="md:col-span-1 flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={!!s.esgotado} onChange={e=>{
                const next=[...data.sabores]; next[i].esgotado=e.target.checked; setData({...data, sabores: next});
              }} className="accent-red-500 w-4 h-4"/> <span className="text-red-400 font-medium">Esgot.</span>
           </label>
           <div className="md:col-span-2 flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5">
             <span className="text-[10px] font-black text-orange-400 uppercase shrink-0">Preço P:</span>
             <input type="number" step="0.5" value={s.p} onChange={(e) => {
                const next = [...data.sabores]; next[i].p = parseFloat(e.target.value)||0; setData({...data, sabores: next});
             }} className="w-full bg-transparent text-sm text-white focus:outline-none" placeholder="0.00" />
           </div>
           <div className="md:col-span-2 flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5">
             <span className="text-[10px] font-black text-orange-400 uppercase shrink-0">Preço G:</span>
             <input type="number" step="0.5" value={s.g} onChange={(e) => {
                const next = [...data.sabores]; next[i].g = parseFloat(e.target.value)||0; setData({...data, sabores: next});
             }} className="w-full bg-transparent text-sm text-white focus:outline-none" placeholder="0.00" />
           </div>
           <input type="text" value={s.img||''} onChange={(e) => {
              const next = [...data.sabores]; next[i].img = e.target.value; setData({...data, sabores: next});
           }} className="md:col-span-3 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" placeholder="URL da imagem (ex: https://...)" />
           <button onClick={() => {
              const next = [...data.sabores]; next.splice(i, 1); setData({...data, sabores: next});
           }} className="md:col-span-1 p-2 text-red-400 hover:text-red-300 flex justify-center cursor-pointer"><Trash className="w-4 h-4"/></button>
        </div>
      ))}
      <button onClick={() => {
         setData({...data, sabores: [...data.sabores, {nome: '', p:0, g:0, img:''}]});
      }} className="text-orange-500 text-sm font-bold mt-2 cursor-pointer">+ Adicionar Sabor</button>
    </div>
  );

  const renderAdicionalList = (field: 'adicionais' | 'bebidas') => {
    const items = data[field];
    return (
      <div className="space-y-3">
        {items.map((a, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-900 p-2 rounded-xl">
             <input type="text" value={a.nome} onChange={(e) => {
                const next = [...items]; next[i].nome = e.target.value; setData({...data, [field]: next});
             }} className="md:col-span-3 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" placeholder="Nome" />
             <label className="md:col-span-1 flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={!!a.esgotado} onChange={e=>{
                  const next=[...items]; next[i].esgotado=e.target.checked; setData({...data, [field]: next});
                }} className="accent-red-500 w-4 h-4"/> <span className="text-red-400">Esgot.</span>
             </label>
             <input type="number" step="0.5" value={a.preco} onChange={(e) => {
                const next = [...items]; next[i].preco = parseFloat(e.target.value)||0; setData({...data, [field]: next});
             }} className="md:col-span-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" placeholder="Preço R$" />
             <input type="text" value={a.img||''} onChange={(e) => {
                const next = [...items]; next[i].img = e.target.value; setData({...data, [field]: next});
             }} className="md:col-span-5 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" placeholder="URL da imagem" />
             <button onClick={() => {
                const next = [...items]; next.splice(i, 1); setData({...data, [field]: next});
             }} className="md:col-span-1 p-2 text-red-400 flex justify-center"><Trash className="w-4 h-4"/></button>
          </div>
        ))}
        <button onClick={() => {
           setData({...data, [field]: [...items, {nome: '', preco:0, img:''}]});
        }} className="text-orange-500 text-sm font-bold mt-2">+ Adicionar {field==='bebidas'?'Bebida':'Adicional'}</button>
      </div>
    );
  }

  const renderCompList = () => (
    <div className="space-y-3">
      {data.complementos.map((c, i) => (
        <div key={i} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-slate-900 p-2 rounded-xl">
           <input type="text" value={c.nome} onChange={(e) => {
              const next = [...data.complementos]; next[i].nome = e.target.value; setData({...data, complementos: next});
           }} className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" placeholder="Nome" />
           <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={!!c.esgotado} onChange={e=>{
                const next=[...data.complementos]; next[i].esgotado=e.target.checked; setData({...data, complementos: next});
              }} className="accent-red-500 w-4 h-4"/> <span className="text-red-400">Esgotado</span>
           </label>
           <input type="text" value={c.img||''} onChange={(e) => {
              const next = [...data.complementos]; next[i].img = e.target.value; setData({...data, complementos: next});
           }} className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" placeholder="URL Imagem" />
           <button onClick={() => {
              const next = [...data.complementos]; next.splice(i, 1); setData({...data, complementos: next});
           }} className="p-2 text-red-400"><Trash className="w-4 h-4"/></button>
        </div>
      ))}
      <button onClick={() => {
         setData({...data, complementos: [...data.complementos, {nome: '', img:''}]});
      }} className="text-orange-500 text-sm font-bold mt-2">+ Adicionar Complemento</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-black text-white">Cardápio</h2>
        <div className="flex gap-2">
          <label className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl cursor-pointer">
            Importar JSON <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl">Exportar JSON</button>
          <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl">Salvar Online</button>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Wheat className="w-5 h-5 text-orange-500" /> Massas</h3>
           {renderSimpleList('massas', data.massas, data.massasImgs, data.massasEsgotadas)}
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Droplets className="w-5 h-5 text-orange-500" /> Molhos</h3>
           {renderSimpleList('molhos', data.molhos, data.molhosImgs, data.molhosEsgotados)}
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Sabores</h3>
           {renderSaborList()}
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-orange-500" /> Adicionais</h3>
           {renderAdicionalList('adicionais')}
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-orange-500" /> Complementos</h3>
           {renderCompList()}
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2"><CupSoda className="w-5 h-5 text-orange-500" /> Bebidas</h3>
           {renderAdicionalList('bebidas')}
        </div>
      </div>

    </div>
  );
}
