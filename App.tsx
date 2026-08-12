import React, { useState, useMemo, useEffect } from 'react';
import { 
  PASTAS, SAUCES, FLAVORS, ADDONS, COMPLEMENTS, STEPS 
} from './constants';
import { OrderState, LOCATIONS, Size } from './types';
import { 
  ChevronRight, ChevronLeft, ShoppingBag, MapPin, User, Check, 
  Trash2, Plus, Minus, Info, MessageCircle, Sparkles, Lock 
} from 'lucide-react';
import { AIChef } from './components/AIChef';
import { AdminDashboard } from './components/AdminDashboard';
import { storageService } from './services/storageService';

const INITIAL_ORDER: OrderState = {
  step: 1,
  pasta: null,
  sauce: null,
  size: null,
  flavors: [],
  complements: [],
  addons: [],
  customerName: '',
  location: '',
  addressDetails: '',
  paymentMethod: 'Pix'
};

function App() {
  const [order, setOrder] = useState<OrderState>(INITIAL_ORDER);
  const [showAIChef, setShowAIChef] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Admin State
  const [view, setView] = useState<'client' | 'adminLogin' | 'adminPanel'>('client');
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateTotal = useMemo(() => {
    let total = 0;
    
    // Calculate Base Price based on Size & Flavors
    if (order.size && order.flavors.length > 0) {
      let maxFlavorPrice = 0;
      order.flavors.forEach(flavorId => {
        const flavor = FLAVORS.find(f => f.id === flavorId);
        if (flavor) {
          const price = order.size === 'P' ? flavor.priceP : flavor.priceG;
          if (price > maxFlavorPrice) maxFlavorPrice = price;
        }
      });
      total += maxFlavorPrice;
    }

    // Add Add-ons
    order.addons.forEach(addonId => {
      const addon = ADDONS.find(a => a.id === addonId);
      if (addon) total += addon.price;
    });

    return total;
  }, [order.size, order.flavors, order.addons]);

  const handleNext = () => {
    if (order.step < STEPS.length) {
      setOrder(prev => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (order.step > 1) {
      setOrder(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const toggleItem = (list: string[], item: string, max?: number) => {
    const currentIndex = list.indexOf(item);
    const newlist = [...list];

    if (currentIndex === -1) {
      if (max && newlist.length >= max) return newlist; // Max reached
      newlist.push(item);
    } else {
      newlist.splice(currentIndex, 1);
    }
    return newlist;
  };

  const canProceed = () => {
    switch (order.step) {
      case 1: return !!order.pasta;
      case 2: return !!order.sauce;
      case 3: return !!order.size && order.flavors.length > 0;
      case 4: return true; // Extras are optional
      case 5: return !!order.customerName && !!order.location;
      default: return false;
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1234') {
      setView('adminPanel');
      setAdminError('');
      setAdminPin('');
    } else {
      setAdminError('Senha incorreta');
    }
  };

  const handleFinishOrder = async () => {
    setIsSending(true);
    try {
      // 1. Save to Firebase DB for Admin Panel
      await storageService.saveOrder(order, calculateTotal);

      // 2. Generate WhatsApp Link
      const flavorNames = order.flavors.map(id => FLAVORS.find(f => f.id === id)?.name).join(' / ');
      const pastaName = PASTAS.find(p => p.id === order.pasta)?.name;
      const sauceName = SAUCES.find(s => s.id === order.sauce)?.name;
      const addonsNames = order.addons.map(id => ADDONS.find(a => a.id === id)?.name).join(', ');
      const complementsNames = order.complements.join(', ');

      let message = `*Novo Pedido - Massas da Bel* 🍝\n\n`;
      message += `*Cliente:* ${order.customerName}\n`;
      message += `*Local:* ${order.location}\n`;
      if (order.addressDetails) message += `*Obs/Endereço:* ${order.addressDetails}\n`;
      message += `--------------------------------\n`;
      message += `*Pedido:*\n`;
      message += `🔹 Tamanho: ${order.size === 'P' ? 'Pequeno' : 'Grande'}\n`;
      message += `🔹 Sabor: ${flavorNames}\n`;
      message += `🔹 Massa: ${pastaName}\n`;
      message += `🔹 Molho: ${sauceName}\n`;
      
      if (complementsNames) {
        message += `🔹 Complementos: ${complementsNames}\n`;
      } else {
        message += `🔹 Complementos: Sem complementos\n`;
      }

      if (addonsNames) {
        message += `🔹 Adicionais: ${addonsNames}\n`;
      }

      message += `--------------------------------\n`;
      message += `*Pagamento:* ${order.paymentMethod}\n`;
      message += `*Total: R$ ${calculateTotal.toFixed(2).replace('.', ',')}*\n`;

      const link = `https://wa.me/5585999999999?text=${encodeURIComponent(message)}`;
      window.open(link, '_blank');
      
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Houve um erro ao salvar o pedido. Tente novamente.");
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  // Render Admin Panel
  if (view === 'adminPanel') {
    return <AdminDashboard onLogout={() => setView('client')} />;
  }

  // Render Admin Login
  if (view === 'adminLogin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-brand-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Área Restrita</h2>
            <p className="text-gray-500 text-sm">Digite a senha de administrador</p>
          </div>
          
          <form onSubmit={handleAdminLogin}>
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="Senha (Dica: 1234)"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-center text-lg tracking-widest focus:ring-2 focus:ring-brand-500 outline-none"
              autoFocus
            />
            {adminError && <p className="text-red-500 text-sm text-center mb-4">{adminError}</p>}
            <button 
              type="submit"
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition"
            >
              Entrar
            </button>
            <button 
              type="button"
              onClick={() => setView('client')}
              className="w-full mt-3 text-gray-500 text-sm hover:text-gray-800"
            >
              Voltar ao Cardápio
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 md:pb-0 relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Massas da Bel</h1>
            <p className="text-brand-100 text-xs">O melhor sabor de Maranguape</p>
          </div>
          <button 
            onClick={() => setShowAIChef(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition px-3 py-2 rounded-full text-sm font-medium border border-white/20"
          >
            <Sparkles size={16} className="text-yellow-300" />
            <span className="hidden sm:inline">Sugestão do Chef</span>
            <span className="sm:hidden">IA</span>
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white/10 backdrop-blur-sm overflow-x-auto">
          <div className="max-w-3xl mx-auto flex">
            {STEPS.map((s, idx) => {
              const isActive = order.step === s.id;
              const isCompleted = order.step > s.id;
              return (
                <div key={s.id} className={`flex-1 flex flex-col items-center py-3 min-w-[70px] ${isActive ? 'text-white font-bold' : 'text-brand-200'} relative`}>
                  <div className={`mb-1 p-1 rounded-full ${isActive ? 'bg-white text-brand-600' : ''} ${isCompleted ? 'text-green-300' : ''}`}>
                    {isCompleted ? <Check size={16} /> : s.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider">{s.title}</span>
                  {isActive && <div className="absolute bottom-0 w-full h-1 bg-white rounded-t-full" />}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        
        {/* Step 1: Pasta */}
        {order.step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">Escolha a Massa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PASTAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setOrder({ ...order, pasta: p.id })}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${
                    order.pasta === p.id 
                    ? 'border-brand-500 bg-brand-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'
                  }`}
                >
                  <span className={`font-semibold text-lg ${order.pasta === p.id ? 'text-brand-700' : 'text-gray-700'}`}>{p.name}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    order.pasta === p.id ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                  }`}>
                    {order.pasta === p.id && <Check size={14} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sauce */}
        {order.step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">Escolha o Molho</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAUCES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setOrder({ ...order, sauce: s.id })}
                  className={`relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                    order.sauce === s.id 
                    ? 'border-brand-500 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-10 ${s.color}`} />
                  <span className="font-semibold text-lg relative z-10 text-gray-800">{s.name}</span>
                  <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    order.sauce === s.id ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                  }`}>
                    {order.sauce === s.id && <Check size={14} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Size & Flavor */}
        {order.step === 3 && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Size Selector */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Qual o tamanho?</h2>
              <div className="flex gap-4">
                {(['P', 'G'] as Size[]).map(size => (
                  <button
                    key={size}
                    onClick={() => setOrder({ ...order, size })}
                    className={`flex-1 p-6 rounded-xl border-2 transition-all text-center ${
                      order.size === size 
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200'
                    }`}
                  >
                    <div className="text-3xl font-black mb-1">{size}</div>
                    <div className="text-sm font-medium uppercase tracking-wide">
                      {size === 'P' ? 'Individual' : 'Grande'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flavor Selector */}
            {order.size && (
              <div className="space-y-4 animate-slideUp">
                <div className="flex justify-between items-end">
                  <h2 className="text-xl font-bold text-gray-800">Escolha até 2 sabores</h2>
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                    {order.flavors.length}/2 Selecionados
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {FLAVORS.map(f => {
                    const isSelected = order.flavors.includes(f.id);
                    const price = order.size === 'P' ? f.priceP : f.priceG;
                    
                    return (
                      <button
                        key={f.id}
                        disabled={!isSelected && order.flavors.length >= 2}
                        onClick={() => setOrder({ ...order, flavors: toggleItem(order.flavors, f.id, 2) as string[] })}
                        className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                          isSelected 
                          ? 'border-brand-500 bg-brand-50 shadow-sm' 
                          : order.flavors.length >= 2 
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-brand-300'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className={`font-semibold ${isSelected ? 'text-brand-900' : 'text-gray-800'}`}>
                            {f.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-600">R$ {price.toFixed(2).replace('.', ',')}</span>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {order.flavors.length > 0 && (
                   <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-start gap-2">
                     <Info size={16} className="mt-0.5 shrink-0" />
                     <p>Preço baseado no sabor de maior valor selecionado.</p>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Addons & Complements */}
        {order.step === 4 && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Free Complements */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Complementos (Grátis)</h2>
              <p className="text-sm text-gray-500">Selecione o que você quer incluir:</p>
              <div className="flex flex-wrap gap-2">
                {COMPLEMENTS.map(c => {
                  const isSelected = order.complements.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setOrder({ ...order, complements: toggleItem(order.complements, c) as string[] })}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        isSelected 
                        ? 'bg-green-100 border-green-300 text-green-800 font-medium' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-200'
                      }`}
                    >
                      {c} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paid Addons */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Adicionais (Extras)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADDONS.map(a => {
                  const isSelected = order.addons.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => setOrder({ ...order, addons: toggleItem(order.addons, a.id) as string[] })}
                      className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                        isSelected 
                        ? 'border-brand-500 bg-brand-50 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-brand-200'
                      }`}
                    >
                      <span className={`font-medium ${isSelected ? 'text-brand-900' : 'text-gray-700'}`}>{a.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-600">+ R$ {a.price.toFixed(2).replace('.', ',')}</span>
                        {isSelected ? <Minus size={16} className="text-brand-500" /> : <Plus size={16} className="text-gray-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Finalize */}
        {order.step === 5 && (
          <div className="space-y-6 animate-fadeIn pb-8">
            <h2 className="text-2xl font-bold text-gray-800">Finalizar Pedido</h2>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={order.customerName}
                    onChange={(e) => setOrder({...order, customerName: e.target.value})}
                    placeholder="Digite seu nome"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local de Entrega</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    value={order.location}
                    onChange={(e) => setOrder({...order, location: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition appearance-none bg-white"
                  >
                    <option value="">Selecione o bairro...</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência / Endereço Completo</label>
                <textarea 
                  value={order.addressDetails}
                  onChange={(e) => setOrder({...order, addressDetails: e.target.value})}
                  placeholder="Ex: Rua A, 123 - Próximo à praça"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition h-24 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <div className="flex gap-3">
                  {['Pix', 'Dinheiro', 'Cartão'].map(method => (
                    <button
                      key={method}
                      onClick={() => setOrder({...order, paymentMethod: method})}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                        order.paymentMethod === method
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag size={18} /> Resumo do Pedido
              </h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-semibold">Massa:</span> {PASTAS.find(p => p.id === order.pasta)?.name}</p>
                <p><span className="font-semibold">Molho:</span> {SAUCES.find(s => s.id === order.sauce)?.name}</p>
                <p><span className="font-semibold">Tamanho:</span> {order.size === 'P' ? 'Pequeno' : 'Grande'}</p>
                <p><span className="font-semibold">Sabores:</span> {order.flavors.map(id => FLAVORS.find(f => f.id === id)?.name).join(', ')}</p>
                {order.addons.length > 0 && (
                   <p><span className="font-semibold">Adicionais:</span> {order.addons.map(id => ADDONS.find(a => a.id === id)?.name).join(', ')}</p>
                )}
                 <p><span className="font-semibold">Complementos:</span> {order.complements.length > 0 ? order.complements.join(', ') : 'Nenhum'}</p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-brand-600">R$ {calculateTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <button 
              onClick={handleFinishOrder}
              disabled={!canProceed() || isSending}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-95 ${
                canProceed() 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <MessageCircle size={24} />
                  Enviar Pedido no WhatsApp
                </>
              )}
            </button>
          </div>
        )}

      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 md:hidden">
        <div className="flex gap-4">
          <button 
            onClick={handleBack}
            disabled={order.step === 1}
            className={`flex-1 py-3 rounded-lg font-medium flex justify-center items-center transition ${
              order.step === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft size={20} className="mr-1" /> Voltar
          </button>
          
          {order.step < 5 ? (
            <button 
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-[2] py-3 rounded-lg font-bold flex justify-center items-center shadow-md transition ${
                canProceed() ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-200 text-gray-400'
              }`}
            >
              Próximo <ChevronRight size={20} className="ml-1" />
            </button>
          ) : (
            <div className="flex-[2]" /> 
          )}
        </div>
      </footer>

      {/* Desktop Navigation Helper (Next Button for non-mobile) */}
      <div className="hidden md:flex justify-between max-w-3xl mx-auto px-8 pb-12">
         <button 
            onClick={handleBack}
            disabled={order.step === 1}
            className={`px-6 py-3 rounded-lg font-medium flex items-center transition ${
              order.step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <ChevronLeft size={20} className="mr-1" /> Voltar
          </button>
          
          {order.step < 5 && (
            <button 
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-lg font-bold flex items-center shadow-md transition ${
                canProceed() ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Próximo <ChevronRight size={20} className="ml-1" />
            </button>
          )}
      </div>

      {/* Admin Link */}
      <div className="text-center py-6 hidden md:block">
        <button onClick={() => setView('adminLogin')} className="text-gray-400 hover:text-brand-600 text-sm flex items-center justify-center gap-1 mx-auto transition">
          <Lock size={12} /> Área Restrita
        </button>
      </div>

      {/* Admin Link Mobile */}
      <div className="md:hidden text-center pb-24 pt-4">
        <button onClick={() => setView('adminLogin')} className="text-gray-400 hover:text-brand-600 text-sm flex items-center justify-center gap-1 mx-auto transition">
          <Lock size={12} /> Área Admin
        </button>
      </div>

      {/* AI Modal */}
      {showAIChef && <AIChef onClose={() => setShowAIChef(false)} />}
    </div>
  );
}

export default App;