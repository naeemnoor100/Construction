
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment } from './types';
import { INITIAL_STATE } from './constants';

interface AppContextType extends AppState {
  addProject: (p: Project) => void;
  updateProject: (p: Project) => void;
  addVendor: (v: Vendor) => void;
  addMaterial: (m: Material) => void;
  updateMaterial: (m: Material) => void;
  addExpense: (e: Expense) => void;
  addPayment: (p: Payment) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const addProject = useCallback((p: Project) => {
    setState(prev => ({ ...prev, projects: [...prev.projects, p] }));
  }, []);

  const updateProject = useCallback((p: Project) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === p.id ? p : proj)
    }));
  }, []);

  const addVendor = useCallback((v: Vendor) => {
    setState(prev => ({ ...prev, vendors: [...prev.vendors, v] }));
  }, []);

  const addMaterial = useCallback((m: Material) => {
    setState(prev => ({ ...prev, materials: [...prev.materials, m] }));
  }, []);

  const updateMaterial = useCallback((m: Material) => {
    setState(prev => ({
      ...prev,
      materials: prev.materials.map(mat => mat.id === m.id ? m : mat)
    }));
  }, []);

  const addExpense = useCallback((e: Expense) => {
    setState(prev => {
      // Logic for updating vendor balances or material stock
      const newVendors = e.vendorId 
        ? prev.vendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v)
        : prev.vendors;
        
      return {
        ...prev,
        expenses: [...prev.expenses, e],
        vendors: newVendors
      };
    });
  }, []);

  const addPayment = useCallback((pay: Payment) => {
    setState(prev => {
      const newVendors = prev.vendors.map(v => 
        v.id === pay.vendorId ? { ...v, balance: Math.max(0, v.balance - pay.amount) } : v
      );
      return {
        ...prev,
        payments: [...prev.payments, pay],
        vendors: newVendors
      };
    });
  }, []);

  const value = useMemo(() => ({
    ...state,
    addProject,
    updateProject,
    addVendor,
    addMaterial,
    updateMaterial,
    addExpense,
    addPayment
  }), [state, addProject, updateProject, addVendor, addMaterial, updateMaterial, addExpense, addPayment]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
