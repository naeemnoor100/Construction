
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
  BarChart4
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Expense, Project, Vendor } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

type InventorySortOption = 'name' | 'stock-low' | 'stock-high' | 'cost';
type HistorySortOption = 'date-desc' | 'date-asc' | 'qty-high' | 'qty-low';
type HistoryTab = 'all' | 'purchases' | 'usage';

export const Inventory: React.FC = () => {
  const { materials, projects, vendors, stockingUnits, updateMaterial, addMaterial, deleteMaterial, addExpense, deleteExpense, updateVendor } = useApp();
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

  const filteredHistory = useMemo(() => {
    if (!historyMaterial || !historyMaterial.history) return [];
    
    let result = historyMaterial.history.filter(entry => {
      // Tab filtering
      if (activeHistoryTab === 'purchases' && entry.type !== 'Purchase') return false;
      if (activeHistoryTab === 'usage' && entry.type !== 'Usage') return false;

      const projectName = projects.find(p => p.id === entry.projectId)?.name || '';
      const vendorName = vendors.find(v => v.id === entry.vendorId)?.name || '';
      const search = historySearch.toLowerCase();
      
      const entryDate = entry.date; // YYYY-MM-DD
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

  const usageStats = useMemo(() => {
    if (!historyMaterial || !historyMaterial.history) return { totalUsed: 0, distinctProjects: 0 };
    const usages = historyMaterial.history.filter(h => h.type === 'Usage');
    const total = usages.reduce((sum, h) => sum + h.quantity, 0);
    const projIds = new Set(usages.map(u => u.projectId).filter(Boolean));
    return { totalUsed: total, distinctProjects: projIds.size };
  }, [historyMaterial]);

  const relevantMaterialsForSite = useMemo(() => {
    if (!usageData.projectId) return [];

    const siteInventory: { 
      id: string, 
      name: string, 
      unit: string, 
      siteBalance: number, 
      vendorNames: string[] 
    }[] = [];

    materials.forEach(m => {
      const sitePurchases = m.history?.filter(h => h.type === 'Purchase' && h.projectId === usageData.projectId) || [];
      const siteUsages = m.history?.filter(h => h.type === 'Usage' && h.projectId === usageData.projectId) || [];
      
      const totalSitePurchased = sitePurchases.reduce((sum, h) => sum + h.quantity, 0);
      const totalSiteUsed = siteUsages.reduce((sum, h) => sum + h.quantity, 0);
      const siteBalance = totalSitePurchased - totalSiteUsed;

      if (siteBalance > 0) {
        const vendorIds = Array.from(new Set(sitePurchases.map(h => h.vendorId).filter(Boolean)));
        const vendorNames = vendorIds.map(vid => vendors.find(v => v.id === vid)?.name || 'Unknown Vendor');
        
        siteInventory.push({
          id: m.id,
          name: m.name,
          unit: m.unit,
          siteBalance,
          vendorNames
        });
      }
    });

    return siteInventory;
  }, [materials, usageData.projectId, vendors]);

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

    if (target) {
      const siteRelevant = relevantMaterialsForSite.find(r => r.id === target.id);
      if (!siteRelevant || siteRelevant.siteBalance < qty) {
        alert(`Error: Insufficient stock available at this site. (Available: ${siteRelevant?.siteBalance || 0} ${target.unit})`);
        return;
      }

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
      alert("Error: Material not found.");
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
        <div className="flex flex-wrap gap-2">
          <div className="relative">
             <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               className="pl-10 pr-8 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none dark:text-white"
               value={projectFilter}
               onChange={(e) => setProjectFilter(e.target.value)}
             >
                <option value="All">Site Filter: All</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
          </div>
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
                <th className="px-8 py-5">Value {projectFilter !== 'All' ? '(At Site)' : '(Total)'}</th>
                <th className="px-8 py-5">Status / Level</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMaterials.map((mat) => {
                const remaining = mat.siteBalance;
                const isProjectFiltered = projectFilter !== 'All';
                
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
                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${remaining < 10 ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:border-red-900/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                         {remaining.toLocaleString()} {mat.unit}s {isProjectFiltered ? 'at Site' : 'Global'}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2 items-center">
                         <button 
                           onClick={() => handleOpenUsageModal(mat.id, isProjectFiltered ? projectFilter : undefined)} 
                           className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2 ${isProjectFiltered ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white'}`}
                           title="Quick Usage"
                         >
                           <TrendingDown size={14} /> {isProjectFiltered ? 'Use on Site' : 'Quick Usage'}
                         </button>
                         <button 
                          onClick={() => { setHistoryMaterial(mat); setHistorySearch(''); setHistorySort('date-desc'); setActiveHistoryTab('all'); }} 
                          className="p-3 text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all shadow-sm" 
                          title="View Logs"
                         >
                           <History size={18} />
                         </button>
                         <button onClick={() => handleOpenEditModal(mat)} className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                         <button onClick={() => handleDeleteAsset(mat.id, mat.name)} className="p-3 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Package size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4 opacity-30" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No materials match the filter</p>
                  </td>
                </tr>
              )}
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

            <div className="flex bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700 px-8 shrink-0">
               <button 
                onClick={() => setActiveHistoryTab('all')} 
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeHistoryTab === 'all' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                 <ClipboardList size={14} /> Full Log
               </button>
               <button 
                onClick={() => setActiveHistoryTab('purchases')} 
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeHistoryTab === 'purchases' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                 <ShoppingCart size={14} /> Inward (Procurement)
               </button>
               <button 
                onClick={() => setActiveHistoryTab('usage')} 
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeHistoryTab === 'usage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                 <TrendingDown size={14} /> Usage History
               </button>
            </div>

            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center shrink-0">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filter by Date, Qty, Site, Vendor or Notes..." 
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
               {activeHistoryTab === 'usage' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total Consumed</p>
                          <p className="text-2xl font-black">{usageStats.totalUsed.toLocaleString()} {historyMaterial.unit}s</p>
                       </div>
                       <TrendingDown size={32} className="opacity-30" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacted Sites</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{usageStats.distinctProjects} Projects</p>
                       </div>
                       <BarChart4 size={32} className="text-blue-500 opacity-20" />
                    </div>
                 </div>
               )}

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
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No logs found for this filter</p>
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

      {/* Procure Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                 <div className="flex gap-4 items-center">
                   <div className="p-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl shadow-lg">
                      <ShoppingCart size={24} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Stock Procurement</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Record inward material supply</p>
                   </div>
                 </div>
                 <button onClick={() => setShowProcureModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
              </div>
              <form onSubmit={handleProcureStock} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh] pb-safe">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Select Asset / Create New</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none transition-all focus:ring-2 focus:ring-blue-500" 
                    value={procureData.materialId} 
                    onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))}
                    required
                  >
                    <option value="">Choose material...</option>
                    <option value="new">+ Register New Asset Type</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                </div>

                {procureData.materialId === 'new' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Name</label>
                       <input type="text" required className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} placeholder="e.g. 10mm Steel" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Stocking Unit</label>
                       <select className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value }))}>
                          {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Site Destination</label>
                     <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>
                        <option value="">Select Project Site...</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Billing Supplier</label>
                     <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required>
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                      <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white outline-none" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} placeholder="0.00" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Unit Price (Rs.)</label>
                      <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white outline-none" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} placeholder="0.00" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Arrival Date</label>
                      <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.date} onChange={e => setProcureData(p => ({ ...p, date: e.target.value }))} />
                   </div>
                </div>

                {procureData.quantity && procureData.costPerUnit && (
                  <div className="bg-slate-900 p-6 rounded-3xl text-white flex justify-between items-center shadow-2xl animate-in slide-in-from-top-2">
                     <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Total Bill Value</p>
                        <p className="text-2xl font-black text-blue-400">{formatCurrency((parseFloat(procureData.quantity) || 0) * (parseFloat(procureData.costPerUnit) || 0))}</p>
                     </div>
                     <ArrowRight size={24} className="text-white/20" />
                     <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Impact on Balances</p>
                        <p className="text-sm font-bold text-emerald-500 flex items-center justify-end gap-1"><ArrowUpDown size={14} /> Vendor & Stock</p>
                     </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={() => setShowProcureModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest text-slate-500">Discard</button>
                   <button type="submit" className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest">Register Inward Stock</button>
                </div>
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
                       <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Consumption</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Deduct from site inventory</p>
                    </div>
                 </div>
                 <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
              </div>
              <form onSubmit={handleRecordUsage} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh] pb-safe">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Site Allocation</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" 
                      value={usageData.projectId} 
                      onChange={e => setUsageData(p => ({ ...p, projectId: e.target.value, materialId: '' }))}
                      required
                    >
                       <option value="">Select Project Site...</option>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material to Deduct (Site Balance)</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none disabled:opacity-50" 
                      value={usageData.materialId} 
                      onChange={e => setUsageData(p => ({ ...p, materialId: e.target.value }))}
                      disabled={!usageData.projectId}
                      required
                    >
                       <option value="">{usageData.projectId ? 'Choose asset...' : 'Select site first...'}</option>
                       {relevantMaterialsForSite.map(m => (
                         <option key={m.id} value={m.id}>
                           {m.name} (Bal: {m.siteBalance.toLocaleString()} {m.unit})
                         </option>
                       ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Usage Quantity</label>
                       <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white outline-none" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Consumption Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={usageData.date} onChange={e => setUsageData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Usage Note / Area</label>
                    <textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={usageData.notes} onChange={e => setUsageData(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Ground floor slab casting..."></textarea>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowUsageModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest text-slate-500">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest">Authorize Consumption</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit History Modal */}
      {showEditHistoryModal && editingHistoryEntry && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Edit Activity Log</h2>
                 <button onClick={() => setShowEditHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={handleEditHistorySubmit} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh] pb-safe">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                       <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={historyEditFormData.quantity} onChange={e => setHistoryEditFormData(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Unit Price</label>
                       <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={historyEditFormData.unitPrice} onChange={e => setHistoryEditFormData(p => ({ ...p, unitPrice: e.target.value }))} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Site</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={historyEditFormData.projectId} onChange={e => setHistoryEditFormData(p => ({ ...p, projectId: e.target.value }))}>
                          <option value="">No Site</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={historyEditFormData.date} onChange={e => setHistoryEditFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 {editingHistoryEntry.entry.type === 'Purchase' && (
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Supplier</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={historyEditFormData.vendorId} onChange={e => setHistoryEditFormData(p => ({ ...p, vendorId: e.target.value }))}>
                          <option value="">No Vendor</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                       </select>
                    </div>
                 )}
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Note</label>
                    <textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={historyEditFormData.note} onChange={e => setHistoryEditFormData(p => ({ ...p, note: e.target.value }))} />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowEditHistoryModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest text-slate-500">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest">Save Changes</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Edit Master Asset</h2>
                 <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={handleEditMaterialSubmit} className="p-8 space-y-5 pb-safe">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Name</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Stocking Unit</label>
                       <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.unit} onChange={e => setEditFormData(p => ({ ...p, unit: e.target.value }))}>
                          {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Standard Unit Cost (Rs.)</label>
                       <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={editFormData.costPerUnit} onChange={e => setEditFormData(p => ({ ...p, costPerUnit: e.target.value }))} />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest text-slate-500">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest">Update Asset</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
