// Reuse types from main app
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  rfid?: string;
  category: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  price: number;
  cost: number;
  supplier: string;
  location: string;
  bin?: string;
  zone?: string;
  description?: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitOfMeasure: string;
  weight?: number;
  dimensions?: string;
  ageRestricted: boolean;
  minAge?: number;
  requiresId?: boolean;
  complianceNotes?: string;
  lastCounted?: string;
  lastCountedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'purchase' | 'sale';
  status: 'pending' | 'processing' | 'picking' | 'packing' | 'shipped' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  customer?: string;
  supplier?: string;
  shippingAddress?: string;
  pickingStatus?: 'not_started' | 'in_progress' | 'completed';
  packingStatus?: 'not_started' | 'in_progress' | 'completed';
  pickedBy?: string;
  packedBy?: string;
  shippedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  createdBy?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  pickedQuantity?: number;
  packedQuantity?: number;
  price: number;
  subtotal: number;
  bin?: string;
}

















