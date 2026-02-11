
import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MoreVertical,
  ChevronRight,
  Filter,
  X,
  Briefcase,
  TrendingUp,
  Receipt,
  Users,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProjectStatus, Project } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { projects, expenses, vendors, addProject } = useApp();
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    location: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const filteredProjects = projects.filter(p => filter === 'All' || p.status === filter);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700';
      case 'On Hold': return 'bg-amber-100 text-amber-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateProjectMetrics = (projectId: string, budget: number) => {
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    const progress = Math.min(100, Math.round((totalSpent / budget) * 100)) || 0;
    return { totalSpent, progress, remaining: Math.max(0, budget - totalSpent), transactions: projectExpenses };
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
          <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
          <p className="text-slate-500">Manage and track your construction sites.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto no-scrollbar max-w-full">
          {(['All', 'Active', 'On Hold', 'Completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${filter === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter size={18} />
          <span className="text-sm font-medium">More Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const { totalSpent, progress } = calculateProjectMetrics(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 transition-all group shadow-sm flex flex-col">
              <div className="p-5 lg:p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{project.name}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-4 flex items-center gap-1.5 truncate">
                  <MapPin size={14} className="shrink-0" />
                  {project.location}
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      <span>Budget Utilization</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${progress > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Budget</p>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(project.budget)}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Start Date</p>
                      <p className="text-sm font-bold text-slate-900">{new Date(project.startDate).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center group-hover:bg-blue-50 transition-colors">
                <button 
                  onClick={() => setViewingProject(project)}
                  className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline active:scale-95 transition-transform"
                >
                  View Details
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      {viewingProject && (() => {
        const metrics = calculateProjectMetrics(viewingProject.id, viewingProject.budget);
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-none sm:rounded-3xl w-full max-w-5xl h-full sm:h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl sm:hidden">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 hidden sm:block">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{viewingProject.name}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin size={12} /> {viewingProject.location} • <span className="font-semibold">{viewingProject.client}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setViewingProject(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl hidden sm:block transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar space-y-8 bg-slate-50/50">
                {/* Stats Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={18} /></div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Budget</h4>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(viewingProject.budget)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingUp size={18} /></div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Spent</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalSpent)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18} /></div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Remaining</h4>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.remaining)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Details & Timeline */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Clock size={18} className="text-blue-600" />
                        Timeline Info
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Start Date</span>
                          <span className="font-bold text-slate-900">{new Date(viewingProject.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Est. Completion</span>
                          <span className="font-bold text-slate-900">{viewingProject.endDate ? new Date(viewingProject.endDate).toLocaleDateString() : 'TBD'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Current Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(viewingProject.status)}`}>
                            {viewingProject.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Users size={18} className="text-blue-600" />
                        Key Partners
                      </h3>
                      <div className="space-y-3">
                        {vendors.slice(0, 3).map(v => (
                          <div key={v.id} className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <span className="font-bold text-slate-800">{v.name}</span>
                            <span className="text-slate-400 font-medium">{v.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Transaction Log */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <Receipt size={18} className="text-blue-600" />
                          Recent Transactions
                        </h3>
                      </div>
                      <div className="overflow-x-auto no-scrollbar max-h-[400px]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Notes</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {metrics.transactions.length > 0 ? (
                              metrics.transactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                    {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {t.category}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-slate-800 font-semibold truncate max-w-[150px]">
                                    {t.notes}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                                    {formatCurrency(t.amount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400 text-sm font-medium">
                                  No transactions recorded for this project.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setViewingProject(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close View
                </button>
                <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                  Generate Project Report
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Project Modal */}
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
