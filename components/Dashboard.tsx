
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  TrendingDown, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  X,
  MapPin,
  DollarSign,
  ArrowUpCircle,
  Phone,
  Activity,
  Target,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useApp } from '../AppContext';
import { Project } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  change: string; 
  isPositive: boolean; 
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, isPositive, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`${color} p-2.5 rounded-xl text-white shadow-sm`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</h3>
    <p className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { projects, expenses, materials, addProject, incomes, siteStatuses } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: siteStatuses[0] || 'Active'
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const activeProjects = projects.filter(p => p.status === 'Active').length;

  const projectStats = useMemo(() => {
    return projects.map(p => {
      const spent = expenses.filter(e => e.projectId === p.id).reduce((sum, e) => sum + e.amount, 0);
      const utilization = p.budget > 0 ? Math.round((spent / p.budget) * 100) : 0;
      return { ...p, spent, utilization };
    }).sort((a, b) => b.utilization - a.utilization);
  }, [projects, expenses]);

  const chartData = useMemo(() => {
    const month = new Date().toLocaleString('default', { month: 'short' });
    return [
      { name: month, exp: totalExpenses, inc: totalIncome }
    ];
  }, [totalExpenses, totalIncome]);

  const globalBudgetData = useMemo(() => [
    { name: 'Spent', value: totalExpenses, color: '#ef4444' },
    { name: 'Remaining', value: Math.max(0, totalBudget - totalExpenses), color: '#3b82f6' }
  ], [totalExpenses, totalBudget]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: 'p' + Date.now(),
      name: formData.name,
      client: formData.client,
      location: formData.location,
      contactNumber: formData.contactNumber,
      budget: parseFloat(formData.budget) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      status: formData.status,
      description: formData.description
    };
    addProject(newProject);
    setShowModal(false);
    setFormData({ name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: siteStatuses[0] || 'Active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Project Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor your projects' financial health and budget status.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
        >
          <Plus size={20} />
          Launch Project
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Sites" value={activeProjects.toString()} 
          change="Real-time" isPositive={true} icon={<Briefcase />} color="bg-blue-600"
        />
        <StatCard 
          title="Collections" value={formatCurrency(totalIncome)} 
          change="Actuals" isPositive={true} icon={<ArrowUpCircle />} color="bg-emerald-500"
        />
        <StatCard 
          title="Expenditure" value={formatCurrency(totalExpenses)} 
          change="Incurred" isPositive={false} icon={<TrendingDown />} color="bg-red-500"
        />
        <StatCard 
          title="Asset Value" 
          value={formatCurrency(materials.reduce((acc, m) => acc + ((m.totalPurchased - m.totalUsed) * m.costPerUnit), 0))} 
          change="Stock" isPositive={true} icon={<Layers />} color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-tight">Financial Flow</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded">Last Month</span>
          </div>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar name="Income" dataKey="inc" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar name="Expense" dataKey="exp" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-tight mb-4 flex items-center gap-2">
            <Target size={16} className="text-blue-500" />
            Global Budget Health
          </h3>
          <div className="flex-1 min-h-[220px] relative">
            {projects.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={globalBudgetData}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {globalBudgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest text-center px-4">Launch projects to see budget utilization</div>
            )}
            {projects.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilized</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0}%
                </p>
              </div>
            )}
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase border-b border-slate-50 dark:border-slate-700 pb-2">
               <span className="text-slate-400">Total Approved Budget</span>
               <span className="text-slate-900 dark:text-white">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <span className="text-slate-400">Remaining Fund</span>
               </div>
               <span className="text-blue-500">{formatCurrency(Math.max(0, totalBudget - totalExpenses))}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <span className="text-slate-400">Total Spent</span>
               </div>
               <span className="text-red-500">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
               <Briefcase size={20} />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Site Budget Utilization</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time expenditure vs approved estimates</p>
             </div>
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-600">Top 5 Projects</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {projectStats.slice(0, 6).length > 0 ? projectStats.slice(0, 6).map((project) => (
            <div key={project.id} className="space-y-2.5">
               <div className="flex justify-between items-end">
                 <div>
                   <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[200px]">{project.name}</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Spent: {formatCurrency(project.spent)} / {formatCurrency(project.budget)}</p>
                 </div>
                 <span className={`text-[11px] font-black ${project.utilization > 90 ? 'text-red-500' : 'text-blue-500'}`}>{project.utilization}%</span>
               </div>
               <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${project.utilization > 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'}`} 
                    style={{ width: `${Math.min(100, project.utilization)}%` }}
                  ></div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300">
               <Target size={32} className="opacity-20 mb-3" />
               <p className="text-[10px] font-bold uppercase tracking-widest">No site expenditures recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Project</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4 overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Name</label>
                <input type="text" placeholder="e.g. Skyline Towers" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Client Name" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none dark:text-white" value={formData.client} onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))} required />
                <input type="text" placeholder="Location" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none dark:text-white" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="tel" placeholder="+91 00000 00000" className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={formData.contactNumber} onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Initial Status</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:text-white" 
                      value={formData.status} 
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      {siteStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Total Budget (Rs.)</label>
                <input type="number" placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" value={formData.budget} onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} required />
                <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold dark:text-white" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
              </div>
              <div className="flex gap-4 pt-4 pb-safe">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-2xl font-bold text-sm dark:text-white">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95 text-sm">Launch Site</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
