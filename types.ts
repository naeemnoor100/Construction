
export type UserRole = 'Admin' | 'Accountant' | 'Site Manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold';

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
}

export type VendorCategory = 'Material' | 'Labor' | 'Equipment';

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  category: VendorCategory;
  email: string;
  balance: number;
}

export type MaterialUnit = 'Bag' | 'Ton' | 'KG' | 'Piece' | 'Cubic Meter';

export interface StockHistoryEntry {
  id: string;
  date: string;
  type: 'Purchase' | 'Usage' | 'Transfer';
  quantity: number;
  projectId?: string;
  vendorId?: string;
  note?: string;
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
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  invoiceUrl?: string;
  category: 'Material' | 'Labor' | 'Overhead' | 'Permit';
}

export interface Payment {
  id: string;
  date: string;
  vendorId: string;
  projectId: string; // Mandatory link to a project
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

export interface Income {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  description: string;
  method: PaymentMethod;
}

export interface AppState {
  projects: Project[];
  vendors: Vendor[];
  materials: Material[];
  expenses: Expense[];
  payments: Payment[];
  incomes: Income[];
  currentUser: User;
  syncId?: string;
  lastUpdated?: number;
}
