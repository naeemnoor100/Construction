
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
  Sparkles,
  Loader2,
  Bot
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
  const { projects, expenses, materials, addProject, incomes, siteStatuses, getProjectHealth } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [analyzingProject, setAnalyzingProject] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<{ id: string, text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '', client: '', location: '', contactNumber: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '', description: '', status: siteStatuses[0] || 'Active'
  });

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

  const handleAiCheck = async (projectId: string) => {
    setAnalyzingProject(projectId);
    const report = await getProjectHealth(projectId);
    setAiReport({ id: projectId, text: report });
    setAnalyzingProject(null);
  };

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
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition-all text-sm"
        >
          <Plus size={20} /> Launch Project
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Sites" value={activeProjects.toString()} change="Real-time" isPositive={true} icon={<Briefcase />} color="bg-blue-600" />
        <StatCard title="Collections" value={formatCurrency(totalIncome)} change="Actuals" isPositive={true} icon={<ArrowUpCircle />} color="bg-emerald-500" />
        <StatCard title="Expenditure" value={formatCurrency(totalExpenses)} change="Incurred" isPositive={false} icon={<TrendingDown />} color="bg-red-500" />
        <StatCard title="Asset Value" value={formatCurrency(materials.reduce((acc, m) => acc + ((m.totalPurchased - m.totalUsed) * m.costPerUnit), 0))} change="Stock" isPositive={true} icon={<Layers />} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="flex items-center gap-3 mb-8">
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
               <Activity size={20} />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Project Insights</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live utilization metrics</p>
             </div>
           </div>

           <div className="space-y-6">
             {projectStats.slice(0, 4).map((project) => (
               <div key={project.id} className="p-4 rounded-3xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{project.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Budget: {formatCurrency(project.budget)}</p>
                    </div>
                    <button 
                      onClick={() => handleAiCheck(project.id)}
                      disabled={analyzingProject === project.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${analyzingProject === project.id ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100'}`}
                    >
                      {analyzingProject === project.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {analyzingProject === project.id ? 'Analyzing...' : 'AI Audit'}
                    </button>
                  </div>
                  
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, project.utilization)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>Utilization</span>
                    <span className={project.utilization > 90 ? 'text-red-500' : 'text-blue-600'}>{project.utilization}%</span>
                  </div>

                  {aiReport && aiReport.id === project.id && (
                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 mb-2">
                          <Bot size={14} className="text-blue-600" />
                          <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400">Gemini AI Project Audit</span>
                          <button onClick={() => setAiReport(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={14} /></button>
                       </div>
                       <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{aiReport.text}</p>
                    </div>
                  )}
               </div>
             ))}
             {projects.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                 <Target size={48} className="opacity-20 mb-4" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">No site data recorded yet</p>
               </div>
             )}
           </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-tight mb-4">Quick Stats</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-[11px] font-black uppercase border-b border-slate-50 dark:border-slate-700 pb-3">
                 <span className="text-slate-400">Global Budget</span>
                 <span className="text-slate-900 dark:text-white">{formatCurrency(totalBudget)}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-black uppercase border-b border-slate-50 dark:border-slate-700 pb-3">
                 <span className="text-slate-400">Total Spent</span>
                 <span className="text-red-500">{formatCurrency(totalExpenses)}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-black uppercase">
                 <span className="text-slate-400">Net Profit/Loss</span>
                 <span className={totalIncome > totalExpenses ? 'text-emerald-500' : 'text-red-500'}>{formatCurrency(totalIncome - totalExpenses)}</span>
               </div>
             </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2.5rem] text-white shadow-2xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white/10 rounded-xl"><Sparkles size={18} className="text-blue-400" /></div>
                <h3 className="text-sm font-black uppercase tracking-tight">Sync Status</h3>
             </div>
             <p className="text-xs text-white/60 mb-6 leading-relaxed">
               Your local database is encrypted and synchronized. Connect to Cloud Sync for multi-device access.
             </p>
             <button className="w-full py-3 bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/50 hover:bg-blue-700 transition-all active:scale-95">
               Enable Cloud Backup
             </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">New Project</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <input type="text" placeholder="Project Name" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />
              <input type="number" placeholder="Budget (Rs.)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl" value={formData.budget} onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))} required />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">Launch Site</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
