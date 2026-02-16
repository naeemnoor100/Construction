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
  ArrowRightLeft,
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
  Scale,
  Lock,
  Info,
  Link,
  Layers,
  Copy,
  LayoutGrid,
  Warehouse,
  Truck
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry, Expense, Project, Vendor } from '../types';

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
  const { materials, projects, vendors, stockingUnits, payments, expenses, updateMaterial, addMaterial, deleteMaterial, addExpense, deleteExpense, updateExpense, updateVendor, allowDecimalStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
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

  // Bulk Inward State
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { id: '1', materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }
  ]);
  const [bulkGlobalVendor, setBulkGlobalVendor] = useState('');
  const [bulkGlobalProject, setBulkGlobalProject] = useState(projects.find(p => p.isGodown)?.id || projects[0]?.id || '');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);

  // Keep historyMaterial synced with the master list after any global state updates
  useEffect(() => {
    if (historyMaterial) {
      const latest = materials.find(m => m.id === historyMaterial.id);
      if (latest) {
        setHistoryMaterial(latest);
      } else {
        setHistoryMaterial(null);
      }
    }
  }, [materials]);

  const [procureData, setProcureData] = useState({
    materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects.find(p => p.isGodown)?.id || projects[0]?.id || '', quantity: '', unit: stockingUnits[0] || 'Bag', costPerUnit: '', date: new Date().toISOString().split('T')[0], note: ''
  });

  const [usageData, setUsageData] = useState({
    materialId: '', 
    vendorId: '', 
    batchId: '', 
    projectId: projects.find(p => !p.isGodown)?.id || projects[0]?.id || '', 
    quantity: '', 
    date: new Date().toISOString().split('T')[0], 
    notes: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '', unit: stockingUnits[0] || 'Bag'
  });

  const relevantMaterialsForSite = useMemo(() => {
    const batches: any[] = [];
    materials.forEach(mat => {
      const history = mat.history || [];
      const inwardEntries = history.filter(h => (h.type === 'Purchase' || h.type === 'Transfer') && h.quantity > 0);
      
      inwardEntries.forEach(inward => {
        const batchId = inward.id.replace('sh-exp-', '');
        const deductionsAgainstThisBatch = history.filter(h => 
          h.parentPurchaseId === batchId && h.quantity < 0
        );
        const totalDeductedFromBatch = Math.abs(deductionsAgainstThisBatch.reduce((sum, d) => sum + d.quantity, 0));
        const availableInBatch = inward.quantity - totalDeductedFromBatch;

        if (availableInBatch > 0) {
          const vendor = vendors.find(v => v.id === inward.vendorId);
          const vName = vendor?.name || (inward.type === 'Transfer' ? 'Inbound Transfer' : 'Standard Supplier');
          batches.push({
            id: mat.id,
            name: mat.name,
            unit: mat.unit,
            batchId: batchId,
            vendorName: vName,
            vendorId: inward.vendorId,
            unitPrice: inward.unitPrice || mat.costPerUnit,
            available: availableInBatch,
            projectId: inward.projectId
          });
        }
      });
    });
    return batches;
  }, [materials, vendors]);

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
      if (activeHistoryTab === 'purchases' && entry.type !== 'Purchase') return false;
      if (activeHistoryTab === 'usage' && entry.type !== 'Usage') return false;
      if (activeHistoryTab === 'transfers' && entry.type !== 'Transfer') return false;
      
      const projectName = projects.find(p => p.id === entry.projectId)?.name || '';
      const vendorName = vendors.find(v => v.id === entry.vendorId)?.name || '';
      const search = historySearch.toLowerCase();
      return (entry.note?.toLowerCase().includes(search) || entry.type.toLowerCase().includes(search) || projectName.toLowerCase().includes(search) || vendorName.toLowerCase().includes(search));
    });
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyMaterial, historySearch, projects, vendors, activeHistoryTab]);

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

  const handleBulkProcureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.materialId && r.quantity && r.unitPrice);
    if (validRows.length === 0) return;

    for (const row of validRows) {
      const qty = parseFloat(row.quantity);
      const price = parseFloat(row.unitPrice);
      const vendorId = row.vendorId || bulkGlobalVendor;
      const projectId = row.projectId || bulkGlobalProject;
      if (!vendorId || !projectId) continue;

      await addExpense({
        id: 'e-bulk-' + Math.random().toString(36).substr(2, 9),
        date: bulkDate,
        projectId: projectId,
        vendorId: vendorId,
        amount: qty * price,
        paymentMethod: 'Bank',
        category: 'Material',
        materialId: row.materialId,
        materialQuantity: qty,
        inventoryAction: 'Purchase',
        notes: `Bulk Entry: ${qty} units inward`
      });
    }
    setShowBulkModal(false);
    setBulkRows([{ id: '1', materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }]);
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(usageData.quantity) || 0;
    const selectedBatch = relevantMaterialsForSite.find(b => b.id === usageData.materialId && b.batchId === usageData.batchId);

    if (selectedBatch) {
      if (selectedBatch.available < qty) {
        alert(`Insufficient stock in this batch. (Available: ${selectedBatch.available})`);
        return;
      }
      await addExpense({ 
        id: 'e-usage-' + Date.now(), 
        date: usageData.date, 
        projectId: usageData.projectId, 
        amount: qty * selectedBatch.unitPrice, 
        paymentMethod: 'Bank', 
        category: 'Material', 
        materialId: selectedBatch.id, 
        vendorId: selectedBatch.vendorId, 
        materialQuantity: -qty, 
        inventoryAction: 'Usage', 
        parentPurchaseId: selectedBatch.batchId,
        notes: usageData.notes || `Usage: ${qty} units`
      });
      setShowUsageModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Inventory Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage godown stock and project site assets.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button onClick={() => setShowBulkModal(true)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl"><Layers size={18} /> Bulk Inward</button>
          <button onClick={() => setShowProcureModal(true)} className="flex-1 sm:flex-none bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl"><Plus size={18} /> Procure</button>
          <button onClick={() => setShowUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"><TrendingDown size={18} /> Use Stock</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search assets..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase dark:text-white" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="All">All Hubs</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Material Asset</th>
                <th className="px-8 py-5">Valuation</th>
                <th className="px-8 py-5 text-center">Availability</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-black text-sm uppercase text-slate-900 dark:text-white">{mat.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{mat.unit}</p>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-slate-600 dark:text-slate-400">{formatCurrency(mat.stockValue)}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${mat.siteBalance < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {mat.siteBalance.toLocaleString()} {mat.unit}s
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setUsageData(d => ({ ...d, materialId: mat.id })); setShowUsageModal(true); }} className="p-3 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><TrendingDown size={18} /></button>
                      <button onClick={() => setHistoryMaterial(mat)} className="p-3 text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl hover:text-slate-900"><History size={18} /></button>
                      <button onClick={() => handleOpenEditModal(mat)} className="p-3 text-slate-400 hover:text-blue-600 transition-all"><Pencil size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/20 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Bulk Stock Inward</h2>
              <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
            </div>
            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Global Vendor</label><select className="w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl font-bold dark:text-white" value={bulkGlobalVendor} onChange={e => setBulkGlobalVendor(e.target.value)}><option value="">Select Supplier...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Hub</label><select className="w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl font-bold dark:text-white" value={bulkGlobalProject} onChange={e => setBulkGlobalProject(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Date</label><input type="date" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl font-bold dark:text-white" value={bulkDate} onChange={e => setBulkDate(e.target.value)} /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
              {bulkRows.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-white dark:bg-slate-700 border border-slate-100 rounded-3xl items-end relative group">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Material</label><select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-bold dark:text-white" value={row.materialId} onChange={e => { const r = [...bulkRows]; r[idx].materialId = e.target.value; setBulkRows(r); }}><option value="">Choose Asset...</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Qty</label><input type="number" step={allowDecimalStock ? "0.01" : "1"} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-black dark:text-white" value={row.quantity} onChange={e => { const r = [...bulkRows]; r[idx].quantity = e.target.value; setBulkRows(r); }} /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Price</label><input type="number" step="0.01" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl font-black dark:text-white" value={row.unitPrice} onChange={e => { const r = [...bulkRows]; r[idx].unitPrice = e.target.value; setBulkRows(r); }} /></div>
                  <div className="flex gap-2">
                    <button onClick={() => setBulkRows(bulkRows.filter(i => i.id !== row.id))} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} className="mx-auto" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => setBulkRows([...bulkRows, { id: Date.now().toString(), materialId: '', quantity: '', unitPrice: '', vendorId: '', projectId: '' }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest">+ Add Row</button>
            </div>
            <div className="p-8 border-t border-slate-100 flex justify-end gap-4"><button onClick={() => setShowBulkModal(false)} className="px-8 py-4 bg-slate-100 rounded-2xl font-bold uppercase text-xs">Cancel</button><button onClick={handleBulkProcureSubmit} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Authorize Inward Batch</button></div>
          </div>
        </div>
      )}

      {/* Procure Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Material Procurement</h2>
              <button onClick={() => setShowProcureModal(false)} className="p-2 text-white/50 hover:text-white"><X size={32} /></button>
            </div>
            <form onSubmit={handleProcureStock} className="p-8 space-y-5">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Target Material</label><select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white outline-none appearance-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))}><option value="">Choose material...</option><option value="new">+ New Asset Category</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select></div>
              {procureData.materialId === 'new' && <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Name" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white" value={procureData.newName} onChange={e => setProcureData(p => ({ ...p, newName: e.target.value }))} /><select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white" value={procureData.unit} onChange={e => setProcureData(p => ({ ...p, unit: e.target.value }))}>{stockingUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>}
              <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Source Vendor</label><select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white text-xs" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))}><option value="">Select Vendor...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Hub</label><select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white text-xs" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-400 uppercase">Qty</label><input type="number" step={allowDecimalStock ? "0.01" : "1"} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-lg dark:text-white dark:bg-slate-900" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} /></div><div><label className="text-[10px] font-black text-slate-400 uppercase">Unit Price</label><input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-lg dark:text-white dark:bg-slate-900" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} /></div></div>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Confirm Procurement</button>
            </form>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Stock Deduction</h2>
              <button onClick={() => setShowUsageModal(false)} className="p-2 text-white/50 hover:text-white"><X size={32} /></button>
            </div>
            <form onSubmit={handleRecordUsage} className="p-8 space-y-5">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Select Material & Batch</label><select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white text-xs outline-none" value={`${usageData.materialId}|${usageData.batchId}`} onChange={e => { const [mId, bId] = e.target.value.split('|'); setUsageData(p => ({ ...p, materialId: mId, batchId: bId })); }}><option value="|">Select pool batch...</option>{relevantMaterialsForSite.map((b, idx) => <option key={idx} value={`${b.id}|${b.batchId}`}>{b.name} ({b.vendorName}) - Available: {b.available} {b.unit}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-400 uppercase">Qty to Deduct</label><input type="number" step={allowDecimalStock ? "0.01" : "1"} required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black text-lg dark:text-white dark:bg-slate-900" value={usageData.quantity} onChange={e => setUsageData(p => ({ ...p, quantity: e.target.value }))} /></div><div><label className="text-[10px] font-black text-slate-400 uppercase">Date</label><input type="date" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold dark:text-white dark:bg-slate-900" value={usageData.date} onChange={e => setUsageData(p => ({ ...p, date: e.target.value }))} /></div></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Usage Memo</label><textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl font-bold dark:text-white" placeholder="Where was this stock used?" value={usageData.notes} onChange={e => setUsageData(p => ({ ...p, notes: e.target.value }))}></textarea></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Confirm Usage</button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shrink-0">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Asset Ledger: {historyMaterial.name}</h2>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={36} /></button>
            </div>
            
            <div className="px-8 pt-4 pb-2 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700">
               {(['all', 'purchases', 'usage', 'transfers'] as HistoryTab[]).map(tab => (
                 <button key={tab} onClick={() => setActiveHistoryTab(tab)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeHistoryTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-600'}`}>{tab}</button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b">
                    <tr><th className="px-8 py-4">Date</th><th className="px-8 py-4">Activity</th><th className="px-8 py-4 text-right">Qty</th><th className="px-8 py-4 text-right">Balance</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHistory.map((entry, idx) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${entry.type === 'Purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{entry.type}</span>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{entry.note || 'Internal Transaction'}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{projects.find(p => p.id === entry.projectId)?.name || 'Godown'}</p>
                        </td>
                        <td className={`px-8 py-4 text-right text-sm font-black ${entry.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{entry.quantity > 0 ? '+' : ''}{entry.quantity}</td>
                        <td className="px-8 py-4 text-right">
                           <button onClick={() => { if(confirm("Revert this entry? This will restore stock levels.")) deleteExpense(entry.id.replace('sh-exp-', '')); }} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};