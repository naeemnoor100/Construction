
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  History, 
  Search, 
  X, 
  TrendingDown, 
  Trash2,
  Briefcase,
  Users,
  Filter
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const Inventory: React.FC = () => {
  const { materials, projects, vendors, updateMaterial, addMaterial, deleteMaterial, addExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const [procureData, setProcureData] = useState({
    materialId: '', newName: '', vendorId: vendors[0]?.id || '', projectId: projects[0]?.id || '', quantity: '', unit: 'Bag' as MaterialUnit, costPerUnit: '', date: new Date().toISOString().split('T')[0]
  });

  const [usageData, setUsageData] = useState({
    materialId: '', projectId: projects[0]?.id || '', quantity: '', date: new Date().toISOString().split('T')[0], notes: ''
  });

  const filteredMaterials = useMemo(() => {
    return materials.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'All' || mat.history?.some(h => h.projectId === projectFilter);
      const matchesVendor = vendorFilter === 'All' || mat.history?.some(h => h.vendorId === vendorFilter);
      return matchesSearch && matchesProject && matchesVendor;
    });
  }, [materials, searchTerm, projectFilter, vendorFilter]);

  const handleProcureStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(procureData.quantity) || 0;
    const cost = (parseFloat(procureData.costPerUnit) || 0) * qty;

    if (procureData.materialId === 'new') {
      const newId = 'm' + Date.now();
      addMaterial({
        id: newId,
        name: procureData.newName,
        unit: procureData.unit,
        costPerUnit: parseFloat(procureData.costPerUnit) || 0,
        totalPurchased: qty,
        totalUsed: 0,
        history: [{
          id: 'sh' + Date.now(),
          date: procureData.date,
          type: 'Purchase',
          quantity: qty,
          vendorId: procureData.vendorId,
          projectId: procureData.projectId,
          note: `Procured from ${vendors.find(v => v.id === procureData.vendorId)?.name}`
        }]
      });
    } else {
      const existing = materials.find(m => m.id === procureData.materialId);
      if (existing) {
        updateMaterial({
          ...existing,
          totalPurchased: existing.totalPurchased + qty,
          history: [...(existing.history || []), {
            id: 'sh' + Date.now(),
            date: procureData.date,
            type: 'Purchase',
            quantity: qty,
            vendorId: procureData.vendorId,
            projectId: procureData.projectId,
            note: `Restock from ${vendors.find(v => v.id === procureData.vendorId)?.name}`
          }]
        });
      }
    }

    addExpense({
      id: 'e' + Date.now(),
      date: procureData.date,
      projectId: procureData.projectId,
      vendorId: procureData.vendorId,
      amount: cost,
      paymentMethod: 'Bank',
      category: 'Material',
      notes: `Purchase of ${qty} ${procureData.unit} material`
    });

    setShowProcureModal(false);
  };

  const handleRecordUsage = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(usageData.quantity) || 0;
    const target = materials.find(m => m.id === usageData.materialId);

    if (target && (target.totalPurchased - target.totalUsed >= qty)) {
      updateMaterial({
        ...target,
        totalUsed: target.totalUsed + qty,
        history: [...(target.history || []), {
          id: 'sh' + Date.now(),
          date: usageData.date,
          type: 'Usage',
          quantity: qty,
          projectId: usageData.projectId,
          note: usageData.notes || 'Site Consumption'
        }]
      });
      setShowUsageModal(false);
    } else {
      alert("Insufficient global stock for this consumption!");
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Inventory</h2>
          <p className="text-slate-500 text-sm">Monitor stock allocation per site and source vendor.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setShowProcureModal(true)} className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><ShoppingCart size={18} /> Procure</button>
          <button onClick={() => setShowUsageModal(true)} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><TrendingDown size={18} /> Consume</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search materials..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
           <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
             <option value="All">All Projects</option>
             {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
           <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
             <option value="All">All Vendors</option>
             {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Last Site</th>
                <th className="px-6 py-4">Last Supplier</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => {
                const remaining = mat.totalPurchased - mat.totalUsed;
                const lastHistory = mat.history?.slice().reverse()[0];
                const lastVendor = vendors.find(v => v.id === lastHistory?.vendorId)?.name || 'N/A';
                const lastProject = projects.find(p => p.id === lastHistory?.projectId)?.name || 'Store';
                
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-slate-900">{mat.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{lastProject}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{lastVendor}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${remaining < 50 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                         {remaining.toLocaleString()} {mat.unit}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setHistoryMaterial(mat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><History size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Modal */}
      {showProcureModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-bold text-slate-900">Procure Material Batch</h2>
               <button onClick={() => setShowProcureModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleProcureStock} className="p-6 space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Material Asset</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={procureData.materialId} onChange={e => setProcureData(p => ({ ...p, materialId: e.target.value }))} required>
                    <option value="">Select Category</option>
                    <option value="new">+ Register New Category</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Source Vendor</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={procureData.vendorId} onChange={e => setProcureData(p => ({ ...p, vendorId: e.target.value }))} required>
                       {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Destination Site</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={procureData.projectId} onChange={e => setProcureData(p => ({ ...p, projectId: e.target.value }))} required>
                       {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.01" placeholder="Quantity" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={procureData.quantity} onChange={e => setProcureData(p => ({ ...p, quantity: e.target.value }))} required />
                  <input type="number" step="0.01" placeholder="Cost Per Unit" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" value={procureData.costPerUnit} onChange={e => setProcureData(p => ({ ...p, costPerUnit: e.target.value }))} required />
               </div>
               <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 mt-4">Record Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingCart = ({ size }: { size: number }) => <Package size={size} />;
