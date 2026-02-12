
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  Plus, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  CreditCard, 
  X, 
  Search, 
  ChevronRight, 
  Pencil, 
  Trash2,
  TrendingUp,
  Receipt,
  Filter,
  ArrowRight,
  Info,
  Wallet
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Income, PaymentMethod, Project } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectIncome: React.FC = () => {
  const { projects, incomes, expenses, addIncome, updateIncome, deleteIncome } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '', 
    amount: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0], 
    method: 'Bank' as PaymentMethod
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setEditingIncome(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleCreateOrUpdateIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const incData: Income = {
      id: editingIncome ? editingIncome.id : 'inc' + Date.now(),
      projectId: formData.projectId,
      amount: parseFloat(formData.amount) || 0,
      description: formData.description,
      date: formData.date,
      method: formData.method
    };

    if (editingIncome) {
      updateIncome(incData);
    } else {
      addIncome(incData);
    }

    setShowModal(false);
    setEditingIncome(null);
    setFormData({ 
      projectId: projects[0]?.id || '', 
      amount: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0], 
      method: 'Bank' 
    });
  };

  const openEdit = (i: Income) => {
    setEditingIncome(i);
    setFormData({
      projectId: i.projectId, 
      amount: i.amount.toString(), 
      description: i.description, 
      date: i.date, 
      method: i.method
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this income record? This action cannot be undone.")) {
      deleteIncome(id);
    }
  };

  // Group incomes by project for the breakdown view
  const projectIncomes = useMemo(() => {
    const grouped: Record<string, { project: Project; items: Income[]; total: number; remaining: number }> = {};
    
    incomes.forEach(inc => {
      const project = projects.find(p => p.id === inc.projectId);
      if (!project) return;
      
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inc.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch && searchTerm) return;

      if (!grouped[inc.projectId]) {
        // Calculate current collected for this project to determine global remaining
        const projectCollected = incomes
          .filter(i => i.projectId === project.id)
          .reduce((sum, i) => sum + i.amount, 0);

        grouped[inc.projectId] = { 
          project, 
          items: [], 
          total: 0,
          remaining: project.budget - projectCollected
        };
      }
      grouped[inc.projectId].items.push(inc);
      grouped[inc.projectId].total += inc.amount;
    });

    Object.values(grouped).forEach(group => {
      group.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [projects, incomes, searchTerm]);

  const totalRevenue = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);

  // Calculate remaining collection budget for the form
  const selectedProjectDetails = useMemo(() => {
    if (!formData.projectId) return null;
    const project = projects.find(p => p.id === formData.projectId);
    if (!project) return null;

    // Sum all incomes for this project EXCEPT the one being edited to avoid double-counting
    const otherIncomesTotal = incomes
      .filter(i => i.projectId === project.id && (editingIncome ? i.id !== editingIncome.id : true))
      .reduce((sum, i) => sum + i.amount, 0);
    
    const currentInput = parseFloat(formData.amount) || 0;
    const remainingBeforeInput = project.budget - otherIncomesTotal;
    const remainingAfterInput = remainingBeforeInput - currentInput;
    
    return {
      name: project.name,
      totalBudget: project.budget,
      remainingBeforeInput,
      remainingAfterInput
    };
  }, [formData.projectId, formData.amount, projects, incomes, editingIncome]);

  // Helper to get remaining budget string for dropdown options
  const getProjectRemainingBudget = (project: Project) => {
    const collected = incomes
      .filter(i => i.projectId === project.id)
      .reduce((sum, i) => sum + i.amount, 0);
    return project.budget - collected;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Revenue Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Track milestone payments and project receivables.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => { setEditingIncome(null); setShowModal(true); }} 
            className="flex-1 sm:flex-none bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus size={20} />
            Record Collection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100">
           <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Revenue Collected</p>
           <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Entries</p>
             <p className="text-2xl font-bold text-slate-900 dark:text-white">{incomes.length}</p>
           </div>
           <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
              <ArrowUpCircle size={24} />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Projects with Revenue</p>
             <p className="text-2xl font-bold text-slate-900 dark:text-white">{projectIncomes.length}</p>
           </div>
           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
              <Briefcase size={24} />
           </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Filter by project or payment description..." 
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {projectIncomes.map((group) => (
          <div key={group.project.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
                   <Briefcase size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">{group.project.name}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{group.project.client}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="bg-white dark:bg-slate-800 px-5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Remaining Amount</span>
                  <span className={`text-lg font-black leading-none ${group.remaining < 0 ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>
                    {formatCurrency(group.remaining)}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 px-5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Project Collection</span>
                  <span className="text-lg font-black text-emerald-600 leading-none">{formatCurrency(group.total)}</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-700">
                  <tr>
                    <th className="px-8 py-4">Received Date</th>
                    <th className="px-8 py-4">Milestone Description</th>
                    <th className="px-8 py-4">Method</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                    <th className="px-8 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {group.items.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-slate-400" />
                           <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{inc.description}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border ${
                          inc.method === 'Bank' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 
                          inc.method === 'Cash' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' : 
                          'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400'
                        }`}>
                          {inc.method}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <span className="text-sm font-bold text-emerald-600">{formatCurrency(inc.amount)}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <div className="flex justify-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(inc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(inc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 size={14} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {projectIncomes.length === 0 && (
          <div className="py-20 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
             <Receipt size={48} strokeWidth={1} className="mb-4 opacity-20" />
             <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No project revenue entries found</p>
             <button 
              onClick={() => setShowModal(true)}
              className="mt-4 text-emerald-600 font-bold hover:underline flex items-center gap-2"
             >
               <Plus size={16} /> Record First Payment
             </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 mobile-sheet">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/10 shrink-0">
              <div className="flex gap-4 items-center">
                <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 dark:shadow-none">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{editingIncome ? 'Modify Receipt' : 'Record Project Income'}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">Financial Inbound Transaction</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setEditingIncome(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdateIncome} className="p-8 space-y-5 overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Source Project / Site</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition-all dark:text-white" 
                    value={formData.projectId} 
                    onChange={(e) => setFormData(p => ({ ...p, projectId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select project...</option>
                    {projects.map(p => {
                      const rem = getProjectRemainingBudget(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (Remaining: {formatCurrency(rem)})
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {selectedProjectDetails && (
                   <div className="mt-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-2xl animate-in fade-in slide-in-from-top-2">
                      <div>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Current Collection Budget</p>
                        <p className="text-lg font-black">{formatCurrency(selectedProjectDetails.remainingBeforeInput)}</p>
                      </div>
                      <ArrowRight className="text-white/20" size={24} />
                      <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">New Remaining Budget</p>
                        <p className={`text-lg font-black ${selectedProjectDetails.remainingAfterInput < 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                          {formatCurrency(selectedProjectDetails.remainingAfterInput)}
                        </p>
                      </div>
                   </div>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Payment Milestone Description</label>
                <div className="relative">
                  <Receipt className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea 
                    placeholder="e.g., 5th Floor Slab Casting payment received from client..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white" 
                    value={formData.description} 
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} 
                    rows={2}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Amount (Rs.)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white" 
                      value={formData.amount} 
                      onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Transaction Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white" 
                      value={formData.date} 
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Settlement Method</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setFormData(p => ({ ...p, method: m }))}
                         className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${formData.method === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                       >{m}</button>
                     ))}
                  </div>
               </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingIncome(null); }} 
                  className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-[1.5rem] shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 active:scale-[0.98] transition-all"
                >
                  {editingIncome ? 'Update Ledger' : 'Confirm Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
