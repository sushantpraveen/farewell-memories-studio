export interface AdminMember {
    id: string;
    name: string;
    memberRollNumber: string;
    photo: string; // data URL or remote URL
    vote?: 'square' | 'hexagonal' | 'circle';
    joinedAt: string;
  }
  
  export interface Shipping {
    name: string;
    phone?: string;
    email?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }
  
  export interface OrderSettings {
    widthPx: number;
    heightPx: number;
    keepAspect: boolean;
    gapPx: number;
    cellScale: number; // 1.0 default
    dpi: number; // e.g., 300
  }
  
  export interface Order {
    id: string;
    status: 'new' | 'in_progress' | 'ready' | 'shipped';
    paid: boolean;
    paymentId?: string;
    paidAt?: string;
    createdAt: string;
    updatedAt?: string;
    description?: string;
    gridTemplate: 'square' | 'hexagonal' | 'circle';
    members: AdminMember[];
    shipping: Shipping;
    settings: OrderSettings;
  }
  
  export interface OrderFilters {
    status?: string;
    paid?: boolean;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }
  
  export interface AdminOrdersContextType {
    orders: Order[];
    selectedOrders: string[];
    filters: OrderFilters;
    currentPage: number;
    pageSize: number;
    openTabs: string[];
    activeTab?: string;
    loading: boolean;
    
    // Actions
    setFilters: (filters: OrderFilters) => void;
    setSelectedOrders: (orderIds: string[]) => void;
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
    updateOrderSettings: (orderId: string, settings: Partial<OrderSettings>) => void;
    openOrderTab: (orderId: string) => void;
    closeOrderTab: (orderId: string) => void;
    setActiveTab: (orderId: string) => void;
    refreshOrders: () => void;
  }