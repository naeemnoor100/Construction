
import React from 'react';
import { 
  Briefcase, 
  TrendingDown, 
  Users, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus
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
        {/* Fix: Check if icon is a valid element and cast to React.ReactElement<any> to allow 'size' prop */}
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
  const { projects, expenses, vendors, materials } = useApp();

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Overview</h2>
          <p className="text-slate-500 text-sm">Welcome back! Here's a snapshot of your projects.</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
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
          value={`$${totalExpenses.toLocaleString()}`} 
          change="+12.5% vs mo" 
          isPositive={false} 
          icon={<TrendingDown />} 
          color="bg-red-500"
        />
        <StatCard 
          title="Vendor Payables" 
          value={`$${vendorPayables.toLocaleString()}`} 
          change="-5% from wk" 
          isPositive={true} 
          icon={<Users />} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Stock Asset Value" 
          value={`$${(materials.length * 15000).toLocaleString()}`} 
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
                  <td className="px-5 py-4 text-xs text-slate-600 font-medium">Skyline Res.</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-900">${exp.amount.toLocaleString()}</td>
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
    </div>
  );
};
