
import React, { useState } from 'react';
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
  ArrowDownCircle
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProjectStatus, Project, Expense, Income, PaymentMethod } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { 
    projects, expenses, vendors, materials, incomes, 
    addProject, updateProject, deleteProject, 
    addExpense, addIncome, updateMaterial 
  } = useApp();
  
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'expenses' | 'income'>('expenses');
  
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickIncome, setShowQuickIncome] = useState(false);

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
    
    return { totalSpent, totalCollected, progress };
  };

  const handleQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;

    addExpense({
      id: 'e' + Date.now(),
      date: expenseFormData.date,
      projectId: viewingProject.id,
      vendorId: expenseFormData.vendorId || undefined,
      amount: parseFloat(expenseFormData.amount) || 0,
      paymentMethod: expenseFormData.paymentMethod,
      category: expenseFormData.category,
      notes: expenseFormData.notes || `Project ${expenseFormData.category} cost`
    });

    setShowQuickExpense(false);
    setExpenseFormData({ amount: '', date: new Date().toISOString().split('T')[0], category: 'Material', vendorId: '', notes: '', paymentMethod: 'Bank' });
  };

  const handleQuickIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingProject) return;

    addIncome({
      id: 'inc' + Date.now(),
      projectId: viewingProject.id,
      date: incomeFormData.date,
      amount: parseFloat(incomeFormData.amount) || 0,
      description: incomeFormData.description || 'Milestone Payment',
      method: incomeFormData.method
    });

    setShowQuickIncome(false);
    setIncomeFormData({ amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Management</h2>
          <p className="text-slate-500 text-sm">Monitor sites and manage specific project financials.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95"
        >
          <Plus size={20} /> Add Project
        </button>
      </div>

      <div className="flex bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto no-scrollbar w-fit">
        {(['All', 'Active', 'On Hold', 'Completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const { progress, totalSpent } = calculateProjectMetrics(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-blue-400 transition-all group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {project.status}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingProject(project); setFormData({ name: project.name, client: project.client, location: project.location, budget: project.budget.toString(), startDate: project.startDate, endDate: project.endDate, description: project.description || '' }); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mt-1">
                  <MapPin size={12} /> {project.location}
                </p>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                      <span>Utilization</span>
                      <span className="text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{formatCurrency(project.budget)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Spent</p>
                      <p className="text-sm font-bold text-red-600 truncate">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setViewingProject(project)}
                className="w-full py-4 bg-slate-50 border-t border-slate-100 text-sm font-bold text-slate-600 flex items-center justify-between px-6 hover:bg-blue-600 hover:text-white transition-all group/btn"
              >
                Project Insights
                <ChevronRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Insights Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl h-[92vh] lg:h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl hidden sm:block"><Briefcase size={28} /></div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{viewingProject.name}</h2>
                  <p className="text-slate-500 text-xs sm:text-sm truncate">Client: {viewingProject.client}</p>
                </div>
              </div>
              <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Budget</p>
                   <p className="text-xl font-bold text-slate-900">{formatCurrency(viewingProject.budget)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Total Spent</p>
                   <p className="text-xl font-bold text-red-600">{formatCurrency(calculateProjectMetrics(viewingProject.id, viewingProject.budget).totalSpent)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Revenue Collected</p>
                   <p className="text-xl font-bold text-emerald-600">{formatCurrency(calculateProjectMetrics(viewingProject.id, viewingProject.budget).totalCollected)}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row border-b border-slate-100 justify-between items-start sm:items-center pr-6 bg-slate-50/30">
                  <div className="flex w-full sm:w-auto">
                    <button onClick={() => setActiveDetailTab('expenses')} className={`flex-1 sm:flex-none px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeDetailTab === 'expenses' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Project Expenses</button>
                    <button onClick={() => setActiveDetailTab('income')} className={`flex-1 sm:flex-none px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeDetailTab === 'income' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>Project Income</button>
                  </div>
                  <div className="p-4 sm:p-0 flex gap-2 w-full sm:w-auto">
                    {activeDetailTab === 'expenses' ? (
                      <button onClick={() => setShowQuickExpense(true)} className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg active:scale-95 transition-all">
                        <Receipt size={14} /> Record Expense
                      </button>
                    ) : (
                      <button onClick={() => setShowQuickIncome(true)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg active:scale-95 transition-all">
                        <ArrowDownCircle size={14} /> Record Income
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                       <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Amount</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {activeDetailTab === 'expenses' ? (
                          expenses.filter(e => e.projectId === viewingProject.id).map(e => (
                            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{e.notes}</td>
                              <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatCurrency(e.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          incomes.filter(i => i.projectId === viewingProject.id).map(i => (
                            <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(i.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{i.description}</td>
                              <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatCurrency(i.amount)}</td>
                            </tr>
                          ))
                        )}
                     </tbody>
                   </table>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end shrink-0">
               <button onClick={() => setViewingProject(null)} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">Close Insights</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Modals */}
      {showQuickExpense && viewingProject && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 bg-red-50/30 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900">Record Site Expense</h2>
                 <button onClick={() => setShowQuickExpense(false)}><X size={24} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleQuickExpense} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (Rs.)</label>
                       <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={expenseFormData.amount} onChange={e => setExpenseFormData(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                       <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={expenseFormData.date} onChange={e => setExpenseFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={expenseFormData.vendorId} onChange={e => setExpenseFormData(p => ({ ...p, vendorId: e.target.value }))}>
                       <option value="">Direct / No Vendor</option>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea rows={2} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={expenseFormData.notes} onChange={e => setExpenseFormData(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Labor payment for week 4..."></textarea>
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-100 transition-all active:scale-95">Record Site Cost</button>
              </form>
           </div>
        </div>
      )}

      {showQuickIncome && viewingProject && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900">Record Milestone Income</h2>
                 <button onClick={() => setShowQuickIncome(false)}><X size={24} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleQuickIncome} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (Rs.)</label>
                       <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={incomeFormData.amount} onChange={e => setIncomeFormData(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                       <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={incomeFormData.date} onChange={e => setIncomeFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Milestone Description</label>
                    <textarea rows={2} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={incomeFormData.description} onChange={e => setIncomeFormData(p => ({ ...p, description: e.target.value }))} placeholder="e.g. 2nd Floor Slab Casting Payment..."></textarea>
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95">Record Payment</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
