
import React, { useState, useEffect } from 'react';
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
  WifiOff,
  Undo2,
  Redo2,
  Check
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
          ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/50'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
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
    className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-all duration-300 active:scale-90 ${
      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
    }`}
  >
    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 -translate-y-1' : ''}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: isActive ? 22 : 20 }) : icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-tighter transition-all ${isActive ? 'opacity-100 mt-1' : 'opacity-60'}`}>
      {label}
    </span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, syncId, isSyncing, syncError, undo, redo, canUndo, canRedo, lastActionName, lastUpdated, theme } = useApp();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showSyncCenter, setShowSyncCenter] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'z' && !e.shiftKey) {
          if (canUndo) { e.preventDefault(); undo(); }
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          if (canRedo) { e.preventDefault(); redo(); }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    if (canUndo) {
      setShowUndoToast(true);
      const timer = setTimeout(() => setShowUndoToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, canUndo]);

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'projects', label: 'Sites', icon: <Briefcase size={20} /> },
    { id: 'income', label: 'Income', icon: <ArrowUpCircle size={20} /> },
    { id: 'vendors', label: 'Vendors', icon: <Users size={20} /> },
    { id: 'materials', label: 'Stock', icon: <Package size={20} /> },
    { id: 'expenses', label: 'Finance', icon: <Receipt size={20} /> },
    { id: 'reports', label: 'Stats', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 overflow-hidden`}>
      <aside className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg"><LayoutDashboard className="text-white" size={24} /></div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">BuildTrack<span className="text-blue-600">Pro</span></h1>
            </div>
            <button className="lg:hidden text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <SidebarItem key={item.id} icon={item.icon} label={item.label} isActive={activeTab === item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} />
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl flex items-center gap-3">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full border border-white dark:border-slate-600 shadow-sm object-cover" />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 lg:h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 pt-safe">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter lg:hidden">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Global Search..." className="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 w-48 xl:w-72 transition-all dark:text-slate-100" />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {(canUndo || canRedo) && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-2xl p-1 shadow-sm h-10">
                <button onClick={undo} disabled={!canUndo} className="px-3 h-full hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 disabled:opacity-20 rounded-xl transition-all"><Undo2 size={16} /></button>
                <button onClick={redo} disabled={!canRedo} className="px-3 h-full hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 disabled:opacity-20 rounded-xl transition-all"><Redo2 size={16} /></button>
              </div>
            )}

            <button onClick={() => setShowSyncCenter(true)} className={`p-2.5 border rounded-2xl transition-all shadow-sm ${syncError ? 'bg-red-50 border-red-200' : syncId ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-700'}`}>
              {isSyncing ? <RefreshCw size={18} className="text-blue-500 animate-spin" /> : syncId ? <Cloud size={18} className="text-emerald-600 dark:text-emerald-400" /> : <WifiOff size={18} className="text-slate-400" />}
            </button>

            <button onClick={() => setActiveTab('settings')} className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"><SettingsIcon size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-900 pb-32 lg:pb-8 relative no-scrollbar">
          <div className="max-w-7xl mx-auto h-full">{children}</div>

          {showUndoToast && lastActionName && (
            <div className="fixed bottom-28 lg:bottom-10 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl text-white px-5 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"><Check size={16} /></div>
                  <p className="text-xs font-bold leading-tight">{lastActionName}</p>
                </div>
                <button onClick={() => { undo(); setShowUndoToast(false); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5">
                  <Undo2 size={12} /> Undo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-2 z-[60] pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
          <MobileNavItem label="Dash" icon={<LayoutDashboard />} isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <MobileNavItem label="Sites" icon={<Briefcase />} isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
          <MobileNavItem label="Incomes" icon={<ArrowUpCircle />} isActive={activeTab === 'income'} onClick={() => setActiveTab('income')} />
          <MobileNavItem label="Suppliers" icon={<Users />} isActive={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />
          <MobileNavItem label="Stock" icon={<Package />} isActive={activeTab === 'materials'} onClick={() => setActiveTab('materials')} />
        </div>
      </main>
      {showSyncCenter && <SyncCenter onClose={() => setShowSyncCenter(false)} />}
    </div>
  );
};
