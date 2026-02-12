
import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Globe, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Mail, 
  Smartphone,
  CreditCard,
  Cloud,
  ChevronRight,
  LogOut,
  Zap
} from 'lucide-react';
import { useApp } from '../AppContext';

export const Settings: React.FC = () => {
  const { currentUser, updateUser, syncId, theme, setTheme } = useApp();
  const [activeSection, setActiveSection] = useState<'profile' | 'company' | 'system'>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: '+91 98765 43210' // Placeholder for additional fields
  });

  const [companyData, setCompanyData] = useState({
    name: 'BuildTrack Infrastructure Ltd.',
    taxId: 'GSTIN-27AAACG0000Z1Z',
    address: 'Sector 5, BKC, Mumbai, Maharashtra 400051',
    currency: 'INR (₹)'
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    // Update global user state
    updateUser({
      ...currentUser,
      name: profileData.name,
      email: profileData.email
    });

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings & Configuration</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your professional profile and application environment.</p>
        </div>
        <div className="hidden sm:block">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Version 2.4.0-Stable
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}
          >
            <User size={18} />
            <span className="text-sm font-bold">Personal Profile</span>
            {activeSection === 'profile' && <ChevronRight size={14} className="ml-auto" />}
          </button>
          <button 
            onClick={() => setActiveSection('company')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'company' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}
          >
            <Building2 size={18} />
            <span className="text-sm font-bold">Company Info</span>
            {activeSection === 'company' && <ChevronRight size={14} className="ml-auto" />}
          </button>
          <button 
            onClick={() => setActiveSection('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'system' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}
          >
            <Globe size={18} />
            <span className="text-sm font-bold">System Defaults</span>
            {activeSection === 'system' && <ChevronRight size={14} className="ml-auto" />}
          </button>
          
          <div className="pt-8 space-y-1">
             <div className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Support</div>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
               <ShieldCheck size={18} />
               <span className="text-sm font-bold">Privacy Policy</span>
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
               <LogOut size={18} />
               <span className="text-sm font-bold">Sign Out</span>
             </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
            
            {activeSection === 'profile' && (
              <div className="p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <img src={currentUser.avatar} alt="Profile" className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-100 dark:border-slate-700 shadow-sm" />
                    <button className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600 shadow-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <Smartphone size={14} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{currentUser.role} Account</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Legal Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={profileData.name}
                        onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Contact Phone</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={profileData.phone}
                        onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={profileData.email}
                        onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={saveStatus === 'saving'}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold transition-all ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
                    >
                      {saveStatus === 'saving' ? (
                        <>Saving Changes...</>
                      ) : saveStatus === 'saved' ? (
                        <><CheckCircle2 size={18} /> Profile Updated</>
                      ) : (
                        <><Save size={18} /> Save Profile</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'company' && (
              <div className="p-8">
                <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-6 text-white mb-8 flex justify-between items-center shadow-2xl">
                   <div className="flex gap-4 items-center">
                     <div className="p-4 bg-white/10 rounded-2xl"><Building2 size={24} /></div>
                     <div>
                       <h3 className="text-lg font-bold">{companyData.name}</h3>
                       <p className="text-[10px] font-bold uppercase text-white/50 tracking-widest">Master Organization Profile</p>
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Company Registered Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        value={companyData.name}
                        onChange={e => setCompanyData(p => ({ ...p, name: e.target.value }))}
                      />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">GST / Tax Identification</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={companyData.taxId}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Local Currency</label>
                        <select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none">
                           <option>INR (₹)</option>
                           <option>USD ($)</option>
                           <option>AED (د.إ)</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Corporate Headquarters Address</label>
                      <textarea 
                        className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        value={companyData.address}
                        rows={2}
                      />
                   </div>
                   <button className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-slate-200 dark:shadow-none transition-all active:scale-95">
                      <Save size={18} /> Save Company Details
                   </button>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div className="p-8 space-y-8">
                 <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-6">
                   <div>
                     <p className="font-bold text-slate-900 dark:text-white">Cloud Synchronization</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Enable real-time data push to the centralized cloud database.</p>
                   </div>
                   <div className={`p-2 rounded-xl border flex items-center gap-2 ${syncId ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-700 dark:border-slate-600'}`}>
                      {syncId ? <Cloud size={16} /> : <Zap size={16} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{syncId ? 'Active' : 'Offline'}</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Interface Theme</p>
                       <div className="flex gap-4">
                          <button 
                            onClick={() => setTheme('light')}
                            className={`flex-1 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${theme === 'light' ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-700 border-transparent opacity-60'}`}
                          >
                             <div className="w-full h-8 bg-white rounded-md border border-slate-200"></div>
                             <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-blue-700' : 'text-slate-500'}`}>Professional Light</span>
                          </button>
                          <button 
                            onClick={() => setTheme('dark')}
                            className={`flex-1 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${theme === 'dark' ? 'bg-slate-800 border-blue-400 shadow-xl' : 'bg-slate-900 border-transparent opacity-60'}`}
                          >
                             <div className="w-full h-8 bg-slate-800 rounded-md border border-slate-700"></div>
                             <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`}>Dark Mode</span>
                          </button>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Push Notifications</p>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Material Low Stock Alerts</span>
                             <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Milestone Payment Receipts</span>
                             <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div>
                          </div>
                          <div className="flex items-center justify-between opacity-50">
                             <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Site Manager Activity Feed</span>
                             <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 rounded-full relative"><div className="w-4 h-4 bg-white dark:bg-slate-400 rounded-full absolute left-0.5 top-0.5 shadow-sm"></div></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none"><ShieldCheck size={20} /></div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">Advanced Site Security</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">System-wide encryption is active for all financial data. Project budgets and vendor bank details are hashed before synchronization to the master database.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};