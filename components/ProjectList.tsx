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

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: 'Active'
  });

  const [expenseFormData, setExpenseFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], category: 'Labor', 
    vendorId: '', notes: '', paymentMethod: 'Bank' as PaymentMethod,
    materialId: '', materialQuantity: ''
  });

  // Auto-sync amount if material quantity changes during edit for inventory entries
  useEffect(() => {
    if (editingExpense?.materialId && expenseFormData.materialQuantity) {
      const mat = materials.find(m => m.id === editingExpense.materialId);
      if (mat) {
        const qty = parseFloat(expenseFormData.materialQuantity) || 0;
        const isPurchase = editingExpense.inventoryAction === 'Purchase';
        // For usage, we use current costPerUnit. For purchase, we might use unitPrice from history, 
        // but for simplicity and ledger consistency with app logic, we follow amount = qty * costPerUnit if synced.
        const newAmount = qty * mat.costPerUnit;
        setExpenseFormData(prev => ({ ...prev, amount: newAmount.toFixed(2) }));
      }
    }
  }, [expenseFormData.materialQuantity, editingExpense, materials]);

  const [incomeFormData, setIncomeFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' as PaymentMethod
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], description: '', status: 'Sent' as Invoice['status']
  });

  const [inventoryUsageForm, setInventoryUsageForm] = useState({
    materialId: '', 
    vendorId: '', 
    quantity: '', 
    date: new Date().toISOString().split('T')[0], 
    note: ''
  });

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

  const filteredProjects = projects.filter(p => filter === 'All' || p.status === filter);

  // Material Arrivals Logic
  const projectArrivals = useMemo(() => {
    if (!viewingProject) return [];
    const arrivals: { material: Material, entry: StockHistoryEntry }[] = [];
    materials.forEach(m => {
      m.history?.forEach(h => {
        if (h.type === 'Purchase' && h.projectId === viewingProject.id) {
          arrivals.push({ material: m, entry: h });
        }
      });
    });
    return arrivals.sort((a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime());
  }, [viewingProject, materials]);

  // Refined siteRelevantMaterials
  const siteRelevantMaterials = useMemo(() => {
    if (!viewingProject) return [];
    
    const results: any[] = [];
    
    materials.forEach(m => {
      const allHistory = m.history || [];
      const purchaseEntries = allHistory.filter(h => h.type === 'Purchase');
      
      if (purchaseEntries.length === 0) return;

      const vendorIds = Array.from(new Set(purchaseEntries.map(h => h.vendorId).filter(Boolean)));
      
      vendorIds.forEach(vid => {
        const vName = vendors.find(v => v.id === vid)?.name || 'Standard Supplier';
        
        const sitePurchases = allHistory.filter(h => h.type === 'Purchase' && h.vendorId === vid && h.projectId === viewingProject.id);
        const siteUsages = allHistory.filter(h => h.type === 'Usage' && h.vendorId === vid && h.projectId === viewingProject.id);
        
        const sitePurchasedQty = sitePurchases.reduce((sum, h) => sum + h.quantity, 0);
        const siteUsedQty = siteUsages.reduce((sum, h) => sum + h.quantity, 0);
        const netSiteAvailable = sitePurchasedQty - siteUsedQty;

        const globalPurchased = allHistory.filter(h => h.type === 'Purchase' && h.vendorId === vid).reduce((sum, h) => sum + h.quantity, 0);
        const globalUsed = allHistory.filter(h => h.type === 'Usage' && h.vendorId === vid).reduce((sum, h) => sum + h.quantity, 0);
        const netGlobalAvailable = globalPurchased - globalUsed;

        if (netGlobalAvailable <= 0 && netSiteAvailable <= 0) return;

        results.push({
          id: m.id,
          name: m.name,
          unit: m.unit,
          vendorId: vid,
          vendorName: vName,
          sitePurchasedFromVendor: netSiteAvailable,
          globalAvailable: netGlobalAvailable,
          priority: netSiteAvailable > 0 ? 1 : 0
        });
      });
    });

    return results.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return (b.sitePurchasedFromVendor || b.globalAvailable) - (a.sitePurchasedFromVendor || a.globalAvailable);
    });
  }, [materials, viewingProject, vendors]);

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const projectIncomes = incomes.filter(i => i.projectId === projectId);
    const projectInvoices = invoices.filter(inv => inv.projectId === projectId);
    
    // EXCLUDE PROCUREMENT FROM SITE COSTS. ONLY INCLUDE USAGE AND GENERAL OVERHEADS.
    const actualSiteExpenses = projectExpenses.filter(e => e.inventoryAction !== 'Purchase');
    
    const totalSpent = actualSiteExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCollected = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const progress = Math.min(100, Math.round((totalSpent / budget) * 100)) || 0;
    
    const categories: Record<string, number> = {};
    actualSiteExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    return { 
      totalSpent, 
      totalCollected, 
      totalInvoiced, 
      receivable: totalInvoiced - totalCollected,
      progress, 
      categoryBreakdown: categories,
      allExpenses: projectExpenses // Original for other uses
    };
  };

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setFormData({ 
      name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: siteStatuses[0] || 'Active' 
    });
    setShowModal(true);
  };

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;

    const data: Expense = {
      id: editingExpense ? editingExpense.id : 'e' + Date.now(),
      date: expenseFormData.date,
      projectId: viewingProject.id,
      vendorId: expenseFormData.vendorId || undefined,
      amount: parseFloat(expenseFormData.amount) || 0,
      paymentMethod: expenseFormData.paymentMethod,
      category: expenseFormData.category,
      notes: expenseFormData.notes || `Project ${expenseFormData.category} cost`,
      materialId: expenseFormData.materialId || undefined,
      materialQuantity: expenseFormData.materialId ? parseFloat(expenseFormData.materialQuantity) || undefined : undefined,
      inventoryAction: editingExpense?.inventoryAction || (expenseFormData.vendorId ? 'Purchase' : 'Usage')
    };

    if (editingExpense) {
      await updateExpense(data);
    } else {
      await addExpense(data);
    }

    setShowQuickExpense(false);
    setEditingExpense(null);
    resetQuickExpenseForm();
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;

    const data: Invoice = {
      id: editingInvoice ? editingInvoice.id : 'inv' + Date.now(),
      projectId: viewingProject.id,
      date: invoiceFormData.date,
      dueDate: invoiceFormData.dueDate,
      amount: parseFloat(invoiceFormData.amount) || 0,
      description: invoiceFormData.description,
      status: invoiceFormData.status
    };

    if (editingInvoice) {
      await updateInvoice(data);
    } else {
      await addInvoice(data);
    }

    setShowInvoiceModal(false);
    setEditingInvoice(null);
    setInvoiceFormData({
      amount: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], description: '', status: 'Sent'
    });
  };

  const handleInventoryUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject || !inventoryUsageForm.materialId || !inventoryUsageForm.vendorId) return;

    const material = materials.find(m => m.id === inventoryUsageForm.materialId);
    const qty = parseFloat(inventoryUsageForm.quantity) || 0;
    const vendorId = inventoryUsageForm.vendorId;

    if (!material) return;

    const selection = siteRelevantMaterials.find(s => s.id === material.id && s.vendorId === vendorId);
    const available = selection ? (selection.sitePurchasedFromVendor > 0 ? selection.sitePurchasedFromVendor : selection.globalAvailable) : 0;

    if (available < qty) {
      alert(`Error: Insufficient stock. (Available: ${available} ${material.unit})`);
      return;
    }

    const totalCost = qty * material.costPerUnit;

    await addExpense({
      id: 'e-inv-' + Date.now(),
      date: inventoryUsageForm.date,
      projectId: viewingProject.id,
      amount: totalCost,
      paymentMethod: 'Bank',
      category: 'Material',
      materialId: material.id,
      vendorId: vendorId, 
      inventoryAction: 'Usage',
      materialQuantity: qty,
      notes: inventoryUsageForm.note || `Consumption: ${qty} ${material.unit} of ${material.name}`
    });

    setShowInventoryUsageModal(false);
    setInventoryUsageForm({ materialId: '', vendorId: '', quantity: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const handleEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseFormData({
      amount: exp.amount.toString(),
      date: exp.date,
      category: exp.category,
      vendorId: exp.vendorId || '',
      notes: exp.notes,
      paymentMethod: exp.paymentMethod,
      materialId: exp.materialId || '',
      materialQuantity: exp.materialQuantity?.toString() || ''
    });
    setShowQuickExpense(true);
  };

  const handleInitiatePayFromInsights = (exp: Expense) => {
    const totalPaidForExp = payments
      .filter(p => p.materialBatchId === 'sh-exp-' + exp.id)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const remaining = Math.max(0, exp.amount - totalPaidForExp);
    
    setSelectedExpForPay(exp);
    setPayFormData({
      amount: remaining.toString(),
      date: new Date().toISOString().split('T')[0],
      method: 'Bank',
      reference: ''
    });
    setShowQuickPayModal(true);
  };

  const handleQuickPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpForPay || !selectedExpForPay.vendorId) return;

    const amountNum = parseFloat(payFormData.amount) || 0;
    if (amountNum <= 0) return;

    const payment: Payment = {
      id: 'pay-exp-' + Date.now(),
      date: payFormData.date,
      vendorId: selectedExpForPay.vendorId,
      projectId: selectedExpForPay.projectId,
      amount: amountNum,
      method: payFormData.method,
      reference: payFormData.reference,
      materialBatchId: 'sh-exp-' + selectedExpForPay.id
    };

    addPayment(payment);
    setShowQuickPayModal(false);
    setSelectedExpForPay(null);
  };

  const handleTriggerUsageFromArrival = (arrival: { material: Material, entry: StockHistoryEntry }) => {
    setInventoryUsageForm({
      materialId: arrival.material.id,
      vendorId: arrival.entry.vendorId || '',
      quantity: arrival.entry.quantity.toString(), 
      date: new Date().toISOString().split('T')[0],
      note: `Consumption of batch received on ${new Date(arrival.entry.date).toLocaleDateString()} from ${vendors.find(v => v.id === arrival.entry.vendorId)?.name}`
    });
    setShowInventoryUsageModal(true);
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
        <button
          onClick={() => setFilter('All')}
          className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filter === 'All' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
        >
          All
        </button>
        {siteStatuses.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const { progress, totalSpent, totalCollected } = calculateProjectMetrics(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col shadow-sm">
              <div className="p-6 flex-1">
                <div className="flex justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30'}`}>
                    {project.status}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProject(project); setFormData({ name: project.name, client: project.client, location: project.location, contactNumber: project.contactNumber || '', budget: project.budget.toString(), startDate: project.startDate, endDate: project.endDate, description: project.description || '', status: project.status }); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                    <button onClick={() => { if(confirm(`Delete ${project.name}?`)) deleteProject(project.id); }} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{project.name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase flex items-center gap-1.5 mt-1">
                  <MapPin size={12} /> {project.location}
                </p>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                      <span>Realized Costs</span>
                      <span className="text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Spent (Consumed)</p>
                      <p className="text-xs font-bold text-red-600 truncate">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                      <p className="text-[9px] text-emerald-600 font-black uppercase mb-1">Collected</p>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(totalCollected)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setViewingProject(project); setActiveDetailTab('expenses'); }}
                className="w-full py-5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center justify-between px-6 hover:bg-blue-600 hover:text-white transition-all"
              >
                Project Insights
                <ChevronRight size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Insights Modal */}
      {viewingProject && (() => {
        const metrics = calculateProjectMetrics(viewingProject.id, viewingProject.budget);
        const projectIncomes = incomes.filter(i => i.projectId === viewingProject.id);
        const projectInvoices = invoices.filter(inv => inv.projectId === viewingProject.id);
        
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-6xl h-[92vh] shadow-2xl overflow-hidden flex flex-col scale-100 transition-all duration-300">
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{viewingProject.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Client: {viewingProject.client}</p>
                  </div>
                </div>
                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Spent Budget</p>
                     <p className="text-xl font-black text-red-600">{formatCurrency(metrics.totalSpent)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Total Billed</p>
                     <p className="text-xl font-black text-blue-600">{formatCurrency(metrics.totalInvoiced)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Total Received</p>
                     <p className="text-xl font-black text-emerald-600">{formatCurrency(metrics.totalCollected)}</p>
                  </div>
                  <div className="bg-blue-600 p-5 rounded-3xl shadow-xl text-white flex flex-col justify-between">
                     <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Total Receivable</p>
                     <p className="text-xl font-black mt-2">
                       {formatCurrency(metrics.receivable)}
                     </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                  <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-700 justify-between items-start sm:items-center pr-6 bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
                      <button onClick={() => setActiveDetailTab('budget')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'budget' ? 'bg-white dark:bg-slate-800 text-slate-900 border-b-4 border-slate-900' : 'text-slate-400'}`}>Master Budget</button>
                      <button onClick={() => setActiveDetailTab('expenses')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'expenses' ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Site Costs</button>
                      <button onClick={() => setActiveDetailTab('invoices')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'invoices' ? 'bg-white dark:bg-slate-800 text-blue-500 border-b-4 border-blue-500' : 'text-slate-400'}`}>Client Billing</button>
                      <button onClick={() => setActiveDetailTab('income')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Collections</button>
                      <button onClick={() => setActiveDetailTab('arrivals')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'arrivals' ? 'bg-white dark:bg-slate-800 text-amber-600 border-b-4 border-amber-600' : 'text-slate-400'}`}>Material Arrivals</button>
                    </div>
                    <div className="p-4 sm:p-0 flex gap-2 w-full sm:w-auto">
                      {activeDetailTab === 'expenses' ? (
                        <>
                          <button onClick={() => setShowInventoryUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Package size={16} /> Record Use</button>
                          <button onClick={() => { setEditingExpense(null); resetQuickExpenseForm(); setShowQuickExpense(true); }} className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Receipt size={16} /> New Cost</button>
                        </>
                      ) : activeDetailTab === 'invoices' ? (
                        <button onClick={() => { setEditingInvoice(null); setShowInvoiceModal(true); }} className="flex-1 sm:flex-none bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><FileText size={16} /> Create Invoice</button>
                      ) : activeDetailTab === 'income' ? (
                        <button onClick={() => { setEditingIncome(null); setShowQuickIncome(true); }} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><ArrowDownCircle size={16} /> Add Payment</button>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar">
                     {activeDetailTab === 'budget' && (
                       <div className="p-8 space-y-8 animate-in fade-in duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                  <Target size={18} className="text-blue-600" />
                                  Financial Pulse
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                   <div className="flex justify-between items-center mb-4">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Realized Burn Rate</span>
                                      <span className={`text-sm font-black ${metrics.progress > 90 ? 'text-red-600' : 'text-blue-600'}`}>{metrics.progress}%</span>
                                   </div>
                                   <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                                      <div className={`h-full transition-all duration-1000 ${metrics.progress > 90 ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${metrics.progress}%` }}></div>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 mt-6">
                                      <div>
                                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Project Budget</p>
                                         <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(viewingProject.budget)}</p>
                                      </div>
                                      <div>
                                         <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Remaining Headroom</p>
                                         <p className="text-lg font-black text-emerald-600">{formatCurrency(Math.max(0, viewingProject.budget - metrics.totalSpent))}</p>
                                      </div>
                                   </div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                   <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                   <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed uppercase tracking-tight">Financial Mode: Procurement Arrivals are ignored in budget burn until 'Recorded as Consumed' on site.</p>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                  <PieChart size={18} className="text-emerald-600" />
                                  Realized Costs by Category
                                </h3>
                                <div className="space-y-3">
                                   {Object.entries(metrics.categoryBreakdown).map(([cat, amt]) => (
                                     <div key={cat} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm group hover:border-blue-400 transition-all">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors"><Tag size={14} /></div>
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{cat}</span>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(amt)}</p>
                                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{Math.round((amt / (metrics.totalSpent || 1)) * 100)}% of realization</p>
                                        </div>
                                     </div>
                                   ))}
                                   {Object.keys(metrics.categoryBreakdown).length === 0 && (
                                     <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
                                        <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No realized spending recorded</p>
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                     )}

                     {activeDetailTab !== 'budget' && (
                        <table className="w-full text-left min-w-[700px]">
                          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                            <tr>
                             <th className="px-8 py-5">Value Date</th>
                             <th className="px-8 py-5">Ledger Entry Details</th>
                             <th className="px-8 py-5 text-center">Quantity</th>
                             <th className="px-8 py-5 text-right">Amount</th>
                             <th className="px-8 py-5 text-right">Control</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {activeDetailTab === 'expenses' ? (
                               // FILTER OUT PURCHASE TYPE ENTRIES FROM THE SITE COSTS LIST
                               metrics.allExpenses.filter(e => e.inventoryAction !== 'Purchase').slice().reverse().map(e => {
                                 const isConsumption = e.inventoryAction === 'Usage';
                                 const mat = e.materialId ? materials.find(m => m.id === e.materialId) : null;
                                 const vName = e.vendorId ? (vendors.find(v => v.id === e.vendorId)?.name || 'Standard Supplier') : 'Self / Direct';
   
                                 return (
                                   <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                     <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                                     <td className="px-8 py-5">
                                       <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                             {isConsumption ? <TrendingDown size={14} className="text-blue-500" /> : <Receipt size={14} className="text-slate-400" />}
                                             {mat ? (
                                               <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter truncate max-w-[300px]">
                                                 {mat.name} <span className="text-[10px] font-bold text-slate-400">({mat.unit})</span>
                                               </p>
                                             ) : (
                                               <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter truncate max-w-[300px]">{e.category}</p>
                                             )}
                                          </div>
                                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-tight">Supplier: {vName}</p>
                                          {isConsumption && (
                                            <div className="flex items-center gap-2 mt-1.5">
                                               <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase border flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-100">
                                                 <Scale size={8} /> Stock Consumption
                                               </span>
                                            </div>
                                          )}
                                       </div>
                                     </td>
                                     <td className="px-8 py-5 text-center">
                                       {e.materialQuantity ? (
                                         <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                           {e.materialQuantity.toLocaleString()} {mat?.unit || ''}
                                         </span>
                                       ) : <span className="text-slate-300">--</span>}
                                     </td>
                                     <td className="px-8 py-5 text-sm font-black text-red-600 text-right">{formatCurrency(e.amount)}</td>
                                     <td className="px-8 py-5 text-right">
                                       <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                         <button onClick={() => handleEditExpense(e)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                                         <button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                                       </div>
                                     </td>
                                   </tr>
                                 );
                               })
                             ) : activeDetailTab === 'invoices' ? (
                               projectInvoices.slice().reverse().map(inv => (
                                 <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                   <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(inv.date).toLocaleDateString()}</td>
                                   <td className="px-8 py-5">
                                     <div className="flex flex-col">
                                       <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{inv.description}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                           {inv.status}
                                         </span>
                                         <span className="text-[8px] font-black text-slate-400 uppercase">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                                       </div>
                                     </div>
                                   </td>
                                   <td className="px-8 py-5 text-center text-slate-300">--</td>
                                   <td className="px-8 py-5 text-sm font-black text-blue-600 text-right">{formatCurrency(inv.amount)}</td>
                                   <td className="px-8 py-5 text-right">
                                     <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                       <button onClick={() => { setEditingInvoice(inv); setInvoiceFormData({ amount: inv.amount.toString(), date: inv.date, dueDate: inv.dueDate, description: inv.description, status: inv.status }); setShowInvoiceModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                                       <button onClick={() => deleteInvoice(inv.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                                     </div>
                                   </td>
                                 </tr>
                               ))
                             ) : activeDetailTab === 'income' ? (
                               projectIncomes.slice().reverse().map(i => (
                                 <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                   <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(i.date).toLocaleDateString()}</td>
                                   <td className="px-8 py-5">
                                     <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{i.description}</p>
                                     <span className="text-[9px] font-black text-slate-400 uppercase">{i.method} Receipt</span>
                                   </td>
                                   <td className="px-8 py-5 text-center text-slate-300">--</td>
                                   <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right">{formatCurrency(i.amount)}</td>
                                   <td className="px-8 py-5 text-right">
                                     <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                       <button onClick={() => { setEditingIncome(i); setIncomeFormData({ amount: i.amount.toString(), date: i.date, description: i.description, method: i.method }); setShowQuickIncome(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                                       <button onClick={() => deleteIncome(i.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
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
                                     <span className="text-[9px] font-bold text-slate-400 uppercase">Vendor: {vendors.find(v => v.id === arrival.entry.vendorId)?.name || 'Direct'}</span>
                                   </td>
                                   <td className="px-8 py-5 text-center">
                                     <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                       {arrival.entry.quantity.toLocaleString()} {arrival.material.unit}s
                                     </span>
                                   </td>
                                   <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white text-right">--</td>
                                   <td className="px-8 py-5 text-right">
                                     <button onClick={() => handleTriggerUsageFromArrival(arrival)} className="px-4 py-2 text-[10px] font-black uppercase bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all">Record Consumption</button>
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
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0 bg-white dark:bg-slate-800">
                 <button onClick={() => setViewingProject(null)} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all text-xs">Close Details</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invoice Generation Modal */}
      {showInvoiceModal && viewingProject && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg"><FileText size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Client Invoice</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Milestone Billing for {viewingProject.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
             </div>
             <form onSubmit={handleInvoiceSubmit} className="p-8 space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Milestone Description</label>
                   <textarea required rows={2} placeholder="e.g. Mobilization Fee or Foundation Casting Milestone..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={invoiceFormData.description} onChange={e => setInvoiceFormData(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Invoice Date</label>
                      <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={invoiceFormData.date} onChange={e => setInvoiceFormData(p => ({ ...p, date: e.target.value }))} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Due Date</label>
                      <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={invoiceFormData.dueDate} onChange={e => setInvoiceFormData(p => ({ ...p, dueDate: e.target.value }))} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Invoice Amount (Rs.)</label>
                    <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none" value={invoiceFormData.amount} onChange={e => setInvoiceFormData(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={invoiceFormData.status} onChange={e => setInvoiceFormData(p => ({ ...p, status: e.target.value as any }))}>
                       <option value="Draft">Draft</option>
                       <option value="Sent">Sent to Client</option>
                       <option value="Paid">Fully Paid</option>
                       <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white py-4 rounded-3xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm uppercase tracking-widest">
                   {editingInvoice ? 'Update Invoice' : 'Generate Invoice Record'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Record Payment (Income) Modal */}
      {showQuickIncome && viewingProject && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><ArrowDownCircle size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Collection</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Funds received from Client</p>
                  </div>
                </div>
                <button onClick={() => setShowQuickIncome(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
             </div>
             <form onSubmit={async (e) => {
               e.preventDefault();
               const data: Income = {
                 id: editingIncome ? editingIncome.id : 'inc' + Date.now(),
                 projectId: viewingProject.id,
                 date: incomeFormData.date,
                 amount: parseFloat(incomeFormData.amount) || 0,
                 description: incomeFormData.description,
                 method: incomeFormData.method
               };
               if (editingIncome) await updateIncome(data); else await addIncome(data);
               setShowQuickIncome(false);
               setEditingIncome(null);
               setIncomeFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' });
             }} className="p-8 space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Description</label>
                   <textarea required rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={incomeFormData.description} onChange={e => setIncomeFormData(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label>
                      <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none" value={incomeFormData.amount} onChange={e => setIncomeFormData(p => ({ ...p, amount: e.target.value }))} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Value Date</label>
                      <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={incomeFormData.date} onChange={e => setIncomeFormData(p => ({ ...p, date: e.target.value }))} />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Method</label>
                   <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button key={m} type="button" onClick={() => setIncomeFormData(p => ({ ...p, method: m }))} className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${incomeFormData.method === m ? 'bg-slate-900 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>{m}</button>
                     ))}
                   </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all text-sm uppercase tracking-widest">
                   {editingIncome ? 'Update Collection' : 'Confirm Collection'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Record Consumption Modal */}
      {showInventoryUsageModal && viewingProject && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Package size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Consumption</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Stock Deduction for {viewingProject.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowInventoryUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
             </div>
             <form onSubmit={handleInventoryUsageSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material to Deduct (Net stock per vendor)</label>
                   <select 
                    required
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none text-xs focus:ring-2 focus:ring-blue-500" 
                    value={`${inventoryUsageForm.materialId}|${inventoryUsageForm.vendorId}`}
                    onChange={e => {
                      const [mId, vId] = e.target.value.split('|');
                      setInventoryUsageForm(p => ({ ...p, materialId: mId, vendorId: vId }));
                    }}
                  >
                     <option value="|">Select stock stream...</option>
                     {siteRelevantMaterials.map((m, idx) => {
                       const isLocal = m.priority === 1;
                       const currentStock = isLocal ? m.sitePurchasedFromVendor : m.globalAvailable;
                       return (
                         <option 
                            key={idx} 
                            value={`${m.id}|${m.vendorId}`}
                            className={isLocal ? 'text-emerald-600 font-black' : 'text-blue-500 font-medium'}
                         >
                           {m.name} ({m.unit}) • {m.vendorName} • Bal: {currentStock.toLocaleString()}
                         </option>
                       );
                     })}
                  </select>
                  <div className="flex gap-4 px-1">
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black uppercase text-emerald-600">At This Site</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-[9px] font-black uppercase text-blue-500">Global Stock</span>
                     </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                    <input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={inventoryUsageForm.quantity} onChange={e => setInventoryUsageForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                    <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={inventoryUsageForm.date} onChange={e => setInventoryUsageForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Consumption Note / Location</label>
                   <textarea rows={2} placeholder="e.g. Ground floor columns..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={inventoryUsageForm.note} onChange={e => setInventoryUsageForm(p => ({ ...p, note: e.target.value }))} />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm uppercase tracking-widest">
                   Confirm Realized Cost
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Project Add/Edit Modal (Existing) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh] scale-100 transition-all duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingProject ? 'Edit Site Profile' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={async (e) => {
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
                status: formData.status,
                description: formData.description
              };
              if (editingProject) await updateProject(projectData); else await addProject(projectData);
              setShowModal(false);
              setEditingProject(null);
            }} className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-safe">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Official Project Name</label>
                <input type="text" placeholder="e.g. Skyline Residency" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Client Entity</label>
                   <input type="text" placeholder="Client Name" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.client} onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Site Location</label>
                   <input type="text" placeholder="Location" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="tel" placeholder="+91 00000 00000" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.contactNumber} onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Status</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} required>
                      {siteStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Master Budget (Rs.)</label>
                <input type="number" placeholder="0.00" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={formData.budget} onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Launch Date</label>
                   <input type="date" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Completion Target</label>
                   <input type="date" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-3xl font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-3xl font-black shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest">
                   {editingProject ? 'Save Profile' : 'Launch Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Cost Modal (Modified for strict edit logic) */}
      {showQuickExpense && viewingProject && (() => {
        const isSynced = !!editingExpense?.materialId;
        return (
          <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-red-50/30 dark:bg-red-900/20">
                  <div className="flex gap-4 items-center">
                    <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg">
                      {expenseFormData.category === 'Material' ? <Package size={24} /> : <Receipt size={24} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {editingExpense ? 'Modify Ledger Entry' : 'Record Site Cost'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project: {viewingProject.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQuickExpense(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
               </div>
               <form onSubmit={handleQuickExpenseSubmit} className="p-8 space-y-5 pb-safe overflow-y-auto max-h-[75vh]">
                  {isSynced && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                       <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                       <p className="text-[11px] font-bold text-blue-800 dark:text-blue-200 leading-relaxed uppercase tracking-tight">
                         <strong>Ledger Sync:</strong> This entry is linked to Inventory. To maintain data integrity, only the <strong>Quantity</strong> can be modified here.
                       </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Cost Category</label>
                        <select disabled={isSynced} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none disabled:opacity-50" value={expenseFormData.category} onChange={e => setExpenseFormData(p => ({ ...p, category: e.target.value }))} required>
                           <option value="" disabled>Select category...</option>
                           {tradeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Value Date</label>
                        <input type="date" required readOnly={isSynced} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none read-only:opacity-50" value={expenseFormData.date} onChange={e => setExpenseFormData(p => ({ ...p, date: e.target.value }))} />
                     </div>
                  </div>
                  
                  {isSynced && (
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                         <Scale size={14} /> Material Quantity ({materials.find(m => m.id === editingExpense?.materialId)?.unit})
                       </label>
                       <input 
                        type="number" 
                        required 
                        step="0.01" 
                        className="w-full px-5 py-4 bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-400 rounded-2xl font-black text-lg dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" 
                        value={expenseFormData.materialQuantity} 
                        onChange={e => setExpenseFormData(p => ({ ...p, materialQuantity: e.target.value }))} 
                       />
                    </div>
                  )}

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Total Bill Amount (Rs.)</label>
                     <input type="number" required readOnly={isSynced} step="0.01" placeholder="0.00" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none read-only:opacity-50" value={expenseFormData.amount} onChange={e => setExpenseFormData(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Associated Vendor</label>
                     <select disabled={isSynced} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none disabled:opacity-50" value={expenseFormData.vendorId} onChange={e => setExpenseFormData(p => ({ ...p, vendorId: e.target.value }))}>
                      <option value="">Direct Site Expense (No Vendor)</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Notes / Description</label>
                     <textarea rows={2} readOnly={isSynced} placeholder="Provide context..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none read-only:opacity-50" value={expenseFormData.notes} onChange={e => setExpenseFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowQuickExpense(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-3xl font-bold text-sm uppercase tracking-widest text-slate-500">Cancel</button>
                    <button type="submit" className="flex-1 bg-red-600 text-white py-4 rounded-3xl font-black shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest">Authorize Entry</button>
                  </div>
               </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
