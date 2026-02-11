
import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  Download, 
  Receipt, 
  CreditCard, 
  Calendar as CalendarIcon, 
  Paperclip,
  X,
  Briefcase,
  Users,
  DollarSign
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Expense, PaymentMethod } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ExpenseTracker: React.FC = () => {
  const { expenses, projects, vendors, addExpense } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: '',
    category: 'Overhead' as Expense['category'],
    paymentMethod: 'Bank' as PaymentMethod
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: 'e' + Date.now(),
      date: formData.date,
      projectId: formData.projectId,
      vendorId: formData.vendorId || undefined,
      amount: parseFloat(formData.amount) || 0,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || 'General Expense',
      category: formData.category
    };
    addExpense(newExpense);
    setShowModal(false);
    setFormData({
      projectId: projects[0]?.id || '',
      vendorId: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      notes: '',
      category: 'Overhead',
      paymentMethod: 'Bank'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
          <p className="text-slate-500">Track and manage project-related expenditures.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50">
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Quick Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Project</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Projects</option>
                  {projects.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                <div className="space-y-2">
                  {['Material', 'Labor', 'Overhead', 'Permit'].map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-blue-600 transition-colors">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-slate-50 py-2 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all uppercase tracking-tight">Cash</button>
                  <button className="bg-slate-50 py-2 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all uppercase tracking-tight">Bank</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Expense Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                              <Receipt size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 line-clamp-1">{exp.notes}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{new Date(exp.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {projects.find(p => p.id === exp.projectId)?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                            <CreditCard size={12} />
                            {exp.paymentMethod}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            <Paperclip size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400">
                        <Receipt size={48} strokeWidth={1} className="mx-auto mb-3" />
                        <p className="font-medium">No expenses recorded yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                  <Receipt size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Record Expense</h2>
                  <p className="text-sm text-slate-500">Allocate costs to a specific project</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Project</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={formData.projectId}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                      required
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Vendor (Optional)</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={formData.vendorId}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendorId: e.target.value }))}
                    >
                      <option value="">No Specific Vendor</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Amount (Rs.)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Category</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Expense['category'] }))}
                  >
                    <option value="Material">Material</option>
                    <option value="Labor">Labor</option>
                    <option value="Overhead">Overhead</option>
                    <option value="Permit">Permit</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Payment Method</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                  >
                    <option value="Bank">Bank Transfer</option>
                    <option value="Online">Online / UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Notes / Description</label>
                <textarea 
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What was this expense for?"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  required
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
