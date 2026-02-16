import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Receipt, X, Briefcase, Users, DollarSign, Pencil, Trash2, Package, ShoppingCart, Info, Search
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Expense, PaymentMethod, Material } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ExpenseTracker: React.FC = () => {
  const { expenses, projects, vendors, materials, tradeCategories, addExpense, updateExpense, deleteExpense, allowDecimalStock } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '', vendorId: '', date: new Date().toISOString().split('T')[0], amount: '', notes: '', category: 'Material', paymentMethod: 'Bank' as PaymentMethod, materialId: '', materialQuantity: ''
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
        const project = projects.find(p => p.id === e.projectId);
        const vendor = vendors.find(v => v.id === e.vendorId);
        const search = searchTerm.toLowerCase();
        return (
            e.category.toLowerCase().includes(search) ||
            e.notes.toLowerCase().includes(search) ||
            project?.name.toLowerCase().includes(search) ||
            vendor?.name.toLowerCase().includes(search)
        );
    }).slice().reverse();
  }, [expenses, projects, vendors, searchTerm]);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Cash Flow Log</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Transaction ledger and stock procurement.</p>
        </div>
        <button 
          onClick={() => { setEditingExpense(null); setShowModal(true); setFormData({ projectId: projects[0]?.id || '', vendorId: '', date: new Date().toISOString().split('T')[0], amount: '', notes: '', category: 'Material', paymentMethod: 'Bank', materialId: '', materialQuantity: '' }); }} 
          className="w-full sm:w-auto bg-rose-600 text-white px-6 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={20} /> Record Expense
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder="Search expenditure history..." className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none shadow-sm dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Mobile-Friendly Transaction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExpenses.map((exp) => {
          const vendor = vendors.find(v => v.id === exp.vendorId);
          const project = projects.find(p => p.id === exp.projectId);
          const mat = materials.find(m => m.id === exp.materialId);

          return (
            <div key={exp.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.8rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col active:scale-[0.98] transition-all group">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                     <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl flex items-center justify-center"><Receipt size={20} /></div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(exp.date).toLocaleDateString()}</p>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight mt-0.5">{exp.category}</h3>
                     </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingExpense(exp); setFormData({ projectId: exp.projectId, vendorId: exp.vendorId || '', date: exp.date, amount: exp.amount.toString(), notes: exp.notes, category: exp.category, paymentMethod: exp.paymentMethod, materialId: exp.materialId || '', materialQuantity: exp.materialQuantity?.toString() || '' }); setShowModal(true); }} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                    <button onClick={() => deleteExpense(exp.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
               </div>

               <div className="flex flex-col gap-2 mb-6 flex-1">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase leading-none truncate flex items-center gap-2"><Briefcase size={12} className="text-blue-500" /> {project?.name || 'General'}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate flex items-center gap-2"><Users size={12} className="text-[#FF5A00]" /> {vendor?.name || 'Direct / Cash Purchase'}</p>
                  {exp.notes && <p className="text-[10px] text-slate-400 font-medium italic mt-2 line-clamp-2">"{exp.notes}"</p>}
               </div>

               <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-700 pt-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                    <p className="text-base font-black text-rose-600">{formatCurrency(exp.amount)}</p>
                  </div>
                  {exp.materialQuantity && (
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Allocated</p>
                       <span className="px-2 py-1 bg-slate-50 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 rounded-lg">{exp.materialQuantity.toLocaleString()} {mat?.unit}</span>
                    </div>
                  )}
               </div>
            </div>
          );
        })}
      </div>

      {/* Expense Form Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-rose-50/20 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingExpense ? 'Modify Expenditure' : 'New Expenditure'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
            </div>
            <form onSubmit={(e) => {
                e.preventDefault();
                const data: Expense = { ...formData, id: editingExpense ? editingExpense.id : 'e'+Date.now(), amount: parseFloat(formData.amount) || 0, materialQuantity: parseFloat(formData.materialQuantity) || undefined };
                if (editingExpense) updateExpense(data); else addExpense(data);
                setShowModal(false);
            }} className="p-8 space-y-6 overflow-y-auto no-scrollbar pb-safe max-h-[75vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Site</label><select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.projectId} onChange={e => setFormData(p => ({ ...p, projectId: e.target.value }))}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vendor</label><select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.vendorId} onChange={e => setFormData(p => ({ ...p, vendorId: e.target.value }))}><option value="">Direct / Cash Purchase</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total Amount (Rs.)</label><input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-black text-lg dark:text-white outline-none" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Value Date</label><input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description / Memo</label><textarea rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} /></div>
              <button type="submit" className="w-full bg-rose-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm mt-4">Confirm Expenditure</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};