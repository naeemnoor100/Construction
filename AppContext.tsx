import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment, Income, User, StockHistoryEntry } from './types';
import { INITIAL_STATE } from './constants';

interface AppContextType extends AppState {
  updateUser: (u: User) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addProject: (p: Project) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addVendor: (v: Vendor) => Promise<void>;
  updateVendor: (v: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addMaterial: (m: Material) => Promise<void>;
  updateMaterial: (m: Material) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addExpense: (e: Expense) => Promise<void>;
  updateExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPayment: (p: Payment) => Promise<void>;
  updatePayment: (p: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addIncome: (i: Income) => Promise<void>;
  updateIncome: (i: Income) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  enableCloudSync: (key: string) => Promise<void>;
  disableCloudSync: () => void;
  forceSync: () => Promise<void>;
  addTradeCategory: (cat: string) => void;
  removeTradeCategory: (cat: string) => void;
  addStockingUnit: (unit: string) => void;
  removeStockingUnit: (unit: string) => void;
  addSiteStatus: (status: string) => void;
  removeSiteStatus: (status: string) => void;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: boolean;
  lastSynced: Date;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastActionName: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const saved = localStorage.getItem('buildtrack_pro_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...INITIAL_STATE,
          ...parsed,
          currentUser: parsed.currentUser || INITIAL_STATE.currentUser,
          siteStatuses: parsed.siteStatuses || INITIAL_STATE.siteStatuses,
          tradeCategories: parsed.tradeCategories || INITIAL_STATE.tradeCategories,
          stockingUnits: parsed.stockingUnits || INITIAL_STATE.stockingUnits
        }));
      }
      setSyncError(false);
    } catch (e) {
      console.error("Database connection failed", e);
      setSyncError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    localStorage.setItem('buildtrack_pro_state_v2', JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const apiRequest = async (method: string, endpoint: string, body?: any) => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setLastSynced(new Date());
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateUser = (u: User) => setState(prev => ({ ...prev, currentUser: u }));
  const setTheme = (theme: 'light' | 'dark') => setState(prev => ({ ...prev, theme }));

  const addProject = async (p: Project) => {
    await apiRequest('POST', '/projects', p);
    setState(prev => ({ ...prev, projects: [...prev.projects, p] }));
  };

  const updateProject = async (p: Project) => {
    await apiRequest('PUT', `/projects/${p.id}`, p);
    setState(prev => ({ ...prev, projects: prev.projects.map(proj => proj.id === p.id ? p : proj) }));
  };

  const deleteProject = async (id: string) => {
    await apiRequest('DELETE', `/projects/${id}`);
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const addVendor = async (v: Vendor) => {
    await apiRequest('POST', '/vendors', v);
    setState(prev => ({ ...prev, vendors: [...prev.vendors, v] }));
  };

  const updateVendor = async (v: Vendor) => {
    await apiRequest('PUT', `/vendors/${v.id}`, v);
    setState(prev => ({ ...prev, vendors: prev.vendors.map(vend => vend.id === v.id ? v : vend) }));
  };

  const deleteVendor = async (id: string) => {
    await apiRequest('DELETE', `/vendors/${id}`);
    setState(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== id) }));
  };

  const addMaterial = async (m: Material) => {
    await apiRequest('POST', '/materials', m);
    setState(prev => ({ ...prev, materials: [...prev.materials, m] }));
  };

  const updateMaterial = async (m: Material) => {
    await apiRequest('PUT', `/materials/${m.id}`, m);
    setState(prev => ({ ...prev, materials: prev.materials.map(mat => mat.id === m.id ? m : mat) }));
  };

  const deleteMaterial = async (id: string) => {
    await apiRequest('DELETE', `/materials/${id}`);
    setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
  };

  const addExpense = async (e: Expense) => {
    await apiRequest('POST', '/expenses', e);
    setState(prev => {
      let newVendors = e.vendorId ? prev.vendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v) : prev.vendors;
      let newMaterials = [...prev.materials];
      
      if (e.materialId && e.materialQuantity) {
        newMaterials = newMaterials.map(m => {
          if (m.id === e.materialId) {
            const isPurchase = !!e.vendorId;
            return {
              ...m,
              totalPurchased: isPurchase ? m.totalPurchased + e.materialQuantity! : m.totalPurchased,
              totalUsed: !isPurchase ? m.totalUsed + e.materialQuantity! : m.totalUsed,
              history: [...(m.history || []), { 
                id: 'sh-' + e.id, 
                date: e.date, 
                type: isPurchase ? 'Purchase' : 'Usage', 
                quantity: e.materialQuantity!, 
                projectId: e.projectId, 
                vendorId: e.vendorId, 
                note: e.notes, 
                unitPrice: m.costPerUnit 
              }]
            };
          }
          return m;
        });
      }
      return { ...prev, expenses: [...prev.expenses, e], vendors: newVendors, materials: newMaterials };
    });
  };

  const updateExpense = async (e: Expense) => {
    await apiRequest('PUT', `/expenses/${e.id}`, e);
    setState(prev => {
      const oldExp = prev.expenses.find(x => x.id === e.id);
      
      // 1. Update Vendor Balances
      let nextVendors = [...prev.vendors];
      if (oldExp && oldExp.vendorId) {
        nextVendors = nextVendors.map(v => v.id === oldExp.vendorId ? { ...v, balance: Math.max(0, v.balance - oldExp.amount) } : v);
      }
      if (e.vendorId) {
        nextVendors = nextVendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v);
      }
      
      // 2. Update Material Stock Quantities
      let nextMaterials = [...prev.materials];
      
      // Revert Old Material Stock
      if (oldExp && oldExp.materialId && oldExp.materialQuantity) {
        nextMaterials = nextMaterials.map(m => {
          if (m.id === oldExp.materialId) {
            const wasPurchase = !!oldExp.vendorId;
            return {
              ...m,
              totalPurchased: wasPurchase ? m.totalPurchased - oldExp.materialQuantity! : m.totalPurchased,
              totalUsed: !wasPurchase ? m.totalUsed - oldExp.materialQuantity! : m.totalUsed,
              history: (m.history || []).filter(h => h.id !== 'sh-' + oldExp.id)
            };
          }
          return m;
        });
      }

      // Apply New Material Stock
      if (e.materialId && e.materialQuantity) {
        nextMaterials = nextMaterials.map(m => {
          if (m.id === e.materialId) {
            const isPurchase = !!e.vendorId;
            const newHistoryItem: StockHistoryEntry = {
              id: 'sh-' + e.id,
              date: e.date,
              type: isPurchase ? 'Purchase' : 'Usage',
              quantity: e.materialQuantity!,
              projectId: e.projectId,
              vendorId: e.vendorId,
              note: e.notes,
              unitPrice: m.costPerUnit
            };
            return {
              ...m,
              totalPurchased: isPurchase ? m.totalPurchased + e.materialQuantity! : m.totalPurchased,
              totalUsed: !isPurchase ? m.totalUsed + e.materialQuantity! : m.totalUsed,
              history: [...(m.history || []), newHistoryItem]
            };
          }
          return m;
        });
      }
      
      return {
        ...prev,
        expenses: prev.expenses.map(x => x.id === e.id ? e : x),
        vendors: nextVendors,
        materials: nextMaterials
      };
    });
  };

  const deleteExpense = async (id: string) => {
    await apiRequest('DELETE', `/expenses/${id}`);
    setState(prev => {
      const oldExp = prev.expenses.find(x => x.id === id);
      let nextVendors = [...prev.vendors];
      if (oldExp && oldExp.vendorId) {
        nextVendors = nextVendors.map(v => v.id === oldExp.vendorId ? { ...v, balance: Math.max(0, v.balance - oldExp.amount) } : v);
      }
      
      let nextMaterials = [...prev.materials];
      if (oldExp && oldExp.materialId && oldExp.materialQuantity) {
        nextMaterials = nextMaterials.map(m => {
          if (m.id === oldExp.materialId) {
            const wasPurchase = !!oldExp.vendorId;
            return {
              ...m,
              totalPurchased: wasPurchase ? m.totalPurchased - oldExp.materialQuantity! : m.totalPurchased,
              totalUsed: !wasPurchase ? m.totalUsed - oldExp.materialQuantity! : m.totalUsed,
              history: (m.history || []).filter(h => h.id !== 'sh-' + oldExp.id)
            };
          }
          return m;
        });
      }

      return {
        ...prev,
        expenses: prev.expenses.filter(x => x.id !== id),
        vendors: nextVendors,
        materials: nextMaterials
      };
    });
  };

  const addPayment = async (p: Payment) => {
    await apiRequest('POST', '/payments', p);
    setState(prev => {
      const newVendors = prev.vendors.map(v => v.id === p.vendorId ? { ...v, balance: Math.max(0, v.balance - p.amount) } : v);
      return { ...prev, payments: [...prev.payments, p], vendors: newVendors };
    });
  };

  const updatePayment = async (p: Payment) => {
    await apiRequest('PUT', `/payments/${p.id}`, p);
    setState(prev => {
      const oldPay = prev.payments.find(x => x.id === p.id);
      let nextVendors = [...prev.vendors];
      if (oldPay) {
        nextVendors = nextVendors.map(v => v.id === oldPay.vendorId ? { ...v, balance: v.balance + oldPay.amount } : v);
      }
      nextVendors = nextVendors.map(v => v.id === p.vendorId ? { ...v, balance: Math.max(0, v.balance - p.amount) } : v);
      return { ...prev, payments: prev.payments.map(x => x.id === p.id ? p : x), vendors: nextVendors };
    });
  };

  const deletePayment = async (id: string) => {
    await apiRequest('DELETE', `/payments/${id}`);
    setState(prev => {
      const oldPay = prev.payments.find(x => x.id === id);
      let nextVendors = [...prev.vendors];
      if (oldPay) {
        nextVendors = nextVendors.map(v => v.id === oldPay.vendorId ? { ...v, balance: v.balance + oldPay.amount } : v);
      }
      return { ...prev, payments: prev.payments.filter(x => x.id !== id), vendors: nextVendors };
    });
  };

  const addIncome = async (i: Income) => {
    await apiRequest('POST', '/income', i);
    setState(prev => ({ ...prev, incomes: [...prev.incomes, i] }));
  };

  const updateIncome = async (i: Income) => {
    await apiRequest('PUT', `/income/${i.id}`, i);
    setState(prev => ({ ...prev, incomes: prev.incomes.map(inc => inc.id === i.id ? i : inc) }));
  };

  const deleteIncome = async (id: string) => {
    await apiRequest('DELETE', `/income/${id}`);
    setState(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== id) }));
  };

  const enableCloudSync = async (key: string) => {
    await apiRequest('POST', '/sync/enable', { key });
    setState(prev => ({ ...prev, syncId: key }));
  };

  const disableCloudSync = () => setState(prev => ({ ...prev, syncId: undefined }));
  const forceSync = async () => fetchAllData();

  const addTradeCategory = (cat: string) => setState(prev => ({ ...prev, tradeCategories: [...prev.tradeCategories, cat] }));
  const removeTradeCategory = (cat: string) => setState(prev => ({ ...prev, tradeCategories: prev.tradeCategories.filter(c => c !== cat) }));
  const addStockingUnit = (unit: string) => setState(prev => ({ ...prev, stockingUnits: [...prev.stockingUnits, unit] }));
  const removeStockingUnit = (unit: string) => setState(prev => ({ ...prev, stockingUnits: prev.stockingUnits.filter(u => u !== unit) }));
  const addSiteStatus = (status: string) => setState(prev => ({ ...prev, siteStatuses: [...prev.siteStatuses, status] }));
  const removeSiteStatus = (status: string) => setState(prev => ({ ...prev, siteStatuses: prev.siteStatuses.filter(s => s !== status) }));

  const value = useMemo(() => ({
    ...state,
    updateUser, setTheme,
    addProject, updateProject, deleteProject,
    addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial,
    addExpense, updateExpense, deleteExpense,
    addPayment, updatePayment, deletePayment,
    addIncome, updateIncome, deleteIncome,
    enableCloudSync, disableCloudSync, forceSync,
    addTradeCategory, removeTradeCategory,
    addStockingUnit, removeStockingUnit,
    addSiteStatus, removeSiteStatus,
    isLoading, isSyncing, syncError, lastSynced,
    undo: () => {}, redo: () => {}, canUndo: false, canRedo: false, lastActionName: ''
  }), [state, isLoading, isSyncing, syncError, lastSynced]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};