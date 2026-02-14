import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  History, 
  Search, 
  X, 
  TrendingDown, 
  Trash2,
  Briefcase,
  Users,
  Filter,
  Pencil,
  AlertCircle,
  Save,
  Plus,
  Receipt,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Landmark,
  Calendar,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  ArrowUpNarrowWide,
  DollarSign,
  ChevronRight,
  ClipboardList,
  BarChart4,
  ArrowDownLeft,
  ArrowUpRight,
  Scale
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Expense, Project, Vendor } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

type InventorySortOption = 'name' | 'stock-low' | 'stock-high' | 'cost';
type HistorySortOption = 'date-desc' | 'date-asc' | 'qty-high' | 'qty-low';
type HistoryTab = 'all' | 'purchases' | 'usage';

export const Inventory: React.FC = () => {
  const { 
    materials, projects, vendors, stockingUnits, 
    updateMaterial, addMaterial, deleteMaterial, 
    addExpense, updateExpense, deleteExpense, 
    expenses 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [inventorySort, setInventorySort] = useState<InventorySortOption>('name');
  
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySortOption>('date-desc');
  const [activeHistoryTab, setActiveHistoryTab] = useState<HistoryTab>('all');
  
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [editingHistoryEntry, setEditingHistoryEntry] = useState<{material: Material, entry: StockHistoryEntry} | null>(null);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [historyEditFormData, setHistoryEditFormData] = useState({
    quantity: '', unitPrice: '', projectId: '', vendorId: '', date: '', note: ''
  });

  // CRITICAL: Keep history modal state in sync with global material updates
  useEffect(() => {
    if (historyMaterial) {
      const freshMat = materials.find(m => m.id === historyMaterial.id);
      if (freshMat) setHistoryMaterial(freshMat);
    }
  }, [materials]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProcureModal(false);
        setShowUsageModal(false);
        setShowEditModal(false);
        setShowEditHistoryModal(false);
        setHistoryMaterial(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const [procureData, setProcureData] = useState({
    materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects[0]?.id || '', quantity: '', unit: stockingUnits[0] || 'Bag', costPerUnit: '', date: new Date().toISOString().split('T')[0]
  });

  const [usageData, setUsageData] = useState({
    materialId: '', projectId: projects[0]?.id || '', quantity: '', date: new Date().toISOString().split('T')[0], notes: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '', unit: stockingUnits[0] || 'Bag', costPerUnit: ''
  });

  const filteredMaterials = useMemo(() => {
    let result = materials.map(mat => {
      let siteBalance = mat.totalPurchased - mat.totalUsed;
      let hasProjectLink = true;

      if (projectFilter !== 'All') {
        const sitePurchases = mat.history?.filter(h => h.type === 'Purchase' && h.projectId === projectFilter) || [];
        const siteUsages = mat.history?.filter(h => h.type === 'Usage' && h.projectId === projectFilter) || [];
        const totalSitePurchased = sitePurchases.reduce((sum, h) => sum + h.quantity, 0);
        const totalSiteUsed = siteUsages.reduce((sum, h) => sum + h.quantity, 0);
        siteBalance = totalSitePurchased - totalSiteUsed;
        hasProjectLink = totalSitePurchased > 0;
      }

      return { ...mat, siteBalance, hasProjectLink };
    });

    result = result.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'All' || mat.hasProjectLink;
      const matchesVendor = vendorFilter === 'All' || mat.history?.some(h => h.vendorId === vendorFilter);
      return matchesSearch && matchesProject && matchesVendor;
    });

    return result.sort((a, b) => {
      if (inventorySort === 'name') return a.name.localeCompare(b.name);
      if (inventorySort === 'stock-low') return a.siteBalance - b.siteBalance;
      if (inventorySort === 'stock-high') return b.siteBalance - a.siteBalance;
      if (inventorySort === 'cost') return b.costPerUnit - a.costPerUnit;
      return 0;
    });
  }, [materials, searchTerm, projectFilter, vendorFilter, inventorySort]);

  const totalInventoryValueSum = useMemo(() => {
    return filteredMaterials.reduce((sum, mat) => sum + (mat.siteBalance * mat.costPerUnit), 0);
  }, [filteredMaterials]);

  const filteredHistory = useMemo(() => {
    if (!historyMaterial || !historyMaterial.history) return [];
    
    let result = historyMaterial.history.filter(entry => {
      if (activeHistoryTab === 'purchases' && entry.type !== 'Purchase') return false;
      if (activeHistoryTab === 'usage' && entry.type !== 'Usage') return false;

      const projectName = projects.find(p => p.id === entry.projectId)?.name || '';
      const vendorName = vendors.find(v => v.id === entry.vendorId)?.name || '';
      const search = historySearch.toLowerCase();
      
      const entryDate = entry.date;
      const formattedDate = new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase();
      const qtyStr = entry.quantity.toString();
      
      return (
        entry.note?.toLowerCase().includes(search) ||
        entry.type.toLowerCase().includes(search) ||
        projectName.toLowerCase().includes(search) ||
        vendorName.toLowerCase().includes(search) ||
        entryDate.includes(search) ||
        formattedDate.includes(search) ||
        qtyStr.includes(search)
      );
    });

    return result.sort((a, b) => {
      if (historySort === 'date-desc') {
        const timeB = new Date(b.date).getTime();
        const timeA = new Date(a.date).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return b.id.localeCompare(a.id);
      }
      if (historySort === 'date-asc') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id);
      }
      if (historySort === 'qty-high') return b.quantity - a.quantity;
      if (historySort === 'qty-low') return a.quantity - b.quantity;
      return 0;
    });
  }, [historyMaterial, historySearch, historySort, projects, vendors, activeHistoryTab]);

  const historySummaryStats = useMemo(() => {
    if (!historyMaterial || !historyMaterial.history) return { inwardValue: 0, usageValue: 0, totalInwardQty: 0, totalUsageQty: 0 };
    
    const inward = filteredHistory.filter(h => h.type === 'Purchase');
    const usage = filteredHistory.filter(h => h.type === 'Usage');
    
    const inwardValue = inward.reduce((sum, h) => sum + (h.quantity * (h.unitPrice || historyMaterial.costPerUnit)), 0);
    const usageValue = usage.reduce((sum, h) => sum + (h.quantity * (h.unitPrice || historyMaterial.costPerUnit)), 0);
    const totalInwardQty = inward.reduce((sum, h) => sum + h.quantity, 0);
    const totalUsageQty = usage.reduce((sum, h) => sum + h.quantity, 0);

    return { inwardValue, usageValue, totalInwardQty, totalUsageQty };
  }, [filteredHistory, historyMaterial]);

  const totalHistoryValueSum = useMemo(() => {
    if (!historyMaterial) return 0;
    if (activeHistoryTab === 'purchases') return historySummaryStats.inwardValue;
    if (activeHistoryTab === 'usage') return historySummaryStats.usageValue;
    return historySummaryStats.inwardValue - historySummaryStats.usageValue;
  }, [historySummaryStats, activeHistoryTab]);

  const relevantMaterialsForSite = useMemo(() => {
    if (!usageData.projectId) return [];
    const siteInventory: any[] = [];
    materials.forEach(m => {
      const sitePurchases = m.history?.filter(h => h.type === 'Purchase' && h.projectId === usageData.projectId) || [];
      const siteUsages = m.history?.filter(h => h.type === 'Usage' && h.projectId === usageData.projectId) || [];
      const siteBalance = sitePurchases.reduce((sum, h) => sum + h.quantity, 0) - siteUsages.reduce((sum, h) => sum + h.quantity, 0);
      if (siteBalance > 0) {
        siteInventory.push({ ...m, siteBalance });
      }
    });
    return siteInventory;
  }, [materials, usageData.projectId]);

  const handleOpenUsageModal = (matId?: string, projId?: string) => {
    setUsageData({
      materialId: matId || '',
      projectId: projId || (projectFilter !== 'All' ? projectFilter : (projects[0]?.id || '')),
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowUsageModal(true);
  };

  const handleOpenEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setEditFormData({ name: mat.name, unit: mat.unit, costPerUnit: mat.costPerUnit.toString() });
    setShowEditModal(true);
  };

  const handleProcureStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const unitPrice = parseFloat(procureData.costPerUnit) || 0;

    let targetId = procureData.materialId;
    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      await addMaterial({ id: newId, name: procureData.newName, unit: procureData.unit, costPerUnit: unitPrice, totalPurchased: 0, totalUsed: 0, history: [] });
      targetId = newId;
    }

    await addExpense({
      id: 'e-proc-' + Date.now(),
      date: procureData.date,
      projectId: procureData.projectId,
      vendorId: procureData.vendorId,
      amount: qty * unitPrice,
      paymentMethod: 'Bank',
      category: 'Material',
      materialId: targetId,
      materialQuantity: qty,
      notes: `Procured ${qty} ${procureData.unit} of ${procureData.materialId === 'new' ? procureData.newName : materials.find(m => m.id === targetId)?.name}`
    });

    setShowProcureModal(false);
    setProcureData({ materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects[0]?.id || '', quantity: '', unit: stockingUnits[0] || 'Bag', costPerUnit: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(usageData.quantity) || 0;
    const target = materials.find(m => m.id === usageData.materialId);
    if (!target) return;

    await addExpense({
      id: 'e-usage-' + Date.now(),
      date: usageData.date,
      projectId: usageData.projectId,
      amount: qty * target.costPerUnit,
      paymentMethod: 'Bank',
      category: 'Material',
      materialId: target.id,
      materialQuantity: qty,
      notes: `Usage: ${qty} ${target.unit} of ${target.name}. ${usageData.notes}`
    });
    setShowUsageModal(false);
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (confirm(`Delete ${name} and all associated logs?`)) deleteMaterial(id);
  };

  const handleDeleteHistoryEntry = async (material: Material, entryId: string) => {
    if (!confirm("Delete this activity log? This will recalculate stock levels and adjust financials.")) return;

    const expenseId = entryId.startsWith('sh-') ? entryId.substring(3) : null;
    
    if (expenseId) {
      // Use central function to handle stock reversal and ledger cleanup
      await deleteExpense(expenseId);
    } else {
      // Manual entry fallback
      const newHistory = material.history?.filter(h => h.id !== entryId) || [];
      const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
      const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);
      await updateMaterial({ ...material, totalPurchased, totalUsed, history: newHistory });
    }
  };

  const handleEditHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryEntry) return;

    const { material, entry } = editingHistoryEntry;
    const expenseId = entry.id.startsWith('sh-') ? entry.id.substring(3) : null;
    const qty = parseFloat(historyEditFormData.quantity) || 0;
    const price = parseFloat(historyEditFormData.unitPrice) || 0;

    if (expenseId) {
      const existingExpense = expenses.find(ex => ex.id === expenseId);
      if (existingExpense) {
        await updateExpense({
          ...existingExpense,
          materialQuantity: qty,
          amount: qty * price,
          projectId: historyEditFormData.projectId,
          vendorId: historyEditFormData.vendorId || undefined,
          date: historyEditFormData.date,
          notes: historyEditFormData.note
        });
      }
    } else {
      // Manual edit fallback
      const newHistory = material.history?.map(h => h.id === entry.id ? { 
        ...h, quantity: qty, unitPrice: price, 
        projectId: historyEditFormData.projectId, vendorId: historyEditFormData.vendorId || undefined,
        date: historyEditFormData.date, note: historyEditFormData.note 
      } : h) || [];
      const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
      const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);
      await updateMaterial({ ...material, totalPurchased, totalUsed, history: newHistory });
    }

    setShowEditHistoryModal(false);
    setEditingHistoryEntry(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Inventory Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage master assets, monitor levels, and track site consumption.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <button onClick={() => setShowProcureModal(true)} className="bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"><Plus size={18} /> Procure</button>
          <button onClick={() => handleOpenUsageModal()} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"><TrendingDown size={18} /> Use Stock</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by asset name..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none dark:text-white"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
             <option value="All">Site: All</option>
             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select 
            className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none dark:text-white"
            value={inventorySort}
            onChange={(e) => setInventorySort(e.target.value as InventorySortOption)}
          >
             <option value="name">Sort: A-Z</option>
             <option value="stock-low">Stock Low</option>
             <option value="stock-high">Stock High</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Material Asset</th>
                <th className="px-8 py-5">Financial Value</th>
                <th className="px-8 py-5">Current Availability</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center font-black text-lg">{mat.name.charAt(0)}</div>
                      <div>
                        <p className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">{mat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Base Unit: {mat.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-slate-600 dark:text-slate-400">
                    {formatCurrency(mat.siteBalance * mat.costPerUnit)}
                  </td>
                  <td className="px-8 py-5">
                     <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${mat.siteBalance < 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                       {mat.siteBalance.toLocaleString()} {mat.unit}s {projectFilter !== 'All' ? 'at Site' : 'Global'}
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex justify-end gap-2 items-center">
                       <button onClick={() => setHistoryMaterial(mat)} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"><History size={18} /></button>
                       <button onClick={() => handleOpenEditModal(mat)} className="p-3 text-slate-400 hover:text-blue-600"><Pencil size={18} /></button>
                       <button onClick={() => handleDeleteAsset(mat.id, mat.name)} className="p-3 text-slate-300 hover:text-red-600"><Trash2 size={18} /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-14 h-14 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl">{historyMaterial.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Stock History</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{historyMaterial.name} Ledger • Bal: {(historyMaterial.totalPurchased - historyMaterial.totalUsed).toLocaleString()} {historyMaterial.unit}s</p>
                 </div>
               </div>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={36} /></button>
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-700 px-8 bg-slate-50/50 dark:bg-slate-900/20">
               <button onClick={() => setActiveHistoryTab('all')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeHistoryTab === 'all' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Full Log</button>
               <button onClick={() => setActiveHistoryTab('purchases')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeHistoryTab === 'purchases' ? 'text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Purchases</button>
               <button onClick={() => setActiveHistoryTab('usage')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeHistoryTab === 'usage' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Usage</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
               <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left min-w-[850px]">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Activity</th>
                        <th className="px-8 py-5">Quantity</th>
                        <th className="px-8 py-5 text-right">Value</th>
                        <th className="px-8 py-5">Project/Vendor</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                          <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-black uppercase ${entry.type === 'Purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>{entry.type}</span>
                            <p className="text-[11px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{entry.note}</p>
                          </td>
                          <td className="px-8 py-5">
                             <span className={`text-sm font-black ${entry.type === 'Purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>
                               {entry.type === 'Purchase' ? '+' : '-'}{entry.quantity.toLocaleString()} {historyMaterial.unit}
                             </span>
                          </td>
                          <td className="px-8 py-5 text-right font-bold text-xs">{formatCurrency(entry.quantity * (entry.unitPrice || historyMaterial.costPerUnit))}</td>
                          <td className="px-8 py-5">
                             <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{projects.find(p => p.id === entry.projectId)?.name || 'General'}</p>
                             <p className="text-[9px] font-bold uppercase text-slate-400">{vendors.find(v => v.id === entry.vendorId)?.name || 'Internal'}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex justify-end gap-1">
                               <button 
                                onClick={() => {
                                  setEditingHistoryEntry({ material: historyMaterial, entry });
                                  setHistoryEditFormData({
                                    quantity: entry.quantity.toString(),
                                    unitPrice: (entry.unitPrice || historyMaterial.costPerUnit).toString(),
                                    projectId: entry.projectId || '',
                                    vendorId: entry.vendorId || '',
                                    date: entry.date,
                                    note: entry.note || ''
                                  });
                                  setShowEditHistoryModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                               >
                                 <Pencil size={16} />
                               </button>
                               <button onClick={() => handleDeleteHistoryEntry(historyMaterial, entry.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {showEditHistoryModal && editingHistoryEntry && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Modify Activity Log</h2>
                 <button onClick={() => setShowEditHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={handleEditHistorySubmit} className="p-8 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                       <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.quantity} onChange={e => setHistoryEditFormData(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unit Price</label>
                       <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.unitPrice} onChange={e => setHistoryEditFormData(p => ({ ...p, unitPrice: e.target.value }))} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Site</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.projectId} onChange={e => setHistoryEditFormData(p => ({ ...p, projectId: e.target.value }))}>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.date} onChange={e => setHistoryEditFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Activity Description</label>
                    <textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.note} onChange={e => setHistoryEditFormData(p => ({ ...p, note: e.target.value }))} />
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest mt-4">Save Changes</button>
              </form>
           </div>
        </div>
      )}

      {/* Procure Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/30 dark:bg-emerald-900/20 flex justify-between items-center shrink-0">
                 <div className="flex gap-4 items-center">
                    <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg">
                       <ShoppingCart size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Procure Materials</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Inward Stock & Record Bill</p>
                    </div>
                 </div>
                 <button onClick={() => setShowProcureModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
              </div>
              <form onSubmit={handleProcureStock} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh]">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Material Asset</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))} required>
                       <option value="">Choose item...</option>
                       {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                       <option value="new">+ Register New Material</option>
                    </select>
                 </div>

                 {procureData.materialId === 'new' && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Material Name</label>
                         <input type="text" className="w-full px-5 py-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold dark:text-white" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} required />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Unit</label>
                         <select className="w-full px-5 py-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold dark:text-white" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value }))}>
                            {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                         </select>
                      </div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier / Vendor</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required>
                          <option value="">Select Vendor...</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project / Site</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Qty in {materials.find(m => m.id === procureData.materialId)?.unit || procureData.unit}
                       </label>
                       <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price (Rs.)</label>
                       <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</label>
                       <input type="date" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.date} onChange={e => setProcureData(p => ({ ...p, date: e.target.value }))} required />
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900 dark:bg-black rounded-3xl text-white flex justify-between items-center shadow-xl">
                    <div>
                       <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Total Transaction Value</p>
                       <p className="text-xl font-black text-emerald-400">
                          {formatCurrency((parseFloat(procureData.quantity) || 0) * (parseFloat(procureData.costPerUnit) || 0))}
                       </p>
                    </div>
                    <Scale size={24} className="text-white/20" />
                 </div>

                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest mt-4">Complete Procurement</button>
              </form>
           </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/20 flex justify-between items-center shrink-0">
                 <div className="flex gap-4 items-center">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
                       <TrendingDown size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Site Usage</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Deduct quantity from project inventory</p>
                    </div>
                 </div>
                 <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
              </div>
              <form onSubmit={handleRecordUsage} className="p-8 space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Site</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={usageData.projectId} onChange={e => setUsageData(p => ({ ...p, projectId: e.target.value }))} required>
                       <option value="">Select Project...</option>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Asset</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={usageData.materialId} onChange={e => setUsageData(p => ({ ...p, materialId: e.target.value }))} required>
                       <option value="">Choose item...</option>
                       {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         Qty in {materials.find(m => m.id === usageData.materialId)?.unit || 'Units'}
                       </label>
                       <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={usageData.date} onChange={e => setUsageData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest mt-4">Confirm Usage & Deduct Stock</button>
              </form>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 shrink-0">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Edit Master Asset</h2>
                 <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await updateMaterial({ ...editingMaterial, name: editFormData.name, unit: editFormData.unit, costPerUnit: parseFloat(editFormData.costPerUnit) || 0 });
                setShowEditModal(false);
              }} className="p-8 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Asset Name</label>
                    <input type="text" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Base Stocking Unit</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.unit} onChange={e => setEditFormData(p => ({ ...p, unit: e.target.value }))}>
                          {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Standard Cost / Unit</label>
                       <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white outline-none" value={editFormData.costPerUnit} onChange={e => setEditFormData(p => ({ ...p, costPerUnit: e.target.value }))} required />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest mt-4">Save Changes</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};