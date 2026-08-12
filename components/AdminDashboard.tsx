import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, History, LogOut, DollarSign, 
  TrendingUp, CheckCircle, XCircle, Clock, MapPin, Search
} from 'lucide-react';
import { StoredOrder } from '../types';
import { storageService } from '../services/storageService';
import { PASTAS, SAUCES, FLAVORS } from '../constants';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'history'>('overview');
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase real-time updates
    const unsubscribe = storageService.subscribeToOrders((newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, status: StoredOrder['status']) => {
    try {
      await storageService.updateStatus(id, status);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erro ao atualizar status. Verifique sua conexão.");
    }
  };

  const stats = storageService.calculateStats(orders);

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  );

  const activeOrders = filteredOrders.filter(o => o.status === 'pending');
  const historyOrders = filteredOrders.filter(o => o.status !== 'pending');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (ts: number) => 
    new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const getPastaName = (id: string | null) => PASTAS.find(p => p.id === id)?.name || id;
  const getFlavorNames = (ids: string[]) => ids.map(id => FLAVORS.find(f => f.id === id)?.name).join(', ');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="bg-brand-900 text-white w-full md:w-64 flex-shrink-0">
        <div className="p-6 border-b border-brand-800">
          <h2 className="text-xl font-bold">Admin Massas</h2>
          <p className="text-brand-300 text-xs">Painel Gerencial</p>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'overview' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800'}`}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800'}`}
          >
            <ShoppingBag size={20} /> Pedidos Ativos
            {activeOrders.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeOrders.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'history' ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800'}`}
          >
            <History size={20} /> Histórico
          </button>
        </nav>
        <div className="p-4 mt-auto border-t border-brand-800">
          <button onClick={onLogout} className="flex items-center gap-2 text-brand-300 hover:text-white transition">
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'overview' && 'Dashboard'}
            {activeTab === 'orders' && 'Fila de Pedidos'}
            {activeTab === 'history' && 'Histórico de Vendas'}
          </h1>
          
          <div className="flex gap-4 items-center">
            {loading && <span className="text-sm text-brand-600 animate-pulse font-medium">Sincronizando...</span>}
            <div className="bg-white rounded-full px-4 py-2 border shadow-sm flex items-center gap-2">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar pedido..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm w-32 md:w-48" 
              />
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-600">
                    <DollarSign size={24} />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+ Hoje</span>
                </div>
                <p className="text-gray-500 text-sm">Faturamento Hoje</p>
                <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats.revenueToday)}</h3>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <ShoppingBag size={24} />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Pedidos Hoje</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.countToday}</h3>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Faturamento Total</p>
                <h3 className="text-3xl font-bold text-gray-800">{formatCurrency(stats.revenueTotal)}</h3>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-lg mb-4">Últimos Pedidos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-sm">
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Pedido</th>
                      <th className="pb-3 font-medium">Valor</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-800">{order.customerName}</td>
                        <td className="py-3 text-gray-600">{getPastaName(order.pasta)} ({order.size})</td>
                        <td className="py-3 text-gray-800 font-bold">{formatCurrency(order.total)}</td>
                        <td className="py-3">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                             order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                             order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                             'bg-gray-100 text-gray-700'
                           }`}>
                             {order.status === 'pending' ? 'Pendente' : order.status === 'completed' ? 'Concluído' : 'Cancelado'}
                           </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">Nenhum pedido registrado ainda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'orders' || activeTab === 'history') && (
          <div className="grid grid-cols-1 gap-4">
            {(activeTab === 'orders' ? activeOrders : historyOrders).map(order => (
              <div key={order.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 animate-fadeIn">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{order.customerName}</h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(order.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                    <MapPin size={14} /> {order.location} 
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                    <p><span className="font-semibold">Item:</span> {getPastaName(order.pasta)} - {order.size === 'P' ? 'Pequeno' : 'Grande'}</p>
                    <p><span className="font-semibold">Sabores:</span> {getFlavorNames(order.flavors)}</p>
                    <p><span className="font-semibold">Complementos:</span> {order.complements.join(', ') || 'Nenhum'}</p>
                    {order.addressDetails && <p className="mt-2 text-gray-500 italic">"Obs: {order.addressDetails}"</p>}
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end min-w-[150px]">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase">Total</p>
                    <p className="text-2xl font-black text-brand-600">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.paymentMethod}</p>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    {order.status === 'pending' ? (
                      <>
                         <button 
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md text-sm font-bold flex items-center gap-2 transition"
                        >
                          <CheckCircle size={16} /> Concluir
                        </button>
                      </>
                    ) : (
                      <span className={`flex items-center gap-1 text-sm font-bold ${order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                        {order.status === 'completed' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {order.status === 'completed' ? 'Entregue' : 'Cancelado'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(activeTab === 'orders' ? activeOrders : historyOrders).length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                <p>Nenhum pedido encontrado nesta seção.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};