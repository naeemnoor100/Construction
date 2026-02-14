
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
  ArrowRight
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
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} text-white`}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className={`mt-4 flex items-center gap-1.5 text-[11px] font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend} vs last month
      </div>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  const { projects, expenses, materials, incomes, addProject } = useApp();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], status: 'Active'
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;
  const inventoryValue = materials.reduce((acc, m) => acc + ((m.totalPurchased - m.totalUsed) * m.costPerUnit), 0);

  const projectStats = useMemo(() => {
    return projects.map(p => {
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

  const handleOpenModal = () => {
    setFormData({
      name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], status: 'Active'
    });
    setShowModal(true);
  };

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
      status: formData.status
    };
    addProject(newProject);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Portfolio Summary</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Review real-time operational and financial performance.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Active Sites" value={activeProjectsCount.toString()} icon={<Briefcase size={22} />} colorClass="bg-blue-600" />
        <DashboardCard title="Revenue" value={formatCurrency(totalIncome)} icon={<ArrowUpCircle size={22} />} trend="12%" isPositive={true} colorClass="bg-emerald-600" />
        <DashboardCard title="Costs" value={formatCurrency(totalExpenses)} icon={<TrendingDown size={22} />} trend="4%" isPositive={false} colorClass="bg-rose-600" />
        <DashboardCard title="Inventory" value={formatCurrency(inventoryValue)} icon={<Layers size={22} />} colorClass="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={18} className="text-[#FF5A00]" /> Budget Utilization
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Top 6 Projects</span>
          </div>
          <div className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStats.slice(0, 6)} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="utilization" radius={[0, 4, 4, 0]} barSize={20}>
                  {projectStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.utilization > 90 ? '#e11d48' : '#003366'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Package size={18} className="text-blue-500" /> Top Material Assets
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {topMaterials.length > 0 ? topMaterials.map(m => (
              <div key={m.id} className="group p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">{m.name}</h4>
                    <p className="text-[10px] text-slate-500">Available: {(m.totalPurchased - m.totalUsed).toLocaleString()} {m.unit}</p>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(m.value)}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <div className="h-1 bg-slate-100 dark:bg-slate-700 flex-1 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, (m.value / inventoryValue) * 100 * 2)}%` }}></div>
                    </div>
                    <ArrowRight size={12} className="text-slate-300" />
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <Package size={40} className="opacity-20 mb-2" />
                <p className="text-xs font-bold uppercase">Inventory Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Expenditures</h3>
          </div>
          <div className="p-0 overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {expenses.slice(-5).reverse().map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{e.notes}</p>
                      <p className="text-[10px] text-slate-500">{e.date}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-rose-600">{formatCurrency(e.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Action Items</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/50 rounded-xl">
              <div className="p-2 bg-orange-500 text-white rounded-lg"><AlertTriangle size={18} /></div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Budget Overrun Risk</p>
                <p className="text-[10px] text-slate-500">Check projects exceeding 90% budget utilization.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
              <div className="p-2 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={18} /></div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Inventory Levels Stable</p>
                <p className="text-[10px] text-slate-500">Asset levels are verified across active sites.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden shadow-2xl scale-100 transition-all duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-[#003366] text-white">
              <h2 className="text-lg font-black uppercase tracking-tighter">New Project Launch</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Project Title</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Client</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={formData.client} onChange={e => setFormData(p => ({ ...p, client: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Location</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Total Budget (Rs.)</label>
                <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} required />
              </div>
              <button type="submit" className="w-full bg-[#FF5A00] hover:bg-[#E65100] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-95">
                Launch System Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
