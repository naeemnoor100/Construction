import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Search, Plus, X, History, DollarSign, Pencil, Trash2, Package, Briefcase, Calendar, CreditCard, ArrowRightLeft, CheckCircle2, AlertCircle, Save, Wallet, ArrowRight, TrendingUp, Landmark, MoreVertical, Phone, MapPin, Lock, ArrowDownCircle, Clock, ShoppingCart, Link, ChevronRight, FileText, Download, ArrowUpRight, ArrowDownRight, Tag, Building2
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Vendor, Payment, PaymentMethod } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const VendorList: React.FC = () => {
  const { vendors, payments, projects, materials, tradeCategories, addVendor, updateVendor, deleteVendor, addPayment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [viewingVendorId, setViewingVendorId] = useState<string | null>(null);
  const activeVendor = useMemo(() => vendors.find(v => v.id === viewingVendorId), [vendors, viewingVendorId]);
  
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', category: tradeCategories[0] || 'Material', address: '', balance: '' });
  const [paymentFormData, setPaymentFormData] = useState({ projectId: projects[0]?.id || '', amount: '', method: 'Bank' as PaymentMethod, date: new Date().toISOString().split('T')[0], reference: '', materialBatchId: '' });

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayment) return;
    const amountNum = parseFloat(paymentFormData.amount) || 0;
    const paymentData: Payment = {
      id: 'pay' + Date.now(),
      date: paymentFormData.date,
      vendorId: selectedVendorForPayment.id,
      projectId: paymentFormData.projectId,
      amount: amountNum,
      method: paymentFormData.method,
      reference: paymentFormData.reference,
      materialBatchId: paymentFormData.materialBatchId || undefined
    };
    await addPayment(paymentData);
    setShowPaymentModal(false);
    setSelectedVendorForPayment(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Supplier Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage partnerships and settle dues.</p>
        </div>
        <button 
          onClick={() => { setEditingVendor(null); setFormData({ name: '', phone: '', category: tradeCategories[0] || 'Material', address: '', balance: '' }); setShowModal(true); }}
          className="w-full sm:w-auto bg-[#003366] text-white px-6 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={20} /> Register Vendor
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none shadow-sm dark:text-white"
        />
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => {
          const vPayments = payments.filter(p => p.vendorId === vendor.id);
          const lastPay = vPayments.length > 0 ? [...vPayments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
          
          return (
            <div key={vendor.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.8rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col group active:scale-[0.98] transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{vendor.name.charAt(0)}</div>
                     <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{vendor.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{vendor.category}</p>
                     </div>
                  </div>
                  <button onClick={() => { setEditingVendor(vendor); setFormData({ name: vendor.name, phone: vendor.phone, category: vendor.category, address: vendor.address, balance: vendor.balance.toString() }); setShowModal(true); }} className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Pencil size={18} /></button>
               </div>

               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                    <p className={`text-lg font-black ${vendor.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(vendor.balance)}</p>
                  </div>
                  {lastPay && (
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Paid</p>
                       <p className="text-xs font-black text-slate-700 dark:text-slate-300">{new Date(lastPay.date).toLocaleDateString()}</p>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-3 mt-8">
                  <button onClick={() => { setSelectedVendorForPayment(vendor); setPaymentFormData(prev => ({...prev, amount: vendor.balance.toString(), projectId: projects[0]?.id || ''})); setShowPaymentModal(true); }} disabled={vendor.balance <= 0} className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${vendor.balance > 0 ? 'bg-emerald-600 text-white shadow-xl active:scale-95 shadow-emerald-100 dark:shadow-none' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}>
                    <DollarSign size={14} /> Pay Dues
                  </button>
                  <button onClick={() => setViewingVendorId(vendor.id)} className="py-3.5 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <History size={14} /> Ledger
                  </button>
               </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Vendor Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingVendor ? 'Edit Supplier' : 'Register Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={32} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const v = { ...formData, id: editingVendor ? editingVendor.id : 'v'+Date.now(), balance: parseFloat(formData.balance) || 0 };
              if (editingVendor) updateVendor(v); else addVendor(v);
              setShowModal(false);
            }} className="p-8 space-y-6 overflow-y-auto no-scrollbar pb-safe max-h-[75vh]">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supplier Name</label><input type="text" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trade Category</label><select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>{tradeCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Opening Balance</label><input type="number" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.balance} onChange={e => setFormData(p => ({ ...p, balance: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label><input type="tel" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
              <button type="submit" className="w-full bg-[#003366] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm mt-4">Confirm Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Settlement Sheet */}
      {showPaymentModal && selectedVendorForPayment && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/20 flex justify-between items-center shrink-0">
               <div className="flex gap-4 items-center">
                  <div className="p-3 bg-emerald-600 text-white rounded-2xl"><DollarSign size={24} /></div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Record Settlement</h2>
               </div>
               <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-8 space-y-6 overflow-y-auto no-scrollbar pb-safe max-h-[75vh]">
               <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Outstanding</p>
                    <p className="text-xl font-black">{formatCurrency(selectedVendorForPayment.balance)}</p>
                  </div>
                  <ArrowRight className="text-white/20" size={24} />
               </div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Allocation</label><select required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.projectId} onChange={e => setPaymentFormData(p => ({ ...p, projectId: e.target.value }))}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pay Amount</label><input type="number" step="0.01" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-black text-lg dark:text-white outline-none" value={paymentFormData.amount} onChange={e => setPaymentFormData(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Value Date</label><input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.date} onChange={e => setPaymentFormData(p => ({ ...p, date: e.target.value }))} /></div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button key={m} type="button" onClick={() => setPaymentFormData(p => ({ ...p, method: m }))} className={`py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${paymentFormData.method === m ? 'bg-slate-900 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-500'}`}>{m}</button>
                     ))}
                  </div>
               </div>
               <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all text-sm mt-4">Confirm Settlement</button>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Sheet */}
      {activeVendor && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-6xl h-[95vh] sm:h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-16 h-16 bg-[#003366] text-white rounded-[1.8rem] flex items-center justify-center font-black text-3xl shadow-xl">{activeVendor.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{activeVendor.name} Ledger</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Statement & Transaction Log</p>
                 </div>
               </div>
               <button onClick={() => setViewingVendorId(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={36} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 no-scrollbar pb-safe">
               {/* Mobile Ledger History Cards */}
               <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {payments.filter(p => p.vendorId === activeVendor.id).slice().reverse().map(pay => (
                    <div key={pay.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(pay.date).toLocaleDateString()}</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white uppercase mt-1">Settlement via {pay.method}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{projects.find(p => p.id === pay.projectId)?.name || 'Direct'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">{formatCurrency(pay.amount)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{pay.reference || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 pb-safe">
              <button onClick={() => setViewingVendorId(null)} className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs">Close Statement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};