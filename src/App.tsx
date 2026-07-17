import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { GSTInvoice } from './pages/GSTInvoice';
import { NonGSTInvoice } from './pages/NonGSTInvoice';
import { InvoiceHistory } from './pages/InvoiceHistory';
import { InvoiceView } from './pages/InvoiceView';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ToastContainer } from './components/ui/ToastContainer';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activePage, loading, refreshData } = useApp();
  
  // Collapse States
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Shareable invoice route: /invoice/:id
  const [shareInvoiceId, setShareInvoiceId] = useState<string | null>(null);
  useEffect(() => {
    const m = window.location.pathname.match(/^\/invoice\/(.+)$/);
    if (m) {
      setShareInvoiceId(m[1]);
      refreshData();
    }
  }, []);

  // Dynamic Page Router
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'gst-invoice':
        return <GSTInvoice />;
      case 'nongst-invoice':
        return <NonGSTInvoice />;
      case 'invoice-history':
        return <InvoiceHistory />;
      case 'customers':
        return <Customers />;
      case 'products':
        return <Products />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const leftMargin = collapsed ? 'lg:pl-20' : 'lg:pl-64';

  if (shareInvoiceId) {
    return (
      <>
        <InvoiceView invoiceId={shareInvoiceId} onBack={() => window.location.href = '/'} />
        <ToastContainer />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F8FAFC] dark:bg-[#0F172A] gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <span className="text-sm font-bold text-text-secondary dark:text-slate-400">Loading Billing Registry...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
      {/* Sidebar Panel */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Panel Content */}
      <div className="flex flex-col min-h-screen">
        {/* Sticky Header Navbar */}
        <Navbar 
          collapsed={collapsed} 
          setMobileOpen={setMobileOpen} 
        />

        {/* Scrollable Page Body */}
        <main className={`flex-grow p-6 transition-all duration-300 ease-in-out ${leftMargin}`}>
          {renderPage()}
        </main>
      </div>

      {/* Global Notifications Container */}
      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
