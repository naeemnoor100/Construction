
import React, { useState, useEffect, useMemo } from 'react';
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
  ClipboardCheck,
  Scale
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProjectStatus, Project, Expense, Income, PaymentMethod, Material, Payment, StockHistoryEntry } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { 
    projects, expenses, vendors, materials, incomes, siteStatuses,
    addProject, updateProject, deleteProject, 
    addExpense, updateExpense, deleteExpense,
    addIncome, updateIncome, deleteIncome,
    updateMaterial, addPayment, payments
  } = useApp();
  
  const [filter, setFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'expenses' | 'income' | 'arrivals'>('expenses');
  
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickIncome, setShowQuickIncome] = useState(false);
  const [showInventoryUsageModal, setShowInventoryUsageModal] = useState(false);

  // Quick Pay state
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [selectedExpForPay, setSelectedExpForPay] = useState<Expense | null>(null);
  const [payFormData, setPayFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank' as PaymentMethod, reference: ''
  });

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setViewingProject(null);
        setShowQuickExpense(false);
        setShowQuickIncome(false);
        setShowInventoryUsageModal(false);
        setEditingExpense(null);
        setEditingIncome(null);
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
    amount: '', date: new Date().toISOString().split('T')[0], category: 'Material' as Expense['category'], 
    vendorId: '', notes: '', paymentMethod: 'Bank' as PaymentMethod
  });

  const [incomeFormData, setIncomeFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' as PaymentMethod
  });

  const [inventoryUsageForm, setInventoryUsageForm] = useState({
    materialId: '', quantity: '', date: new Date().toISOString().split('T')[0], note: ''
  });

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

  const siteRelevantMaterials = useMemo(() => {
    if (!viewingProject) return [];
    
    const siteItems: { id: string, name: string, unit: string, siteBalance: number, vendorNames: string[] }[] = [];
    
    materials.forEach(m => {
      const sitePurchases = m.history?.filter(h => h.type === 'Purchase' && h.projectId === viewingProject.id) || [];
      const siteUsages = m.history?.filter(h => h.type === 'Usage' && h.projectId === viewingProject.id) || [];
      
      const totalSitePurchased = sitePurchases.reduce((sum, h) => sum + h.quantity, 0);
      const totalSiteUsed = siteUsages.reduce((sum, h) => sum + h.quantity, 0);
      const siteBalance = totalSitePurchased - totalSiteUsed;

      if (siteBalance > 0) {
        const vendorIds = Array.from(new Set(sitePurchases.map(h => h.vendorId).filter(Boolean)));
        const vendorNames = vendorIds.map(vid => vendors.find(v => v.id === vid)?.name || 'Unknown Vendor');
        
        siteItems.push({
          id: m.id,
          name: m.name,
          unit: m.unit,
          siteBalance,
          vendorNames
        });
      }
    });

    return siteItems;
  }, [materials, viewingProject, vendors]);

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const projectIncomes = incomes.filter(i => i.projectId === projectId);
    const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCollected = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
    const progress = Math.min(100, Math.round((totalSpent / budget) * 100)) || 0;
    
    const categories: Record<string, number> = {};
    projectExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    return { totalSpent, totalCollected, progress, categoryBreakdown: categories };
  };

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setFormData({ 
      name: '', 
      client: '', 
      location: '', 
      contactNumber: '', 
      budget: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: '', 
      description: '', 
      status: siteStatuses[0] || 'Active' 
    });
    setShowModal(true);
  };

  const handleQuickExpenseSubmit = (e: React.FormEvent) => {
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
      notes: expenseFormData.notes || `Project ${expenseFormData.category} cost`
    };

    if (editingExpense) {
      updateExpense(data);
    } else {
      addExpense(data);
    }

    setShowQuickExpense(false);
    setEditingExpense(null);
    setExpenseFormData({ amount: '', date: new Date().toISOString().split('T')[0], category: 'Material', vendorId: '', notes: '', paymentMethod: 'Bank' });
  };

  const handleInventoryUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject || !inventoryUsageForm.materialId) return;

    const material = materials.find(m => m.id === inventoryUsageForm.materialId);
    const qty = parseFloat(inventoryUsageForm.quantity) || 0;

    if (!material) return;

    const siteData = siteRelevantMaterials.find(s => s.id === material.id);
    if (!siteData || siteData.siteBalance < qty) {
      alert(`Error: Insufficient stock at this site. (Available: ${siteData?.siteBalance || 0} ${material.unit})`);
      return;
    }

    const totalCost = qty * material.costPerUnit;

    // Use central addExpense which handles both the financial and material update
    await addExpense({
      id: 'e-inv-' + Date.now(),
      date: inventoryUsageForm.date,
      projectId: viewingProject.id,
      amount: totalCost,
      paymentMethod: 'Bank',
      category: 'Material',
      materialId: material.id,
      materialQuantity: qty,
      notes: inventoryUsageForm.note || `Site Consumption: ${qty} ${material.unit} of ${material.name} used on ${viewingProject.name}`
    });

    setShowInventoryUsageModal(false);
    setInventoryUsageForm({ materialId: '', quantity: '', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const handleQuickIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;

    const data: Income = {
      id: editingIncome ? editingIncome.id : 'inc' + Date.now(),
      projectId: viewingProject.id,
      date: incomeFormData.date,
      amount: parseFloat(incomeFormData.amount) || 0,
      description: incomeFormData.description || 'Milestone Payment',
      method: incomeFormData.method
    };

    if (editingIncome) {
      updateIncome(data);
    } else {
      addIncome(data);
    }

    setShowQuickIncome(false);
    setEditingIncome(null);
    setIncomeFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' });
  };

  const handleEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseFormData({
      amount: exp.amount.toString(),
      date: exp.date,
      category: exp.category,
      vendorId: exp.vendorId || '',
      notes: exp.notes,
      paymentMethod: exp.paymentMethod
    });
    setShowQuickExpense(true);
  };

  const handleEditIncome = (inc: Income) => {
    setEditingIncome(inc);
    setIncomeFormData({
      amount: inc.amount.toString(),
      date: inc.date,
      description: inc.description,
      method: inc.method
    });
    setShowQuickIncome(true);
  };

  const handleDeleteProject = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will remove all project history.`)) {
      deleteProject(id);
    }
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
    // PRE-SELECT QUANTITY BASE ACTION
    // Instead of billing the amount, we are recording consumption of quantity
    setInventoryUsageForm({
      materialId: arrival.material.id,
      quantity: arrival.entry.quantity.toString(), // Default to full arrival quantity
      date: new Date().toISOString().split('T')[0],
      note: `Consumption of batch received on ${new Date(arrival.entry.date).toLocaleDateString()}`
    });
    setShowInventoryUsageModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Project Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitor sites and manage specific project financials.</p>
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
          const { progress, totalSpent } = calculateProjectMetrics(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col shadow-sm">
              <div className="p-6 flex-1">
                <div className="flex justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30'}`}>
                    {project.status}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingProject(project); 
                        setFormData({ 
                          name: project.name, 
                          client: project.client, 
                          location: project.location, 
                          contactNumber: project.contactNumber || '',
                          budget: project.budget.toString(), 
                          startDate: project.startDate, 
                          endDate: project.endDate, 
                          description: project.description || '',
                          status: project.status
                        }); 
                        setShowModal(true); 
                      }} 
                      className="p-1.5 text-slate-400 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{project.name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase flex items-center gap-1.5 mt-1">
                  <MapPin size={12} /> {project.location}
                </p>
                {project.contactNumber && (
                   <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1.5 mt-1">
                     <Phone size={10} /> {project.contactNumber}
                   </p>
                )}
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                      <span>Budget Utilization</span>
                      <span className="text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Budget</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{formatCurrency(project.budget)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Spent</p>
                      <p className="text-xs font-bold text-red-600 truncate">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setViewingProject(project); setActiveDetailTab('expenses'); }}
                className="w-full py-5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center justify-between px-6 hover:bg-blue-600 hover:text-white transition-all group/btn"
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
        const projectExpenses = expenses.filter(e => e.projectId === viewingProject.id);
        
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-6xl h-[92vh] shadow-2xl overflow-hidden flex flex-col scale-100 transition-all duration-300">
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-200 dark:shadow-none hidden sm:block">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{viewingProject.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Client: {viewingProject.client} {viewingProject.contactNumber && `• ${viewingProject.contactNumber}`}</p>
                  </div>
                </div>
                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Project Budget</p>
                     <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(viewingProject.budget)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5">Total Incurred</p>
                     <p className="text-xl font-black text-red-600">{formatCurrency(metrics.totalSpent)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Collections</p>
                     <p className="text-xl font-black text-emerald-600">{formatCurrency(metrics.totalCollected)}</p>
                  </div>
                  <div className="bg-blue-600 p-5 rounded-3xl shadow-xl shadow-blue-100 dark:shadow-none text-white flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                       <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Available Fund</p>
                       <Wallet size={16} className="text-white/40" />
                     </div>
                     <p className="text-xl font-black mt-2">
                       {formatCurrency(viewingProject.budget - metrics.totalSpent)}
                     </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                  <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-700 justify-between items-start sm:items-center pr-6 bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex w-full sm:w-auto">
                      <button onClick={() => setActiveDetailTab('expenses')} className={`flex-1 sm:flex-none px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'expenses' ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Daily Expenses</button>
                      <button onClick={() => setActiveDetailTab('income')} className={`flex-1 sm:flex-none px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Site Income</button>
                      <button onClick={() => setActiveDetailTab('arrivals')} className={`flex-1 sm:flex-none px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'arrivals' ? 'bg-white dark:bg-slate-800 text-amber-600 border-b-4 border-amber-600' : 'text-slate-400'}`}>Material Arrivals</button>
                    </div>
                    <div className="p-4 sm:p-0 flex gap-2 w-full sm:w-auto">
                      {activeDetailTab === 'expenses' ? (
                        <>
                          <button 
                            onClick={() => setShowInventoryUsageModal(true)} 
                            className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl active:scale-95 transition-all"
                          >
                            <Package size={16} /> Record Expense from Inventory
                          </button>
                          <button 
                            onClick={() => { setEditingExpense(null); setShowQuickExpense(true); }} 
                            className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 shadow-xl active:scale-95 transition-all"
                          >
                            <Receipt size={16} /> Record Cost
                          </button>
                        </>
                      ) : activeDetailTab === 'income' ? (
                        <button onClick={() => { setEditingIncome(null); setShowQuickIncome(true); }} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl active:scale-95 transition-all">
                          <ArrowDownCircle size={16} /> Record Payment
                        </button>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar">
                     {activeDetailTab === 'arrivals' ? (
                       <table className="w-full text-left min-w-[700px]">
                         <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                           <tr>
                            <th className="px-8 py-5">Arrival Date</th>
                            <th className="px-8 py-5">Material Asset</th>
                            <th className="px-8 py-5">Qty Received (Site Stock)</th>
                            <th className="px-8 py-5 text-right">Unit Price / Value</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {projectArrivals.map((arrival, idx) => {
                              const value = arrival.entry.quantity * (arrival.entry.unitPrice || arrival.material.costPerUnit);
                              
                              return (
                                <tr key={`${arrival.material.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                  <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(arrival.entry.date).toLocaleDateString()}</td>
                                  <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter truncate max-w-[200px]">{arrival.material.name}</p>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Vendor: {vendors.find(v => v.id === arrival.entry.vendorId)?.name || 'Direct'}</span>
                                  </td>
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                       <Scale size={14} className="text-blue-400" />
                                       <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                         {arrival.entry.quantity.toLocaleString()} {arrival.material.unit}s
                                       </span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Est: {formatCurrency(value)}</p>
                                    <p className="text-[9px] font-medium text-slate-400">@{formatCurrency(arrival.entry.unitPrice || arrival.material.costPerUnit)}</p>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <button 
                                      onClick={() => handleTriggerUsageFromArrival(arrival)}
                                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ml-auto shadow-sm active:scale-95 bg-blue-600 text-white hover:bg-blue-700`}
                                    >
                                      <ArrowUpRight size={14} /> Record Consumption
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {projectArrivals.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-slate-300">
                                   <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
                                   <p className="text-[10px] font-bold uppercase">No material arrivals recorded for this site</p>
                                </td>
                              </tr>
                            )}
                         </tbody>
                       </table>
                     ) : (
                       <table className="w-full text-left min-w-[700px]">
                         <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                           <tr>
                            <th className="px-8 py-5">Txn Date</th>
                            <th className="px-8 py-5">Detailed Ledger Entry</th>
                            <th className="px-8 py-5 text-right">Settled Amount</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {activeDetailTab === 'expenses' ? (
                              projectExpenses.slice().reverse().map(e => {
                                const isMatPurchase = e.category === 'Material' && e.vendorId;
                                const totalPaidForExp = payments
                                  .filter(p => p.materialBatchId === 'sh-exp-' + e.id)
                                  .reduce((sum, p) => sum + p.amount, 0);
                                const isFullyPaid = isMatPurchase && totalPaidForExp >= (e.amount - 0.01);

                                return (
                                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-5">
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter truncate max-w-[200px]">{e.notes}</p>
                                      <span className="text-[9px] font-black uppercase text-blue-500">{e.category}</span>
                                      {isMatPurchase && !isFullyPaid && (
                                        <p className="text-[8px] font-black text-amber-500 uppercase mt-0.5">Dues Pending: {formatCurrency(e.amount - totalPaidForExp)}</p>
                                      )}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-red-600 text-right">{formatCurrency(e.amount)}</td>
                                    <td className="px-8 py-5 text-right">
                                      <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                        {isMatPurchase && !isFullyPaid && (
                                          <button 
                                            onClick={() => handleInitiatePayFromInsights(e)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                                            title="Initiate Payment"
                                          >
                                            <DollarSign size={16} />
                                          </button>
                                        )}
                                        <button onClick={() => handleEditExpense(e)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil size={18} /></button>
                                        <button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              incomes.filter(i => i.projectId === viewingProject.id).slice().reverse().map(i => (
                                <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                  <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(i.date).toLocaleDateString()}</td>
                                  <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{i.description}</td>
                                  <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right">{formatCurrency(i.amount)}</td>
                                  <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                      <button onClick={() => handleEditIncome(i)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil size={18} /></button>
                                      <button onClick={() => deleteIncome(i.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
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
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0 bg-white dark:bg-slate-800">
                 <button onClick={() => setViewingProject(null)} className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-10 py-4 rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-xs">Exit Project Analysis</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Record Expense from Inventory Modal */}
      {showInventoryUsageModal && viewingProject && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden scale-100 transition-all duration-300">
             <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-blue-50/30 dark:bg-blue-900/20">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Site Consumption</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Assign quantities to project logs</p>
                  </div>
                </div>
                <button onClick={() => setShowInventoryUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
             </div>
             <form onSubmit={handleInventoryUsageSubmit} className="p-6 space-y-5 pb-safe">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Material</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none text-xs" 
                    value={inventoryUsageForm.materialId} 
                    onChange={e => setInventoryUsageForm(p => ({ ...p, materialId: e.target.value }))} 
                    required
                  >
                    <option value="">Choose Asset...</option>
                    {siteRelevantMaterials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} • Available Qty: {m.siteBalance.toLocaleString()} {m.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity to Consume</label>
                      <input 
                        type="number" 
                        required 
                        step="0.01" 
                        placeholder="0.00"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white" 
                        value={inventoryUsageForm.quantity} 
                        onChange={e => setInventoryUsageForm(p => ({ ...p, quantity: e.target.value }))} 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Consumption Date</label>
                      <input 
                        type="date" 
                        required 
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white" 
                        value={inventoryUsageForm.date} 
                        onChange={e => setInventoryUsageForm(p => ({ ...p, date: e.target.value }))} 
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Activity Log Note (Optional)</label>
                   <textarea 
                    rows={2} 
                    placeholder="e.g. Columns for 4th block..."
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" 
                    value={inventoryUsageForm.note} 
                    onChange={e => setInventoryUsageForm(p => ({ ...p, note: e.target.value }))} 
                  />
                </div>

                {inventoryUsageForm.materialId && (
                  <div className="bg-slate-900 p-4 rounded-2xl text-white flex justify-between items-center shadow-xl">
                    <div>
                      <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Auto-Calculated Financial Impact</p>
                      <p className="text-lg font-black text-blue-400">
                        {(() => {
                          const mat = materials.find(m => m.id === inventoryUsageForm.materialId);
                          return mat ? formatCurrency((parseFloat(inventoryUsageForm.quantity) || 0) * mat.costPerUnit) : 'Rs. 0';
                        })()}
                      </p>
                    </div>
                    <Scale size={24} className="text-blue-500 opacity-50" />
                  </div>
                )}

                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  Authorize Physical Consumption
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Project Add/Edit Modal */}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Lifecycle Status</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none" 
                      value={formData.status} 
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      {siteStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Approved Master Budget (Rs.)</label>
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
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-3xl font-black shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 text-sm uppercase tracking-widest">
                   {editingProject ? 'Save Profile' : 'Launch Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
