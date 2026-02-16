import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings as SettingsIcon, 
  Menu,
  X,
  ChevronRight,
  Sparkles,
  ArrowUpCircle,
  Cloud,
  RefreshCw,
  WifiOff,
  Undo2,
  Redo2,
  Check,
  Bot,
  FileText,
  MoreHorizontal
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${
      isActive 
        ? 'bg-[#003366] text-white shadow-md' 
        : isSpecial 
          ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <span className={isActive ? 'text-white' : ''}>{icon}</span>
    <span className="font-bold text-sm">{label}</span>
    {isActive && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
  </button>
);

const BottomNavItem: React.FC<{ 
  id: string; 
  label: string; 
  icon: React.ReactNode; 
  isActive: boolean; 
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
      isActive ? 'text-[#003366] dark:text-blue-400 scale-105' : 'text-slate-400'
    }`}
  >
    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 22 })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, syncId, isSyncing, theme } = useApp();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showSyncCenter, setShowSyncCenter] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dash', icon: <LayoutDashboard /> },
    { id: 'projects', label: 'Sites', icon: <Briefcase /> },
    { id: 'materials', label: 'Assets', icon: <Package /> },
    { id: 'expenses', label: 'Cash', icon: <Receipt /> },
    { id: 'vendors', label: 'Suppliers', icon: <Users /> },
    { id: 'income', label: 'Revenue', icon: <ArrowUpCircle /> },
    { id: 'invoices', label: 'Bills', icon: <FileText /> },
    { id: 'reports', label: 'Stats', icon: <BarChart3 /> },
  ];

  const bottomNavItems = menuItems.slice(0, 4);

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 overflow-hidden`}>
      {/* Sidebar - Desktop or Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF5A00] p-2 rounded-lg text-white shadow-lg"><Briefcase size={22} /></div>
              <h1 className="text-xl font-black text-[#003366] dark:text-white tracking-tighter">BUILDTRACK<span className="text-[#FF5A00]">PRO</span></h1>
            </div>
            <button className="lg:hidden ml-auto p-2 text-slate-400" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <SidebarItem key={item.id} {...item} isActive={activeTab === item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} />
            ))}
          </nav>
          <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 mb-16 lg:mb-0">
            <div className="flex items-center gap-3">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-sm" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 lg:h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-10 shrink-0 z-40 pt-safe">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-3 -ml-2 text-slate-600 dark:text-slate-300 active:bg-slate-100 rounded-xl" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
            <div className="flex flex-col">
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BuildTrack Pro</h2>
              <h3 className="text-sm lg:text-base font-black text-slate-900 dark:text-white uppercase leading-none">
                {menuItems.find(m => m.id === activeTab)?.label || 'System Settings'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <button onClick={() => setShowSyncCenter(true)} className={`p-2.5 rounded-xl border transition-all ${syncId ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : syncId ? <Cloud size={18} /> : <WifiOff size={18} />}
            </button>
            <button onClick={() => setActiveTab('settings')} className={`p-2.5 rounded-xl border transition-all ${activeTab === 'settings' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500'}`}><SettingsIcon size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F4F6F8] dark:bg-slate-900 p-4 lg:p-10 no-scrollbar pb-24 lg:pb-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 h-16 sm:h-20 px-2 flex items-center justify-around z-[90] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {bottomNavItems.map((item) => (
            <BottomNavItem key={item.id} {...item} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} />
          ))}
          <BottomNavItem id="more" label="More" icon={<MoreHorizontal />} isActive={!bottomNavItems.some(i => i.id === activeTab)} onClick={() => setSidebarOpen(true)} />
        </nav>
      </div>

      {showSyncCenter && <SyncCenter onClose={() => setShowSyncCenter(false)} />}
    </div>
  );
};