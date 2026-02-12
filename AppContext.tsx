
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment, Income } from './types';
import { INITIAL_STATE } from './constants';

interface AppContextType extends AppState {
  addProject: (p: Project) => void;
  updateProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  addVendor: (v: Vendor) => void;
  updateVendor: (v: Vendor) => void;
  deleteVendor: (id: string) => void;
  addMaterial: (m: Material) => void;
  updateMaterial: (m: Material) => void;
  deleteMaterial: (id: string) => void;
  addExpense: (e: Expense) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  addPayment: (p: Payment) => void;
  updatePayment: (p: Payment) => void;
  deletePayment: (id: string) => void;
  addIncome: (i: Income) => void;
  updateIncome: (i: Income) => void;
  deleteIncome: (id: string) => void;
  loadExternalState: (newState: AppState) => void;
  enableCloudSync: (id: string) => void;
  disableCloudSync: () => void;
  forceSync: () => Promise<void>;
  isSyncing: boolean;
  syncError: boolean;
  lastSynced: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'buildtrack_pro_state_v2';
const SYNC_CHANNEL = 'buildtrack_sync_v2';
const CLOUD_API = 'https://jsonblob.com/api/jsonBlob';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return { ...INITIAL_STATE, lastUpdated: Date.now() };
  });

  const [lastSynced, setLastSynced] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const skipNextCloudPush = useRef(false);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const newState = updater(prev);
      return { ...newState, lastUpdated: Date.now() };
    });
  }, []);

  useEffect(() => {
    syncChannel.current = new BroadcastChannel(SYNC_CHANNEL);
    syncChannel.current.onmessage = (event) => {
      if (event.data?.type === 'STATE_UPDATE' && event.data.payload.lastUpdated > (state.lastUpdated || 0)) {
        skipNextCloudPush.current = true;
        setState(event.data.payload);
        setLastSynced(new Date());
      }
    };
    return () => syncChannel.current?.close();
  }, [state.lastUpdated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncChannel.current?.postMessage({ type: 'STATE_UPDATE', payload: state });
  }, [state]);

  const pullFromCloud = useCallback(async () => {
    if (!state.syncId || isSyncing) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${CLOUD_API}/${state.syncId}`);
      if (!response.ok) throw new Error("Fetch failed");
      const cloudState: AppState = await response.json();
      if (cloudState.lastUpdated && cloudState.lastUpdated > (state.lastUpdated || 0)) {
        skipNextCloudPush.current = true;
        setState(cloudState);
        setLastSynced(new Date());
      }
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  }, [state.syncId, state.lastUpdated, isSyncing]);

  const pushToCloud = useCallback(async (data: AppState) => {
    if (!data.syncId || skipNextCloudPush.current) {
      skipNextCloudPush.current = false;
      return;
    }
    setIsSyncing(true);
    try {
      await fetch(`${CLOUD_API}/${data.syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setLastSynced(new Date());
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => pushToCloud(state), 2000);
    return () => clearTimeout(timer);
  }, [state, pushToCloud]);

  // CRUD: Projects
  const addProject = (p: Project) => updateState(prev => ({ ...prev, projects: [...prev.projects, p] }));
  const updateProject = (p: Project) => updateState(prev => ({
    ...prev, projects: prev.projects.map(proj => proj.id === p.id ? p : proj)
  }));
  const deleteProject = (id: string) => updateState(prev => ({
    ...prev, projects: prev.projects.filter(p => p.id !== id)
  }));

  // CRUD: Vendors
  const addVendor = (v: Vendor) => updateState(prev => ({ ...prev, vendors: [...prev.vendors, v] }));
  const updateVendor = (v: Vendor) => updateState(prev => ({
    ...prev, vendors: prev.vendors.map(vend => vend.id === v.id ? v : vend)
  }));
  const deleteVendor = (id: string) => updateState(prev => ({
    ...prev, vendors: prev.vendors.filter(v => v.id !== id)
  }));

  // CRUD: Materials
  const addMaterial = (m: Material) => updateState(prev => ({ ...prev, materials: [...prev.materials, m] }));
  const updateMaterial = (m: Material) => updateState(prev => ({
    ...prev, materials: prev.materials.map(mat => mat.id === m.id ? m : mat)
  }));
  const deleteMaterial = (id: string) => updateState(prev => ({
    ...prev, materials: prev.materials.filter(m => m.id !== id)
  }));

  // CRUD: Expenses
  const addExpense = (e: Expense) => updateState(prev => {
    const newVendors = e.vendorId 
      ? prev.vendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v)
      : prev.vendors;
    return { ...prev, expenses: [...prev.expenses, e], vendors: newVendors };
  });
  const updateExpense = (e: Expense) => updateState(prev => {
    // Reconcile balances for vendor change or amount change
    const oldExpense = prev.expenses.find(x => x.id === e.id);
    let newVendors = [...prev.vendors];
    if (oldExpense) {
      if (oldExpense.vendorId) {
        newVendors = newVendors.map(v => v.id === oldExpense.vendorId ? { ...v, balance: v.balance - oldExpense.amount } : v);
      }
      if (e.vendorId) {
        newVendors = newVendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v);
      }
    }
    return {
      ...prev,
      expenses: prev.expenses.map(exp => exp.id === e.id ? e : exp),
      vendors: newVendors
    };
  });
  const deleteExpense = (id: string) => updateState(prev => {
    const exp = prev.expenses.find(e => e.id === id);
    const newVendors = exp?.vendorId 
      ? prev.vendors.map(v => v.id === exp.vendorId ? { ...v, balance: Math.max(0, v.balance - exp.amount) } : v)
      : prev.vendors;
    return { ...prev, expenses: prev.expenses.filter(e => e.id !== id), vendors: newVendors };
  });

  // CRUD: Payments
  const addPayment = (pay: Payment) => updateState(prev => {
    const newVendors = prev.vendors.map(v => v.id === pay.vendorId ? { ...v, balance: Math.max(0, v.balance - pay.amount) } : v);
    return { ...prev, payments: [...prev.payments, pay], vendors: newVendors };
  });
  const updatePayment = (p: Payment) => updateState(prev => {
    const old = prev.payments.find(x => x.id === p.id);
    let newVendors = [...prev.vendors];
    if (old) {
      newVendors = newVendors.map(v => v.id === old.vendorId ? { ...v, balance: v.balance + old.amount } : v);
      newVendors = newVendors.map(v => v.id === p.vendorId ? { ...v, balance: Math.max(0, v.balance - p.amount) } : v);
    }
    return {
      ...prev,
      payments: prev.payments.map(pay => pay.id === p.id ? p : pay),
      vendors: newVendors
    };
  });
  const deletePayment = (id: string) => updateState(prev => {
    const pay = prev.payments.find(p => p.id === id);
    const newVendors = pay 
      ? prev.vendors.map(v => v.id === pay.vendorId ? { ...v, balance: v.balance + pay.amount } : v)
      : prev.vendors;
    return { ...prev, payments: prev.payments.filter(p => p.id !== id), vendors: newVendors };
  });

  // CRUD: Income
  const addIncome = (i: Income) => updateState(prev => ({ ...prev, incomes: [...prev.incomes, i] }));
  const updateIncome = (i: Income) => updateState(prev => ({
    ...prev, incomes: prev.incomes.map(inc => inc.id === i.id ? i : inc)
  }));
  const deleteIncome = (id: string) => updateState(prev => ({
    ...prev, incomes: prev.incomes.filter(i => i.id !== id)
  }));

  const enableCloudSync = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${CLOUD_API}/${id}`);
      if (res.ok) {
        const cloudState = await res.json();
        if (cloudState.lastUpdated > (state.lastUpdated || 0)) {
          setState({ ...cloudState, syncId: id });
        } else {
          await pushToCloud({ ...state, syncId: id, lastUpdated: Date.now() });
          updateState(prev => ({ ...prev, syncId: id }));
        }
      } else {
        await fetch(`${CLOUD_API}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...state, syncId: id, lastUpdated: Date.now() })
        });
        updateState(prev => ({ ...prev, syncId: id }));
      }
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const disableCloudSync = () => updateState(prev => ({ ...prev, syncId: undefined }));
  const forceSync = async () => { await pullFromCloud(); await pushToCloud(state); };
  const loadExternalState = useCallback((newState: AppState) => updateState(() => newState), [updateState]);

  const value = useMemo(() => ({
    ...state,
    addProject, updateProject, deleteProject,
    addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial,
    addExpense, updateExpense, deleteExpense,
    addPayment, updatePayment, deletePayment,
    addIncome, updateIncome, deleteIncome,
    loadExternalState, enableCloudSync, disableCloudSync, forceSync,
    isSyncing, syncError, lastSynced
  }), [state, lastSynced, isSyncing, syncError, loadExternalState, forceSync]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
