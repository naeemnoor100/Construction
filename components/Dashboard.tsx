import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  TrendingDown, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  X,
  Activity,
  ArrowUpCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowRight,
  Wallet,
  Warehouse,
  LayoutGrid
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useApp } from '../AppContext';
import { Project } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

const DashboardCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: string;
  isPositive?: boolean;
  colorClass: string;
}> = ({ title, value, icon, trend, isPositive, colorClass }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-[0.98]">
    <div className="flex justify-between items-start mb-3">
      <div className={`p-3 rounded-2xl ${colorClass} text-white shadow-lg`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">{value}</h3>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { projects, expenses, materials, incomes, invoices, addProject } = useApp();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], status: 'Active', isGodown: false
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReceivables = Math.max(0, totalInvoiced - totalIncome);
  
  const activeProjectsCount = projects.filter(p => p.status === 'Active' && !p.isGodown).length;
  const activeGodownsCount = projects.filter(p => p.isGodown).length;

  const godownValue = useMemo(() => {
    let value = 0;
    materials.forEach(m => {
      m.history?.forEach(h => {
        const p = projects.find(proj => proj.id === h.projectId);
        if (p?.isGodown) {
          value += (h.quantity * (h.unitPrice || m.costPerUnit));
        }
      });
    });
    return value;
  }, [materials, projects]);

  const inventoryValue = materials.reduce((acc, m) => acc + ((m.totalPurchased - m.totalUsed) * m.costPerUnit), 0);

  const projectStats = useMemo(() => {
    return projects.filter(p => !p.isGodown).map(p => {
      const spent = expenses.filter(e => e.projectId === p.id).reduce((sum, e) => sum + e.amount, 0);
      const utilization = p.budget > 0 ? Math.round((spent / p.budget) * 100) : 0;
      return { name: p.name, spent, utilization, budget: p.budget, id: p.id };
    }).sort((a, b) => b.utilization - a.utilization);
  }, [projects, expenses]);

  const topMaterials = useMemo(() => {
    return [...materials]
      .map(m => ({ ...m, value: (m.totalPurchased - m.totalUsed) * m.costPerUnit }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [materials]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: 'p' + Date.now(),
      name: formData.name,
      client: formData.client,
      location: formData.location,
      budget: parseFloat(formData.budget) || 0,
      startDate: formData.startDate,
      endDate: formData.startDate,
      status: formData.status,
      isGodown: formData.isGodown
    };
    addProject(newProject);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Operational Pulse</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Real-time status of sites and godowns.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-[#003366] dark:bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} /> New Hub Entry
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <DashboardCard title="Active Sites" value={activeProjectsCount.toString()} icon={<Briefcase size={22} />} colorClass="bg-blue-600" />
        <DashboardCard title="Godown Stock" value={formatCurrency(godownValue)} icon={<Warehouse size={22} />} colorClass="bg-slate-900" />
        <DashboardCard title="Revenue" value={formatCurrency(totalIncome)} icon={<ArrowUpCircle size={22} />} colorClass="bg-emerald-600" />
        <DashboardCard title="Total Costs" value={formatCurrency(totalExpenses)} icon={<TrendingDown size={22} />} colorClass="bg-rose-600" />
        <DashboardCard title="Receivables" value={formatCurrency(totalReceivables)} icon={<Wallet size={22} />} colorClass="bg-indigo-600" className="col-span-2 lg:col-span-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={18} className="text-[#FF5A00]" /> Budget Utilization Per Site
            </h3>
          </div>
          <div className="p-6 h-[300px] lg:h-[350px]">
            {projectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStats.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} width={80} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="utilization" radius={[0, 8, 8, 0]} barSize={16}>
                    {projectStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.utilization > 90 ? '#e11d48' : '#003366'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <LayoutGrid size={48} className="opacity-10 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No active site data</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Package size={18} className="text-blue-500" /> High-Value Pool Assets
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            {topMaterials.length > 0 ? topMaterials.map(m => (
              <div key={m.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.name}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Pool: {(m.totalPurchased - m.totalUsed).toLocaleString()} {m.unit}</p>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">{formatCurrency(m.value)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 flex-1 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (m.value / (inventoryValue || 1)) * 100 * 3)}%` }}></div>
                    </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                <Package size={48} className="opacity-10 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Pool Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden mobile-sheet animate-in slide-in-from-bottom-8 duration-300">
            <div className={`p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center ${formData.isGodown ? 'bg-slate-900' : 'bg-[#003366]'} text-white`}>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Register New Entity</h2>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Database Initialization</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-8 space-y-6 pb-safe overflow-y-auto no-scrollbar max-h-[75vh]">
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl w-fit">
                <button type="button" onClick={() => setFormData(p => ({ ...p, isGodown: false }))} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.isGodown ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Project Site</button>
                <button type="button" onClick={() => setFormData(p => ({ ...p, isGodown: true }))} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.isGodown ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}>Godown Hub</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Entity Title</label>
                <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:bg-slate-900 dark:text-white font-black uppercase" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required placeholder="Title..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{formData.isGodown ? 'Supervisor' : 'Client Name'}</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:bg-slate-900 dark:text-white font-bold" value={formData.client} onChange={e => setFormData(p => ({ ...p, client: e.target.value }))} required placeholder="Full Name..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Global Location</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:bg-slate-900 dark:text-white font-bold" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} required placeholder="City, State..." />
                </div>
              </div>
              {!formData.isGodown && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Project Valuation (Rs.)</label>
                  <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black text-xl text-slate-900 dark:bg-slate-900 dark:text-white" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} required />
                </div>
              )}
              <button type="submit" className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 text-sm ${formData.isGodown ? 'bg-slate-900' : 'bg-blue-600'} text-white`}>
                Authorize Registration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};