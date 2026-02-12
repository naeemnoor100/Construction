
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
  Plus
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry } from '../types';

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
      notes: `Purchase of ${qty} ${procureData.unit} material`
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
      setShowUsageModal(false);
    } else {
      alert("Error: Insufficient stock available for this consumption amount.");
    }
  };

  const handleDeleteHistoryEntry = (material: Material, entryId: string) => {
    if (!confirm("Delete this log entry? Total inventory levels will be recalculated automatically.")) return;
    
    const newHistory = material.history?.filter(h => h.id !== entryId) || [];
    const totalPurchased = newHistory.filter(h => h.type === 'Purchase').reduce((sum, h) => sum + h.quantity, 0);
    const totalUsed = newHistory.filter(h => h.type === 'Usage').reduce((sum, h) => sum + h.quantity, 0);

    const updatedMat = {
      ...material,
      totalPurchased,
      totalUsed,
      history: newHistory
    };
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

    const updatedMat = {
      ...material,
      totalPurchased,
      totalUsed,
      history: newHistory
    };
    updateMaterial(updatedMat);
    setHistoryMaterial(updatedMat);
    setShowEditHistoryModal(false);
    setEditingHistoryEntry(null);
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
    setEditingMaterial(null);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setEditFormData({
      name: mat.name,
      unit: mat.unit,
      costPerUnit: mat.costPerUnit.toString()
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Project Inventory</h2>
          <p className="text-slate-500 text-sm">Monitor master stock allocation and audit usage logs.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setShowProcureModal(true)} className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all"><Plus size={18} /> Procure</button>
          <button onClick={() => setShowUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><TrendingDown size={18} /> Record Usage</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by material name..." className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
           <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
             <option value="All">All Sites</option>
             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
           <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
             <option value="All">All Vendors</option>
             {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Inventory Asset</th>
                <th className="px-6 py-4">Unit Cost</th>
                <th className="px-6 py-4">Total Stock</th>
                <th className="px-6 py-4">Utilization</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => {
                const remaining = mat.totalPurchased - mat.totalUsed;
                const utilizationPct = Math.round((mat.totalUsed / mat.totalPurchased) * 100) || 0;
                
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm">{mat.name.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{mat.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{mat.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{formatCurrency(mat.costPerUnit)}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${remaining < 100 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         {remaining.toLocaleString()} {mat.unit} left
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 max-w-[120px]">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500 rounded-full" style={{width: `${utilizationPct}%`}}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{utilizationPct}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1">
                         <button onClick={() => setHistoryMaterial(mat)} className="p-2 text-slate-400 hover:text-blue-600" title="View Logs"><History size={16} /></button>
                         <button onClick={() => openEditModal(mat)} className="p-2 text-slate-400 hover:text-emerald-600" title="Edit Item"><Pencil size={16} /></button>
                         <button onClick={() => confirm(`Delete ${mat.name}? All history will be lost.`) && deleteMaterial(mat.id)} className="p-2 text-slate-400 hover:text-red-600" title="Delete Asset"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-100">{historyMaterial.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">{historyMaterial.name} Audit Logs</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History of all procurements and site usages</p>
                 </div>
               </div>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 no-scrollbar">
               <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4">Transaction Date</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Site / Source</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {historyMaterial.history?.slice().reverse().map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group/row">
                          <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${h.type === 'Purchase' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{h.type}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-800">{h.quantity.toLocaleString()} {historyMaterial.unit}</td>
                          <td className="px-6 py-4">
                             <p className="text-xs font-semibold text-slate-700">{projects.find(p => p.id === h.projectId)?.name || 'General Inventory'}</p>
                             <p className="text-[10px] text-slate-400 font-medium">{h.note}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                               <button onClick={() => openEditHistoryModal(historyMaterial, h)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                               <button onClick={() => handleDeleteHistoryEntry(historyMaterial, h.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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

      {/* Edit History Entry Modal */}
      {showEditHistoryModal && editingHistoryEntry && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
               <h2 className="text-xl font-bold text-slate-900">Modify Log Entry</h2>
               <button onClick={() => { setShowEditHistoryModal(false); setEditingHistoryEntry(null); }}><X size={24} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateHistoryEntry} className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                    <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={editHistoryData.quantity} onChange={e => setEditHistoryData(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                    <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={editHistoryData.date} onChange={e => setEditHistoryData(p => ({ ...p, date: e.target.value }))} />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Associated Project</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={editHistoryData.projectId} onChange={e => setEditHistoryData(p => ({ ...p, projectId: e.target.value }))}>
                     <option value="">General / Central Store</option>
                     {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Audit Note</label>
                  <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={editHistoryData.note} onChange={e => setEditHistoryData(p => ({ ...p, note: e.target.value }))} rows={2} />
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 mt-4">Save Entry</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
               <h2 className="text-xl font-bold text-slate-900">Edit Asset Catalog</h2>
               <button onClick={() => { setShowEditModal(false); setEditingMaterial(null); }} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditMaterial} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Name</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Unit</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={editFormData.unit} onChange={e => setEditFormData(p => ({ ...p, unit: e.target.value as MaterialUnit }))}>
                    <option value="Bag">Bag</option><option value="Ton">Ton</option><option value="KG">KG</option><option value="Piece">Piece</option><option value="Cubic Meter">Cubic Meter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Unit Price (Rs.)</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={editFormData.costPerUnit} onChange={e => setEditFormData(p => ({ ...p, costPerUnit: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 mt-4">Save Asset Update</button>
            </form>
          </div>
        </div>
      )}

      {/* Procurement Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-bold text-slate-900">Procure Stock Batch</h2>
               <button onClick={() => setShowProcureModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleProcureStock} className="p-6 space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Asset Category</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))} required>
                    <option value="">Choose item...</option>
                    <option value="new">+ Register New Asset Type</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
               {procureData.materialId === 'new' && (
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="Material Name" className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-bold" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} required />
                   <select className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-bold" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value as MaterialUnit }))}>
                     <option value="Bag">Bag</option><option value="Ton">Ton</option><option value="KG">KG</option><option value="Piece">Piece</option><option value="Cubic Meter">Cubic Meter</option>
                   </select>
                 </div>
               )}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Source Vendor</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Site</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Qty" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} required />
                  <input type="number" placeholder="Cost/Unit" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} required />
               </div>
               <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 mt-4">Confirm Procurement</button>
            </form>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
                <h2 className="text-xl font-bold text-slate-900">Record Site Consumption</h2>
                <button onClick={() => setShowUsageModal(false)}><X size={24} className="text-slate-400" /></button>
             </div>
             <form onSubmit={handleRecordUsage} className="p-6 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material to Deduct</label>
                   <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={usageData.materialId} onChange={e => setUsageData(p => ({ ...p, materialId: e.target.value }))} required>
                     <option value="">Select Category</option>
                     {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.totalPurchased - m.totalUsed} in stock)</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity Used</label>
                      <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Destination Site</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={usageData.projectId} onChange={e => setUsageData(p => ({ ...p, projectId: e.target.value }))} required>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Audit Log Note</label>
                   <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="e.g. 2nd floor column casting" value={usageData.notes} onChange={e => setUsageData(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 mt-4">Confirm Usage</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
