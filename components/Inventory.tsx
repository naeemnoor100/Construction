
import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertCircle, 
  ShoppingCart, 
  TrendingUp, 
  History, 
  Search, 
  Filter, 
  X, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Calendar,
  Plus,
  DollarSign,
  Briefcase,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useApp } from '../AppContext';
import { Material, StockHistoryEntry, MaterialUnit, Expense } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const Inventory: React.FC = () => {
  const { materials, projects, updateMaterial, addMaterial, addExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Form State for Purchase
  const [purchaseData, setPurchaseData] = useState({
    materialId: '',
    newName: '',
    unit: 'Bag' as MaterialUnit,
    costPerUnit: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '', // Optional for purchase
    note: ''
  });

  // Form State for Usage
  const [usageData, setUsageData] = useState({
    materialId: '',
    projectId: '', // Mandatory for usage
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const uniqueUnits = useMemo(() => {
    const units = materials.map(m => m.unit);
    return ['All', ...Array.from(new Set(units))];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = unitFilter === 'All' || mat.unit === unitFilter;
      
      const stockLevel = mat.totalPurchased > 0 
        ? ((mat.totalPurchased - mat.totalUsed) / mat.totalPurchased) * 100 
        : 0;
      
      const isLowStock = stockLevel < 20;
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Low Stock' && isLowStock) ||
        (statusFilter === 'In Stock' && !isLowStock);
      
      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [materials, searchTerm, unitFilter, statusFilter]);

  const lowStockCount = materials.filter(mat => {
    const remaining = mat.totalPurchased - mat.totalUsed;
    const stockLevel = mat.totalPurchased > 0 ? (remaining / mat.totalPurchased) * 100 : 0;
    return stockLevel < 20;
  }).length;

  const totalAssetValue = materials.reduce((sum, mat) => {
    const remaining = mat.totalPurchased - mat.totalUsed;
    return sum + (remaining * mat.costPerUnit);
  }, 0);

  const historyChartData = useMemo(() => {
    if (!historyMaterial || !historyMaterial.history) return [];
    
    let cumulativePurchased = 0;
    let cumulativeUsed = 0;
    
    return [...historyMaterial.history]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => {
        if (entry.type === 'Purchase') cumulativePurchased += entry.quantity;
        else cumulativeUsed += entry.quantity;
        
        return {
          date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          purchased: cumulativePurchased,
          used: cumulativeUsed,
          stock: cumulativePurchased - cumulativeUsed
        };
      });
  }, [historyMaterial]);

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(purchaseData.quantity);
    const cost = parseFloat(purchaseData.costPerUnit);
    
    if (isNaN(qty) || qty <= 0) return;

    const newHistoryEntry: StockHistoryEntry = {
      id: 'h' + Date.now(),
      date: purchaseData.date,
      type: 'Purchase',
      quantity: qty,
      note: purchaseData.note || 'Inventory Purchase'
    };

    let targetMaterial: Material;

    if (purchaseData.materialId && purchaseData.materialId !== 'new') {
      const existing = materials.find(m => m.id === purchaseData.materialId);
      if (existing) {
        targetMaterial = {
          ...existing,
          totalPurchased: existing.totalPurchased + qty,
          costPerUnit: cost || existing.costPerUnit,
          history: [...(existing.history || []), newHistoryEntry]
        };
        updateMaterial(targetMaterial);
      } else return;
    } else {
      targetMaterial = {
        id: 'm' + Date.now(),
        name: purchaseData.newName,
        unit: purchaseData.unit,
        costPerUnit: cost,
        totalPurchased: qty,
        totalUsed: 0,
        history: [newHistoryEntry]
      };
      addMaterial(targetMaterial);
    }

    if (purchaseData.projectId) {
      const expense: Expense = {
        id: 'exp' + Date.now(),
        date: purchaseData.date,
        projectId: purchaseData.projectId,
        materialId: targetMaterial.id,
        amount: qty * (cost || targetMaterial.costPerUnit),
        paymentMethod: 'Bank',
        notes: `Material Purchase: ${targetMaterial.name} (${qty} ${targetMaterial.unit}) - ${purchaseData.note}`,
        category: 'Material'
      };
      addExpense(expense);
    }

    setShowPurchaseModal(false);
    setPurchaseData({
      materialId: '', newName: '', unit: 'Bag', costPerUnit: '', quantity: '', date: new Date().toISOString().split('T')[0], projectId: '', note: ''
    });
  };

  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(usageData.quantity);
    if (isNaN(qty) || qty <= 0) return;

    const existing = materials.find(m => m.id === usageData.materialId);
    if (!existing) return;

    const remaining = existing.totalPurchased - existing.totalUsed;
    if (qty > remaining) {
      alert("Error: Usage quantity exceeds available stock!");
      return;
    }

    const newHistoryEntry: StockHistoryEntry = {
      id: 'h' + Date.now(),
      date: usageData.date,
      type: 'Usage',
      quantity: qty,
      note: usageData.note || 'Site Consumption'
    };

    updateMaterial({
      ...existing,
      totalUsed: existing.totalUsed + qty,
      history: [...(existing.history || []), newHistoryEntry]
    });

    if (usageData.projectId) {
      const expense: Expense = {
        id: 'exp' + Date.now(),
        date: usageData.date,
        projectId: usageData.projectId,
        materialId: existing.id,
        amount: qty * existing.costPerUnit,
        paymentMethod: 'Cash',
        notes: `Material Usage: ${existing.name} (${qty} ${existing.unit}) - ${usageData.note}`,
        category: 'Material'
      };
      addExpense(expense);
    }

    setShowUsageModal(false);
    setUsageData({
      materialId: '', projectId: '', quantity: '', date: new Date().toISOString().split('T')[0], note: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory</h2>
          <p className="text-slate-500 text-sm">Real-time material tracking and consumption.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button 
            onClick={() => setShowPurchaseModal(true)}
            className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
            Purchase
          </button>
          <button 
            onClick={() => setShowUsageModal(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <TrendingDown size={18} />
            Usage
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Items</h3>
            <p className="text-xl font-bold text-slate-900">{materials.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Low Stock</h3>
            <p className="text-xl font-bold text-slate-900">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Asset Value</h3>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAssetValue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="flex-1 lg:flex-none bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[100px]"
            >
              {uniqueUnits.map(unit => (
                <option key={unit} value={unit}>{unit === 'All' ? 'All Units' : unit}</option>
              ))}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 lg:flex-none bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[100px]"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4 text-right">Value</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((mat) => {
                  const remaining = mat.totalPurchased - mat.totalUsed;
                  const stockLevel = mat.totalPurchased > 0 ? (remaining / mat.totalPurchased) * 100 : 0;
                  const isLow = stockLevel < 20;
                  
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{mat.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Qty: {mat.totalPurchased.toLocaleString()} purchased</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                          {mat.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 w-32">
                          <div className="flex justify-between text-[10px] font-bold uppercase">
                            <span className={isLow ? 'text-red-500' : 'text-slate-500'}>
                              {remaining.toLocaleString()} left
                            </span>
                            <span className={isLow ? 'text-red-600' : 'text-blue-600'}>
                              {Math.round(stockLevel)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-blue-600'}`}
                              style={{width: `${stockLevel}%`}}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(remaining * mat.costPerUnit)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{formatCurrency(mat.costPerUnit)}/unit</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setHistoryMaterial(mat)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                          title="View Stock History"
                        >
                          <History size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <Package size={40} strokeWidth={1} />
                      <p className="text-sm font-medium text-slate-500">No matching materials</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Purchase Order</h2>
                  <p className="text-sm text-slate-500">Record incoming stock</p>
                </div>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X size={24} /></button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 block">Select Material</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={purchaseData.materialId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const mat = materials.find(m => m.id === id);
                    setPurchaseData(prev => ({
                      ...prev,
                      materialId: id,
                      unit: mat ? mat.unit : prev.unit,
                      costPerUnit: mat ? mat.costPerUnit.toString() : prev.costPerUnit
                    }));
                  }}
                  required
                >
                  <option value="">Choose Existing Material...</option>
                  <option value="new">+ Add New Material Category</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {purchaseData.materialId === 'new' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">Material Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Red Bricks"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      value={purchaseData.newName}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, newName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 block">Unit</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      value={purchaseData.unit}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, unit: e.target.value as MaterialUnit }))}
                    >
                      <option>Bag</option>
                      <option>Ton</option>
                      <option>KG</option>
                      <option>Piece</option>
                      <option>Cubic Meter</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Quantity</label>
                  <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={purchaseData.quantity} onChange={(e) => setPurchaseData(prev => ({ ...prev, quantity: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Cost Per Unit (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={purchaseData.costPerUnit} onChange={(e) => setPurchaseData(prev => ({ ...prev, costPerUnit: e.target.value }))} required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block flex items-center gap-2">
                  <Briefcase size={14} className="text-blue-600" />
                  Link to Project (Optional)
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={purchaseData.projectId}
                  onChange={(e) => setPurchaseData(prev => ({ ...prev, projectId: e.target.value }))}
                >
                  <option value="">General Stock (No Project)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">Linking to a project will automatically create a Material Expense for that project.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={purchaseData.date} onChange={(e) => setPurchaseData(prev => ({ ...prev, date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Note</label>
                  <input type="text" placeholder="e.g. Inv #1234" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={purchaseData.note} onChange={(e) => setPurchaseData(prev => ({ ...prev, note: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 shadow-lg transition-colors">Record Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Record Usage</h2>
                  <p className="text-sm text-slate-500">Log material site consumption</p>
                </div>
              </div>
              <button onClick={() => setShowUsageModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X size={24} /></button>
            </div>

            <form onSubmit={handleUsageSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Material</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={usageData.materialId}
                  onChange={(e) => setUsageData(prev => ({ ...prev, materialId: e.target.value }))}
                  required
                >
                  <option value="">Select Material from Stock...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.totalPurchased - m.totalUsed} {m.unit} available)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Linked Project</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={usageData.projectId}
                  onChange={(e) => setUsageData(prev => ({ ...prev, projectId: e.target.value }))}
                  required
                >
                  <option value="">Choose Site/Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Quantity Used</label>
                  <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={usageData.quantity} onChange={(e) => setUsageData(prev => ({ ...prev, quantity: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Date of Usage</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={usageData.date} onChange={(e) => setUsageData(prev => ({ ...prev, date: e.target.value }))} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Usage Details / Note</label>
                <input type="text" placeholder="e.g. Floor 2 Slab Casting" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" value={usageData.note} onChange={(e) => setUsageData(prev => ({ ...prev, note: e.target.value }))} />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
                <FileText className="text-amber-600 mt-1" size={18} />
                <div className="text-xs text-amber-700 leading-relaxed">
                  <strong>Site Cost Allocation:</strong> This usage will be recorded as a project expense. Ensure the quantity is accurate as it affects both inventory levels and project profitability reports.
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowUsageModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Submit Usage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {historyMaterial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-900">{historyMaterial.name}</h2>
                  <p className="text-sm text-slate-500">Inventory movement history</p>
                </div>
              </div>
              <button onClick={() => setHistoryMaterial(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {(historyMaterial.totalPurchased - historyMaterial.totalUsed).toLocaleString()} <span className="text-sm font-medium text-slate-500">{historyMaterial.unit}</span>
                  </p>
                </div>
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <ArrowUpRight size={12} /> Total Purchased
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {historyMaterial.totalPurchased.toLocaleString()} <span className="text-sm font-medium text-slate-500">{historyMaterial.unit}</span>
                  </p>
                </div>
                <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <ArrowDownRight size={12} /> Total Used
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {historyMaterial.totalUsed.toLocaleString()} <span className="text-sm font-medium text-slate-500">{historyMaterial.unit}</span>
                  </p>
                </div>
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <TrendingUp size={12} /> Asset Value
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency((historyMaterial.totalPurchased - historyMaterial.totalUsed) * historyMaterial.costPerUnit)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Stock Level Trends (Purchased vs. Used)
                </h3>
                <div className="h-64 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPurchased" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} padding={{ left: 20, right: 20 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                      <Area name="Purchased" type="monotone" dataKey="purchased" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchased)" />
                      <Area name="Used" type="monotone" dataKey="used" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorUsed)" />
                      <Area name="Current Stock" type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  Transaction Log
                </h3>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historyMaterial.history?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">{new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${entry.type === 'Purchase' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {entry.type === 'Purchase' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{entry.type === 'Purchase' ? '+' : '-'}{entry.quantity.toLocaleString()} {historyMaterial.unit}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">{entry.note || 'No description'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0 text-right">
              <button onClick={() => setHistoryMaterial(null)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
