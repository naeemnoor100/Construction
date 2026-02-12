
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
  Save
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Vendor, VendorCategory, Payment, PaymentMethod, Project } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const VendorList: React.FC = () => {
  const { vendors, payments, projects, materials, addVendor, updateVendor, deleteVendor, addPayment, updatePayment, deletePayment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [viewingVendorDetails, setViewingVendorDetails] = useState<Vendor | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'payments' | 'supplies'>('payments');
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<Vendor | null>(null);
  
  // State for editing an existing payment
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', contact: '', category: 'Material' as VendorCategory, email: '', balance: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    projectId: '', 
    amount: '', 
    method: 'Bank' as PaymentMethod, 
    date: new Date().toISOString().split('T')[0], 
    reference: ''
  });

  const [editPaymentFormData, setEditPaymentFormData] = useState({
    projectId: '',
    amount: '',
    method: 'Bank' as PaymentMethod,
    date: '',
    reference: ''
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowPaymentModal(false);
        setShowEditPaymentModal(false);
        setViewingVendorDetails(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);

  const handleOpenPaymentModal = (vendor: Vendor) => {
    setSelectedVendorForPayment(vendor);
    setPaymentFormData({
      projectId: projects[0]?.id || '',
      amount: '',
      method: 'Bank',
      date: new Date().toISOString().split('T')[0],
      reference: ''
    });
    setShowPaymentModal(true);
  };

  const handleOpenEditPaymentModal = (payment: Payment) => {
    setEditingPayment(payment);
    setEditPaymentFormData({
      projectId: payment.projectId,
      amount: payment.amount.toString(),
      method: payment.method,
      date: payment.date,
      reference: payment.reference || ''
    });
    setShowEditPaymentModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayment || !paymentFormData.projectId) {
      alert("Please select a valid project for this payment.");
      return;
    }
    
    const paymentData: Payment = {
      id: 'pay' + Date.now(),
      date: paymentFormData.date,
      vendorId: selectedVendorForPayment.id,
      projectId: paymentFormData.projectId,
      amount: parseFloat(paymentFormData.amount) || 0,
      method: paymentFormData.method,
      reference: paymentFormData.reference
    };

    addPayment(paymentData);
    setShowPaymentModal(false);
    setSelectedVendorForPayment(null);
  };

  const handleUpdatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment || !editPaymentFormData.projectId) return;

    const updatedPayment: Payment = {
      ...editingPayment,
      projectId: editPaymentFormData.projectId,
      amount: parseFloat(editPaymentFormData.amount) || 0,
      method: editPaymentFormData.method,
      date: editPaymentFormData.date,
      reference: editPaymentFormData.reference
    };

    updatePayment(updatedPayment);
    setShowEditPaymentModal(false);
    setEditingPayment(null);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm("Are you sure you want to delete this payment record? This will adjust the vendor's outstanding balance.")) {
      deletePayment(id);
    }
  };

  const handleEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setFormData({
      name: v.name,
      contact: v.contact,
      category: v.category,
      email: v.email,
      balance: v.balance.toString()
    });
    setShowModal(true);
  };

  const vendorSupplies = useMemo(() => {
    if (!viewingVendorDetails) return [];
    const supplyList: any[] = [];
    materials.forEach(mat => {
      mat.history?.forEach(h => {
        if (h.type === 'Purchase' && h.vendorId === viewingVendorDetails.id) {
          supplyList.push({ ...h, materialName: mat.name, unit: mat.unit });
        }
      });
    });
    return supplyList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [viewingVendorDetails, materials]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vendor Management</h2>
          <p className="text-slate-500 text-sm">Oversee suppliers and site-specific payment settlements.</p>
        </div>
        <button 
          onClick={() => { setEditingVendor(null); setShowModal(true); setFormData({ name: '', contact: '', category: 'Material', email: '', balance: '' }); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search suppliers by name or email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Supplier Profile</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Outstanding Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">{vendor.name.charAt(0)}</div>
                       <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{vendor.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-[9px] font-bold uppercase rounded-lg text-slate-600 border border-slate-200">{vendor.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold ${vendor.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(vendor.balance)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                       <button 
                        onClick={() => handleOpenPaymentModal(vendor)}
                        className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                       >
                         <DollarSign size={12} /> Pay
                       </button>
                       <button onClick={() => setViewingVendorDetails(vendor)} className="p-2 text-slate-400 hover:text-blue-600" title="Ledger Details"><History size={16} /></button>
                       <button onClick={() => handleEditVendor(vendor)} className="p-2 text-slate-400 hover:text-emerald-600" title="Edit Vendor"><Pencil size={16} /></button>
                       <button onClick={() => confirm(`Delete vendor ${vendor.name}?`) && deleteVendor(vendor.id)} className="p-2 text-slate-400 hover:text-red-600" title="Delete Vendor"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed View Modal (Ledger) */}
      {viewingVendorDetails && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[92vh] lg:h-[80vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-100">{viewingVendorDetails.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">Comprehensive Ledger</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingVendorDetails.name} • {viewingVendorDetails.category} Solutions</p>
                 </div>
               </div>
               <button onClick={() => setViewingVendorDetails(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
            </div>

            <div className="flex border-b border-slate-100 bg-slate-50/50">
               <button onClick={() => setActiveDetailTab('payments')} className={`px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeDetailTab === 'payments' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Payment History</button>
               <button onClick={() => setActiveDetailTab('supplies')} className={`px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeDetailTab === 'supplies' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>Supply History</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/20 no-scrollbar">
               <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                   {activeDetailTab === 'payments' ? (
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Project</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4 text-right">Settled Amount</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.filter(p => p.vendorId === viewingVendorDetails.id).map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-50 transition-colors group/row">
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(pay.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Briefcase size={12} className="text-blue-500" />
                                  <span className="text-xs font-semibold text-slate-800">{projects.find(p => p.id === pay.projectId)?.name || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold uppercase rounded-md border border-blue-100">{pay.method}</span></td>
                              <td className="px-6 py-4 text-xs font-bold text-emerald-600 text-right">{formatCurrency(pay.amount)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleOpenEditPaymentModal(pay)} 
                                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                  >
                                    <Pencil size={12} /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePayment(pay.id)} 
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {payments.filter(p => p.vendorId === viewingVendorDetails.id).length === 0 && (
                            <tr><td colSpan={5} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No payment records found</td></tr>
                          )}
                        </tbody>
                      </table>
                   ) : (
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                          <tr><th className="px-6 py-4">Arrival Date</th><th className="px-6 py-4">Material Asset</th><th className="px-6 py-4">Quantity</th><th className="px-6 py-4">Delivery Site</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vendorSupplies.map((supply, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(supply.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Package size={14} className="text-emerald-500" />
                                  <span className="font-bold text-xs text-slate-800">{supply.materialName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-700">{supply.quantity.toLocaleString()} {supply.unit}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-600">{projects.find(p => p.id === supply.projectId)?.name || 'Central Store'}</td>
                            </tr>
                          ))}
                          {vendorSupplies.length === 0 && (
                            <tr><td colSpan={4} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No supply records found</td></tr>
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

      {/* Edit Payment Modal */}
      {showEditPaymentModal && editingPayment && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/30 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Pencil size={24} /></div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">Update Payment</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Modify amount or link to different project</p>
                 </div>
               </div>
               <button onClick={() => { setShowEditPaymentModal(false); setEditingPayment(null); }} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Linked Project</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={editPaymentFormData.projectId}
                      onChange={(e) => setEditPaymentFormData(p => ({ ...p, projectId: e.target.value }))}
                      required
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input type="number" step="0.01" required className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={editPaymentFormData.amount} onChange={(e) => setEditPaymentFormData(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Transaction Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input type="date" required className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={editPaymentFormData.date} onChange={(e) => setEditPaymentFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setEditPaymentFormData(p => ({ ...p, method: m }))}
                         className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${editPaymentFormData.method === m ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50'}`}
                       >
                         {m}
                       </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reference Info</label>
                  <input type="text" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" placeholder="Cheque # or UPI Reference" value={editPaymentFormData.reference} onChange={(e) => setEditPaymentFormData(p => ({ ...p, reference: e.target.value }))} />
               </div>
               <div className="pt-2">
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save size={18} /> Update Transaction
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedVendorForPayment && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100"><DollarSign size={24} /></div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">New Payment</h2>
                    <p className="text-xs text-slate-500 font-medium">To: {selectedVendorForPayment.name}</p>
                 </div>
               </div>
               <button onClick={() => { setShowPaymentModal(false); setSelectedVendorForPayment(null); }} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Allocate to Site / Project</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      value={paymentFormData.projectId}
                      onChange={(e) => setPaymentFormData(p => ({ ...p, projectId: e.target.value }))}
                      required
                    >
                      <option value="">Select Project Assignment</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input type="number" step="0.01" required placeholder="0.00" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={paymentFormData.amount} onChange={(e) => setPaymentFormData(p => ({ ...p, amount: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input type="date" required className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={paymentFormData.date} onChange={(e) => setPaymentFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Settlement Method</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setPaymentFormData(p => ({ ...p, method: m }))}
                         className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${paymentFormData.method === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50'}`}
                       >
                         {paymentFormData.method === m && <CheckCircle2 size={12} />}
                         {m}
                       </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reference ID</label>
                  <input type="text" placeholder="e.g. UTR-0982-ALPHA" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={paymentFormData.reference} onChange={(e) => setPaymentFormData(p => ({ ...p, reference: e.target.value }))} />
               </div>
               <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95 mt-4 text-sm flex items-center justify-center gap-2">
                 <CheckCircle2 size={20} />
                 Confirm Settlement
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-fit animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h2 className="text-xl font-bold text-slate-900">{editingVendor ? 'Update Supplier Profile' : 'Register New Vendor'}</h2>
                 <button onClick={() => { setShowModal(false); setEditingVendor(null); }} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const vendorData: Vendor = {
                  id: editingVendor ? editingVendor.id : 'v' + Date.now(),
                  name: formData.name,
                  contact: formData.contact,
                  category: formData.category,
                  email: formData.email,
                  balance: editingVendor ? editingVendor.balance : (parseFloat(formData.balance) || 0)
                };
                if (editingVendor) updateVendor(vendorData); else addVendor(vendorData);
                setShowModal(false);
                setEditingVendor(null);
                setFormData({ name: '', contact: '', category: 'Material', email: '', balance: '' });
              }} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Legal Company Name</label>
                  <input type="text" placeholder="e.g. Skyline Steel Supplies" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Supplier Type</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as VendorCategory }))}>
                      <option value="Material">Material Supplier</option><option value="Labor">Labor Contractor</option><option value="Equipment">Equipment Rental</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Phone</label>
                    <input type="text" placeholder="+91..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.contact} onChange={(e) => setFormData(p => ({ ...p, contact: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Billing Email</label>
                  <input type="email" placeholder="accounts@vendor.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
                </div>
                {!editingVendor && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-1">Opening Payable Balance (Rs.)</label>
                    <input type="number" placeholder="0.00" className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl font-bold" value={formData.balance} onChange={(e) => setFormData(p => ({ ...p, balance: e.target.value }))} />
                  </div>
                )}
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 mt-4">
                  {editingVendor ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
