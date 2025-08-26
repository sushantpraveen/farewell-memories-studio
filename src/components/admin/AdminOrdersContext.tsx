
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminOrdersContextType, Order, OrderFilters } from '@/types/admin';
import { mockAdminApi } from '@/services/mockAdminApi';

const AdminOrdersContext = createContext<AdminOrdersContextType | null>(null);

export const useAdminOrders = () => {
  const context = useContext(AdminOrdersContext);
  if (!context) {
    throw new Error('useAdminOrders must be used within AdminOrdersProvider');
  }
  return context;
};

export const AdminOrdersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>();
  const [loading, setLoading] = useState(false);

  const refreshOrders = async () => {
    setLoading(true);
    try {
      const result = await mockAdminApi.getOrders(filters, currentPage, pageSize);
      setOrders(result.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await mockAdminApi.updateOrder(orderId, { status });
      await refreshOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const updateOrderSettings = async (orderId: string, settings: Partial<Order['settings']>) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const updatedSettings = { ...order.settings, ...settings };
        await mockAdminApi.updateOrder(orderId, { settings: updatedSettings });
        
        // Update local state immediately for better UX
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, settings: updatedSettings } : o
        ));
      }
    } catch (error) {
      console.error('Failed to update order settings:', error);
    }
  };

  const openOrderTab = (orderId: string) => {
    if (!openTabs.includes(orderId)) {
      setOpenTabs(prev => [...prev, orderId]);
    }
    setActiveTab(orderId);
  };

  const closeOrderTab = (orderId: string) => {
    setOpenTabs(prev => prev.filter(id => id !== orderId));
    if (activeTab === orderId) {
      const remainingTabs = openTabs.filter(id => id !== orderId);
      setActiveTab(remainingTabs[remainingTabs.length - 1]);
    }
  };

  useEffect(() => {
    refreshOrders();
  }, [filters, currentPage]);

  const value: AdminOrdersContextType = {
    orders,
    selectedOrders,
    filters,
    currentPage,
    pageSize,
    openTabs,
    activeTab,
    loading,
    setFilters,
    setSelectedOrders,
    updateOrderStatus,
    updateOrderSettings,
    openOrderTab,
    closeOrderTab,
    setActiveTab,
    refreshOrders
  };

  return (
    <AdminOrdersContext.Provider value={value}>
      {children}
    </AdminOrdersContext.Provider>
  );
};