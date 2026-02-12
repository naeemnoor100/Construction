
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
  Users
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProjectStatus, Project, Expense, Income, PaymentMethod } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { 
    projects, expenses, vendors, materials, incomes, 
    addProject, updateProject, deleteProject, 
    addExpense, updateExpense, deleteExpense,
    addIncome, updateIncome, deleteIncome 
  } = useApp();
  
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'expenses' | 'income'>('expenses');
  
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickIncome, setShowQuickIncome] = useState(false);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setViewingProject(null);
        setShowQuickExpense(false);
        setShowQuickIncome(false);
        setEditingExpense(null);
        setEditingIncome(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: ''
  });

  const [expenseFormData, setExpenseFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], category: 'Material' as Expense['category'], 
    vendorId: '', notes: '', paymentMethod: 'Bank' as PaymentMethod
  });

  const [incomeFormData, setIncomeFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' as PaymentMethod
  });

  const filteredProjects = projects.filter(p => filter === 'All' || p.status === filter);

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const projectIncomes = incomes.filter(i => i.projectId === projectId);
    const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCollected = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
    const progress = Math.min(100, Math.round((totalSpent / budget) * 100)) || 0;
    
    // Category Breakdown
    const categories: Record<string, number> = {};
    projectExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    return { totalSpent, totalCollected, progress, categoryBreakdown: categories };
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Project Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monitor sites and manage specific project financials.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Project
        </button>
      </div>

      <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 overflow-x-auto no-scrollbar w-fit">
        {(['All', 'Active', 'On Hold', 'Completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
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
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
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
                          budget: project.budget.toString(), 
                          startDate: project.startDate, 
                          endDate: project.endDate, 
                          description: project.description || '' 
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
                onClick={() => setViewingProject(project)}
                className="w-full py-5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center justify-between px-6 hover:bg-blue-600 hover:text-white transition-all group/btn"
              >
                Project Insights
                <ChevronRight size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Insights Modal with Enhanced Expense Summary */}
      {viewingProject && (() => {
        const metrics = calculateProjectMetrics(viewingProject.id, viewingProject.budget);
        const projectExpenses = expenses.filter(e => e.projectId === viewingProject.id);
        
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-6xl h-[92vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-200 dark:shadow-none hidden sm:block">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{viewingProject.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Client: {viewingProject.client}</p>
                  </div>
                </div>
                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
                {/* Financial Summary Dashboard */}
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

                {/* Detailed Expense Summary Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <PieChart size={16} className="text-blue-500" />
                        Expenditure Summary by Category
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {Object.keys(metrics.categoryBreakdown).length > 0 ? Object.entries(metrics.categoryBreakdown).map(([cat, amt]) => {
                        const pct = Math.round((amt / metrics.totalSpent) * 100);
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                              <span className="text-slate-600 dark:text-slate-400">{cat}</span>
                              <span className="text-slate-900 dark:text-white">{formatCurrency(amt)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="col-span-2 py-8 flex flex-col items-center justify-center text-slate-300">
                          <AlertCircle size={32} className="opacity-20 mb-2" />
                          <p className="text-[10px] font-bold uppercase">No categorized data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] text-white flex flex-col shadow-2xl">
                    <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users size={16} className="text-blue-400" />
                      Top Supply Partners
                    </h3>
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                      {(() => {
                        const vendorSpend: Record<string, number> = {};
                        projectExpenses.forEach(e => {
                          if (e.vendorId) vendorSpend[e.vendorId] = (vendorSpend[e.vendorId] || 0) + e.amount;
                        });
                        const sorted = Object.entries(vendorSpend).sort((a,b) => b[1] - a[1]).slice(0, 3);
                        
                        return sorted.length > 0 ? sorted.map(([vid, amt]) => (
                          <div key={vid} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-bold">{vendors.find(v => v.id === vid)?.name.charAt(0)}</div>
                              <span className="text-[11px] font-bold truncate max-w-[100px]">{vendors.find(v => v.id === vid)?.name}</span>
                            </div>
                            <span className="text-[11px] font-black text-blue-400">{formatCurrency(amt)}</span>
                          </div>
                        )) : <p className="text-[10px] text-white/40 font-bold uppercase text-center mt-10">No specific vendor data</p>;
                      })()}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                       <span className="text-[9px] font-bold text-white/50 uppercase">Project Profit Margin</span>
                       <span className={`text-xs font-black ${metrics.totalCollected > metrics.totalSpent ? 'text-emerald-400' : 'text-red-400'}`}>
                         {metrics.totalCollected > 0 ? Math.round(((metrics.totalCollected - metrics.totalSpent) / metrics.totalCollected) * 100) : 0}%
                       </span>
                    </div>
                  </div>
                </div>

                {/* Ledger View Tabs */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                  <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-700 justify-between items-start sm:items-center pr-6 bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="flex w-full sm:w-auto">
                      <button onClick={() => setActiveDetailTab('expenses')} className={`flex-1 sm:flex-none px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'expenses' ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Daily Expenses</button>
                      <button onClick={() => setActiveDetailTab('income')} className={`flex-1 sm:flex-none px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Site Income</button>
                    </div>
                    <div className="p-4 sm:p-0 flex gap-2 w-full sm:w-auto">
                      {activeDetailTab === 'expenses' ? (
                        <button onClick={() => { setEditingExpense(null); setShowQuickExpense(true); }} className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 shadow-xl active:scale-95 transition-all">
                          <Receipt size={16} /> Record Cost
                        </button>
                      ) : (
                        <button onClick={() => { setEditingIncome(null); setShowQuickIncome(true); }} className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl active:scale-95 transition-all">
                          <ArrowDownCircle size={16} /> Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto no-scrollbar">
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
                            projectExpenses.slice().reverse().map(e => (
                              <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                                <td className="px-8 py-5">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{e.notes}</p>
                                  <span className="text-[9px] font-black uppercase text-blue-500">{e.category}</span>
                                </td>
                                <td className="px-8 py-5 text-sm font-black text-red-600 text-right">{formatCurrency(e.amount)}</td>
                                <td className="px-8 py-5 text-right">
                                  <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditExpense(e)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil size={18} /></button>
                                    <button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            incomes.filter(i => i.projectId === viewingProject.id).slice().reverse().map(i => (
                              <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(i.date).toLocaleDateString()}</td>
                                <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-slate-200">{i.description}</td>
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

      {/* Quick Record Modals */}
      {showQuickExpense && viewingProject && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-red-50/30 dark:bg-red-900/20 flex justify-between items-center">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingExpense ? 'Modify Site Expense' : 'Record Site Expense'}</h2>
                 <button onClick={() => { setShowQuickExpense(false); setEditingExpense(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
              </div>
              <form onSubmit={handleQuickExpenseSubmit} className="p-6 space-y-5 pb-safe">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label>
                       <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={expenseFormData.amount} onChange={e => setExpenseFormData(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={expenseFormData.date} onChange={e => setExpenseFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Source Vendor</label>
                    <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={expenseFormData.vendorId} onChange={e => setExpenseFormData(p => ({ ...p, vendorId: e.target.value }))}>
                       <option value="">Direct / Local Purchase</option>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ledger Entry Note</label>
                    <textarea rows={2} required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={expenseFormData.notes} onChange={e => setExpenseFormData(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Weekly labor payments..."></textarea>
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all text-sm uppercase tracking-widest">
                    {editingExpense ? 'Save Changes' : 'Authorize Site Cost'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showQuickIncome && viewingProject && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/30 dark:bg-emerald-900/20 flex justify-between items-center">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingIncome ? 'Modify Milestone' : 'Record Milestone Income'}</h2>
                 <button onClick={() => { setShowQuickIncome(false); setEditingIncome(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
              </div>
              <form onSubmit={handleQuickIncomeSubmit} className="p-6 space-y-5 pb-safe">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label>
                       <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={incomeFormData.amount} onChange={e => setIncomeFormData(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={incomeFormData.date} onChange={e => setIncomeFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Milestone Description</label>
                    <textarea rows={2} required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={incomeFormData.description} onChange={e => setIncomeFormData(p => ({ ...p, description: e.target.value }))} placeholder="e.g. 5th Floor Slab Completion..."></textarea>
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all text-sm uppercase tracking-widest">
                    {editingIncome ? 'Save Changes' : 'Record Site Payment'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Project Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh] mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingProject ? 'Edit Site Profile' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const projectData: Project = {
                id: editingProject ? editingProject.id : 'p' + Date.now(),
                name: formData.name,
                client: formData.client,
                location: formData.location,
                budget: parseFloat(formData.budget) || 0,
                startDate: formData.startDate,
                endDate: formData.endDate || formData.startDate,
                status: editingProject ? editingProject.status : 'Active',
                description: formData.description
              };
              if (editingProject) updateProject(projectData); else addProject(projectData);
              setShowModal(false);
              setEditingProject(null);
              setFormData({ name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '' });
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
