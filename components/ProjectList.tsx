import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  MapPin, 
  DollarSign, 
  ChevronRight,
  X,
  Briefcase,
  TrendingUp,
  ArrowUpCircle,
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
  Hash,
  AlertCircle,
  Receipt,
  ArrowDownCircle,
  Wallet,
  Save,
  PieChart,
  Tag,
  Users,
  Package,
  CheckCircle2,
  Phone,
  Activity,
  ArrowRightLeft,
  Landmark,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardCheck,
  Scale,
  RefreshCw,
  ArrowRight,
  Link,
  FileText,
  Clock,
  Target,
  Info,
  TrendingDown,
  Search
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProjectStatus, Project, Expense, Income, PaymentMethod, Material, Payment, StockHistoryEntry, Invoice } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { 
    projects, expenses, vendors, materials, incomes, invoices, siteStatuses, tradeCategories,
    addProject, updateProject, deleteProject, 
    addExpense, updateExpense, deleteExpense,
    addIncome, updateIncome, deleteIncome,
    addInvoice, updateInvoice, deleteInvoice,
    updateMaterial, addPayment, payments
  } = useApp();
  
  const [filter, setFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'expenses' | 'income' | 'arrivals' | 'invoices' | 'budget'>('expenses');
  
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickIncome, setShowQuickIncome] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showInventoryUsageModal, setShowInventoryUsageModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [selectedExpForPay, setSelectedExpForPay] = useState<Expense | null>(null);
  const [payFormData, setPayFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank' as PaymentMethod, reference: ''
  });

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: 'Active'
  });

  const [expenseFormData, setExpenseFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], category: 'Labor', 
    vendorId: '', notes: '', paymentMethod: 'Bank' as PaymentMethod,
    materialId: '', materialQuantity: ''
  });

  const [incomeFormData, setIncomeFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' as PaymentMethod
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], description: '', status: 'Sent' as Invoice['status']
  });

  const [inventoryUsageForm, setInventoryUsageForm] = useState({
    materialId: '', 
    batchId: '', 
    vendorId: '', 
    quantity: '', 
    date: new Date().toISOString().split('T')[0], 
    note: ''
  });

  const [transferForm, setTransferForm] = useState({
    materialId: '',
    batchId: '',
    destProjectId: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    unitPrice: 0
  });

  // Deep Search for Modals
  const [usageMaterialSearch, setUsageMaterialSearch] = useState('');
  const [transferProjectSearch, setTransferProjectSearch] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setViewingProject(null);
        setShowQuickExpense(false);
        setShowQuickIncome(false);
        setShowInvoiceModal(false);
        setShowInventoryUsageModal(false);
        setShowTransferModal(false);
        setEditingExpense(null);
        setEditingIncome(null);
        setEditingInvoice(null);
        setShowQuickPayModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const resetQuickExpenseForm = useCallback(() => {
    setExpenseFormData({
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      category: 'Labor', 
      vendorId: '', 
      notes: '', 
      paymentMethod: 'Bank',
      materialId: '',
      materialQuantity: ''
    });
  }, []);

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setFormData({ 
      name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: siteStatuses[0] || 'Active' 
    });
    setShowModal(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData: Project = {
      id: editingProject ? editingProject.id : 'p' + Date.now(),
      name: formData.name,
      client: formData.client,
      location: formData.location,
      contactNumber: formData.contactNumber,
      budget: parseFloat(formData.budget) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      description: formData.description,
      status: formData.status
    };

    if (editingProject) {
      await updateProject(projectData);
    } else {
      await addProject(projectData);
    }
    setShowModal(false);
    setEditingProject(null);
  };

  // Alphabetical Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => filter === 'All' || p.status === filter)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, filter]);

  // Alphabetical Statuses
  const sortedStatuses = useMemo(() => [...siteStatuses].sort(), [siteStatuses]);

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const projectIncomes = incomes.filter(i => i.projectId === projectId);
    const projectInvoices = invoices.filter(inv => inv.projectId === projectId);
    // Note: Actual site costs exclude 'Purchases' (because they are stock arrivals) and 'Transfers' (because they are stock movement)
    const actualSiteExpenses = projectExpenses.filter(e => e.inventoryAction !== 'Purchase' && e.inventoryAction !== 'Transfer');
    const totalSpent = actualSiteExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCollected = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const progress = Math.min(100, Math.round((totalSpent / (budget || 1)) * 100)) || 0;
    const categories: Record<string, number> = {};
    actualSiteExpenses.forEach(e => { categories[e.category] = (categories[e.category] || 0) + e.amount; });
    return { totalSpent, totalCollected, totalInvoiced, receivable: totalInvoiced - totalCollected, progress, categoryBreakdown: categories, allExpenses: projectExpenses };
  };

  const projectArrivals = useMemo(() => {
    if (!viewingProject) return [];
    const arrivals: { material: Material, entry: StockHistoryEntry, arrived: number, consumed: number, transferred: number, remaining: number }[] = [];
    materials.forEach(m => {
      m.history?.forEach(h => {
        // Track site-specific stock: only inward (Purchase or Transfer IN)
        if ((h.type === 'Purchase' || h.type === 'Transfer') && h.projectId === viewingProject.id && h.quantity > 0) { 
          const batchId = h.id.replace('sh-exp-', '');
          // Subtract usages AND transfers out specifically linked to this entry or site
          const historyForMaterial = m.history || [];
          const deductions = historyForMaterial.filter(d => 
            d.parentPurchaseId === batchId && d.projectId === viewingProject.id && d.quantity < 0
          );
          
          const qtyUsed = Math.abs(deductions.filter(d => d.type === 'Usage').reduce((sum, d) => sum + d.quantity, 0));
          const qtyMoved = Math.abs(deductions.filter(d => d.type === 'Transfer').reduce((sum, d) => sum + d.quantity, 0));
          
          const arrived = h.quantity;
          const remaining = arrived - (qtyUsed + qtyMoved);
          
          arrivals.push({ material: m, entry: h, arrived, consumed: qtyUsed, transferred: qtyMoved, remaining }); 
        }
      });
    });
    return arrivals.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime());
  }, [viewingProject, materials]);

  const siteRelevantMaterials = useMemo(() => {
    if (!viewingProject) return [];
    const batches: any[] = [];
    
    materials.forEach(mat => {
      const history = mat.history || [];
      // Any positive entry for this site or others
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
          batches.push({
            id: mat.id,
            name: mat.name,
            unit: mat.unit,
            batchId: batchId,
            vendorName: vendor?.name || (inward.type === 'Transfer' ? 'Inbound Stock' : 'Standard Supplier'),
            vendorId: inward.vendorId,
            unitPrice: inward.unitPrice || mat.costPerUnit,
            available: availableInBatch,
            isLocal: inward.projectId === viewingProject.id
          });
        }
      });
    });

    return batches
      .filter(b => {
        const term = usageMaterialSearch.toLowerCase();
        return b.name.toLowerCase().includes(term) || b.vendorName.toLowerCase().includes(term);
      })
      .sort((a, b) => {
        if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [materials, viewingProject, vendors, usageMaterialSearch]);

  const currentTotalValue = useMemo(() => {
    const selectedBatch = siteRelevantMaterials.find(b => 
      b.id === inventoryUsageForm.materialId && b.batchId === inventoryUsageForm.batchId
    );
    return (selectedBatch?.unitPrice || 0) * (parseFloat(inventoryUsageForm.quantity) || 0);
  }, [siteRelevantMaterials, inventoryUsageForm.materialId, inventoryUsageForm.batchId, inventoryUsageForm.quantity]);

  const sortedTransferDestinations = useMemo(() => {
    if (!viewingProject) return [];
    return projects
      .filter(p => p.id !== viewingProject.id)
      .filter(p => p.name.toLowerCase().includes(transferProjectSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, viewingProject, transferProjectSearch]);

  const handleInventoryUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject || !inventoryUsageForm.materialId || !inventoryUsageForm.batchId) return;
    const selectedBatch = siteRelevantMaterials.find(b => b.id === inventoryUsageForm.materialId && b.batchId === inventoryUsageForm.batchId);
    if (!selectedBatch) return;
    const qty = parseFloat(inventoryUsageForm.quantity) || 0;
    if (selectedBatch.available < qty) { alert(`Error: Insufficient stock in this batch. (Available: ${selectedBatch.available} ${selectedBatch.unit})`); return; }
    const totalCost = qty * selectedBatch.unitPrice;
    
    // Usage is always recorded with negative quantity for history deduction
    await addExpense({ 
      id: 'e-inv-' + Date.now(), 
      date: inventoryUsageForm.date, 
      projectId: viewingProject.id, 
      amount: totalCost, 
      paymentMethod: 'Bank', 
      category: 'Material', 
      materialId: selectedBatch.id, 
      vendorId: selectedBatch.vendorId, 
      inventoryAction: 'Usage', 
      materialQuantity: -qty, 
      parentPurchaseId: selectedBatch.batchId, 
      notes: inventoryUsageForm.note || `Consumption: ${qty} ${selectedBatch.unit} of ${selectedBatch.name}` 
    });
    
    setShowInventoryUsageModal(false);
    setInventoryUsageForm({ materialId: '', batchId: '', vendorId: '', quantity: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject || !transferForm.destProjectId || !transferForm.materialId) return;
    const qty = parseFloat(transferForm.quantity) || 0;
    if (qty <= 0) return;

    const destProject = projects.find(p => p.id === transferForm.destProjectId);
    const unitPrice = transferForm.unitPrice;

    // Leg 1: Record TRANSFER OUT from source site (treated as type 'Transfer' with negative qty)
    await addExpense({
      id: 'e-trans-out-' + Date.now(),
      date: transferForm.date,
      projectId: viewingProject.id,
      amount: 0, // Transfer movement has 0 financial impact at source until consumed
      paymentMethod: 'Bank',
      category: 'Material',
      materialId: transferForm.materialId,
      materialQuantity: -qty,
      inventoryAction: 'Transfer',
      parentPurchaseId: transferForm.batchId,
      notes: transferForm.note || `Transfer OUT to Site: ${destProject?.name}`
    });

    // Leg 2: Record TRANSFER IN at destination site (inventoryAction: 'Transfer' with positive qty)
    await addExpense({
      id: 'e-trans-in-' + Date.now(),
      date: transferForm.date,
      projectId: transferForm.destProjectId,
      amount: 0, // Transfer movement has 0 financial impact at destination until consumed
      paymentMethod: 'Bank',
      category: 'Material',
      materialId: transferForm.materialId,
      materialQuantity: qty,
      inventoryAction: 'Transfer',
      notes: `Transfer IN from Site: ${viewingProject.name}`,
      unitPrice: unitPrice // Carry over the original cost
    });

    setShowTransferModal(false);
    setTransferProjectSearch('');
  };

  const handleQuickIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;
    const incData: Income = {
      id: editingIncome ? editingIncome.id : 'inc-' + Date.now(),
      projectId: viewingProject.id,
      amount: parseFloat(incomeFormData.amount) || 0,
      description: incomeFormData.description,
      date: incomeFormData.date,
      method: incomeFormData.method
    };
    if (editingIncome) await updateIncome(incData); else await addIncome(incData);
    setShowQuickIncome(false);
    setEditingIncome(null);
    setIncomeFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Site Portfolio (A-Z)</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitor site activity and manage specific project financials.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Project
        </button>
      </div>

      <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 overflow-x-auto no-scrollbar w-fit max-w-full">
        <button onClick={() => setFilter('All')} className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filter === 'All' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>All</button>
        {sortedStatuses.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{tab}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const { progress, totalSpent, totalCollected } = calculateProjectMetrics(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col shadow-sm">
              <div className="p-6 flex-1">
                <div className="flex justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30'}`}>{project.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProject(project); setFormData({ name: project.name, client: project.client, location: project.location, contactNumber: project.contactNumber || '', budget: project.budget.toString(), startDate: project.startDate, endDate: project.endDate, description: project.description || '', status: project.status }); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                    <button onClick={() => { if(confirm(`Delete ${project.name}?`)) deleteProject(project.id); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{project.name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase flex items-center gap-1.5 mt-1"><MapPin size={12} /> {project.location}</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest"><span>Realized Costs</span><span className="text-blue-600">{progress}%</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${progress}%` }}></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700"><p className="text-[9px] text-slate-400 font-black uppercase mb-1">Spent (Consumed)</p><p className="text-xs font-bold text-red-600 truncate">{formatCurrency(totalSpent)}</p></div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/20"><p className="text-[9px] text-emerald-600 font-black uppercase mb-1">Collected</p><p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(totalCollected)}</p></div>
                  </div>
                </div>
              </div>
              <button onClick={() => { setViewingProject(project); setActiveDetailTab('expenses'); }} className="w-full py-5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center justify-between px-6 hover:bg-blue-600 hover:text-white transition-all">Project Insights <ChevronRight size={18} /></button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><Briefcase size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingProject ? 'Modify Project Site' : 'Launch New Project'}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Database Registration Entry</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
             </div>
             <form onSubmit={handleProjectSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar pb-safe">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Site Name</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Oakwood Residency" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Client / Owner Name</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.client} onChange={e => setFormData(p => ({ ...p, client: e.target.value }))} placeholder="Client name..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location Address</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Street, City..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                    <input type="tel" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.contactNumber} onChange={e => setFormData(p => ({ ...p, contactNumber: e.target.value }))} placeholder="+00 000 0000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Initial Budget (Rs.)</label>
                    <input type="number" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                    <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Site Status</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                      {sortedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brief Description</label>
                  <textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Brief project scope..."></textarea>
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest text-slate-500">Cancel</button>
                   <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest">Register Project Site</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {viewingProject && (() => {
        const metrics = calculateProjectMetrics(viewingProject.id, viewingProject.budget);
        const projectIncomes = incomes.filter(i => i.projectId === viewingProject.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-6xl h-[92vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl"><Briefcase size={32} /></div>
                  <div><h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{viewingProject.name}</h2><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Client: {viewingProject.client}</p></div>
                </div>
                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spent Budget</p><p className="text-xl font-black text-red-600">{formatCurrency(metrics.totalSpent)}</p></div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm"><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Total Billed</p><p className="text-xl font-black text-blue-600">{formatCurrency(metrics.totalInvoiced)}</p></div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm"><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Total Received</p><p className="text-xl font-black text-emerald-600">{formatCurrency(metrics.totalCollected)}</p></div>
                  <div className="bg-blue-600 p-5 rounded-3xl shadow-xl text-white flex flex-col justify-between"><p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Total Receivable</p><p className="text-xl font-black mt-2">{formatCurrency(metrics.receivable)}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                  <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-700 justify-between items-start sm:items-center pr-6 bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
                      <button onClick={() => setActiveDetailTab('budget')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'budget' ? 'bg-white dark:bg-slate-800 text-slate-900 border-b-4 border-slate-900' : 'text-slate-400'}`}>Master Budget</button>
                      <button onClick={() => setActiveDetailTab('expenses')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'expenses' ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Site Costs</button>
                      <button onClick={() => setActiveDetailTab('income')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Project Income</button>
                      <button onClick={() => setActiveDetailTab('arrivals')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'arrivals' ? 'bg-white dark:bg-slate-800 text-amber-600 border-b-4 border-amber-600' : 'text-slate-400'}`}>Material Arrivals</button>
                    </div>
                    <div className="p-4 sm:p-0 flex gap-2 w-full sm:w-auto">
                      {activeDetailTab === 'expenses' && (
                        <button onClick={() => setShowInventoryUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Package size={16} /> Record Use</button>
                      )}
                      {activeDetailTab === 'income' && (
                        <button onClick={() => { setEditingIncome(null); setIncomeFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' }); setShowQuickIncome(true); }} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={16} /> Record Income</button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                     {activeDetailTab === 'budget' && (
                       <div className="p-8 space-y-8 animate-in fade-in duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Target size={18} className="text-blue-600" /> Financial Pulse</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                   <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realized Burn Rate</span><span className={`text-sm font-black ${metrics.progress > 90 ? 'text-red-600' : 'text-blue-600'}`}>{metrics.progress}%</span></div>
                                   <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${metrics.progress > 90 ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${metrics.progress}%` }}></div></div>
                                   <div className="grid grid-cols-2 gap-4 mt-6"><div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Project Budget</p><p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(viewingProject.budget)}</p></div><div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Remaining Headroom</p><p className="text-lg font-black text-emerald-600">{formatCurrency(Math.max(0, viewingProject.budget - metrics.totalSpent))}</p></div></div>
                                </div>
                             </div>
                             <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><PieChart size={18} className="text-emerald-600" /> Realized Costs by Category</h3>
                                <div className="space-y-3">
                                   {Object.entries(metrics.categoryBreakdown).sort((a,b) => a[0].localeCompare(b[0])).map(([cat, amt]) => (
                                     <div key={cat} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm group hover:border-blue-400 transition-all">
                                        <div className="flex items-center gap-3"><div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors"><Tag size={14} /></div><span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{cat}</span></div>
                                        <div className="text-right"><p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(amt)}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{Math.round((amt / (metrics.totalSpent || 1)) * 100)}% of realization</p></div>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                     )}
                     {activeDetailTab !== 'budget' && (
                        <table className="w-full text-left min-w-[800px]">
                          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                            {activeDetailTab === 'expenses' ? (
                              <tr><th className="px-8 py-5">Value Date</th><th className="px-8 py-5">Ledger Entry Details</th><th className="px-8 py-5 text-center">Quantity</th><th className="px-8 py-5 text-right">Amount / Actions</th><th className="px-8 py-5 text-right">Control</th></tr>
                            ) : activeDetailTab === 'income' ? (
                              <tr><th className="px-8 py-5">Value Date</th><th className="px-8 py-5">Description</th><th className="px-8 py-5">Method</th><th className="px-8 py-5 text-right">Amount</th><th className="px-8 py-5 text-right">Control</th></tr>
                            ) : (
                              <tr><th className="px-8 py-5">Arrival Date</th><th className="px-8 py-5">Material Asset</th><th className="px-8 py-5 text-center">Inward (Quantity)</th><th className="px-8 py-5 text-center">Activity Summary</th><th className="px-8 py-5 text-center">Remaining</th><th className="px-8 py-5 text-right">Actions</th></tr>
                            )}
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {activeDetailTab === 'expenses' ? (
                               metrics.allExpenses.filter(e => e.inventoryAction !== 'Purchase' && e.inventoryAction !== 'Transfer').slice().reverse().map(e => {
                                 const isConsumption = e.inventoryAction === 'Usage';
                                 const mat = e.materialId ? materials.find(m => m.id === e.materialId) : null;
                                 return (
                                   <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                     <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                                     <td className="px-8 py-5">
                                       <div className="flex flex-col"><div className="flex items-center gap-2">{isConsumption ? <TrendingDown size={14} className="text-blue-500" /> : <Receipt size={14} className="text-slate-400" />}{mat ? (<p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter truncate max-w-[300px]">{mat.name} <span className="text-[10px] font-bold text-slate-400">({mat.unit})</span></p>) : (<p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter truncate max-w-[300px]">{e.category}</p>)}</div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-tight">Supplier: {e.vendorId ? (vendors.find(v => v.id === e.vendorId)?.name || 'Standard Supplier') : 'Self / Direct'}</p></div>
                                     </td>
                                     <td className="px-8 py-5 text-center">{e.materialQuantity ? (<span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{Math.abs(e.materialQuantity).toLocaleString()} {mat?.unit || ''}</span>) : <span className="text-slate-300">--</span>}</td>
                                     <td className="px-8 py-5 text-sm font-black text-red-600 text-right">{formatCurrency(e.amount)}</td>
                                     <td className="px-8 py-5 text-right"><div className="flex justify-end gap-1"><button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button></div></td>
                                   </tr>
                                 );
                               })
                             ) : activeDetailTab === 'income' ? (
                               projectIncomes.map(inc => (
                                 <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(inc.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate max-w-[250px]">{inc.description}</td>
                                    <td className="px-8 py-5"><span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500">{inc.method}</span></td>
                                    <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right">{formatCurrency(inc.amount)}</td>
                                    <td className="px-8 py-5 text-right">
                                       <div className="flex justify-end gap-1">
                                          <button onClick={() => { setEditingIncome(inc); setIncomeFormData({ amount: inc.amount.toString(), date: inc.date, description: inc.description, method: inc.method }); setShowQuickIncome(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                                          <button onClick={() => deleteIncome(inc.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                                       </div>
                                    </td>
                                 </tr>
                               ))
                             ) : (
                               projectArrivals.map((arrival, idx) => (
                                 <tr key={`${arrival.material.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                   <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(arrival.entry.date).toLocaleDateString()}</td>
                                   <td className="px-8 py-5">
                                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{arrival.material.name} <span className="text-[10px] font-bold text-slate-400">({arrival.material.unit})</span></p>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                                        {arrival.entry.type === 'Transfer' ? 'Inbound Transfer' : `Vendor: ${vendors.find(v => v.id === arrival.entry.vendorId)?.name || 'Direct'}`}
                                      </span>
                                   </td>
                                   <td className="px-8 py-5 text-center">
                                      <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{arrival.arrived.toLocaleString()}</span>
                                   </td>
                                   <td className="px-8 py-5 text-center">
                                      <div className="flex flex-col gap-1.5 items-center">
                                        {arrival.consumed > 0 && (
                                          <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-900/10 px-3 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/20">{arrival.consumed.toLocaleString()}</span>
                                            <span className="text-[8px] font-black uppercase text-amber-500">کنزیوم</span>
                                          </div>
                                        )}
                                        {arrival.transferred > 0 && (
                                          <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 px-3 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/20">{arrival.transferred.toLocaleString()}</span>
                                            <span className="text-[8px] font-black uppercase text-indigo-500">ٹرانسفر</span>
                                          </div>
                                        )}
                                        {arrival.consumed === 0 && arrival.transferred === 0 && (
                                          <span className="text-[10px] text-slate-300 font-bold uppercase italic">No Activity</span>
                                        )}
                                      </div>
                                   </td>
                                   <td className="px-8 py-5 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className={`text-xs font-black px-3 py-1 rounded-lg border ${arrival.remaining > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20' : 'text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-700'}`}>
                                          {arrival.remaining.toLocaleString()}
                                        </span>
                                        <span className="text-[8px] font-black uppercase text-slate-400 mt-0.5">باقی</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          disabled={arrival.remaining <= 0}
                                          onClick={() => { const batchId = arrival.entry.id.replace('sh-exp-', ''); setInventoryUsageForm({ materialId: arrival.material.id, batchId: batchId, vendorId: arrival.entry.vendorId || '', quantity: arrival.remaining.toString(), date: new Date().toISOString().split('T')[0], note: `Consumption of batch received on ${new Date(arrival.entry.date).toLocaleDateString()}` }); setShowInventoryUsageModal(true); }} 
                                          className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl shadow-sm transition-all ${arrival.remaining > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                        >
                                          Consume
                                        </button>
                                        <button 
                                          disabled={arrival.remaining <= 0}
                                          onClick={() => { setTransferForm({ materialId: arrival.material.id, batchId: arrival.entry.id.replace('sh-exp-', ''), destProjectId: '', quantity: arrival.remaining.toString(), date: new Date().toISOString().split('T')[0], note: '', unitPrice: arrival.entry.unitPrice || arrival.material.costPerUnit }); setTransferProjectSearch(''); setShowTransferModal(true); }} 
                                          className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl shadow-sm flex items-center gap-2 transition-all ${arrival.remaining > 0 ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                        >
                                          <ArrowRightLeft size={12} /> Send
                                        </button>
                                      </div>
                                   </td>
                                 </tr>
                               ))
                             )}
                          </tbody>
                        </table>
                     )}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0 bg-white dark:bg-slate-800"><button onClick={() => setViewingProject(null)} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all text-xs">Close Details</button></div>
            </div>
          </div>
        );
      })()}

      {/* Record Quick Income Modal for Project Insights */}
      {showQuickIncome && viewingProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/20">
                 <div className="flex gap-4 items-center">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><DollarSign size={24} /></div>
                    <div>
                       <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingIncome ? 'Edit Receipt' : 'Record Collection'}</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project: {viewingProject.name}</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowQuickIncome(false); setEditingIncome(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleQuickIncomeSubmit} className="p-8 space-y-5">
                 <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Milestone Description</label><textarea required rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" placeholder="e.g. 1st Floor Slab casting complete..." value={incomeFormData.description} onChange={e => setIncomeFormData(p => ({ ...p, description: e.target.value }))} /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label><input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-black text-lg dark:text-white" value={incomeFormData.amount} onChange={e => setIncomeFormData(p => ({ ...p, amount: e.target.value }))} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Value Date</label><input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white" value={incomeFormData.date} onChange={e => setIncomeFormData(p => ({ ...p, date: e.target.value }))} /></div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Settlement Channel</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                         <button key={m} type="button" onClick={() => setIncomeFormData(p => ({ ...p, method: m }))} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${incomeFormData.method === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-500'}`}>{m}</button>
                       ))}
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none active:scale-95 transition-all text-sm mt-4">Confirm Collection</button>
              </form>
           </div>
        </div>
      )}

      {/* Transfer Material Modal */}
      {showTransferModal && viewingProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-900 text-white">
                 <div className="flex gap-4 items-center">
                    <div className="p-3 bg-white/10 rounded-2xl"><ArrowRightLeft size={24} /></div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Inter-Site Transfer</h2>
                       <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Source: {viewingProject.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={28} /></button>
              </div>
              <form onSubmit={handleTransferSubmit} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destination Project (A-Z Search)</label>
                    <div className="relative mb-2">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                       <input 
                         type="text" 
                         placeholder="Deep Search Project Name..." 
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                         value={transferProjectSearch}
                         onChange={(e) => setTransferProjectSearch(e.target.value)}
                       />
                    </div>
                    <select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={transferForm.destProjectId} onChange={e => setTransferForm(p => ({ ...p, destProjectId: e.target.value }))}>
                       <option value="">Select Destination Site...</option>
                       {sortedTransferDestinations.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Transfer Qty</label>
                       <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg" value={transferForm.quantity} onChange={e => setTransferForm(p => ({ ...p, quantity: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Move Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold" value={transferForm.date} onChange={e => setTransferForm(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>

                 <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Internal Note / Gate Pass #</label><textarea className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold outline-none" rows={2} placeholder="e.g. Sent for slab work via Vehicle XYZ..." value={transferForm.note} onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))} /></div>

                 <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-3xl uppercase tracking-widest shadow-xl active:scale-95 transition-all">Authorize Stock Movement</button>
              </form>
           </div>
        </div>
      )}

      {/* Record Consumption Modal with Deep Search */}
      {showInventoryUsageModal && viewingProject && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Package size={24} /></div>
                  <div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Consumption</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Stock Deduction for {viewingProject.name}</p></div>
                </div>
                <button onClick={() => { setShowInventoryUsageModal(false); setUsageMaterialSearch(''); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
             </div>
             <form onSubmit={handleInventoryUsageSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Search & Select Batch (A-Z)</label>
                   
                   {/* Deep Search Input */}
                   <div className="relative mb-2">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input 
                       type="text" 
                       placeholder="Deep Search: Name or Vendor..."
                       className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                       value={usageMaterialSearch}
                       onChange={(e) => setUsageMaterialSearch(e.target.value)}
                     />
                   </div>

                   <select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none text-xs focus:ring-2 focus:ring-blue-500" value={`${inventoryUsageForm.materialId}|${inventoryUsageForm.batchId}`} onChange={e => { const [mId, bId] = e.target.value.split('|'); setInventoryUsageForm(p => ({ ...p, materialId: mId, batchId: bId })); }}>
                     <option value="|">{siteRelevantMaterials.length > 0 ? 'Choose stock batch...' : 'No batches found'}</option>
                     {siteRelevantMaterials.map((batch, idx) => (<option key={idx} value={`${batch.id}|${batch.batchId}`} className={batch.isLocal ? 'text-emerald-600 font-black' : 'text-blue-500 font-medium'}>{batch.name} / {batch.vendorName} / {formatCurrency(batch.unitPrice)} / {batch.available.toLocaleString()} {batch.unit}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label><input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={inventoryUsageForm.quantity} onChange={e => setInventoryUsageForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0.00" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label><input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={inventoryUsageForm.date} onChange={e => setInventoryUsageForm(p => ({ ...p, date: e.target.value }))} /></div>
                </div>

                {inventoryUsageForm.materialId && inventoryUsageForm.quantity && (
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-[1.8rem] border-2 border-blue-100 dark:border-blue-800 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                       <div>
                          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">Total Consumption Value</p>
                          <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{formatCurrency(currentTotalValue)}</p>
                       </div>
                       <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-100 dark:border-slate-700 text-blue-600">
                          <DollarSign size={24} />
                       </div>
                    </div>
                )}

                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Consumption Note / Location</label><textarea rows={2} placeholder="e.g. Ground floor columns..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={inventoryUsageForm.note} onChange={e => setInventoryUsageForm(p => ({ ...p, note: e.target.value }))} /></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm uppercase tracking-widest">Confirm Realized Cost</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};