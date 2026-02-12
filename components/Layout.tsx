
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings as SettingsIcon, 
  Bell, 
  Search,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
  ArrowUpCircle,
  Cloud,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { useApp } from '../AppContext';
import { SyncCenter } from './SyncCenter';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  isSpecial?: boolean;
}> = ({ icon, label, isActive, onClick, isSpecial }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : isSpecial 
          ? 'text-blue-600 hover:bg-blue-50 bg-blue-50/50 border border-blue-100/50'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
    {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
    {isSpecial && !isActive && <Sparkles size={12} className="ml-auto animate-pulse text-blue-400" />}
  </button>
);

const MobileNavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
      isActive ? 'text-blue-600' : 'text-slate-400'
    }`}
  >
    <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-50' : ''}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, lastSynced, syncId, isSyncing, syncError } = useApp();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showSyncCenter, setShowSyncCenter] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isSidebarOpen) setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase size={20} /> },
    { id: 'income', label: 'Income', icon: <ArrowUpCircle size={20} /> },
    { id: 'vendors', label: 'Vendors', icon: <Users size={20} /> },
    { id: 'materials', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { id: 'ai-assistant', label: 'AI Helper', icon: <Sparkles size={20} />, isSpecial: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <div 
        className={`fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">BuildTrack<span className="text-blue-600">Pro</span></h1>
            </div>
            <button className="lg:hidden text-slate-400 p-2 hover:bg-slate-100 rounded-xl" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === item.id}
                onClick={() => handleTabChange(item.id)}
                isSpecial={item.isSpecial}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 mb-20 lg:mb-0">
            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full border border-white shadow-sm object-cover" />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</p>
              </div>
              <button className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-40">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-48 xl:w-64 transition-all"
              />
            </div>
            <div className="block md:hidden">
               <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tighter">
                 {menuItems.find(m => m.id === activeTab)?.label}
               </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setShowSyncCenter(true)}
              className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-xl transition-all shadow-sm ${
                syncError ? 'bg-red-50 border-red-200' : syncId ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {isSyncing ? (
                <RefreshCw size={14} className="text-blue-500 animate-spin" />
              ) : syncId ? (
                <Cloud size={14} className="text-emerald-600" />
              ) : (
                <WifiOff size={14} className="text-slate-400" />
              )}
              <span className="hidden sm:inline text-[10px] font-bold uppercase text-slate-600">
                {syncId ? 'Cloud' : 'Offline'}
              </span>
            </button>

            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={() => handleTabChange('settings')}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon size={16} />
              <span>Settings</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <MobileNavItem 
            label="Dashboard" icon={<LayoutDashboard />} 
            isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} 
          />
          <MobileNavItem 
            label="Projects" icon={<Briefcase />} 
            isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} 
          />
          <MobileNavItem 
            label="Suppliers" icon={<Users />} 
            isActive={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} 
          />
          <MobileNavItem 
            label="Finance" icon={<Receipt />} 
            isActive={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} 
          />
        </div>
      </main>

      {showSyncCenter && <SyncCenter onClose={() => setShowSyncCenter(false)} />}
    </div>
  );
};
