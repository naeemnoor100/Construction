
import React, { useMemo, useState } from 'react';
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  BarChart3 as LucideBarChart, 
  PieChart as LucidePieChart,
  TrendingUp,
  ArrowUpCircle,
  Briefcase,
  Users,
  Target,
  Package,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../AppContext';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const Reports: React.FC = () => {
  const { projects, expenses, materials, incomes, vendors } = useApp();
  const [materialProjectFilter, setMaterialProjectFilter] = useState<string>('All');

  // Financial Health Data
  const financialData = useMemo(() => projects.map(p => {
    const spent = expenses.filter(e => e.projectId === p.id).reduce((sum, e) => sum + e.amount, 0);
    const collected = incomes.filter(i => i.projectId === p.id).reduce((sum, i) => sum + i.amount, 0);
    return {
      name: p.name,
      budget: p.budget,
      spent: spent,
      income: collected,
      profit: collected - spent
    };
  }), [projects, expenses, incomes]);

  // Material Asset Distribution
  const materialData = useMemo(() => materials.map(m => ({
    name: m.name,
    value: (m.totalPurchased - m.totalUsed) * m.costPerUnit
  })).filter(m => m.value > 0), [materials]);

  // Material Consumption Trend (Aggregated from Expenses)
  const materialTrendData = useMemo(() => {
    const materialExpenses = expenses.filter(e => {
      const isMaterial = e.category === 'Material';
      const matchesProject = materialProjectFilter === 'All' || e.projectId === materialProjectFilter;
      return isMaterial && matchesProject;
    });

    const monthlyAggregation: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sort expenses by date
    const sortedExpenses = [...materialExpenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedExpenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthYear = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      monthlyAggregation[monthYear] = (monthlyAggregation[monthYear] || 0) + exp.amount;
    });

    return Object.entries(monthlyAggregation).map(([month, amount]) => ({
      month,
      amount
    })).slice(-6); // Show last 6 active months
  }, [expenses, materialProjectFilter]);

  // Detailed Expense Breakdown per Project
  const projectExpenseDrilldown = useMemo(() => {
    return projects.map(project => {
      const projectExpenses = expenses.filter(e => e.projectId === project.id);
      const total = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Included 'Equipment' in categories list to align with updated types and constants.
      const categories = ['Material', 'Labor', 'Equipment', 'Overhead', 'Permit'] as const;
      const categoryBreakdown = categories.map(cat => ({
        category: cat,
        amount: projectExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
      }));

      // Top Vendors
      const vendorSums: Record<string, number> = {};
      projectExpenses.forEach(exp => {
        if (exp.vendorId) {
          vendorSums[exp.vendorId] = (vendorSums[exp.vendorId] || 0) + exp.amount;
        }
      });

      const topVendors = Object.entries(vendorSums)
        .map(([id, amount]) => ({
          name: vendors.find(v => v.id === id)?.name || 'Unknown Vendor',
          amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      return {
        id: project.id,
        name: project.name,
        total,
        categoryBreakdown,
        topVendors
      };
    });
  }, [projects, expenses, vendors]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-12">
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
        {/* Budget vs Actual vs Income */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
              <LucideBarChart size={18} className="text-blue-600" />
              Project Cash Flow (Income vs Expense)
            </h3>
            <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">Detailed</button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: 20, fontSize: 11, fontWeight: 600}} />
                <Bar name="Actual Spent" dataKey="spent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Collected Income" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Consumption Trend - NEW */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                <Package size={18} className="text-blue-500" />
                Material Consumption Trend
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Monthly Procurement Values</p>
            </div>
            <div className="relative">
              <select 
                value={materialProjectFilter}
                onChange={(e) => setMaterialProjectFilter(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="All">Global Store</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
          </div>
          <div className="h-80">
            {materialTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={materialTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <Package size={48} className="opacity-20 mb-2" strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest">No material expenses recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Value Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
              <LucidePieChart size={18} className="text-emerald-600" />
              Stock Asset Distribution
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
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
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                <ArrowUpCircle size={18} className="text-emerald-600" />
                Collection vs Expenditure Timeline
              </h3>
              <div className="flex gap-2">
                 <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600"><Filter size={16} /></button>
                 <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600"><Calendar size={16} /></button>
              </div>
           </div>
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'Jan', Income: 300000, Expense: 240000 },
                  { month: 'Feb', Income: 450000, Expense: 339800 },
                  { month: 'Mar', Income: 200000, Expense: 280000 },
                  { month: 'Apr', Income: 600000, Expense: 390800 },
                  { month: 'May', Income: 189000, Expense: 480000 },
                  { month: 'Jun', Income: 500000, Expense: 380000 },
                ]}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Area type="monotone" name="Income" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" name="Expense" dataKey="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* New Project Financial Drill-down Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Target className="text-blue-600" size={24} />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Project Financial Drill-down</h3>
            <p className="text-slate-500 text-sm">Granular view of expenditures by category and vendor.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {projectExpenseDrilldown.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-blue-600">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Total Spent: {formatCurrency(item.total)}</p>
                  </div>
                </div>
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                  <span className="px-3 py-1 text-[10px] font-bold text-blue-600 uppercase">Analysis Active</span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Category Bar Chart */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LucideBarChart size={12} className="text-blue-500" />
                    Category Allocation
                  </h5>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart layout="vertical" data={item.categoryBreakdown} margin={{ left: -10, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={70} />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          formatter={(val: number) => formatCurrency(val)}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Vendors Table */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} className="text-blue-500" />
                    Major Payees / Vendors
                  </h5>
                  <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white/50 text-[9px] font-bold text-slate-400 uppercase tracking-tighter border-b border-slate-100">
                          <th className="px-4 py-3">Vendor Name</th>
                          <th className="px-4 py-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {item.topVendors.length > 0 ? (
                          item.topVendors.map((vendor, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                                {vendor.name}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right">
                                {formatCurrency(vendor.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-4 py-8 text-center text-[10px] font-bold text-slate-400 uppercase">
                              No vendor transactions
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {item.topVendors.length > 0 && (
                    <div className="flex justify-between items-center text-[10px] px-1 font-medium text-slate-400">
                      <span>Top 3 Contributors</span>
                      <span className="text-blue-600 font-bold cursor-pointer hover:underline">View All Expenses</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
