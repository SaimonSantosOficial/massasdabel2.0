import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, RotateCcw, Save } from 'lucide-react';
import { useMenu } from '../contexts/MenuContext';
import { formatMoney } from '../utils';

const TABS = [
  { id: 'massas', label: 'Massas' },
  { id: 'molhos', label: 'Molhos' },
  { id: 'sabores', label: 'Sabores' },
  { id: 'adicionais', label: 'Adicionais' },
  { id: 'complementos', label: 'Complementos' },
  { id: 'bairros', label: 'Bairros' },
];

export function Admin() {
  const { menuData, setMenuData, resetMenuData } = useMenu();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getFields = (tab: string) => {
    const base = [{ name: 'nome', label: 'Nome', type: 'text' }];
    if (tab === 'bairros') {
      return [...base, { name: 'taxa', label: 'Taxa (R$)', type: 'number' }];
    }
    if (tab === 'sabores') {
      return [
        ...base,
        { name: 'p', label: 'Preço P (R$)', type: 'number' },
        { name: 'g', label: 'Preço G (R$)', type: 'number' },
        { name: 'img', label: 'URL da Imagem (Opcional)', type: 'text' }
      ];
    }
    if (tab === 'adicionais') {
      return [
        ...base,
        { name: 'preco', label: 'Preço (R$)', type: 'number' },
        { name: 'img', label: 'URL da Imagem (Opcional)', type: 'text' }
      ];
    }
    // massas, molhos, complementos
    return [
      ...base,
      { name: 'img', label: 'URL da Imagem (Opcional)', type: 'text' }
    ];
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setEditingIndex(null);
    setFormData({});
    setIsFormOpen(false);
  };

  const openNewForm = () => {
    setEditingIndex(null);
    setFormData({});
    setIsFormOpen(true);
  };

  const handleEdit = (index: number, item: any) => {
    setEditingIndex(index);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      const newData = { ...menuData };
      (newData[activeTab as keyof typeof menuData] as any[]).splice(index, 1);
      setMenuData(newData);
    }
  };

  const handleReset = () => {
    if (window.confirm('Atenção: Isso apagará todas as suas edições e restaurará o cardápio padrão original! Deseja continuar?')) {
      resetMenuData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newData = { ...menuData };
    const list = newData[activeTab as keyof typeof menuData] as any[];
    
    let parsedData = { ...formData };
    
    // Ensure numbers are numbers
    getFields(activeTab).forEach(f => {
      if (f.type === 'number') {
        parsedData[f.name] = parsedData[f.name] !== undefined && parsedData[f.name] !== '' 
          ? parseFloat(parsedData[f.name]) 
          : 0;
      }
    });

    if (editingIndex !== null) {
      list[editingIndex] = parsedData;
    } else {
      list.push(parsedData);
    }
    
    setMenuData(newData);
    setFormData({});
    setEditingIndex(null);
    setIsFormOpen(false);
  };

  const validateImg = (img?: string) => {
    if (!img) return 'https://placehold.co/100?text=Sem+Foto';
    return img;
  };

  const listItems = menuData[activeTab as keyof typeof menuData] as any[];

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl relative pb-24">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft size={20} />
          </a>
          <h1 className="text-xl font-black">Painel Admin</h1>
          <button onClick={handleReset} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors" title="Restaurar Padrão">
            <RotateCcw size={18} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-md' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Form Modal/Section */}
        {isFormOpen && (
          <div className="mb-8 bg-white p-6 rounded-3xl shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-800 text-lg">
                {editingIndex !== null ? 'Editar Item' : 'Adicionar Item'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 font-bold text-xs uppercase hover:text-slate-600">
                Cancelar
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {getFields(activeTab).map(field => (
                <div key={field.name}>
                  <label className="block text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">{field.label}</label>
                  <input 
                    type={field.type} 
                    step="0.01"
                    required={field.name === 'nome'}
                    value={formData[field.name] !== undefined ? formData[field.name] : ''}
                    onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                    placeholder={`Digite ${field.label.toLowerCase()}`}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:ring-4 focus:ring-brand/20 outline-none font-bold text-slate-700"
                  />
                </div>
              ))}
              <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white font-black py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                <Save size={18} /> Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {/* List Items */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            Itens Cadastrados <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-md">{listItems.length}</span>
          </h2>
          {!isFormOpen && (
            <button onClick={openNewForm} className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:bg-black transition-colors">
              <Plus size={14} /> Adicionar
            </button>
          )}
        </div>

        <div className="space-y-3">
          {listItems.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold mb-2">Nenhum item cadastrado.</p>
              <button onClick={openNewForm} className="text-brand font-black text-sm hover:underline">
                Criar o primeiro
              </button>
            </div>
          ) : (
            listItems.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                {activeTab !== 'bairros' && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-inner">
                    <img src={validateImg(item.img)} alt={item.nome} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 leading-tight">{item.nome}</h4>
                  
                  {/* Prices display */}
                  <div className="text-xs text-brand font-black mt-1 flex gap-3">
                    {activeTab === 'sabores' && (
                      <>
                        <span>P: {formatMoney(item.p || 0)}</span>
                        <span>G: {formatMoney(item.g || 0)}</span>
                      </>
                    )}
                    {activeTab === 'adicionais' && <span>{formatMoney(item.preco || 0)}</span>}
                    {activeTab === 'bairros' && <span className={item.taxa === 0 ? 'text-green-500' : ''}>{item.taxa === 0 ? 'Grátis' : formatMoney(item.taxa || 0)}</span>}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => handleEdit(idx, item)} className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(idx)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
