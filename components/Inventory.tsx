
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
  DollarSign
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Expense, Project, Vendor } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

type InventorySortOption = 'name' | 'stock-low' | 'stock-high' | 'cost';
type HistorySortOption = 'date-desc' | 'date-asc' | 'qty-high' | 'qty-low';

export const Inventory: React.FC = () => {
  const { materials, projects, vendors, stockingUnits, updateMaterial, addMaterial, deleteMaterial, addExpense, deleteExpense, updateVendor } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [inventorySort, setInventorySort] = useState<InventorySortOption>('name');
  
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySortOption>('date-desc');
  
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [editingHistoryEntry, setEditingHistoryEntry] = useState<{material: Material, entry: StockHistoryEntry} | null>(null);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [historyEditFormData, setHistoryEditFormData] = useState({
    quantity: '', unitPrice: '', projectId: '', vendorId: '', date: '', note: ''
  });

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
    let result = materials.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'All' || mat.history?.some(h => h.projectId === projectFilter);
      const matchesVendor = vendorFilter === 'All' || mat.history?.some(h => h.vendorId === vendorFilter);
      return matchesSearch && matchesProject && matchesVendor;
    });

    return result.sort((a, b) => {
      const stockA = a.totalPurchased - a.totalUsed;
      const stockB = b.totalPurchased - b.totalUsed;
      if (inventorySort === 'name') return a.name.localeCompare(b.name);
      if (inventorySort === 'stock-low') return stockA - stockB;
      if (inventorySort === 'stock-high') return stockB - stockA;
      if (inventorySort === 'cost') return b.costPerUnit - a.costPerUnit;
      return 0;
    });
  }, [materials, searchTerm, projectFilter, vendorFilter, inventorySort]);

  const filteredHistory = useMemo(() => {
    if (!historyMaterial || !historyMaterial.history) return [];
    
    let result = historyMaterial.history.filter(entry => {
      const projectName = projects.find(p => p.id === entry.projectId)?.name || '';
      const vendorName = vendors.find(v => v.id === entry.vendorId)?.name || '';
      const search = historySearch.toLowerCase();
      
      const entryDate = new Date(entry.date).toLocaleDateString();
      const qtyStr = entry.quantity.toString();
      
      return (
        entry.note?.toLowerCase().includes(search) ||
        entry.type.toLowerCase().includes(search) ||
        projectName.toLowerCase().includes(search) ||
        vendorName.toLowerCase().includes(search) ||
        entryDate.includes(search) ||
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
  }, [historyMaterial, historySearch, historySort, projects, vendors]);

  // Enhanced logic to categorize and label materials for the Usage dropdown
  // Itemizes by Material + Vendor for the specific project chosen
  const organizedUsageMaterials = useMemo(() => {
    if (!usageData.projectId) return { siteSpecific: [], others: [] };

    const siteSpecific: { mat: Material; vendorName: string; key: string }[] = [];
    const others: Material[] = [];

    materials.forEach(m => {
      const projectPurchases = m.history?.filter(h => h.type === 'Purchase' && h.projectId === usageData.projectId) || [];
      
      if (projectPurchases.length > 0) {
        // Group by vendor for the line-wise site relevance
        const uniqueVendorIds = Array.from(new Set(projectPurchases.map(p => p.vendorId)));
        uniqueVendorIds.forEach(vid => {
          const vendor = vendors.find(v => v.id === vid);
          siteSpecific.push({ 
            mat: m, 
            vendorName: vendor?.name || 'Manual/Direct Entry',
            key: `${m.id}-${vid || 'manual'}`
          });
        });
      } else {
        // If material exists in registry but never purchased for this site
        others.push(m);
      }
    });

    return { siteSpecific, others };
  }, [materials, vendors, usageData.projectId]);

  const handleOpenUsageModal = (matId?: string) => {
    setUsageData({
      materialId: matId || '',
      projectId: projects[0]?.id || '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowUsageModal(true);
  };

  const handleOpenEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setEditFormData({
      name: mat.name,
      unit: mat.unit,
      costPerUnit: mat.costPerUnit.toString()
    });
    setShowEditModal(true);
  };

  const handleProcureStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const unitPrice = parseFloat(procureData.costPerUnit) || 0;
    const cost = unitPrice * qty;

    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      addMaterial({
        id: newId,
        name: procureData.newName,
        unit: procureData.unit,
        costPerUnit: unitPrice,
        totalPurchased: qty,
        totalUsed: 0,
        history: [{
          id: 'sh' + Date.now(),
          date: procureData.date,
          type: 'Purchase',
          quantity: qty,
          vendorId: procureData.vendorId,
          projectId: procureData.projectId,
          note: `Initial Procurement`,
          unitPrice: unitPrice
        }]
      });
    } else {
      const existing = materials.find(m => m.id === procureData.materialId);
      if (existing) {
        updateMaterial({
          ...existing,
          totalPurchased: existing.totalPurchased + qty,
          history: [...(existing.history || []), {
            id: 'sh' + Date.now(),
            date: procureData.date,
            type: 'Purchase',
            quantity: qty,
            vendorId: procureData.vendorId,
            projectId: procureData.projectId,
            note: `Restock Procurement`,
            unitPrice: unitPrice
          }]
        });
      }
    }

    if (procureData.vendorId) {
      const vendor = vendors.find(v => v.id === procureData.vendorId);
      if (vendor) {
        updateVendor({
          ...vendor,
          balance: vendor.balance + cost
        });
      }
    }

    setShowProcureModal(false);
    setProcureData({
      materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects[0]?.id || '', quantity: '', unit: stockingUnits[0] || 'Bag', costPerUnit: '', date: new Date().toISOString().split('T')[0]
    });
  };

  const handleRecordUsage = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(usageData.quantity) || 0;
    const target = materials.find(m => m.id === usageData.materialId);

    if (target && (target.totalPurchased - target.totalUsed >= qty)) {
      updateMaterial({
        ...target,
        totalUsed: target.totalUsed + qty,
        history: [...(target.history || []), {
          id: 'sh' + Date.now(),
          date: usageData.date,
          type: 'Usage',
          quantity: qty,
          projectId: usageData.projectId,
          note: usageData.notes || 'Site Consumption',
          unitPrice: target.costPerUnit
        }]
      });

      const consumptionValue = qty * target.costPerUnit;
      addExpense({
        id: 'e-usage-' + Date.now(),
        date: usageData.date,
        projectId: usageData.projectId,
        amount: consumptionValue,
        paymentMethod: 'Bank',
        category: 'Material',
        materialId: target.id,
        notes: `Usage Recorded: ${qty} ${target.unit} of ${target.name}. ${usageData.notes ? `(${usageData.notes})` : ''}`
      });

      setShowUsageModal(false);
      setHistoryMaterial(null);
    } else {
      alert("Error: Insufficient stock available.");
    }
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (confirm(`Permanent Action: Are you sure you want to delete ${name} from inventory? All linked stock logs will be removed.`)) {
      deleteMaterial(id);
    }
  };

  const handleDeleteHistoryEntry = (material: Material, entryId: string) => {
    if (!confirm("Recalculate Stock: Delete this log entry? Total inventory levels will be adjusted automatically.")) return;
    const entry = material.history?.find(h => h.id === entryId);
    const newHistory = material.history?.filter(h => h.id !== entryId) || [];
    const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
    const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);
    
    if (entry && entry.type === 'Purchase' && entry.vendorId) {
      const vendor = vendors.find(v => v.id === entry.vendorId);
      if (vendor) {
        const cost = entry.quantity * (entry.unitPrice || material.costPerUnit);
        updateVendor({ ...vendor, balance: Math.max(0, vendor.balance - cost) });
      }
    }

    const updatedMat = { ...material, totalPurchased, totalUsed, history: newHistory };
    updateMaterial(updatedMat);
    setHistoryMaterial(updatedMat);
  };

  const handleEditHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryEntry) return;

    const { material, entry: oldEntry } = editingHistoryEntry;
    const newQty = parseFloat(historyEditFormData.quantity) || 0;
    const newPrice = parseFloat(historyEditFormData.unitPrice) || 0;
    
    if (oldEntry.type === 'Purchase') {
      if (oldEntry.vendorId) {
        const oldVendor = vendors.find(v => v.id === oldEntry.vendorId);
        if (oldVendor) {
          const oldCost = oldEntry.quantity * (oldEntry.unitPrice || material.costPerUnit);
          updateVendor({ ...oldVendor, balance: Math.max(0, oldVendor.balance - oldCost) });
        }
      }
      
      const newVendorId = historyEditFormData.vendorId;
      if (newVendorId) {
        const newVendor = vendors.find(v => v.id === newVendorId);
        if (newVendor) {
          const newCost = newQty * newPrice;
          updateVendor({ ...newVendor, balance: newVendor.balance + newCost });
        }
      }
    }

    const newHistory = material.history?.map(h => {
      if (h.id === oldEntry.id) {
        return {
          ...h,
          quantity: newQty,
          unitPrice: newPrice,
          projectId: historyEditFormData.projectId || undefined,
          vendorId: historyEditFormData.vendorId || undefined,
          date: historyEditFormData.date,
          note: historyEditFormData.note
        };
      }
      return h;
    }) || [];

    const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
    const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);

    const updatedMat = { ...material, totalPurchased, totalUsed, history: newHistory };
    updateMaterial(updatedMat);
    setHistoryMaterial(updatedMat);
    setShowEditHistoryModal(false);
    setEditingHistoryEntry(null);
  };

  const handleEditMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    updateMaterial({
      ...editingMaterial,
      name: editFormData.name,
      unit: editFormData.unit,
      costPerUnit: parseFloat(editFormData.costPerUnit) || 0
    });
    setShowEditModal(false);
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
        <div className="flex gap-2">
          <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               className="pl-10 pr-8 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
               value={inventorySort}
               onChange={(e) => setInventorySort(e.target.value as InventorySortOption)}
             >
                <option value="name">Sort: A-Z</option>
                <option value="stock-low">Sort: Stock Low</option>
                <option value="stock-high">Sort: Stock High</option>
                <option value="cost">Sort: High Cost</option>
             </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Material Asset</th>
                <th className="px-8 py-5">Actual Cost</th>
                <th className="px-8 py-5">Status / Level</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMaterials.map((mat) => {
                const remaining = mat.totalPurchased - mat.totalUsed;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">{mat.name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">{mat.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Unit: {mat.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-black text-slate-600 dark:text-slate-400">
                      {formatCurrency(remaining * mat.costPerUnit)}
                    </td>
                    <td className="px-8 py-5">
                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${remaining < 100 ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:border-red-900/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                         {remaining.toLocaleString()} {mat.unit}s Available
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2 items-center">
                         <button onClick={() => handleOpenUsageModal(mat.id)} className="p-3 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Quick Usage"><TrendingDown size={18} /></button>
                         <button onClick={() => { setHistoryMaterial(mat); setHistorySearch(''); setHistorySort('date-desc'); }} className="p-3 text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all shadow-sm" title="View Logs"><History size={18} /></button>
                         <button onClick={() => handleOpenEditModal(mat)} className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                         <button onClick={() => handleDeleteAsset(mat.id, mat.name)} className="p-3 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-14 h-14 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl">{historyMaterial.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Stock Activity History</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{historyMaterial.name} Ledger • Current Stock: {(historyMaterial.totalPurchased - historyMaterial.totalUsed).toLocaleString()} {historyMaterial.unit}s</p>
                 </div>
               </div>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={36} /></button>
            </div>

            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center shrink-0">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search logs by Date, Qty, Site, Vendor or Notes..." 
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                     <ArrowUpNarrowWide className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <select 
                       className="pl-9 pr-8 py-3 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white shadow-sm"
                       value={historySort}
                       onChange={(e) => setHistorySort(e.target.value as HistorySortOption)}
                     >
                        <option value="date-desc">Newest Entry First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="qty-high">Quantity: High-Low</option>
                        <option value="qty-low">Quantity: Low-High</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
               <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[850px]">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                        <tr>
                          <th className="px-8 py-5">Value Date</th>
                          <th className="px-8 py-5">Activity Details</th>
                          <th className="px-8 py-5">Quantity Change</th>
                          <th className="px-8 py-5 text-right">Unit Price</th>
                          <th className="px-8 py-5 text-right">Total Value</th>
                          <th className="px-8 py-5">Site Allocation / Supplier</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredHistory.length > 0 ? (
                          filteredHistory.map((entry) => {
                            const project = projects.find(p => p.id === entry.projectId);
                            const vendor = vendors.find(v => v.id === entry.vendorId);
                            
                            return (
                              <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-2">
                                    {entry.type === 'Purchase' ? (
                                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                        <ShoppingCart size={12} />
                                      </div>
                                    ) : (
                                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                        <TrendingDown size={12} />
                                      </div>
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${entry.type === 'Purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>{entry.type}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-1">{entry.note}</p>
                                </td>
                                <td className="px-8 py-5">
                                  <span className={`text-sm font-black ${entry.type === 'Purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {entry.type === 'Purchase' ? '+' : '-'}{entry.quantity.toLocaleString()} {historyMaterial.unit}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    {formatCurrency(entry.unitPrice || historyMaterial.costPerUnit)}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <span className={`text-xs font-black ${entry.type === 'Purchase' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {formatCurrency(entry.quantity * (entry.unitPrice || historyMaterial.costPerUnit))}
                                  </span>
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex flex-col gap-1">
                                    {project && (
                                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        <Briefcase size={12} className="text-blue-500" />
                                        {project.name}
                                      </div>
                                    )}
                                    {vendor && (
                                      <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
                                        <Users size={12} className="text-emerald-500" />
                                        {vendor.name}
                                      </div>
                                    )}
                                    {!project && !vendor && <span className="text-[10px] text-slate-400 italic">Manual Log Entry</span>}
                                  </div>
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
                                      className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteHistoryEntry(historyMaterial, entry.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-8 py-20 text-center">
                              <History size={32} className="mx-auto text-slate-200 mb-2 opacity-30" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No logs match your filter</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Entry Modal */}
      {showEditHistoryModal && editingHistoryEntry && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl">
                    <Pencil size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Modify Stock Log</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Adjusting: {editingHistoryEntry.entry.type} Entry</p>
                  </div>
                </div>
                <button onClick={() => setShowEditHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
             </div>
             <form onSubmit={handleEditHistorySubmit} className="p-8 space-y-5 pb-safe overflow-y-auto no-scrollbar max-h-[75vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Log Date</label>
                    <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.date} onChange={e => setHistoryEditFormData(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity ({editingHistoryEntry.material.unit})</label>
                    <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.quantity} onChange={e => setHistoryEditFormData(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate Per Unit (Rs.)</label>
                  <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.unitPrice} onChange={e => setHistoryEditFormData(p => ({ ...p, unitPrice: e.target.value }))} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Site Allocation</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={historyEditFormData.projectId} onChange={e => setHistoryEditFormData(p => ({ ...p, projectId: e.target.value }))}>
                       <option value="">Direct / Global Store</option>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {editingHistoryEntry.entry.type === 'Purchase' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supplier / Source</label>
                      <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={historyEditFormData.vendorId} onChange={e => setHistoryEditFormData(p => ({ ...p, vendorId: e.target.value }))}>
                         <option value="">Manual Entry</option>
                         {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Log Entry Notes</label>
                  <textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={historyEditFormData.note} onChange={e => setHistoryEditFormData(p => ({ ...p, note: e.target.value }))} />
                </div>

                <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
                   <div>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">New Calculated Value</p>
                      <p className="text-xl font-black text-emerald-500">
                        {formatCurrency((parseFloat(historyEditFormData.quantity) || 0) * (parseFloat(historyEditFormData.unitPrice) || 0))}
                      </p>
                   </div>
                   <CheckCircle2 size={24} className="text-emerald-500 opacity-50" />
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                  <Save size={20} /> Update Activity Log
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Procurement Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-900 dark:bg-slate-900 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
                    <ShoppingCart size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Procure Stock</h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Bulk Material Arrival Registry</p>
                 </div>
               </div>
               <button onClick={() => setShowProcureModal(false)} className="p-2 text-white/50 hover:text-white transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleProcureStock} className="p-8 space-y-5 overflow-y-auto no-scrollbar pb-safe">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Material Asset Registry</label>
                  <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))} required>
                    <option value="">Choose item to restock...</option>
                    <option value="new">+ Register New Asset Type</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>

               {procureData.materialId === 'new' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Asset Name</label>
                      <input type="text" placeholder="e.g. Graded Fine Sand" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stocking Unit</label>
                      <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value }))}>
                         {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supplied By</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white appearance-none" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required>
                       <option value="" disabled>Select Vendor...</option>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Delivery Destination</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white appearance-none" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name} Site</option>)}
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Arrival Qty</label>
                    <input type="number" required placeholder="0.00" className="px-5 py-4 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cost / Unit (Rs.)</label>
                    <input type="number" required placeholder="0.00" className="px-5 py-4 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Procurement Date</label>
                  <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.date} onChange={e => setProcureData(p => ({ ...p, date: e.target.value }))} />
               </div>

               <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-emerald-100 dark:shadow-none active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                 <ShoppingCart size={20} /> Register Batch Arrival
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Record Site Consumption</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Deducting from Master Stock</p>
                  </div>
                </div>
                <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
             </div>
             <form onSubmit={handleRecordUsage} className="p-8 space-y-5 pb-safe overflow-y-auto no-scrollbar max-h-[70vh]">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">1. Project Assignment</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500" 
                    value={usageData.projectId} 
                    onChange={e => setUsageData(p => ({ ...p, projectId: e.target.value, materialId: '' }))} 
                    required
                  >
                     <option value="" disabled>Choose site...</option>
                     {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">2. Material Asset Selection (Line Wise Relevance)</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none focus:ring-2 focus:ring-blue-500" 
                    value={usageData.materialId} 
                    onChange={e => setUsageData(p => ({ ...p, materialId: e.target.value }))} 
                    required
                    disabled={!usageData.projectId}
                  >
                    <option value="">Choose item to deduct...</option>
                    
                    {/* Site Specific Line-Wise Section */}
                    {organizedUsageMaterials.siteSpecific.length > 0 && (
                      <optgroup label="--- Inventory for this Project Site ---">
                        {organizedUsageMaterials.siteSpecific.map(({ mat, vendorName, key }) => (
                          <option key={key} value={mat.id}>
                            {mat.name} - (Supplier: {vendorName}) • { (mat.totalPurchased - mat.totalUsed).toLocaleString() } {mat.unit} Available in Pool
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* Other Inventory Section */}
                    {organizedUsageMaterials.others.length > 0 && (
                      <optgroup label="--- All Other Available Project Stocks ---">
                        {organizedUsageMaterials.others.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} • { (m.totalPurchased - m.totalUsed).toLocaleString() } {m.unit} In-Stock Global
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  
                  {usageData.projectId && organizedUsageMaterials.siteSpecific.length === 0 && (
                    <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase flex items-center gap-1">
                      <AlertCircle size={10} /> Note: No materials have been specifically purchased for this project yet.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity to Use</label>
                      <input type="number" required step="0.01" placeholder="0.00" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Consumption Date</label>
                      <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={usageData.date} onChange={e => setUsageData(p => ({ ...p, date: e.target.value }))} />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Consumption Note / Task</label>
                   <textarea rows={2} placeholder="e.g. Ground Floor Masonry..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={usageData.notes} onChange={e => setUsageData(p => ({ ...p, notes: e.target.value }))} />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                  <CheckCircle2 size={24} /> Confirm Consumption
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl">
                    <Pencil size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Update Asset Info</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Editing: {editingMaterial.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
             </div>
             <form onSubmit={handleEditMaterialSubmit} className="p-8 space-y-6 pb-safe">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Asset Display Name</label>
                   <input type="text" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unit</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.unit} onChange={e => setEditFormData(p => ({ ...p, unit: e.target.value }))}>
                      {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Base Cost / Unit</label>
                    <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none px-5 py-4" value={editFormData.costPerUnit} onChange={e => setEditFormData(p => ({ ...p, costPerUnit: e.target.value }))} required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                  <Save size={20} /> Update Registry
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
