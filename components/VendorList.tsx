
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
  ArrowRight
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

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayment || !paymentFormData.projectId) {
      alert("Please select a specific project to link this payment to.");
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
    if (confirm("Delete payment record? This will increase the vendor's outstanding balance.")) {
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vendors & Suppliers</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage procurement partners and project-linked settlements.</p>
        </div>
        <button 
          onClick={() => { setEditingVendor(null); setShowModal(true); setFormData({ name: '', contact: '', category: 'Material', email: '', balance: '' }); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Vendor
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white" 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-center">Category</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">{vendor.name.charAt(0)}</div>
                       <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{vendor.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-[9px] font-bold uppercase rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{vendor.category}</span>
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
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
                       >
                         <DollarSign size={12} /> Pay
                       </button>
                       <button onClick={() => setViewingVendorDetails(vendor)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all"><History size={18} /></button>
                       <button onClick={() => confirm(`Delete vendor ${vendor.name}?`) && deleteVendor(vendor.id)} className="p-2.5 text-red-400 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal as Mobile Sheet */}
      {showPaymentModal && selectedVendorForPayment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/20">
               <div className="flex gap-4 items-center">
                 <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                    <DollarSign size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Record Payment</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">To: {selectedVendorForPayment.name}</p>
                 </div>
               </div>
               <button onClick={() => { setShowPaymentModal(false); setSelectedVendorForPayment(null); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="p-6 space-y-5 pb-safe overflow-y-auto no-scrollbar max-h-[80vh]">
               <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Balance</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(selectedVendorForPayment.balance)}</p>
                  </div>
                  {paymentFormData.amount && (
                    <div className="text-right">
                       <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Remaining After</p>
                       <p className="text-lg font-bold text-emerald-600">
                         {formatCurrency(Math.max(0, selectedVendorForPayment.balance - parseFloat(paymentFormData.amount)))}
                       </p>
                    </div>
                  )}
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Linked Project / Site</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold appearance-none outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                      value={paymentFormData.projectId}
                      onChange={(e) => setPaymentFormData(p => ({ ...p, projectId: e.target.value }))}
                      required
                    >
                      <option value="">Choose specific site...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium px-1">Link this payment to a site for project-wise financial accuracy.</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount (Rs.)</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.amount} onChange={(e) => setPaymentFormData(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment Date</label>
                    <input type="date" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.date} onChange={(e) => setPaymentFormData(p => ({ ...p, date: e.target.value }))} />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Method</label>
                  <div className="grid grid-cols-3 gap-2">
                     {(['Bank', 'Cash', 'Online'] as PaymentMethod[]).map(m => (
                       <button
                         key={m} type="button"
                         onClick={() => setPaymentFormData(p => ({ ...p, method: m }))}
                         className={`py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${paymentFormData.method === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                       >
                         {m}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Reference / UTR ID</label>
                  <input type="text" placeholder="Transaction Number..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none" value={paymentFormData.reference} onChange={(e) => setPaymentFormData(p => ({ ...p, reference: e.target.value }))} />
               </div>

               <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-3xl font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                 <CheckCircle2 size={20} />
                 Confirm Settlement
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Modal */}
      {viewingVendorDetails && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
               <div className="flex gap-4 items-center">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{viewingVendorDetails.name.charAt(0)}</div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Vendor Ledger</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingVendorDetails.name} • {viewingVendorDetails.category}</p>
                 </div>
               </div>
               <button onClick={() => setViewingVendorDetails(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={28} /></button>
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
               <button onClick={() => setActiveDetailTab('payments')} className={`flex-1 sm:flex-none px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'payments' ? 'bg-white dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Payments</button>
               <button onClick={() => setActiveDetailTab('supplies')} className={`flex-1 sm:flex-none px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeDetailTab === 'supplies' ? 'bg-white dark:bg-slate-800 text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}>Supplies</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/20 dark:bg-slate-900/10 no-scrollbar">
               <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto no-scrollbar">
                   {activeDetailTab === 'payments' ? (
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Project / Site</th>
                            <th className="px-6 py-4">Ref</th>
                            <th className="px-6 py-4 text-right">Settled</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {payments.filter(p => p.vendorId === viewingVendorDetails.id).map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group/row">
                              <td className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">{new Date(pay.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Briefcase size={12} className="text-blue-500" />
                                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{projects.find(p => p.id === pay.projectId)?.name || 'General'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{pay.reference || '--'}</td>
                              <td className="px-6 py-4 text-[11px] font-black text-emerald-600 text-right">{formatCurrency(pay.amount)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 group-hover/row:opacity-100 transition-opacity">
                                  <button onClick={() => handleDeletePayment(pay.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   ) : (
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                          <tr><th className="px-6 py-4">Arrival Date</th><th className="px-6 py-4">Asset</th><th className="px-6 py-4">Qty</th><th className="px-6 py-4">Site</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {vendorSupplies.map((supply, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">{new Date(supply.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Package size={14} className="text-emerald-500" />
                                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase">{supply.materialName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[11px] font-bold text-slate-700 dark:text-slate-300">{supply.quantity.toLocaleString()} {supply.unit}</td>
                              <td className="px-6 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{projects.find(p => p.id === supply.projectId)?.name || 'General Store'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
