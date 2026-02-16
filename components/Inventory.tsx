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
  const [bulkGlobalProject, setBulkGlobalProject] = useState('');
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

  const isHistoryEntryLocked = useMemo(() => {
    if (!editingHistoryEntry) return false;
    return payments.some(p => p.materialBatchId === editingHistoryEntry.entry.id);
  }, [editingHistoryEntry, payments]);

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
    if (!usageData.projectId) return [];
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
            isLocal: inward.projectId === usageData.projectId
          });
        }
      });
    });

    return batches.sort((a, b) => (a.isLocal === b.isLocal ? 0 : a.isLocal ? -1 : 1));
  }, [materials, usageData.projectId, vendors]);

  const selectedBatchForTotal = useMemo(() => {
    return relevantMaterialsForSite.find(b => 
      b.id === usageData.materialId && b.batchId === usageData.batchId
    );
  }, [relevantMaterialsForSite, usageData.materialId, usageData.batchId]);

  const handleOpenUsageModal = (materialId?: string, projectId?: string) => {
    setUsageData({ materialId: materialId || '', vendorId: '', batchId: '', projectId: projectId || projects.find(p => !p.isGodown)?.id || projects[0]?.id || '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setShowUsageModal(true);
  };

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
    setEditingMaterial(null);
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
        hasProjectLink = siteEntries.some(h => h.quantity > 0);
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
      if (activeHistoryTab === 'all' && entry.type === 'Transfer') return false;
      if (activeHistoryTab === 'purchases' && entry.type !== 'Purchase') return false;
      if (activeHistoryTab === 'usage' && entry.type !== 'Usage') return false;
      if (activeHistoryTab === 'transfers' && entry.type !== 'Transfer') return false;
      
      const projectName = projects.find(p => p.id === entry.projectId)?.name || '';
      const vendorName = vendors.find(v => v.id === entry.vendorId)?.name || '';
      const search = historySearch.toLowerCase();
      return (entry.note?.toLowerCase().includes(search) || entry.type.toLowerCase().includes(search) || projectName.toLowerCase().includes(search) || vendorName.toLowerCase().includes(search) || entry.date.includes(search));
    });
    return result.sort((a, b) => {
      const timeB = new Date(b.date).getTime();
      const timeA = new Date(a.date).getTime();
      if (historySort === 'date-desc') return timeB - timeA;
      if (historySort === 'date-asc') return timeA - timeB;
      if (historySort === 'qty-high') return b.quantity - a.quantity;
      if (historySort === 'qty-low') return a.quantity - b.quantity;
      return 0;
    });
  }, [historyMaterial, historySearch, historySort, projects, vendors, activeHistoryTab]);

  const handleProcureStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const unitPrice = parseFloat(procureData.costPerUnit) || 0;
    const totalAmount = qty * unitPrice;
    const expenseId = 'e-pro-' + Date.now();
    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      await addMaterial({ id: newId, name: procureData.newName, unit: procureData.unit, costPerUnit: unitPrice, totalPurchased: 0, totalUsed: 0, history: [] });
      await addExpense({ id: expenseId, date: procureData.date, projectId: procureData.projectId, vendorId: procureData.vendorId, amount: totalAmount, paymentMethod: 'Bank', category: 'Material', notes: procureData.note || `Procured ${qty} ${procureData.unit} of ${procureData.newName}`, materialId: newId, materialQuantity: qty, inventoryAction: 'Purchase' });
    } else {
      await addExpense({ id: expenseId, date: procureData.date, projectId: procureData.projectId, vendorId: procureData.vendorId, amount: totalAmount, paymentMethod: 'Bank', category: 'Material', notes: procureData.note || `Restock Procurement: ${qty} units`, materialId: procureData.materialId, materialQuantity: qty, inventoryAction: 'Purchase' });
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
        alert(`Insufficient stock. (Available: ${selectedBatch.available})`);
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

  const handleDeleteHistoryEntry = async (material: Material, entryId: string) => {
    if (payments.some(p => p.materialBatchId === entryId)) {
      alert("This entry is linked to payments and cannot be deleted.");
      return;
    }
    if (!confirm("Reverting this will affect both stock and financials. Continue?")) return;
    const expenseId = entryId.startsWith('sh-exp-') ? entryId.replace('sh-exp-', '') : null;
    if (expenseId) await deleteExpense(expenseId);
  };

  const handleOpenEditHistoryModal = (entry: StockHistoryEntry) => {
    if (!historyMaterial) return;
    setEditingHistoryEntry({ material: historyMaterial, entry });
    setHistoryEditFormData({ 
      quantity: entry.quantity.toString(), 
      unitPrice: (entry.unitPrice || historyMaterial.costPerUnit || 0).toString(), 
      projectId: entry.projectId || '', 
      vendorId: entry.vendorId || '', 
      date: entry.date, 
      note: entry.note || '' 
    }); 
    setShowEditHistoryModal(true); 
  };

  const handleEditHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryEntry) return;
    const { material, entry: oldEntry } = editingHistoryEntry;
    const expenseId = oldEntry.id.startsWith('sh-exp-') ? oldEntry.id.replace('sh-exp-', '') : null;
    if (expenseId) {
      const oldExp = expenses.find(x => x.id === expenseId);
      if (oldExp) {
        await updateExpense({ 
          ...oldExp, 
          date: historyEditFormData.date, 
          amount: Math.abs(parseFloat(historyEditFormData.quantity)) * parseFloat(historyEditFormData.unitPrice), 
          materialQuantity: parseFloat(historyEditFormData.quantity), 
          notes: historyEditFormData.note,
          unitPrice: parseFloat(historyEditFormData.unitPrice) 
        });
      }
    }
    setShowEditHistoryModal(false);
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
          <button onClick={() => handleOpenUsageModal()} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"><TrendingDown size={18} /> Use Stock</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search assets..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
           <select className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase dark:text-white" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="All">All Hubs</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Material Asset</th>
                <th className="px-8 py-5">Valuation</th>
                <th className="px-8 py-5">Availability</th>
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
                  <td className="px-8 py-5 text-xs font-black text-slate-600">{formatCurrency(mat.stockValue)}</td>
                  <td className="px-8 py-5">
                     <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${mat.siteBalance < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {mat.siteBalance.toLocaleString()} {mat.unit}s
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenUsageModal(mat.id)} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><TrendingDown size={18} /></button>
                       <button onClick={() => setHistoryMaterial(mat)} className="p-3 text-slate-400 bg-slate-50 rounded-xl hover:text-slate-900"><History size={18} /></button>
                       <button onClick={() => handleOpenEditModal(mat)} className="p-3 text-slate-400 hover:text-blue-600"><Pencil size={18} /></button>
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
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Asset Hub Log: {historyMaterial.name}</h2>
               <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={36} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                    <tr>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Activity</th>
                      <th className="px-8 py-4 text-right">Qty</th>
                      <th className="px-8 py-4 text-right">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${entry.type === 'Purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{entry.type}</span>
                          <p className="text-[11px] text-slate-700 mt-1">{entry.note}</p>
                        </td>
                        <td className={`px-8 py-4 text-right text-sm font-black ${entry.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{entry.quantity > 0 ? '+' : ''}{entry.quantity}</td>
                        <td className="px-8 py-4 text-right">
                           <div className="flex justify-end gap-1">
                              <button onClick={() => handleOpenEditHistoryModal(entry)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
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
      )}
    </div>
  );
};