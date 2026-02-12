
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment, Income, User } from './types';
import { INITIAL_STATE } from './constants';

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
  loadExternalState: (newState: AppState) => void;
  enableCloudSync: (id: string) => void;
  disableCloudSync: () => void;
  forceSync: () => Promise<void>;
  undo: () => void;
  canUndo: boolean;
  isSyncing: boolean;
  syncError: boolean;
  lastSynced: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'buildtrack_pro_state_v2';
const SYNC_CHANNEL = 'buildtrack_sync_v2';
const CLOUD_API = 'https://jsonblob.com/api/jsonBlob';
const MAX_HISTORY = 25;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure theme is present in recovered state
        if (!parsed.theme) parsed.theme = 'light';
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return { ...INITIAL_STATE, lastUpdated: Date.now() };
  });

  const [past, setPast] = useState<AppState[]>([]);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const skipNextCloudPush = useRef(false);

  const updateState = useCallback((updater: (prev: AppState) => AppState, saveToHistory = false) => {
    setState(prev => {
      const newState = updater(prev);
      if (saveToHistory) {
        setPast(p => [prev, ...p].slice(0, MAX_HISTORY));
      }
      return { ...newState, lastUpdated: Date.now() };
    });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    updateState(prev => ({ ...prev, theme }), false);
  }, [updateState]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[0];
    const newPast = past.slice(1);
    
    setPast(newPast);
    setState({ ...previous, lastUpdated: Date.now() });
    
    console.debug("Undo performed");
  }, [past]);

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
    
    // Sync class with state for tailwind dark mode
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

  // CRUD: User
  const updateUser = (u: User) => updateState(prev => ({ ...prev, currentUser: u }), true);

  // CRUD: Projects
  const addProject = (p: Project) => updateState(prev => ({ ...prev, projects: [...prev.projects, p] }), true);
  const updateProject = (p: Project) => updateState(prev => ({
    ...prev, projects: prev.projects.map(proj => proj.id === p.id ? p : proj)
  }), true);
  const deleteProject = (id: string) => updateState(prev => ({
    ...prev, projects: prev.projects.filter(p => p.id !== id)
  }), true);

  // CRUD: Vendors
  const addVendor = (v: Vendor) => updateState(prev => ({ ...prev, vendors: [...prev.vendors, v] }), true);
  const updateVendor = (v: Vendor) => updateState(prev => ({
    ...prev, vendors: prev.vendors.map(vend => vend.id === v.id ? v : vend)
  }), true);
  const deleteVendor = (id: string) => updateState(prev => ({
    ...prev, vendors: prev.vendors.filter(v => v.id !== id)
  }), true);

  // CRUD: Materials
  const addMaterial = (m: Material) => updateState(prev => ({ ...prev, materials: [...prev.materials, m] }), true);
  const updateMaterial = (m: Material) => updateState(prev => ({
    ...prev, materials: prev.materials.map(mat => mat.id === m.id ? m : mat)
  }), true);
  const deleteMaterial = (id: string) => updateState(prev => ({
    ...prev, materials: prev.materials.filter(m => m.id !== id)
  }), true);

  // CRUD: Expenses
  const addExpense = (e: Expense) => updateState(prev => {
    const newVendors = e.vendorId 
      ? prev.vendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v)
      : prev.vendors;
    return { ...prev, expenses: [...prev.expenses, e], vendors: newVendors };
  }, true);
  const updateExpense = (e: Expense) => updateState(prev => {
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
  }, true);
  const deleteExpense = (id: string) => updateState(prev => {
    const exp = prev.expenses.find(e => e.id === id);
    const newVendors = exp?.vendorId 
      ? prev.vendors.map(v => v.id === exp.vendorId ? { ...v, balance: Math.max(0, v.balance - exp.amount) } : v)
      : prev.vendors;
    return { ...prev, expenses: prev.expenses.filter(e => e.id !== id), vendors: newVendors };
  }, true);

  // CRUD: Payments
  const addPayment = (pay: Payment) => updateState(prev => {
    const newVendors = prev.vendors.map(v => v.id === pay.vendorId ? { ...v, balance: Math.max(0, v.balance - pay.amount) } : v);
    return { ...prev, payments: [...prev.payments, pay], vendors: newVendors };
  }, true);
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
  }, true);
  const deletePayment = (id: string) => updateState(prev => {
    const pay = prev.payments.find(p => p.id === id);
    const newVendors = pay 
      ? prev.vendors.map(v => v.id === pay.vendorId ? { ...v, balance: v.balance + pay.amount } : v)
      : prev.vendors;
    return { ...prev, payments: prev.payments.filter(p => p.id !== id), vendors: newVendors };
  }, true);

  // CRUD: Income
  const addIncome = (i: Income) => updateState(prev => ({ ...prev, incomes: [...prev.incomes, i] }), true);
  const updateIncome = (i: Income) => updateState(prev => ({
    ...prev, incomes: prev.incomes.map(inc => inc.id === i.id ? i : inc)
  }), true);
  const deleteIncome = (id: string) => updateState(prev => ({
    ...prev, incomes: prev.incomes.filter(i => i.id !== id)
  }), true);

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
    updateUser,
    setTheme,
    addProject, updateProject, deleteProject,
    addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial,
    addExpense, updateExpense, deleteExpense,
    addPayment, updatePayment, deletePayment,
    addIncome, updateIncome, deleteIncome,
    loadExternalState, enableCloudSync, disableCloudSync, forceSync,
    undo, canUndo: past.length > 0,
    isSyncing, syncError, lastSynced
  }), [state, past.length, lastSynced, isSyncing, syncError, loadExternalState, forceSync, undo, setTheme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};