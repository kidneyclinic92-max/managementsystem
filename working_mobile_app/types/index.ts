export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  quantity: number;
  price: number;
  cost: number;
  supplier: string;
  location: string;
  minStock: number;
  maxStock: number;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'purchase' | 'sale';
  status: string;
  supplier?: string;
  customer?: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
  approvalStatus?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  subtotal: number;
}









