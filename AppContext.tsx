
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment, Income, User } from './types';
import { INITIAL_STATE } from './constants';

interface HistoryState {
  state: AppState;
  actionName: string;
}

interface AppContextType extends AppState {
  updateUser: (u: User) => void;
  setTheme: (theme: 'light' | 'dark') => void;
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
  addTradeCategory: (cat: string) => void;
  removeTradeCategory: (cat: string) => void;
  addStockingUnit: (unit: string) => void;
  removeStockingUnit: (unit: string) => void;
  loadExternalState: (newState: AppState) => void;
  enableCloudSync: (id: string) => void;
  disableCloudSync: () => void;
  forceSync: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastActionName: string;
  isSyncing: boolean;
  syncError: boolean;
  lastSynced: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'buildtrack_pro_state_v2';
const SYNC_CHANNEL = 'buildtrack_sync_v2';
const CLOUD_API = 'https://jsonblob.com/api/jsonBlob';
const MAX_HISTORY = 30;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.theme) parsed.theme = 'light';
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return { ...INITIAL_STATE, lastUpdated: Date.now() };
  });

  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const skipNextCloudPush = useRef(false);

  const updateState = useCallback((updater: (prev: AppState) => AppState, actionName?: string) => {
    setState(prev => {
      const newState = updater(prev);
      if (actionName) {
        setPast(p => [{ state: prev, actionName }, ...p].slice(0, MAX_HISTORY));
        setFuture([]); 
      }
      return { ...newState, lastUpdated: Date.now() };
    });
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const { state: previous, actionName } = past[0];
    const newPast = past.slice(1);
    
    setFuture(f => [{ state, actionName }, ...f]);
    setPast(newPast);
    setState({ ...previous, lastUpdated: Date.now() });
  }, [past, state]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const { state: next, actionName } = future[0];
    const newFuture = future.slice(1);

    setPast(p => [{ state, actionName }, ...p]);
    setFuture(newFuture);
    setState({ ...next, lastUpdated: Date.now() });
  }, [future, state]);

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
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const updateUser = (u: User) => updateState(prev => ({ ...prev, currentUser: u }), "Update Profile");
  const setTheme = (theme: 'light' | 'dark') => updateState(prev => ({ ...prev, theme }), "Switch Theme");

  const addProject = (p: Project) => updateState(prev => ({ ...prev, projects: [...prev.projects, p] }), `Add Project '${p.name}'`);
  const updateProject = (p: Project) => updateState(prev => ({
    ...prev, projects: prev.projects.map(proj => proj.id === p.id ? p : proj)
  }), `Update Project '${p.name}'`);
  const deleteProject = (id: string) => updateState(prev => ({
    ...prev, projects: prev.projects.filter(p => p.id !== id)
  }), "Delete Project");

  const addVendor = (v: Vendor) => updateState(prev => ({ ...prev, vendors: [...prev.vendors, v] }), `Add Vendor '${v.name}'`);
  const updateVendor = (v: Vendor) => updateState(prev => ({
    ...prev, vendors: prev.vendors.map(vend => vend.id === v.id ? v : vend)
  }), `Update Vendor '${v.name}'`);
  const deleteVendor = (id: string) => updateState(prev => ({
    ...prev, vendors: prev.vendors.filter(v => v.id !== id)
  }), "Delete Vendor");

  const addMaterial = (m: Material) => updateState(prev => ({ ...prev, materials: [...prev.materials, m] }), `Add Material Asset '${m.name}'`);
  const updateMaterial = (m: Material) => updateState(prev => ({
    ...prev, materials: prev.materials.map(mat => mat.id === m.id ? m : mat)
  }), `Update Material '${m.name}'`);
  const deleteMaterial = (id: string) => updateState(prev => ({
    ...prev, materials: prev.materials.filter(m => m.id !== id)
  }), "Delete Material Asset");

  const addExpense = (e: Expense) => updateState(prev => {
    const newVendors = e.vendorId 
      ? prev.vendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v)
      : prev.vendors;
    return { ...prev, expenses: [...prev.expenses, e], vendors: newVendors };
  }, "Record Expense");
  const updateExpense = (e: Expense) => updateState(prev => ({
    ...prev, expenses: prev.expenses.map(exp => exp.id === e.id ? e : exp)
  }), "Update Expense");
  const deleteExpense = (id: string) => updateState(prev => {
    const expenseToDelete = prev.expenses.find(e => e.id === id);
    const newVendors = (expenseToDelete && expenseToDelete.vendorId)
      ? prev.vendors.map(v => v.id === expenseToDelete.vendorId ? { ...v, balance: Math.max(0, v.balance - expenseToDelete.amount) } : v)
      : prev.vendors;
    return { ...prev, expenses: prev.expenses.filter(e => e.id !== id), vendors: newVendors };
  }, "Delete Expense Record");

  const addPayment = (pay: Payment) => updateState(prev => {
    const newVendors = prev.vendors.map(v => v.id === pay.vendorId ? { ...v, balance: Math.max(0, v.balance - pay.amount) } : v);
    return { ...prev, payments: [...prev.payments, pay], vendors: newVendors };
  }, "Record Vendor Payment");
  const updatePayment = (p: Payment) => updateState(prev => ({
    ...prev, payments: prev.payments.map(pay => pay.id === p.id ? p : pay)
  }), "Update Payment");
  const deletePayment = (id: string) => updateState(prev => {
    const paymentToDelete = prev.payments.find(p => p.id === id);
    const newVendors = paymentToDelete
      ? prev.vendors.map(v => v.id === paymentToDelete.vendorId ? { ...v, balance: v.balance + paymentToDelete.amount } : v)
      : prev.vendors;
    return { ...prev, payments: prev.payments.filter(p => p.id !== id), vendors: newVendors };
  }, "Delete Payment Record");

  const addIncome = (i: Income) => updateState(prev => ({ ...prev, incomes: [...prev.incomes, i] }), "Record Project Income");
  const updateIncome = (i: Income) => updateState(prev => ({
    ...prev, incomes: prev.incomes.map(inc => inc.id === i.id ? i : inc)
  }), "Update Income");
  const deleteIncome = (id: string) => updateState(prev => ({
    ...prev, incomes: prev.incomes.filter(i => i.id !== id)
  }), "Delete Income Record");

  const addTradeCategory = (cat: string) => updateState(prev => ({ ...prev, tradeCategories: [...new Set([...prev.tradeCategories, cat])] }), "Add Trade Category");
  const removeTradeCategory = (cat: string) => updateState(prev => ({ ...prev, tradeCategories: prev.tradeCategories.filter(c => c !== cat) }), "Remove Trade Category");
  
  const addStockingUnit = (unit: string) => updateState(prev => ({ ...prev, stockingUnits: [...new Set([...prev.stockingUnits, unit])] }), "Add Stocking Unit");
  const removeStockingUnit = (unit: string) => updateState(prev => ({ ...prev, stockingUnits: prev.stockingUnits.filter(u => u !== unit) }), "Remove Stocking Unit");

  const enableCloudSync = async (id: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${CLOUD_API}/${id}`);
      if (res.ok) {
        const cloudState = await res.json();
        setState({ ...cloudState, syncId: id });
      } else {
        await pushToCloud({ ...state, syncId: id, lastUpdated: Date.now() });
        updateState(prev => ({ ...prev, syncId: id }));
      }
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const disableCloudSync = () => updateState(prev => ({ ...prev, syncId: undefined }), "Disable Cloud Sync");
  const forceSync = async () => { await pullFromCloud(); await pushToCloud(state); };
  const loadExternalState = useCallback((newState: AppState) => updateState(() => newState, "Import External Data"), [updateState]);

  const value = useMemo(() => ({
    ...state,
    updateUser, setTheme,
    addProject, updateProject, deleteProject,
    addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial,
    addExpense, updateExpense, deleteExpense,
    addPayment, updatePayment, deletePayment,
    addIncome, updateIncome, deleteIncome,
    addTradeCategory, removeTradeCategory, addStockingUnit, removeStockingUnit,
    loadExternalState, enableCloudSync, disableCloudSync, forceSync,
    undo, redo, canUndo: past.length > 0, canRedo: future.length > 0,
    lastActionName: past.length > 0 ? past[0].actionName : '',
    isSyncing, syncError, lastSynced
  }), [state, past.length, future.length, lastSynced, isSyncing, syncError, loadExternalState, forceSync, undo, redo, setTheme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
