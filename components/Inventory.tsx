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
  TrendingUp,
  DollarSign,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Project, Vendor } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

type InventorySortOption = 'name' | 'stock-low' | 'stock-high' | 'cost';
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
  const { materials, projects, vendors, stockingUnits, addMaterial, updateMaterial, deleteMaterial, addExpense, deleteExpense, updateExpense, allowDecimalStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [inventorySort, setInventorySort] = useState<InventorySortOption>('name');
  
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<HistoryTab>('all');
  
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { id: '1', materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }
  ]);
  const [bulkGlobalVendor, setBulkGlobalVendor] = useState('');
  const [bulkGlobalProject, setBulkGlobalProject] = useState(projects.find(p => p.isGodown)?.id || projects[0]?.id || '');
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
        stockValue = history.reduce((sum, h) => sum + (h.quantity * (h.unitPrice || mat.costPerUnit)), 0);
      } else {
        const siteEntries = history.filter(h => h.projectId === projectFilter);
        siteBalance = siteEntries.reduce((sum, h) => sum + h.quantity, 0);
        stockValue = siteEntries.reduce((sum, h) => sum + (h.quantity * (h.unitPrice || mat.costPerUnit)), 0);
        hasProjectLink = siteEntries.length > 0;
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
      return 0;
    });
  }, [materials, searchTerm, projectFilter, inventorySort]);

  const handleBulkProcureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.materialId && r.quantity && r.unitPrice);
    if (validRows.length === 0) return;
    for (const row of validRows) {
      await addExpense({
        id: 'e-bulk-' + Math.random().toString(36).substr(2, 9),
        date: bulkDate,
        projectId: row.projectId || bulkGlobalProject,
        vendorId: row.vendorId || bulkGlobalVendor,
        amount: parseFloat(row.quantity) * parseFloat(row.unitPrice),
        paymentMethod: 'Bank',
        category: 'Material',
        materialId: row.materialId,
        materialQuantity: parseFloat(row.quantity),
        inventoryAction: 'Purchase',
        notes: `Bulk Inward: ${row.quantity} units`
      });
    }
    setShowBulkModal(false);
    setBulkRows([{ id: '1', materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }]);
  };

  const handleProcureStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const unitPrice = parseFloat(procureData.costPerUnit) || 0;
    const totalAmount = qty * unitPrice;
    
    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      await addMaterial({ id: newId, name: procureData.newName, unit: procureData.unit, costPerUnit: unitPrice, totalPurchased: 0, totalUsed: 0, history: [] });
      await addExpense({ id: 'e-pro-' + Date.now(), date: procureData.date, projectId: procureData.projectId, vendorId: procureData.vendorId, amount: totalAmount, paymentMethod: 'Bank', category: 'Material', notes: procureData.note || `Procured ${qty} ${procureData.unit} of ${procureData.newName}`, materialId: newId, materialQuantity: qty, inventoryAction: 'Purchase' });
    } else {
      await addExpense({ id: 'e-pro-' + Date.now(), date: procureData.date, projectId: procureData.projectId, vendorId: procureData.vendorId, amount: totalAmount, paymentMethod: 'Bank', category: 'Material', notes: procureData.note || `Restock Procurement: ${qty} units`, materialId: procureData.materialId, materialQuantity: qty, inventoryAction: 'Purchase' });
    }
    setShowProcureModal(false);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Inventory Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Stock levels across all project hubs.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setShowBulkModal(true)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all h-12">
            <Layers size={16} /> Bulk
          </button>
          <button onClick={() => { setShowProcureModal(true); setProcureData(prev => ({...prev, materialId: ''})) }} className="flex-1 sm:flex-none bg-[#003366] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all h-12">
            <Plus size={16} /> Procure
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Filter assets..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase dark:text-white appearance-none" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Storage Hubs</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Adaptive List View: Cards on Mobile, Dense Grid on Tablet/Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => (
          <div key={mat.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 active:scale-[0.98] transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{mat.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{mat.unit}</p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${mat.siteBalance < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {mat.siteBalance.toLocaleString()} {mat.unit}s
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-4">
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase">Valuation</p>
                 <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(mat.stockValue)}</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setHistoryMaterial(mat)} className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                   <History size={18} />
                 </button>
                 <button onClick={() => { setEditingMaterial(mat); setEditFormData({ name: mat.name, unit: mat.unit }); setShowEditModal(true); }} className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                   <Pencil size={18} />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Inward Sheet */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-5xl h-[92vh] sm:h-[85vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/20 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Bulk Stock Inward</h2>
              <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
            </div>
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Supplier</label><select className="w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl font-bold dark:text-white" value={bulkGlobalVendor} onChange={e => setBulkGlobalVendor(e.target.value)}><option value="">Select Vendor...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Storage Hub</label><select className="w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl font-bold dark:text-white" value={bulkGlobalProject} onChange={e => setBulkGlobalProject(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Date</label><input type="date" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl font-bold dark:text-white" value={bulkDate} onChange={e => setBulkDate(e.target.value)} /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
              {bulkRows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-3xl relative animate-in zoom-in-95">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Material</label>
                    <select className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white text-xs" value={row.materialId} onChange={e => { const r = [...bulkRows]; r[idx].materialId = e.target.value; setBulkRows(r); }}>
                      <option value="">Choose Asset...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Qty</label>
                    <input type="number" step={allowDecimalStock ? "0.01" : "1"} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-black dark:text-white text-xs" value={row.quantity} onChange={e => { const r = [...bulkRows]; r[idx].quantity = e.target.value; setBulkRows(r); }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Rate</label>
                    <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-black dark:text-white text-xs" value={row.unitPrice} onChange={e => { const r = [...bulkRows]; r[idx].unitPrice = e.target.value; setBulkRows(r); }} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => setBulkRows(bulkRows.filter(i => i.id !== row.id))} className="w-full bg-rose-50 text-rose-600 py-2.5 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} className="mx-auto" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setBulkRows([...bulkRows, { id: Date.now().toString(), materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }])} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-3xl text-slate-400 dark:text-slate-500 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest">+ Add Material Row</button>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 shrink-0 pb-safe">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold uppercase text-xs">Cancel</button>
              <button onClick={handleBulkProcureSubmit} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Register Inward Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Procure Sheet */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Material Procurement</h2>
              <button onClick={() => setShowProcureModal(false)} className="p-2 text-white/50 hover:text-white"><X size={32} /></button>
            </div>
            <form onSubmit={handleProcureStock} className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-safe">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Target Material</label><select required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))}><option value="">Choose material...</option><option value="new">+ Register New Asset Category</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></div>
              {procureData.materialId === 'new' && <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95"><input type="text" placeholder="Material Name" required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} /><select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value }))}>{stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Supplier</label><select required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-xs" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))}><option value="">Select Vendor...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Hub</label><select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-xs" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-400 uppercase">Qty</label><input type="number" step={allowDecimalStock ? "0.01" : "1"} required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg dark:text-white dark:bg-slate-900" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} /></div><div><label className="text-[10px] font-black text-slate-400 uppercase">Rate</label><input type="number" step="0.01" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg dark:text-white dark:bg-slate-900" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} /></div></div>
              <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Authorize Inward Arrival</button>
            </form>
          </div>
        </div>
      )}

      {/* History Ledger Sheet */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-6xl h-[94vh] sm:h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
               <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Asset Ledger: {historyMaterial.name}</h2>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={36} /></button>
            </div>
            
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/30 flex overflow-x-auto no-scrollbar gap-2 border-b border-slate-100 dark:border-slate-700 shrink-0">
               {(['all', 'purchases', 'usage', 'transfers'] as HistoryTab[]).map(tab => (
                 <button key={tab} onClick={() => setActiveHistoryTab(tab)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeHistoryTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-600'}`}>{tab}</button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-0 no-scrollbar pb-safe">
               {/* Mobile Friendly Ledger View */}
               <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {historyMaterial.history?.filter(h => {
                      if (activeHistoryTab === 'purchases' && h.type !== 'Purchase') return false;
                      if (activeHistoryTab === 'usage' && h.type !== 'Usage') return false;
                      if (activeHistoryTab === 'transfers' && h.type !== 'Transfer') return false;
                      return true;
                  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry, idx) => (
                    <div key={entry.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {entry.type === 'Purchase' ? <ShoppingCart size={20} /> : <Truck size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none mt-1">{entry.type} • {projects.find(p => p.id === entry.projectId)?.name || 'Central'}</p>
                          <p className="text-[10px] text-slate-500 font-medium italic mt-1 line-clamp-1">{entry.note || 'No notes added'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${entry.quantity > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                        </p>
                        <p className="text-[8px] font-black uppercase text-slate-400">{historyMaterial.unit}s</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 pb-safe">
              <button onClick={() => setHistoryMaterial(null)} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs">Close Statement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};