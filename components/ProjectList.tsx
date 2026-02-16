import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, MapPin, DollarSign, ChevronRight, X, Briefcase, TrendingUp, Pencil, Trash2, Calendar, Package, Warehouse, History, ClipboardList, Search, Info, TrendingDown, Clock, Target, ArrowRight, ArrowDownCircle, FileText, Receipt, CheckCircle2
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Project, Expense, Income, PaymentMethod, Material, StockHistoryEntry, Invoice } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { 
    projects, expenses, vendors, materials, incomes, invoices, siteStatuses, stockingUnits,
    addProject, updateProject, deleteProject, deleteExpense, addIncome, updateIncome, deleteIncome, addInvoice, updateInvoice, deleteInvoice, addMaterial, allowDecimalStock
  } = useApp();
  
  const [filter, setFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'expenses' | 'income' | 'arrivals' | 'invoices'>('expenses');
  
  const [showQuickIncome, setShowQuickIncome] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRecordArrivalModal, setShowRecordArrivalModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], status: 'Active', isGodown: false
  });

  const [incomeFormData, setIncomeFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], description: '', method: 'Bank' as PaymentMethod, invoiceId: ''
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], description: ''
  });

  const [arrivalFormData, setArrivalFormData] = useState({
    materialId: '', newMaterialName: '', vendorId: '', quantity: '', unit: stockingUnits[0] || 'Bag', costPerUnit: '', date: new Date().toISOString().split('T')[0], note: ''
  });

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setFormData({ name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], status: siteStatuses[0] || 'Active', isGodown: false });
    setShowModal(true);
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setFormData({ name: p.name, client: p.client, location: p.location, budget: p.budget.toString(), startDate: p.startDate, status: p.status, isGodown: !!p.isGodown });
    setShowModal(true);
  };

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const projectIncomes = incomes.filter(i => i.projectId === projectId);
    const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCollected = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
    const progress = Math.min(100, Math.round((totalSpent / (budget || 1)) * 100)) || 0;
    return { totalSpent, totalCollected, progress, allExpenses: projectExpenses };
  };

  const constructionSites = useMemo(() => {
    return projects.filter(p => !p.isGodown && (filter === 'All' || p.status === filter)).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, filter]);

  const godownProjects = useMemo(() => {
    return projects.filter(p => p.isGodown).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Sites & Hubs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Portfolio management and godown monitoring.</p>
        </div>
        <button onClick={handleOpenAddModal} className="w-full sm:w-auto bg-[#003366] dark:bg-blue-600 text-white px-6 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
          <Plus size={20} /> Register New Entry
        </button>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        <button onClick={() => setFilter('All')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'All' ? 'bg-[#003366] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}>All Sites</button>
        {siteStatuses.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab ? 'bg-[#003366] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}>{tab}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Godown Section Integration */}
        {godownProjects.map(godown => (
          <div key={godown.id} className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2.8rem] text-white shadow-2xl flex flex-col group relative overflow-hidden active:scale-[0.98] transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Warehouse size={120} /></div>
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">Godown Hub</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditProject(godown); }} className="p-2 text-white/40 hover:text-white transition-colors"><Pencil size={18} /></button>
                  </div>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tighter leading-tight mb-2 pr-10">{godown.name}</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="text-[#FF5A00]" /> {godown.location}</p>
               <div className="mt-auto pt-8">
                 <button onClick={() => { setViewingProject(godown); setActiveDetailTab('arrivals'); }} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">Hub Insights <ArrowRight size={14} /></button>
               </div>
            </div>
          </div>
        ))}

        {/* Regular Projects */}
        {constructionSites.map(project => {
          const { progress, totalSpent } = calculateProjectMetrics(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.8rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col active:scale-[0.98] transition-all group">
              <div className="flex justify-between items-start mb-6">
                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-50 text-slate-500'}`}>{project.status}</span>
                 <button onClick={(e) => { e.stopPropagation(); handleOpenEditProject(project); }} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Pencil size={18} /></button>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight mb-2">{project.name}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="text-blue-500" /> {project.location}</p>
              
              <div className="mt-8 space-y-4">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Budget Burn</p>
                       <p className="text-sm font-black text-blue-600">{progress}%</p>
                    </div>
                 </div>
                 <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                 </div>
              </div>

              <div className="mt-8">
                 <button onClick={() => { setViewingProject(project); setActiveDetailTab('expenses'); }} className="w-full py-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-[#003366] hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">View Site Portfolio <ChevronRight size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Entity Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingProject ? 'Modify Entity' : 'New Registration'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
             </div>
             <form onSubmit={(e) => {
                e.preventDefault();
                const data = { ...formData, id: editingProject ? editingProject.id : 'p'+Date.now(), budget: parseFloat(formData.budget) || 0 };
                if (editingProject) updateProject(data); else addProject(data);
                setShowModal(false);
             }} className="p-8 space-y-6 overflow-y-auto no-scrollbar pb-safe max-h-[75vh]">
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl w-fit">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, isGodown: false }))} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.isGodown ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Site</button>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, isGodown: true }))} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.isGodown ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>Godown</button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Entity Name</label>
                  <input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                {!formData.isGodown && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Master Budget (Rs.)</label>
                    <input type="number" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xl dark:text-white outline-none" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label><input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label><select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>{siteStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <button type="submit" className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 text-sm ${formData.isGodown ? 'bg-slate-900' : 'bg-blue-600'} text-white mt-4`}>Confirm Registration</button>
             </form>
          </div>
        </div>
      )}

      {/* Project Insights Sheet */}
      {viewingProject && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-6xl h-[95vh] sm:h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8">
             <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className={`p-4 ${viewingProject.isGodown ? 'bg-slate-900' : 'bg-blue-600'} text-white rounded-[1.5rem] shadow-xl`}><Briefcase size={28} /></div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{viewingProject.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{viewingProject.isGodown ? 'Stock Hub' : 'Site Portfolio'}</p>
                  </div>
                </div>
                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
             </div>
             
             <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar px-6 bg-slate-50/50 dark:bg-slate-900/10 shrink-0">
               <button onClick={() => setActiveDetailTab('expenses')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeDetailTab === 'expenses' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Site Costs</button>
               <button onClick={() => setActiveDetailTab('invoices')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeDetailTab === 'invoices' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400'}`}>Invoices</button>
               <button onClick={() => setActiveDetailTab('income')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeDetailTab === 'income' ? 'text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Receipts</button>
               <button onClick={() => setActiveDetailTab('arrivals')} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeDetailTab === 'arrivals' ? 'text-amber-600 border-b-4 border-amber-600' : 'text-slate-400'}`}>Material Log</button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50/20 dark:bg-slate-900/10 pb-safe">
                {/* Adaptive Card-based detail lists for mobile */}
                <div className="space-y-3">
                   {activeDetailTab === 'expenses' && expenses.filter(e => e.projectId === viewingProject.id).slice().reverse().map(e => (
                     <div key={e.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center"><Receipt size={20} /></div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</p>
                              <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none mt-1">{e.category}</p>
                              <p className="text-[10px] text-slate-500 font-medium italic mt-1">{e.notes || 'No notes'}</p>
                           </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                           <p className="text-sm font-black text-rose-600">{formatCurrency(e.amount)}</p>
                           <button onClick={() => deleteExpense(e.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}

                   {activeDetailTab === 'invoices' && invoices.filter(i => i.projectId === viewingProject.id).slice().reverse().map(i => (
                     <div key={i.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{i.id.slice(-6).toUpperCase()}</p>
                              <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none mt-1">{i.description}</p>
                              <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black border mt-2 inline-block ${i.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{i.status}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-indigo-600">{formatCurrency(i.amount)}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Due: {new Date(i.dueDate).toLocaleDateString()}</p>
                        </div>
                     </div>
                   ))}

                   {activeDetailTab === 'income' && incomes.filter(i => i.projectId === viewingProject.id).slice().reverse().map(i => (
                     <div key={i.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                           <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center"><ArrowDownCircle size={20} /></div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(i.date).toLocaleDateString()}</p>
                              <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none mt-1">{i.description}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Via {i.method}</p>
                           </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                           <p className="text-sm font-black text-emerald-600">{formatCurrency(i.amount)}</p>
                           <button onClick={() => deleteIncome(i.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 pb-safe">
               <button onClick={() => setViewingProject(null)} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs">Close Project Insights</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};