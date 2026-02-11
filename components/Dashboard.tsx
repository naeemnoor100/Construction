
import React, { useState } from 'react';
import { 
  Briefcase, 
  TrendingDown, 
  Users, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  X,
  MapPin,
  Calendar,
  DollarSign
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
  <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`${color} p-2.5 rounded-xl text-white shadow-sm`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}
      </div>
    </div>
    <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
    <p className="text-xl lg:text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { projects, expenses, vendors, materials, addProject } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    location: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const vendorPayables = vendors.reduce((sum, v) => sum + v.balance, 0);

  const chartData = [
    { name: 'Jan', exp: 4000, bud: 2400 },
    { name: 'Feb', exp: 3000, bud: 1398 },
    { name: 'Mar', exp: totalExpenses, bud: totalBudget / 12 },
    { name: 'Apr', exp: 2780, bud: 3908 },
    { name: 'May', exp: 1890, bud: 4800 },
  ];

  const pieData = [
    { name: 'Materials', value: 45 },
    { name: 'Labor', value: 35 },
    { name: 'Overhead', value: 20 },
  ];
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: 'p' + Date.now(),
      name: formData.name,
      client: formData.client,
      location: formData.location,
      budget: parseFloat(formData.budget) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      status: 'Active',
      description: ''
    };
    addProject(newProject);
    setShowModal(false);
    setFormData({ name: '', client: '', location: '', budget: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Overview</h2>
          <p className="text-slate-500 text-sm">Welcome back! Here's a snapshot of your projects.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Active Projects" 
          value={activeProjects.toString()} 
          change="+2 this month" 
          isPositive={true} 
          icon={<Briefcase />} 
          color="bg-blue-600"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(totalExpenses)} 
          change="+12.5% vs mo" 
          isPositive={false} 
          icon={<TrendingDown />} 
          color="bg-red-500"
        />
        <StatCard 
          title="Vendor Payables" 
          value={formatCurrency(vendorPayables)} 
          change="-5% from wk" 
          isPositive={true} 
          icon={<Users />} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Stock Asset Value" 
          value={formatCurrency(materials.reduce((acc, m) => acc + ((m.totalPurchased - m.totalUsed) * m.costPerUnit), 0))} 
          change="Stable" 
          isPositive={true} 
          icon={<Layers />} 
          color="bg-amber-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Expense vs Budget</h3>
            <select className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  formatter={(value: number) => [`Rs. ${value.toLocaleString('en-IN')}`, '']}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="exp" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="bud" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Cost Breakdown</h3>
          <div className="h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[idx]}}></div>
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5">Project</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {exp.notes[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{exp.notes}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{exp.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                    {projects.find(p => p.id === exp.projectId)?.name || 'Unknown'}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-900">{formatCurrency(exp.amount)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">New Project</h2>
                  <p className="text-sm text-slate-500">Launch a new construction site</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X size={24} /></button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Project Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="e.g., Downtown Plaza"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Client Name</label>
                  <input 
                    type="text" 
                    placeholder="Company or Person"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.client}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="City, State"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Total Budget (Rs.)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">Estimated End</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
