
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus,
  X,
  History,
  DollarSign,
  Pencil,
  Trash2,
  Package,
  Briefcase,
  Calendar,
  CreditCard,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Wallet,
  ArrowRight,
  TrendingUp,
  Landmark,
  MoreVertical,
  Phone,
  MapPin,
  Lock,
  ArrowDownCircle,
  Clock,
  ShoppingCart,
  Link
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Vendor, VendorCategory, Payment, PaymentMethod, Project } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const VendorList: React.FC = () => {
  const { vendors, payments, expenses, projects, materials, tradeCategories, addVendor, updateVendor, deleteVendor, addPayment, updatePayment, deletePayment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Track by ID to ensure reactive updates when balance changes
  const [viewingVendorId, setViewingVendorId] = useState<string | null>(null);
  const activeVendor = useMemo(() => vendors.find(v => v.id === viewingVendorId), [vendors, viewingVendorId]);
  
  const [activeDetailTab, setActiveDetailTab] = useState<'payments' | 'supplies'>('payments');
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<Vendor | null>(null);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState<Payment | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', category: tradeCategories[0] || 'Material', address: '', balance: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    projectId: '', 
    amount: '', 
    method: 'Bank' as PaymentMethod, 
    date: new Date().toISOString().split('T')[0], 
    reference: '',
    materialBatchId: ''
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setViewingVendorId(null);
        setEditingPaymentRecord(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const totalOutstanding = useMemo(() => vendors.reduce((sum, v) => sum + v.balance, 0), [vendors]);
  const highBalanceCount = useMemo(() => vendors.filter(v => v.balance > 50000).length, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);

  // Helper to find material batch info for contextual display
  const linkedBatchInfo = useMemo(() => {
    if (!paymentFormData.materialBatchId) return null;
    let found = null;
    materials.forEach(m => {
      m.history?.forEach(h => {
        if (h.id === paymentFormData.materialBatchId) {
          found = { materialName: m.name, batchDate: h.date, totalValue: h.quantity * (h.unitPrice || m.costPerUnit) };
        }
      });
    });
    return found;
  }, [paymentFormData.materialBatchId, materials]);

  const handleOpenPaymentModal = (vendor: Vendor, prefillProjectId?: string, prefillAmount?: number, materialBatchId?: string) => {
    setSelectedVendorForPayment(vendor);
    setEditingPaymentRecord(null);
    setPaymentFormData({
      projectId: prefillProjectId || projects[0]?.id || '',
      amount: prefillAmount ? prefillAmount.toString() : '',
      method: 'Bank',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      materialBatchId: materialBatchId || ''
    });
    setShowPaymentModal(true);
  };

  const handleOpenEditPaymentModal = (pay: Payment) => {
    const vendor = vendors.find(v => v.id === pay.vendorId);
    if (!vendor) return;
    
    setSelectedVendorForPayment(vendor);
    setEditingPaymentRecord(pay);
    setPaymentFormData({
      projectId: pay.projectId,
      amount: pay.amount.toString(),
      method: pay.method,
      date: pay.date,
      reference: pay.reference || '',
      materialBatchId: pay.materialBatchId || ''
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayment) return;
    
    const amountNum = parseFloat(paymentFormData.amount) || 0;
    
    // Strict Balance Validation
    const currentMaxAvailable = editingPaymentRecord 
      ? selectedVendorForPayment.balance + editingPaymentRecord.amount 
      : selectedVendorForPayment.balance;

    if (amountNum > currentMaxAvailable + 0.01) {
      alert(`Payment Forbidden: Amount (${formatCurrency(amountNum)}) exceeds the outstanding balance (${formatCurrency(currentMaxAvailable)}).`);
      return;
    }
    
    if (!paymentFormData.projectId) {
      alert("Error: Every payment must be linked to a specific project site.");
      return;
    }

    if (amountNum <= 0) {
      alert("Error: Payment amount must be greater than zero.");
      return;
    }
    
    const paymentData: Payment = {
      id: editingPaymentRecord ? editingPaymentRecord.id : 'pay' + Date.now(),
      date: paymentFormData.date,
      vendorId: selectedVendorForPayment.id,
      projectId: paymentFormData.projectId,
      amount: amountNum,
      method: paymentFormData.method,
      reference: paymentFormData.reference,
      materialBatchId: paymentFormData.materialBatchId || undefined
    };

    if (editingPaymentRecord) {
      updatePayment(paymentData);
    } else {
      addPayment(paymentData);
    }
    
    setShowPaymentModal(false);
    setSelectedVendorForPayment(null);
    setEditingPaymentRecord(null);
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteVendor(id);
    }
  };

  const handleDeletePaymentRecord = (id: string) => {
    if (confirm("Delete this payment record? Balance will be adjusted.")) {
      deletePayment(id);
    }
  };

  const vendorSupplies = useMemo(() => {
    if (!activeVendor) return [];
    const supplyList: any[] = [];
    materials.forEach(mat => {
      if (mat.history) {
        mat.history.forEach(h => {
          if (h.type === 'Purchase' && h.vendorId === activeVendor.id) {
            supplyList.push({ 
              ...h, 
              materialName: mat.name, 
              unit: mat.unit,
              unitPrice: h.unitPrice || mat.costPerUnit,
              estimatedValue: h.quantity * (h.unitPrice || mat.costPerUnit)
            });
          }
        });
      }
    });
    return supplyList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeVendor, materials]);

  const procurementSummary = useMemo(() => {
    const totalValue = vendorSupplies.reduce((sum, s) => sum + s.estimatedValue, 0);
    const totalCount = vendorSupplies.length;
    return { totalValue, totalCount };
  }, [vendorSupplies]);

  const hasVendorHistory = (vendorId: string) => {
    return payments.some(p => p.vendorId === vendorId) || expenses.some(e => e.vendorId === vendorId);
  };

  const getLastPayment = (vendorId: string) => {
    const vPayments = payments.filter(p => p.vendorId === vendorId);
    if (vPayments.length === 0) return null;
    return [...vPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Suppliers & Settlements</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor outstanding balances and record project-wise settlements.</p>
        </div>
        <button 
          onClick={() => { setEditingVendor(null); setShowModal(true); setFormData({ name: '', phone: '', category: tradeCategories[0] || 'Material', address: '', balance: '' }); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
        >
          <Plus size={20} /> Register Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] text-white shadow-lg">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">High Balance</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{highBalanceCount} <span className="text-xs font-medium text-slate-400">Suppliers</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 md:col-span-2">
           <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Quick search suppliers..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-8 py-5">Supplier Profile</th>
                <th className="px-8 py-5">Outstanding Bal.</th>
                <th className="px-8 py-5">Last Transaction</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredVendors.map((vendor) => {
                const lastPay = getLastPayment(vendor.id);
                return (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                           {vendor.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{vendor.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-[8px] font-black uppercase rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                {vendor.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{vendor.phone}</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className={`text-base font-black ${vendor.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatCurrency(vendor.balance)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           {vendor.balance > 50000 ? (
                             <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1">
                               <AlertCircle size={10} /> High Priority
                             </span>
                           ) : vendor.balance > 0 ? (
                             <span className="text-[9px] text-slate-400 font-bold uppercase">Due Settlement</span>
                           ) : (
                             <span className="text-[9px] text-emerald-600 font-bold uppercase flex items-center gap-1">
                               <CheckCircle2 size={10} /> Account Clear
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       {lastPay ? (
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                              <ArrowDownCircle size={16} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{formatCurrency(lastPay.amount)}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                <Clock size={10} /> {new Date(lastPay.date).toLocaleDateString()}
                              </p>
                           </div>
                         </div>
                       ) : (
                         <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">No Payments yet</span>
                       )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 items-center">
                         <button 
                          onClick={() => handleOpenPaymentModal(vendor)}
                          disabled={vendor.balance <= 0}
                          className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95 ${vendor.balance > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none' : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'}`}
                         >
                           <DollarSign size={14} /> Record Payment
                         </button>
                         <button 
                          onClick={() => setViewingVendorId(vendor.id)} 
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                          title="Full Ledger"
                         >
                           <History size={20} />
                         </button>
                         <div className="relative group/actions">
                            <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors">
                               <MoreVertical size={18} />
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/actions:flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-20 w-32 animate-in fade-in slide-in-from-bottom-2">
                               <button 
                                onClick={() => {
                                  setEditingVendor(vendor);
                                  setFormData({
                                    name: vendor.name,
                                    phone: vendor.phone,
                                    category: vendor.category,
                                    address: vendor.address,
                                    balance: vendor.balance.toString()
                                  });
                                  setShowModal(true);
                                }}
                                className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                               >
                                  <Pencil size={14} /> Edit
                               </button>
                               <button 
                                onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                                className="px-4 py-3 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700"
                               >
                                  <Trash2 size={14} /> Delete
                               </button>
                            </div>
                         </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Payment Modal */}
      {showPaymentModal && selectedVendorForPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/20 dark:bg-emerald-900/10">
               <div className="flex gap-4 items-center">
                 <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200 dark:shadow-none">
                    <DollarSign size={28} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingPaymentRecord ? 'Modify Settlement' : 'New Settlement'}</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Vendor: {selectedVendorForPayment.name}</p>
                 </div>
               </div>
               <button onClick={() => { setShowPaymentModal(false); setSelectedVendorForPayment(null); setEditingPaymentRecord(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="p-8 space-y-6 pb-safe overflow-y-auto no-scrollbar max-h-[80vh]">
               {/* Context Display for Stock Inward Pay Balance */}
               {linkedBatchInfo && (
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-center gap-4 animate-in slide-in-from-top-2">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl">
                       <ShoppingCart size={20} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Settling Linked Batch</p>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">{linkedBatchInfo.materialName}</h4>
                       <p className="text-[9px] text-slate-500 uppercase font-black">Received: {new Date(linkedBatchInfo.batchDate).toLocaleDateString()} • Total Value: {formatCurrency(linkedBatchInfo.totalValue)}</p>
                    </div>
                    <Link size={16} className="text-blue-300" />
                 </div>
               )}

               <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">
                      {editingPaymentRecord ? 'Outstanding Before This' : 'Current Outstanding'}
                    </p>
                    <p className="text-xl font-black">
                      {formatCurrency(editingPaymentRecord ? selectedVendorForPayment.balance + editingPaymentRecord.amount : selectedVendorForPayment.balance)}
                    </p>
                  </div>
                  <ArrowRight className="text-white/20" size={24} />
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">New Balance</p>
                    <p className="text-xl font-black text-emerald-500">
                      {formatCurrency(Math.max(0, (editingPaymentRecord ? selectedVendorForPayment.balance + editingPaymentRecord.amount : selectedVendorForPayment.balance) - (parseFloat(paymentFormData.amount) || 0)))}
                    </p>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Briefcase size={14} className="text-blue-500" /> Site Linkage
                  </label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    value={paymentFormData.projectId}
                    onChange={(e) => setPaymentFormData(p => ({ ...p, projectId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Choose site to bill...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount (Rs.)</label>
                    </div>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="0.00" 
                      max={editingPaymentRecord ? selectedVendorForPayment.balance + editingPaymentRecord.amount : selectedVendorForPayment.balance}
                      className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all`} 
                      value={paymentFormData.amount} 
                      onChange={(e) => setPaymentFormData(p => ({ ...p, amount: e.target.value }))} 
                    />
                    {parseFloat(paymentFormData.amount) > (editingPaymentRecord ? selectedVendorForPayment.balance + editingPaymentRecord.amount : selectedVendorForPayment.balance) && (
                      <p className="text-[9px] font-black text-red-500 uppercase px-1 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Amount cannot exceed outstanding balance
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                    <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.date} onChange={(e) => setPaymentFormData(p => ({ ...p, date: e.target.value }))} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Settlement Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setPaymentFormData(p => ({ ...p, method: m }))}
                         className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${paymentFormData.method === m ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-500'}`}
                       >
                         {m}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">UTR / Reference #</label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Optional transaction ID..." className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.reference} onChange={(e) => setPaymentFormData(p => ({ ...p, reference: e.target.value }))} />
                  </div>
               </div>

               <button 
                type="submit" 
                disabled={parseFloat(paymentFormData.amount) > (editingPaymentRecord ? selectedVendorForPayment.balance + editingPaymentRecord.amount : selectedVendorForPayment.balance)}
                className={`w-full py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 ${parseFloat(paymentFormData.amount) > (editingPaymentRecord ? selectedVendorForPayment.balance + editingPaymentRecord.amount : selectedVendorForPayment.balance) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none'}`}
               >
                 <CheckCircle2 size={24} />
                 {editingPaymentRecord ? 'Update Settlement' : 'Authorize Payment'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Modal */}
      {activeVendor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl">{activeVendor.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Supplier Ledger</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeVendor.name} • {activeVendor.category} Specialist</p>
                 </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="hidden sm:block text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Outstanding</p>
                    <p className={`text-lg font-black ${activeVendor.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(activeVendor.balance)}</p>
                 </div>
                 <button onClick={() => setViewingVendorId(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={36} /></button>
               </div>
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 shrink-0 px-4">
               <button onClick={() => setActiveDetailTab('payments')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'payments' ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}>Payment History</button>
               <button onClick={() => setActiveDetailTab('supplies')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'supplies' ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400'}`}>Stock Inward</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
               {activeDetailTab === 'supplies' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                       <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
                          <ShoppingCart size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Procurement Value</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(procurementSummary.totalValue)}</p>
                       </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                       <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                          <Package size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery Volume</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{procurementSummary.totalCount} <span className="text-xs font-medium text-slate-400 uppercase">Batches Received</span></p>
                       </div>
                    </div>
                 </div>
               )}

               <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto no-scrollbar">
                   {activeDetailTab === 'payments' ? (
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-8 py-5">Value Date</th>
                            <th className="px-8 py-5">Project Site</th>
                            <th className="px-8 py-5">Method/Ref</th>
                            <th className="px-8 py-5 text-right">Settled Amount</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {payments.filter(p => p.vendorId === activeVendor.id).slice().reverse().map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                              <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(pay.date).toLocaleDateString()}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                  <Briefcase size={14} className="text-blue-500" />
                                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{projects.find(p => p.id === pay.projectId)?.name || 'Direct Procurement'}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">{pay.method}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{pay.reference || '--'}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right">{formatCurrency(pay.amount)}</td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleOpenEditPaymentModal(pay)} 
                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePaymentRecord(pay.id)} 
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   ) : (
                      <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-8 py-5">Arrival Date</th>
                            <th className="px-8 py-5">Material Asset</th>
                            <th className="px-8 py-5 text-right">Qty Received</th>
                            <th className="px-8 py-5 text-right">Unit Price</th>
                            <th className="px-8 py-5 text-right">Total Cost</th>
                            <th className="px-8 py-5">Site Allocation</th>
                            <th className="px-8 py-5 text-right">Quick Settlement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {vendorSupplies.length > 0 ? vendorSupplies.map((supply, idx) => {
                            const totalPaidForBatch = payments
                              .filter(p => p.materialBatchId === supply.id)
                              .reduce((sum, p) => sum + p.amount, 0);
                            
                            // Use a small epsilon for float comparison to ensure "Settled" only at 100% payment
                            const isFullyPaid = totalPaidForBatch >= (supply.estimatedValue - 0.01);
                            const remaining = Math.max(0, supply.estimatedValue - totalPaidForBatch);

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group/row">
                                <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(supply.date).toLocaleDateString()}</td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg flex items-center justify-center"><Package size={14} /></div>
                                    <div>
                                      <p className="font-black text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-tight">{supply.materialName}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase">Batch ID: {supply.id.slice(-6)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-[11px] font-black text-slate-700 dark:text-slate-300 text-right">{supply.quantity.toLocaleString()} {supply.unit}</td>
                                <td className="px-8 py-5 text-[11px] font-black text-slate-600 dark:text-slate-400 text-right">{formatCurrency(supply.unitPrice)}</td>
                                <td className="px-8 py-5 text-[12px] font-black text-red-600 text-right">
                                  {formatCurrency(supply.estimatedValue)}
                                  {totalPaidForBatch > 0 && !isFullyPaid && (
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Paid: {formatCurrency(totalPaidForBatch)}</p>
                                  )}
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-2">
                                      <Briefcase size={12} className="text-slate-400" />
                                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{projects.find(p => p.id === supply.projectId)?.name || 'Direct Allocation'}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => handleOpenPaymentModal(activeVendor, supply.projectId, remaining, supply.id)}
                                    disabled={isFullyPaid}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ml-auto shadow-md active:scale-95 ${isFullyPaid ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed border border-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none'}`}
                                  >
                                    {isFullyPaid ? (
                                      <>
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        Settled
                                      </>
                                    ) : (
                                      <>
                                        <DollarSign size={12} />
                                        {totalPaidForBatch > 0 ? 'Pay Balance' : 'Pay Now'}
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={7} className="px-8 py-20 text-center">
                                <AlertCircle size={32} className="mx-auto text-slate-300 mb-4 opacity-50" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No procurement history recorded for this supplier</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                   )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingVendor ? 'Edit Supplier Profile' : 'New Supplier Registry'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={32} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const vendorData: Vendor = {
                id: editingVendor ? editingVendor.id : 'v' + Date.now(),
                name: formData.name,
                phone: formData.phone,
                category: formData.category,
                address: formData.address,
                balance: parseFloat(formData.balance) || 0
              };
              if (editingVendor) updateVendor(vendorData); else addVendor(vendorData);
              setShowModal(false);
              setEditingVendor(null);
            }} className="p-8 space-y-6 pb-safe overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Company Name</label>
                <input type="text" placeholder="e.g. Acme Construction Supplies" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trade Category</label>
                   <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}>
                     {tradeCategories.map(cat => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balance (Rs.)</label>
                     {editingVendor && hasVendorHistory(editingVendor.id) && (
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                           <Lock size={10} className="text-amber-600" />
                           <span className="text-[8px] font-black uppercase text-amber-600">Locked: Has History</span>
                        </div>
                     )}
                   </div>
                   <input 
                    type="number" 
                    placeholder="0.00" 
                    disabled={editingVendor ? hasVendorHistory(editingVendor.id) : false}
                    className={`w-full px-5 py-4 border rounded-2xl font-bold dark:text-white outline-none transition-all ${(editingVendor && hasVendorHistory(editingVendor.id)) ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed opacity-70 shadow-inner' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10'}`} 
                    value={formData.balance} 
                    onChange={(e) => setFormData(p => ({ ...p, balance: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="tel" placeholder="+91 00000 00000" className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Business Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea placeholder="Shop #, Street, City, ZIP..." className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} rows={2} required />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-500">Discard</button>
                 <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95 text-[10px] uppercase tracking-widest">
                    {editingVendor ? 'Update Profile' : 'Authorize Supplier'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
