
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
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Expense } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const Inventory: React.FC = () => {
  const { materials, projects, vendors, updateMaterial, addMaterial, deleteMaterial, addExpense, deleteExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // States for editing history entries
  const [editingHistoryEntry, setEditingHistoryEntry] = useState<{material: Material, entry: StockHistoryEntry} | null>(null);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);

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
    materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects[0]?.id || '', quantity: '', unit: 'Bag' as MaterialUnit, costPerUnit: '', date: new Date().toISOString().split('T')[0]
  });

  const [usageData, setUsageData] = useState({
    materialId: '', projectId: projects[0]?.id || '', quantity: '', date: new Date().toISOString().split('T')[0], notes: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '', unit: 'Bag' as MaterialUnit, costPerUnit: ''
  });

  const [editHistoryData, setEditHistoryData] = useState({
    quantity: '', date: '', note: '', projectId: '', vendorId: ''
  });

  const filteredMaterials = useMemo(() => {
    return materials.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'All' || mat.history?.some(h => h.projectId === projectFilter);
      const matchesVendor = vendorFilter === 'All' || mat.history?.some(h => h.vendorId === vendorFilter);
      return matchesSearch && matchesProject && matchesVendor;
    });
  }, [materials, searchTerm, projectFilter, vendorFilter]);

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

  const handleProcureStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const cost = (parseFloat(procureData.costPerUnit) || 0) * qty;

    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      addMaterial({
        id: newId,
        name: procureData.newName,
        unit: procureData.unit,
        costPerUnit: parseFloat(procureData.costPerUnit) || 0,
        totalPurchased: qty,
        totalUsed: 0,
        history: [{
          id: 'sh' + Date.now(),
          date: procureData.date,
          type: 'Purchase',
          quantity: qty,
          vendorId: procureData.vendorId,
          projectId: procureData.projectId,
          note: `Initial Procurement`
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
            note: `Restock Procurement`
          }]
        });
      }
    }

    addExpense({
      id: 'e' + Date.now(),
      date: procureData.date,
      projectId: procureData.projectId,
      vendorId: procureData.vendorId,
      amount: cost,
      paymentMethod: 'Bank',
      category: 'Material',
      notes: `Purchase: ${qty} ${procureData.unit} of ${procureData.materialId === 'new' ? procureData.newName : materials.find(m => m.id === procureData.materialId)?.name}`
    });

    setShowProcureModal(false);
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
          note: usageData.notes || 'Site Consumption'
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

  const handleDeleteHistoryEntry = (material: Material, entryId: string) => {
    if (!confirm("Delete this log entry? Total inventory levels will be recalculated automatically.")) return;
    const newHistory = material.history?.filter(h => h.id !== entryId) || [];
    const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
    const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);
    const updatedMat = { ...material, totalPurchased, totalUsed, history: newHistory };
    updateMaterial(updatedMat);
    setHistoryMaterial(updatedMat);
  };

  const openEditHistoryModal = (material: Material, entry: StockHistoryEntry) => {
    setEditingHistoryEntry({ material, entry });
    setEditHistoryData({
      quantity: entry.quantity.toString(),
      date: entry.date,
      note: entry.note || '',
      projectId: entry.projectId || '',
      vendorId: entry.vendorId || ''
    });
    setShowEditHistoryModal(true);
  };

  const handleUpdateHistoryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryEntry) return;
    const { material, entry } = editingHistoryEntry;
    const newHistory = material.history?.map(h => h.id === entry.id ? {
      ...h,
      quantity: parseFloat(editHistoryData.quantity) || 0,
      date: editHistoryData.date,
      note: editHistoryData.note,
      projectId: editHistoryData.projectId || undefined,
      vendorId: editHistoryData.vendorId || undefined
    } : h) || [];
    const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
    const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);
    const updatedMat = { ...material, totalPurchased, totalUsed, history: newHistory };
    updateMaterial(updatedMat);
    setHistoryMaterial(updatedMat);
    setShowEditHistoryModal(false);
  };

  const handleEditMaterial = (e: React.FormEvent) => {
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage master assets.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <button onClick={() => setShowProcureModal(true)} className="bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={18} /> Procure</button>
          <button onClick={() => handleOpenUsageModal()} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"><TrendingDown size={18} /> Use Stock</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search materials..." className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
           <select className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-bold uppercase dark:text-slate-300" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
             <option value="All">All Sites</option>
             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMaterials.map((mat) => {
                const remaining = mat.totalPurchased - mat.totalUsed;
                const utilizationPct = Math.round((mat.totalUsed / mat.totalPurchased) * 100) || 0;
                
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center font-bold text-xs uppercase">{mat.name.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{mat.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{mat.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{formatCurrency(mat.costPerUnit)}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${remaining < 100 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20'}`}>
                         {remaining.toLocaleString()} Left
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1 items-center">
                         <button onClick={() => handleOpenUsageModal(mat.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><TrendingDown size={18} /></button>
                         <button onClick={() => setHistoryMaterial(mat)} className="p-2.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl"><History size={18} /></button>
                         <button onClick={() => confirm(`Delete ${mat.name}?`) && deleteMaterial(mat.id)} className="p-2.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 size={18} /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Procure Stock</h2>
               <button onClick={() => setShowProcureModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
            </div>
            <form onSubmit={handleProcureStock} className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-safe">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Asset</label>
                  <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))} required>
                    <option value="">Choose item...</option>
                    <option value="new">+ Register New Asset Type</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Vendor</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Site</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Quantity" className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} required />
                  <input type="number" placeholder="Cost/Unit" className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} required />
               </div>
               <button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-3xl font-bold shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                 <ShoppingCart size={18} /> Confirm Batch Arrival
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Usage Modal as Mobile Sheet */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Use Stock</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Authorize site consumption</p>
                  </div>
                </div>
                <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
             </div>
             <form onSubmit={handleRecordUsage} className="p-6 space-y-5 pb-safe">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material to Deduct</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" 
                    value={usageData.materialId} 
                    onChange={e => setUsageData(p => ({ ...p, materialId: e.target.value }))} 
                    required
                  >
                    <option value="">Select Asset...</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.totalPurchased - m.totalUsed} left)</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Qty</label>
                      <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Destination Site</label>
                      <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white appearance-none" value={usageData.projectId} onChange={e => setUsageData(p => ({ ...p, projectId: e.target.value }))} required>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                   </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Confirm Consumption
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
