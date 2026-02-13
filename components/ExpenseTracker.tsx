
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Receipt, CreditCard, Calendar, X, Briefcase, Users, DollarSign, Tag, ChevronDown, Pencil, Trash2, Package, AlertCircle, RefreshCw, ShoppingCart, ArrowRightLeft, CheckCircle2, Landmark
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Expense, PaymentMethod, Material, Payment } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ExpenseTracker: React.FC = () => {
  const { expenses, projects, vendors, materials, tradeCategories, addExpense, updateExpense, deleteExpense, addPayment, payments } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Payment quick action state
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [selectedExpForPay, setSelectedExpForPay] = useState<Expense | null>(null);
  const [payFormData, setPayFormData] = useState({
    amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank' as PaymentMethod, reference: ''
  });

  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '', 
    vendorId: '', 
    date: new Date().toISOString().split('T')[0], 
    amount: '', 
    notes: '', 
    category: tradeCategories[0] || 'Overhead', 
    paymentMethod: 'Bank' as PaymentMethod,
    materialId: '',
    materialQuantity: ''
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setEditingExpense(null);
        setShowQuickPayModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const selectedMaterial = useMemo(() => 
    materials.find(m => m.id === formData.materialId), [materials, formData.materialId]
  );

  const isPurchase = useMemo(() => !!formData.vendorId, [formData.vendorId]);

  const calculatedCost = useMemo(() => {
    if (!selectedMaterial || !formData.materialQuantity) return 0;
    return (parseFloat(formData.materialQuantity) || 0) * selectedMaterial.costPerUnit;
  }, [selectedMaterial, formData.materialQuantity]);

  const handleApplyCost = () => {
    if (calculatedCost > 0) {
      setFormData(prev => ({ ...prev, amount: calculatedCost.toString() }));
    }
  };

  const handleCreateOrUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.category === 'Material' && formData.materialId && formData.materialQuantity && !isPurchase) {
      const mat = materials.find(m => m.id === formData.materialId);
      const qty = parseFloat(formData.materialQuantity) || 0;
      
      let availableStock = mat ? (mat.totalPurchased - mat.totalUsed) : 0;
      if (editingExpense && !editingExpense.vendorId && editingExpense.materialId === formData.materialId) {
        availableStock += (editingExpense.materialQuantity || 0);
      }

      if (qty > availableStock) {
        alert(`Error: Insufficient Stock for site usage. Available: ${availableStock.toLocaleString()} ${mat?.unit || 'units'}. Requested: ${qty.toLocaleString()}. To add stock, select a Billing Vendor.`);
        return;
      }
    }

    const expData: Expense = {
      id: editingExpense ? editingExpense.id : 'e' + Date.now(),
      date: formData.date,
      projectId: formData.projectId,
      vendorId: formData.vendorId || undefined,
      amount: parseFloat(formData.amount) || 0,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || 'General Expense',
      category: formData.category,
      materialId: formData.category === 'Material' ? formData.materialId || undefined : undefined,
      materialQuantity: formData.category === 'Material' ? parseFloat(formData.materialQuantity) || undefined : undefined
    };

    if (editingExpense) {
      updateExpense(expData);
    } else {
      addExpense(expData);
    }

    setShowModal(false);
    setEditingExpense(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      projectId: projects[0]?.id || '', 
      vendorId: '', 
      date: new Date().toISOString().split('T')[0], 
      amount: '', 
      notes: '', 
      category: tradeCategories[0] || 'Overhead', 
      paymentMethod: 'Bank',
      materialId: '',
      materialQuantity: ''
    });
  };

  const openEdit = (e: Expense) => {
    setEditingExpense(e);
    setFormData({
      projectId: e.projectId, 
      vendorId: e.vendorId || '', 
      date: e.date, 
      amount: e.amount.toString(), 
      notes: e.notes, 
      category: e.category, 
      paymentMethod: e.paymentMethod,
      materialId: e.materialId || '',
      materialQuantity: e.materialQuantity?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this expense record? Associated vendor balance and material stock levels will be restored.")) {
      deleteExpense(id);
    }
  };

  const handleInitiatePay = (exp: Expense) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Financial Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Record expenditures and trigger stock arrivals.</p>
        </div>
        <button 
          onClick={() => { setEditingExpense(null); resetForm(); setShowModal(true); }} 
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <Plus size={20} />
          Record Expense
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Value Date</th>
                <th className="px-8 py-5">Detailed Description</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Site / Vendor</th>
                <th className="px-8 py-5 text-right">Amount</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {expenses.slice().reverse().map((exp) => {
                const isMaterialPurchase = exp.category === 'Material' && exp.vendorId;
                const totalPaidForExp = payments
                  .filter(p => p.materialBatchId === 'sh-exp-' + exp.id)
                  .reduce((sum, p) => sum + p.amount, 0);
                const isFullyPaid = isMaterialPurchase && totalPaidForExp >= (exp.amount - 0.01);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{exp.notes}</p>
                      {exp.materialId && (
                        <div className={`flex items-center gap-1.5 mt-0.5 text-[9px] font-black uppercase ${exp.vendorId ? 'text-emerald-500' : 'text-blue-500'}`}>
                          {exp.vendorId ? <ShoppingCart size={10} /> : <Package size={10} />} 
                          {exp.materialQuantity?.toLocaleString()} {materials.find(m => m.id === exp.materialId)?.unit} {exp.vendorId ? 'Added to Stock' : 'Deducted from Stock'}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={12} className="text-blue-500" />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">{projects.find(p => p.id === exp.projectId)?.name || 'General'}</span>
                        </div>
                        {exp.vendorId && (
                          <div className="flex items-center gap-1.5">
                            <Users size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter truncate max-w-[120px]">{vendors.find(v => v.id === exp.vendorId)?.name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-red-600">{formatCurrency(exp.amount)}</p>
                      {isMaterialPurchase && (
                        <p className={`text-[8px] font-black uppercase mt-0.5 ${isFullyPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {isFullyPaid ? 'Fully Settled' : `Paid: ${formatCurrency(totalPaidForExp)}`}
                        </p>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 items-center">
                        {isMaterialPurchase && !isFullyPaid && (
                          <button 
                            onClick={() => handleInitiatePay(exp)}
                            className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                            title="Initiate Payment"
                          >
                            <DollarSign size={16} />
                          </button>
                        )}
                        <button onClick={() => openEdit(exp)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Payment Modal */}
      {showQuickPayModal && selectedExpForPay && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/10 shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Initiate Settlement</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Paying: {vendors.find(v => v.id === selectedExpForPay.vendorId)?.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowQuickPayModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
             </div>
             <form onSubmit={handleQuickPaySubmit} className="p-8 space-y-5 pb-safe overflow-y-auto no-scrollbar">
                <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
                   <div>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Expense Bill Value</p>
                      <p className="text-xl font-black">{formatCurrency(selectedExpForPay.amount)}</p>
                   </div>
                   <ArrowRightLeft className="text-white/20" size={24} />
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Settlement Qty</p>
                      <p className="text-xl font-black text-emerald-500">{formatCurrency(parseFloat(payFormData.amount) || 0)}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Amount (Rs.)</label>
                      <input type="number" required step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10" value={payFormData.amount} onChange={e => setPayFormData(p => ({ ...p, amount: e.target.value }))} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Value Date</label>
                      <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={payFormData.date} onChange={e => setPayFormData(p => ({ ...p, date: e.target.value }))} />
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setPayFormData(p => ({ ...p, method: m }))}
                         className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${payFormData.method === m ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                       >{m}</button>
                     ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reference / UTR Number</label>
                   <div className="relative">
                      <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="Optional transaction code..." className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={payFormData.reference} onChange={e => setPayFormData(p => ({ ...p, reference: e.target.value }))} />
                   </div>
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-emerald-100 dark:shadow-none active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                  <CheckCircle2 size={24} /> Confirm Settlement
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900 shrink-0">
              <div className="flex gap-4 items-center">
                 <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100 dark:shadow-none">
                    <Receipt size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{editingExpense ? 'Modify Entry' : 'Record Expenditure'}</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Site Financials Registry</p>
                 </div>
              </div>
              <button onClick={() => { setShowModal(false); setEditingExpense(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdateExpense} className="p-8 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh] pb-safe">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Site</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" 
                    value={formData.projectId} 
                    onChange={(e) => setFormData(p => ({ ...p, projectId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select site...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cost Category</label>
                   <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" 
                    value={formData.category} 
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                  >
                    {tradeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {formData.category === 'Material' && (
                <div className={`p-6 rounded-[2rem] border space-y-4 animate-in fade-in slide-in-from-top-2 transition-colors ${isPurchase ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/50' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50'}`}>
                   <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {isPurchase ? <ShoppingCart size={16} className="text-emerald-600" /> : <Package size={16} className="text-blue-600" />}
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${isPurchase ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                          {isPurchase ? 'Stock Inward (Purchase)' : 'Stock Deduction (Usage)'}
                        </h4>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${isPurchase ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isPurchase ? 'Adds to Stock' : 'Removes from Stock'}
                      </span>
                   </div>
                   <div className="space-y-4">
                      <select 
                        className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm dark:text-white outline-none"
                        value={formData.materialId}
                        onChange={e => setFormData(p => ({ ...p, materialId: e.target.value }))}
                      >
                         <option value="">Choose item...</option>
                         {materials.map(m => (
                           <option key={m.id} value={m.id}>{m.name} ({(m.totalPurchased - m.totalUsed).toLocaleString()} {m.unit} In-Stock)</option>
                         ))}
                      </select>
                      {formData.materialId && (
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase px-1">Quantity</label>
                             <input 
                              type="number" 
                              step="0.01" 
                              className={`w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-black outline-none focus:ring-2 ${isPurchase ? 'text-emerald-600 focus:ring-emerald-500/20' : 'text-blue-600 focus:ring-blue-500/20'}`} 
                              placeholder="0.00"
                              value={formData.materialQuantity}
                              onChange={e => setFormData(p => ({ ...p, materialQuantity: e.target.value }))}
                             />
                           </div>
                           <div className="flex flex-col justify-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 px-1">Inventory Value</p>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  {formatCurrency(calculatedCost)}
                                </p>
                                {calculatedCost > 0 && (
                                  <button 
                                    type="button" 
                                    onClick={handleApplyCost}
                                    className="p-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-80 transition-all shadow-md active:scale-90"
                                    title="Sync Amount"
                                  >
                                    <RefreshCw size={14} />
                                  </button>
                                )}
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Billing Vendor</label>
                   <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={formData.vendorId} onChange={(e) => setFormData(p => ({ ...p, vendorId: e.target.value }))}>
                    <option value="">Self / Direct Cost (Usage)</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Settlement Method</label>
                   <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setFormData(p => ({ ...p, paymentMethod: m }))}
                         className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.paymentMethod === m ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500'}`}
                       >{m}</button>
                     ))}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expense Date</label>
                  <input type="date" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total Bill Amount (Rs.)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20`} 
                    value={formData.amount} 
                    onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Memo / Invoice Description</label>
                <textarea rows={2} placeholder="e.g. Bulk cement procurement..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingExpense(null); }} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest text-slate-500">Cancel</button>
                <button 
                  type="submit" 
                  className={`flex-1 py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest bg-red-600 text-white shadow-red-100 dark:shadow-none`}
                >
                  {editingExpense ? 'Update Registry' : (isPurchase ? 'Authorize Purchase' : 'Authorize Consumption')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
