
import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectList } from './components/ProjectList';
import { VendorList } from './components/VendorList';
import { Inventory } from './components/Inventory';
import { ExpenseTracker } from './components/ExpenseTracker';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectList />;
      case 'vendors':
        return <VendorList />;
      case 'materials':
        return <Inventory />;
      case 'expenses':
        return <ExpenseTracker />;
      case 'reports':
        return (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="font-bold text-2xl">R</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Reporting Engine</h2>
            <p className="text-slate-500 max-w-sm mx-auto">This module generates complex analytics and PDF exports. It's coming soon in the next update!</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

export default App;
