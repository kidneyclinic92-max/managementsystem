import type { InventoryItem, Order, OrderItem, User } from '@/types';

// Simple delay to mimic network latency
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock inventory items
const mockInventory: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Shipping Box - Medium',
    sku: 'BOX-MED-001',
    barcode: '1234567890123',
    category: 'Packaging',
    quantity: 240,
    price: 1.5,
    cost: 0.8,
    supplier: 'Acme Supplies',
    location: 'Aisle 1',
    minStock: 50,
    maxStock: 500,
    description: 'Medium corrugated shipping box',
  },
  {
    id: 'item-2',
    name: 'Packing Tape - Clear',
    sku: 'TAPE-CLR-002',
    barcode: '9876543210987',
    category: 'Packaging',
    quantity: 120,
    price: 2.99,
    cost: 1.2,
    supplier: 'Acme Supplies',
    location: 'Aisle 1',
    minStock: 30,
    maxStock: 300,
    description: '48mm x 100m clear packing tape',
  },
  {
    id: 'item-3',
    name: 'Warehouse Gloves',
    sku: 'GLOVES-003',
    barcode: '5555555555555',
    category: 'Safety',
    quantity: 60,
    price: 5.99,
    cost: 2.5,
    supplier: 'Safety First Co.',
    location: 'Aisle 3',
    minStock: 20,
    maxStock: 200,
    description: 'General purpose warehouse gloves',
  },
];

// Helper to generate IDs without extra deps
const newId = () => `mock-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

// Seed a couple of orders
const initialOrders: Order[] = [
  {
    id: newId(),
    orderNumber: 'MOCK-1001',
    type: 'purchase',
    status: 'pending',
    supplier: 'Demo Vendor LLC',
    total: 120.5,
    approvalStatus: 'pending_approval',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    items: [
      {
        itemId: mockInventory[0].id,
        itemName: mockInventory[0].name,
        quantity: 50,
        price: mockInventory[0].price,
        subtotal: 50 * mockInventory[0].price,
      },
    ],
  },
  {
    id: newId(),
    orderNumber: 'MOCK-1000',
    type: 'purchase',
    status: 'completed',
    supplier: 'Acme Retail',
    total: 59.9,
    approvalStatus: 'approved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    items: [
      {
        itemId: mockInventory[1].id,
        itemName: mockInventory[1].name,
        quantity: 20,
        price: mockInventory[1].price,
        subtotal: 20 * mockInventory[1].price,
      },
    ],
  },
];

const orders: Order[] = [...initialOrders];

export const mockApi = {
  async get(url: string) {
    await delay();

    if (url.startsWith('/inventory')) {
      return { data: { items: mockInventory } };
    }

    if (url.startsWith('/orders')) {
      return { data: { orders } };
    }

    return { data: {} };
  },

  async post(url: string, body?: any) {
    await delay();

    if (url.startsWith('/auth/login')) {
      const user: User = {
        id: 'mock-user',
        username: body?.username || 'staff',
        fullName: 'Demo Vendor',
        role: 'vendor',
      };

      return {
        data: {
          token: 'mock-token',
          user,
        },
      };
    }

    if (url.startsWith('/orders')) {
      const items: OrderItem[] = (body?.items || []).map((item: OrderItem) => ({
        ...item,
        subtotal: item.subtotal ?? item.price * item.quantity,
      }));

      const total =
        body?.total ??
        items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order: Order = {
        id: newId(),
        orderNumber: `MOCK-${orders.length + 1001}`,
        type: 'purchase',
        status: 'pending',
        supplier: body?.supplier || 'Demo Vendor',
        total,
        approvalStatus: 'pending_approval',
        createdAt: new Date().toISOString(),
        items,
      };

      orders.unshift(order);

      return { data: { order } };
    }

    return { data: {} };
  },
};





