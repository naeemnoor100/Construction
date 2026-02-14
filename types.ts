export type UserRole = 'Admin' | 'Accountant' | 'Site Manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type ProjectStatus = string;

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: ProjectStatus;
  description?: string;
  contactNumber?: string;
}

export type VendorCategory = string;

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: VendorCategory;
  email?: string;
  balance: number;
}

export type MaterialUnit = string;

export interface StockHistoryEntry {
  id: string;
  date: string;
  type: 'Purchase' | 'Usage' | 'Transfer';
  quantity: number;
  projectId?: string;
  vendorId?: string;
  note?: string;
  unitPrice?: number;
}

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  costPerUnit: number;
  totalPurchased: number;
  totalUsed: number;
  history?: StockHistoryEntry[];
}

export type PaymentMethod = 'Cash' | 'Bank' | 'Online';

export interface Expense {
  id: string;
  date: string;
  projectId: string;
  vendorId?: string;
  materialId?: string;
  materialQuantity?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  invoiceUrl?: string;
  category: string;
  inventoryAction?: 'Purchase' | 'Usage';
}

export interface Invoice {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  description: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Cancelled';
  dueDate: string;
}

export interface Payment {
  id: string;
  date: string;
  vendorId: string;
  projectId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  materialBatchId?: string;
}

export interface Income {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  description: string;
  method: PaymentMethod;
  invoiceId?: string;
}

export interface AppState {
  projects: Project[];
  vendors: Vendor[];
  materials: Material[];
  expenses: Expense[];
  payments: Payment[];
  incomes: Income[];
  invoices: Invoice[];
  tradeCategories: string[];
  stockingUnits: string[];
  siteStatuses: string[];
  currentUser: User;
  theme: 'light' | 'dark';
  syncId?: string;
  lastUpdated?: number;
}