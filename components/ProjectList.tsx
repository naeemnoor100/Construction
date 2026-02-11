
import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MoreVertical,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useApp } from '../AppContext';
import { ProjectStatus } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

export const ProjectList: React.FC = () => {
  const { projects, expenses } = useApp();
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All');

  const filteredProjects = projects.filter(p => filter === 'All' || p.status === filter);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700';
      case 'On Hold': return 'bg-amber-100 text-amber-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateProgress = (projectId: string, budget: number) => {
    const projectExpenses = expenses
      .filter(e => e.projectId === projectId)
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.min(100, Math.round((projectExpenses / budget) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
          <p className="text-slate-500">Manage and track your construction sites.</p>
        </div>
        <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
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
          const progress = calculateProgress(project.id, project.budget);
          return (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 transition-all group shadow-sm">
              <div className="p-5 lg:p-6">
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

              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/seed/${project.id}${i}/100`} 
                      className="w-7 h-7 rounded-full border-2 border-white object-cover" 
                      alt="Team Member" 
                    />
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    +4
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                  View
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
