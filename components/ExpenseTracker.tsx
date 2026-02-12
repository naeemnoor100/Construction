
import React, { useState } from 'react';
import { 
  Plus, Receipt, CreditCard, Calendar, X, Briefcase, Users, DollarSign, Tag, ChevronDown, Pencil, Trash2
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Expense, PaymentMethod } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ExpenseTracker: React.FC = () => {
  const { expenses, projects, vendors, addExpense, updateExpense, deleteExpense } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeProjectFilter, setActiveProjectFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '', vendorId: '', date: new Date().toISOString().split('T')[0], amount: '', notes: '', category: 'Overhead' as Expense['category'], paymentMethod: 'Bank' as PaymentMethod
  });

  const handleCreateOrUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const expData: Expense = {
      id: editingExpense ? editingExpense.id : 'e' + Date.now(),
      date: formData.date,
      projectId: formData.projectId,
      vendorId: formData.vendorId || undefined,
      amount: parseFloat(formData.amount) || 0,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || 'General Expense',
      category: formData.category
    };

    if (editingExpense) {
      updateExpense(expData);
    } else {
      addExpense(expData);
    }

    setShowModal(false);
    setEditingExpense(null);
    setFormData({ projectId: projects[0]?.id || '', vendorId: '', date: new Date().toISOString().split('T')[0], amount: '', notes: '', category: 'Overhead', paymentMethod: 'Bank' });
  };

  const openEdit = (e: Expense) => {
    setEditingExpense(e);
    setFormData({
      projectId: e.projectId, vendorId: e.vendorId || '', date: e.date, amount: e.amount.toString(), notes: e.notes, category: e.category, paymentMethod: e.paymentMethod
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this expense record? The associated vendor balance will be restored automatically.")) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
        <button onClick={() => { setEditingExpense(null); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"><Plus size={20} />Add Expense</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Detail</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{exp.notes}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(exp.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">{exp.category}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{projects.find(p => p.id === exp.projectId)?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatCurrency(exp.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(exp)} className="text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(exp.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingExpense ? 'Edit Expense' : 'Record Expense'}</h2>
              <button onClick={() => { setShowModal(false); setEditingExpense(null); }} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdateExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.projectId} onChange={(e) => setFormData(p => ({ ...p, projectId: e.target.value }))}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.vendorId} onChange={(e) => setFormData(p => ({ ...p, vendorId: e.target.value }))}>
                  <option value="">No Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} required />
                <input type="number" placeholder="Amount" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.amount} onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <textarea placeholder="Notes" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}></textarea>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingExpense(null); }} className="flex-1 bg-slate-100 py-3 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl">{editingExpense ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
