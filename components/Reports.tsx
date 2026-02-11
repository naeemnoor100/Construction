
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Download, FileText, Calendar, Filter, ArrowUpRight } from 'lucide-react';
import { useApp } from '../AppContext';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const Reports: React.FC = () => {
  const { projects, expenses, materials } = useApp();

  // Financial Health Data
  const financialData = projects.map(p => {
    const spent = expenses.filter(e => e.projectId === p.id).reduce((sum, e) => sum + e.amount, 0);
    return {
      name: p.name,
      budget: p.budget,
      spent: spent,
      remaining: Math.max(0, p.budget - spent)
    };
  });

  // Material Asset Distribution
  const materialData = materials.map(m => ({
    name: m.name,
    value: (m.totalPurchased - m.totalUsed) * m.costPerUnit
  })).filter(m => m.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm">Real-time financial visibility and resource allocation.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95">
          <Download size={18} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart size={18} className="text-blue-600" />
              Project Financial Health
            </h3>
            <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">Full Details</button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: 20, fontSize: 11, fontWeight: 600}} />
                <Bar name="Total Budget" dataKey="budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar name="Actual Spent" dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Value Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <PieChart size={18} className="text-emerald-600" />
              Stock Asset Distribution
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{fontSize: 10}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-purple-600" />
                Category-wise Expenditure Over Time
              </h3>
              <div className="flex gap-2">
                 <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600"><Filter size={16} /></button>
                 <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600"><Calendar size={16} /></button>
              </div>
           </div>
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'Jan', Material: 4000, Labor: 2400, Overhead: 1000 },
                  { month: 'Feb', Material: 3000, Labor: 3398, Overhead: 1200 },
                  { month: 'Mar', Material: 5000, Labor: 2800, Overhead: 1500 },
                  { month: 'Apr', Material: 2780, Labor: 3908, Overhead: 2000 },
                  { month: 'May', Material: 1890, Labor: 4800, Overhead: 1800 },
                  { month: 'Jun', Material: 2390, Labor: 3800, Overhead: 2500 },
                ]}>
                  <defs>
                    <linearGradient id="colorMat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Area type="monotone" dataKey="Material" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMat)" />
                  <Area type="monotone" dataKey="Labor" stroke="#10b981" fillOpacity={1} fill="url(#colorLab)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};
