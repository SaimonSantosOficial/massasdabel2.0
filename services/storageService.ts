import { OrderState, StoredOrder } from '../types';

// Mock storage service using LocalStorage to fix Firebase import errors
// and allow the application to function without external dependencies setup.

const STORAGE_KEY = 'massas_da_bel_orders';

const getOrders = (): StoredOrder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading from localStorage", e);
    return [];
  }
};

const setOrders = (orders: StoredOrder[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    // Dispatch a custom event to notify listeners in the same window
    window.dispatchEvent(new Event('local-storage-orders-update'));
  } catch (e) {
    console.error("Error writing to localStorage", e);
  }
};

export const storageService = {
  // Subscribe to updates
  subscribeToOrders: (callback: (orders: StoredOrder[]) => void) => {
    const handleUpdate = () => {
      const orders = getOrders();
      // Sort by timestamp desc (newest first)
      orders.sort((a, b) => b.timestamp - a.timestamp);
      callback(orders);
    };

    // Initial load
    handleUpdate();

    // Listen for changes in other tabs
    window.addEventListener('storage', handleUpdate);
    // Listen for changes in this tab
    window.addEventListener('local-storage-orders-update', handleUpdate);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('local-storage-orders-update', handleUpdate);
    };
  },

  saveOrder: async (order: OrderState, total: number): Promise<void> => {
    const orders = getOrders();
    const newOrder: StoredOrder = {
      ...order,
      // Simple unique ID generation
      id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
      timestamp: Date.now(),
      status: 'pending',
      total
    };
    
    orders.push(newOrder);
    setOrders(orders);
  },

  updateStatus: async (id: string, status: StoredOrder['status']): Promise<void> => {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      setOrders(orders);
    }
  },

  // Client-side stats calculation helper
  calculateStats: (orders: StoredOrder[]) => {
    const today = new Date().setHours(0,0,0,0);
    
    const todayOrders = orders.filter(o => o.timestamp >= today);
    const revenueToday = todayOrders.reduce((acc, curr) => acc + curr.total, 0);
    const revenueTotal = orders.reduce((acc, curr) => acc + curr.total, 0);
    
    return {
      countToday: todayOrders.length,
      revenueToday,
      revenueTotal,
      totalOrders: orders.length
    };
  }
};