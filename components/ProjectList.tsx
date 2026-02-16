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
  TrendingDown
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

  // Quick Pay state
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

  // Fixed syntax error here: setIncomeFormData was incorrectly repeated for invoiceFormData
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setViewingProject(null);
        setShowQuickExpense(false);
        setShowQuickIncome(false);
        setShowInvoiceModal(false);
        setShowInventoryUsageModal(false);
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

  const filteredProjects = projects.filter(p => filter === 'All' || p.status === filter);

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const projectIncomes = incomes.filter(i => i.projectId === projectId);
    const projectInvoices = invoices.filter(inv => inv.projectId === projectId);
    const actualSiteExpenses = projectExpenses.filter(e => e.inventoryAction !== 'Purchase');
    const totalSpent = actualSiteExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCollected = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const progress = Math.min(100, Math.round((totalSpent / budget) * 100)) || 0;
    const categories: Record<string, number> = {};
    actualSiteExpenses.forEach(e => { categories[e.category] = (categories[e.category] || 0) + e.amount; });
    return { totalSpent, totalCollected, totalInvoiced, receivable: totalInvoiced - totalCollected, progress, categoryBreakdown: categories, allExpenses: projectExpenses };
  };

  const projectArrivals = useMemo(() => {
    if (!viewingProject) return [];
    const arrivals: { material: Material, entry: StockHistoryEntry }[] = [];
    materials.forEach(m => {
      m.history?.forEach(h => {
        if (h.type === 'Purchase' && h.projectId === viewingProject.id) { arrivals.push({ material: m, entry: h }); }
      });
    });
    return arrivals.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime());
  }, [viewingProject, materials]);

  const siteRelevantMaterials = useMemo(() => {
    if (!viewingProject) return [];
    const batches: any[] = [];
    
    materials.forEach(mat => {
      const history = mat.history || [];
      const purchaseEntries = history.filter(h => h.type === 'Purchase');
      
      purchaseEntries.forEach(purchase => {
        const batchId = purchase.id.replace('sh-exp-', '');
        
        // Calculate remaining in this specific batch
        const usagesAgainstThisBatch = history.filter(h => 
          h.type === 'Usage' && h.parentPurchaseId === batchId
        );
        const totalUsedFromBatch = usagesAgainstThisBatch.reduce((sum, u) => sum + u.quantity, 0);
        const availableInBatch = purchase.quantity - totalUsedFromBatch;

        if (availableInBatch > 0) {
          const vendor = vendors.find(v => v.id === purchase.vendorId);
          batches.push({
            id: mat.id,
            name: mat.name,
            unit: mat.unit,
            batchId: batchId,
            vendorName: vendor?.name || 'Standard Supplier',
            vendorId: purchase.vendorId,
            unitPrice: purchase.unitPrice || mat.costPerUnit,
            available: availableInBatch,
            isLocal: purchase.projectId === viewingProject.id
          });
        }
      });
    });

    return batches.sort((a, b) => (a.isLocal === b.isLocal ? 0 : a.isLocal ? -1 : 1));
  }, [materials, viewingProject, vendors]);

  // Real-time calculation for display
  const selectedBatchForTotal = useMemo(() => {
    return siteRelevantMaterials.find(b => 
      b.id === inventoryUsageForm.materialId && b.batchId === inventoryUsageForm.batchId
    );
  }, [siteRelevantMaterials, inventoryUsageForm.materialId, inventoryUsageForm.batchId]);

  const currentTotalValue = (selectedBatchForTotal?.unitPrice || 0) * (parseFloat(inventoryUsageForm.quantity) || 0);

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;
    const data: Expense = { id: editingExpense ? editingExpense.id : 'e' + Date.now(), date: expenseFormData.date, projectId: viewingProject.id, vendorId: expenseFormData.vendorId || undefined, amount: parseFloat(expenseFormData.amount) || 0, paymentMethod: expenseFormData.paymentMethod, category: expenseFormData.category, notes: expenseFormData.notes || `Project ${expenseFormData.category} cost`, materialId: expenseFormData.materialId || undefined, materialQuantity: expenseFormData.materialId ? parseFloat(expenseFormData.materialQuantity) || undefined : undefined, inventoryAction: editingExpense?.inventoryAction || (expenseFormData.vendorId ? 'Purchase' : 'Usage'), parentPurchaseId: editingExpense?.parentPurchaseId };
    if (editingExpense) await updateExpense(data); else await addExpense(data);
    setShowQuickExpense(false);
    setEditingExpense(null);
    resetQuickExpenseForm();
  };

  const handleInventoryUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject || !inventoryUsageForm.materialId || !inventoryUsageForm.batchId) return;
    const selectedBatch = siteRelevantMaterials.find(b => b.id === inventoryUsageForm.materialId && b.batchId === inventoryUsageForm.batchId);
    if (!selectedBatch) return;
    const qty = parseFloat(inventoryUsageForm.quantity) || 0;
    if (selectedBatch.available < qty) { alert(`Error: Insufficient stock in this batch. (Available: ${selectedBatch.available} ${selectedBatch.unit})`); return; }
    const totalCost = qty * selectedBatch.unitPrice;
    await addExpense({ id: 'e-inv-' + Date.now(), date: inventoryUsageForm.date, projectId: viewingProject.id, amount: totalCost, paymentMethod: 'Bank', category: 'Material', materialId: selectedBatch.id, vendorId: selectedBatch.vendorId, inventoryAction: 'Usage', materialQuantity: qty, parentPurchaseId: selectedBatch.batchId, notes: inventoryUsageForm.note || `Consumption: ${qty} ${selectedBatch.unit} of ${selectedBatch.name}` });
    setShowInventoryUsageModal(false);
    setInventoryUsageForm({ materialId: '', batchId: '', vendorId: '', quantity: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Project Management</h2>
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
        {siteStatuses.map(tab => (
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

      {/* Project Add/Edit Modal */}
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
                      {siteStatuses.map(s => <option key={s} value={s}>{s}</option>)}
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
        const projectIncomes = incomes.filter(i => i.projectId === viewingProject.id);
        const projectInvoices = invoices.filter(inv => inv.projectId === viewingProject.id);
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
                      <button onClick={() => setActiveDetailTab('arrivals')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'arrivals' ? 'bg-white dark:bg-slate-800 text-amber-600 border-b-4 border-amber-600' : 'text-slate-400'}`}>Material Arrivals</button>
                    </div>
                    <div className="p-4 sm:p-0 flex gap-2 w-full sm:w-auto">
                      {activeDetailTab === 'expenses' && (
                        <button onClick={() => setShowInventoryUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Package size={16} /> Record Use</button>
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
                                   {Object.entries(metrics.categoryBreakdown).map(([cat, amt]) => (
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
                        <table className="w-full text-left min-w-[700px]">
                          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                            <tr><th className="px-8 py-5">Value Date</th><th className="px-8 py-5">Ledger Entry Details</th><th className="px-8 py-5 text-center">Quantity</th><th className="px-8 py-5 text-right">Amount</th><th className="px-8 py-5 text-right">Control</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {activeDetailTab === 'expenses' ? (
                               metrics.allExpenses.filter(e => e.inventoryAction !== 'Purchase').slice().reverse().map(e => {
                                 const isConsumption = e.inventoryAction === 'Usage';
                                 const mat = e.materialId ? materials.find(m => m.id === e.materialId) : null;
                                 return (
                                   <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                     <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                                     <td className="px-8 py-5">
                                       <div className="flex flex-col"><div className="flex items-center gap-2">{isConsumption ? <TrendingDown size={14} className="text-blue-500" /> : <Receipt size={14} className="text-slate-400" />}{mat ? (<p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter truncate max-w-[300px]">{mat.name} <span className="text-[10px] font-bold text-slate-400">({mat.unit})</span></p>) : (<p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter truncate max-w-[300px]">{e.category}</p>)}</div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-tight">Supplier: {e.vendorId ? (vendors.find(v => v.id === e.vendorId)?.name || 'Standard Supplier') : 'Self / Direct'}</p></div>
                                     </td>
                                     <td className="px-8 py-5 text-center">{e.materialQuantity ? (<span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{e.materialQuantity.toLocaleString()} {mat?.unit || ''}</span>) : <span className="text-slate-300">--</span>}</td>
                                     <td className="px-8 py-5 text-sm font-black text-red-600 text-right">{formatCurrency(e.amount)}</td>
                                     <td className="px-8 py-5 text-right"><div className="flex justify-end gap-1"><button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button></div></td>
                                   </tr>
                                 );
                               })
                             ) : (
                               projectArrivals.map((arrival, idx) => (
                                 <tr key={`${arrival.material.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                   <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(arrival.entry.date).toLocaleDateString()}</td>
                                   <td className="px-8 py-5"><p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{arrival.material.name} <span className="text-[10px] font-bold text-slate-400">({arrival.material.unit})</span></p><span className="text-[9px] font-bold text-slate-400 uppercase">Vendor: {vendors.find(v => v.id === arrival.entry.vendorId)?.name || 'Direct'}</span></td>
                                   <td className="px-8 py-5 text-center"><span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{arrival.entry.quantity.toLocaleString()} {arrival.material.unit}s</span></td>
                                   <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white text-right">--</td>
                                   <td className="px-8 py-5 text-right"><button onClick={() => { const batchId = arrival.entry.id.replace('sh-exp-', ''); setInventoryUsageForm({ materialId: arrival.material.id, batchId: batchId, vendorId: arrival.entry.vendorId || '', quantity: arrival.entry.quantity.toString(), date: new Date().toISOString().split('T')[0], note: `Consumption of batch received on ${new Date(arrival.entry.date).toLocaleDateString()}` }); setShowInventoryUsageModal(true); }} className="px-4 py-2 text-[10px] font-black uppercase bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all">Record Consumption</button></td>
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

      {/* Record Consumption Modal */}
      {showInventoryUsageModal && viewingProject && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Package size={24} /></div>
                  <div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Consumption</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Stock Deduction for {viewingProject.name}</p></div>
                </div>
                <button onClick={() => setShowInventoryUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
             </div>
             <form onSubmit={handleInventoryUsageSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Select Batch (Material / Vendor / Unit Price / Available)</label>
                   <select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none text-xs focus:ring-2 focus:ring-blue-500" value={`${inventoryUsageForm.materialId}|${inventoryUsageForm.batchId}`} onChange={e => { const [mId, bId] = e.target.value.split('|'); setInventoryUsageForm(p => ({ ...p, materialId: mId, batchId: bId })); }}>
                     <option value="|">Choose stock batch...</option>
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