import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  History, 
  Search, 
  X, 
  TrendingDown, 
  Trash2,
  Pencil,
  Plus,
  Layers,
  ChevronRight,
  Warehouse,
  Truck,
  DollarSign,
  ClipboardList,
  Filter,
  Scale,
  Lock,
  Info,
  Link
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Project, Vendor } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

type InventorySortOption = 'name' | 'stock-low' | 'stock-high' | 'cost';
type HistorySortOption = 'date-desc' | 'date-asc' | 'qty-high' | 'qty-low';
type HistoryTab = 'all' | 'purchases' | 'usage' | 'transfers';

interface BulkRow {
  id: string;
  materialId: string;
  quantity: string;
  unitPrice: string;
  vendorId: string;
  projectId: string;
}

export const Inventory: React.FC = () => {
  const { materials, projects, vendors, stockingUnits, payments, expenses, updateMaterial, addMaterial, deleteMaterial, addExpense, deleteExpense, updateExpense, allowDecimalStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [inventorySort, setInventorySort] = useState<InventorySortOption>('name');
  
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySortOption>('date-desc');
  const [activeHistoryTab, setActiveHistoryTab] = useState<HistoryTab>('all');
  
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [editingHistoryEntry, setEditingHistoryEntry] = useState<{material: Material, entry: StockHistoryEntry} | null>(null);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [historyEditFormData, setHistoryEditFormData] = useState({
    quantity: '', unitPrice: '', projectId: '', vendorId: '', date: '', note: ''
  });

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { id: '1', materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }
  ]);
  const [bulkGlobalVendor, setBulkGlobalVendor] = useState('');
  const [bulkGlobalProject, setBulkGlobalProject] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);

  const [procureData, setProcureData] = useState({
    materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects.find(p => p.isGodown)?.id || projects[0]?.id || '', quantity: '', unit: stockingUnits[0] || 'Bag', costPerUnit: '', date: new Date().toISOString().split('T')[0], note: ''
  });

  const [usageData, setUsageData] = useState({
    materialId: '', batchId: '', projectId: projects.find(p => !p.isGodown)?.id || projects[0]?.id || '', quantity: '', date: new Date().toISOString().split('T')[0], notes: ''
  });

  const [editFormData, setEditFormData] = useState({ name: '', unit: stockingUnits[0] || 'Bag' });

  useEffect(() => {
    if (historyMaterial) {
      const latest = materials.find(m => m.id === historyMaterial.id);
      if (latest) setHistoryMaterial(latest);
      else setHistoryMaterial(null);
    }
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    let result = materials.map(mat => {
      let siteBalance = mat.totalPurchased - mat.totalUsed;
      let stockValue = 0;
      let hasProjectLink = true;

      const history = mat.history || [];
      if (projectFilter === 'All') {
        stockValue = history.reduce((sum, h) => {
          if (h.type === 'Purchase' || h.type === 'Transfer') return sum + (h.quantity * (h.unitPrice || mat.costPerUnit));
          return sum;
        }, 0);
      } else {
        const siteEntries = history.filter(h => h.projectId === projectFilter);
        siteBalance = siteEntries.reduce((sum, h) => sum + h.quantity, 0);
        stockValue = siteEntries.reduce((sum, h) => {
          if (h.type === 'Purchase' || h.type === 'Transfer') return sum + (h.quantity * (h.unitPrice || mat.costPerUnit));
          return sum;
        }, 0);
        hasProjectLink = siteEntries.some(h => h.quantity > 0);
      }
      return { ...mat, siteBalance, stockValue, hasProjectLink };
    });

    result = result.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'All' || mat.hasProjectLink;
      return matchesSearch && matchesProject;
    });

    return result.sort((a, b) => {
      if (inventorySort === 'name') return a.name.localeCompare(b.name);
      if (inventorySort === 'stock-low') return a.siteBalance - b.siteBalance;
      if (inventorySort === 'stock-high') return b.siteBalance - a.siteBalance;
      if (inventorySort === 'cost') return b.costPerUnit - a.costPerUnit;
      return 0;
    });
  }, [materials, searchTerm, projectFilter, inventorySort]);

  const relevantMaterialsForSite = useMemo(() => {
    if (!usageData.projectId) return [];
    const batches: any[] = [];
    materials.forEach(mat => {
      const history = mat.history || [];
      const inwardEntries = history.filter(h => (h.type === 'Purchase' || h.type === 'Transfer') && h.quantity > 0);
      inwardEntries.forEach(inward => {
        const batchId = inward.id.replace('sh-exp-', '');
        const deductionsAgainstThisBatch = history.filter(h => h.parentPurchaseId === batchId && h.quantity < 0);
        const totalDeductedFromBatch = Math.abs(deductionsAgainstThisBatch.reduce((sum, d) => sum + d.quantity, 0));
        const availableInBatch = inward.quantity - totalDeductedFromBatch;
        if (availableInBatch > 0) {
          const vendor = vendors.find(v => v.id === inward.vendorId);
          const vName = vendor?.name || (inward.type === 'Transfer' ? 'Inbound' : 'Supplier');
          batches.push({
            id: mat.id,
            name: mat.name,
            unit: mat.unit,
            batchId: batchId,
            vendorName: vName,
            vendorId: inward.vendorId,
            unitPrice: inward.unitPrice || mat.costPerUnit,
            available: availableInBatch,
            isLocal: inward.projectId === usageData.projectId
          });
        }
      });
    });
    return batches.sort((a, b) => (a.isLocal === b.isLocal ? 0 : a.isLocal ? -1 : 1));
  }, [materials, usageData.projectId, vendors]);

  const handleProcureStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const unitPrice = parseFloat(procureData.costPerUnit) || 0;
    const totalAmount = qty * unitPrice;
    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      await addMaterial({ id: newId, name: procureData.newName, unit: procureData.unit, costPerUnit: unitPrice, totalPurchased: 0, totalUsed: 0, history: [] });
      await addExpense({ id: 'e-pro-' + Date.now(), date: procureData.date, projectId: procureData.projectId, vendorId: procureData.vendorId, amount: totalAmount, paymentMethod: 'Bank', category: 'Material', notes: procureData.note || `Procured ${qty} ${procureData.unit}`, materialId: newId, materialQuantity: qty, inventoryAction: 'Purchase' });
    } else {
      await addExpense({ id: 'e-pro-' + Date.now(), date: procureData.date, projectId: procureData.projectId, vendorId: procureData.vendorId, amount: totalAmount, paymentMethod: 'Bank', category: 'Material', notes: procureData.note || `Restock: ${qty} units`, materialId: procureData.materialId, materialQuantity: qty, inventoryAction: 'Purchase' });
    }
    setShowProcureModal(false);
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(usageData.quantity) || 0;
    const selectedBatch = relevantMaterialsForSite.find(b => b.id === usageData.materialId && b.batchId === usageData.batchId);
    if (!selectedBatch) { alert("Error: Please select a valid material batch."); return; }
    if (selectedBatch.available < qty) { alert(`Error: Insufficient stock. Available: ${selectedBatch.available}`); return; }
    await addExpense({ id: 'e-use-' + Date.now(), date: usageData.date, projectId: usageData.projectId, amount: qty * selectedBatch.unitPrice, paymentMethod: 'Cash', category: 'Material', materialId: selectedBatch.id, vendorId: selectedBatch.vendorId, materialQuantity: -qty, inventoryAction: 'Usage', parentPurchaseId: selectedBatch.batchId, notes: usageData.notes || `Consumed ${qty} units` });
    setShowUsageModal(false);
  };

  // Fix: Added handleOpenEditModal function to set state and open the edit material modal
  const handleOpenEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setEditFormData({ name: mat.name, unit: mat.unit });
    setShowEditModal(true);
  };

  const handleEditMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    updateMaterial({ ...editingMaterial, name: editFormData.name, unit: editFormData.unit as MaterialUnit });
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Inventory Control</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Stock levels across project sites and godowns.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setShowUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><ClipboardList size={18} /> Consume</button>
          <button onClick={() => setShowBulkModal(true)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"><Layers size={18} /> Bulk Inward</button>
          <button onClick={() => setShowProcureModal(true)} className="flex-1 sm:flex-none bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"><Plus size={18} /> Procure</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Filter assets..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl text-sm font-bold outline-none dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest dark:text-white" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Storage Hubs</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => (
          <div key={mat.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 active:scale-[0.98] transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500"><Package size={24} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{mat.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{mat.unit}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${mat.siteBalance < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {mat.siteBalance.toLocaleString()} {mat.unit}s
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-4">
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase">Current Value</p>
                 <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(mat.stockValue)}</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => { setUsageData(p => ({ ...p, materialId: mat.id })); setShowUsageModal(true); }} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><ClipboardList size={18} /></button>
                 <button onClick={() => setHistoryMaterial(mat)} className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"><History size={18} /></button>
                 <button onClick={() => handleOpenEditModal(mat)} className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><Pencil size={18} /></button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Consumption Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/20 flex justify-between items-center shrink-0">
                 <div className="flex gap-4 items-center">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><TrendingDown size={24} /></div>
                    <div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Consumption</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Deduct stock from site or godown pool</p></div>
                 </div>
                 <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={handleRecordUsage} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh] pb-safe">
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Deduction Site / Godown</label>
                 <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={usageData.projectId} onChange={e => setUsageData(p => ({ ...p, projectId: e.target.value, materialId: '', batchId: '' }))} required>
                   {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select></div>
                 
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Select Material Batch</label>
                 <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none appearance-none text-xs" value={`${usageData.materialId}|${usageData.batchId}`} onChange={e => { const [mId, bId] = e.target.value.split('|'); setUsageData(p => ({ ...p, materialId: mId, batchId: bId })); }} required>
                    <option value="|">Choose stock pool...</option>
                    {relevantMaterialsForSite.map((batch, idx) => (<option key={idx} value={`${batch.id}|${batch.batchId}`} className={batch.isLocal ? 'text-emerald-600' : 'text-blue-500'}>{batch.name} / {batch.vendorName} / {formatCurrency(batch.unitPrice)} / {batch.available.toLocaleString()} {batch.unit}</option>))}
                 </select></div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Quantity</label><input type="number" step={allowDecimalStock ? "0.01" : "1"} required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-black dark:text-white outline-none" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} placeholder="0.00" /></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Date</label><input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={usageData.date} onChange={e => setUsageData(p => ({ ...p, date: e.target.value }))} /></div>
                 </div>

                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Note / Remark</label><textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={usageData.notes} onChange={e => setUsageData(p => ({ ...p, notes: e.target.value }))} placeholder="Hub operation details..." /></div>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest">Confirm Site Deduction</button>
              </form>
           </div>
        </div>
      )}

      {/* Procure Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Hub Stock Procure</h2>
                 <button onClick={() => setShowProcureModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={handleProcureStock} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh] pb-safe">
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Material Asset</label>
                <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))} required>
                    <option value="">Choose material...</option>
                    <option value="new">+ Hub New Asset Category</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select></div>
                {procureData.materialId === 'new' && <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95"><input type="text" placeholder="Name" required className="w-full px-5 py-4 bg-white border rounded-2xl font-bold" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} /><select className="w-full px-5 py-4 bg-white border rounded-2xl font-bold" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value }))}>{stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Hub Location</label><select className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Billing Vendor</label><select className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required><option value="">Select Vendor...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Qty</label><input type="number" step={allowDecimalStock ? "0.01" : "1"} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-lg" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase px-1">Rate</label><input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-lg" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} /></div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest">Authorize Reception</button>
              </form>
           </div>
        </div>
      )}

      {/* History Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
               <h2 className="text-2xl font-black uppercase tracking-tighter">Hub Log: {historyMaterial.name}</h2>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={36} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-8 py-5">Date</th><th className="px-8 py-5">Details</th><th className="px-8 py-5">Stock Flux</th><th className="px-8 py-5">Entity</th><th className="px-8 py-5 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyMaterial.history?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-xs font-black uppercase tracking-tight">{entry.type} - {entry.note}</td>
                        <td className="px-8 py-5"><span className={`text-sm font-black ${entry.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{entry.quantity > 0 ? '+' : ''}{entry.quantity.toLocaleString()}</span></td>
                        <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{projects.find(p => p.id === entry.projectId)?.name || 'General Hub'}</td>
                        <td className="px-8 py-5 text-right"><button onClick={() => { if(confirm("Confirm Delete Log Entry?")) deleteExpense(entry.id.replace('sh-exp-', '')); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                 <h2 className="text-xl font-black uppercase tracking-tighter">Edit Asset Class</h2>
                 <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} /></button>
              </div>
              <form onSubmit={handleEditMaterialSubmit} className="p-8 space-y-5">
                 <input type="text" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold" value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} />
                 <select className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none appearance-none" value={editFormData.unit} onChange={e => setEditFormData(p => ({ ...p, unit: e.target.value }))}>
                    {stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}
                 </select>
                 <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest">Update Ledger Item</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
