import React from 'react';
import { useApp, ActivePage } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Package, 
  History, 
  BarChart3, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { activePage, setActivePage, setSelectedInvoiceIdForEdit } = useApp();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'gst-invoice', name: 'Create GST Invoice', icon: FileSpreadsheet },
    { id: 'nongst-invoice', name: 'Create Non-GST Invoice', icon: FileText },
    { id: 'invoice-history', name: 'Invoice History', icon: History },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  const handleNavigate = (page: ActivePage) => {
    setSelectedInvoiceIdForEdit(null); // Clear any invoice edits when navigating
    setActivePage(page);
    setMobileOpen(false);
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ease-in-out no-print
          ${sidebarWidth} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-white shadow-md shadow-primary/20 flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                InvoiceFlow
              </span>
            )}
          </div>
          
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow py-6 px-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as ActivePage)}
                className={`flex items-center w-full rounded-xl transition-all duration-200 group px-4.5 py-3.5
                  ${isActive 
                    ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20 dark:text-primary-light' 
                    : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }
                  ${collapsed ? 'justify-center py-4' : 'gap-4'}
                `}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105
                  ${isActive ? 'text-primary dark:text-primary-light' : 'text-text-secondary dark:text-slate-400'}
                `} />
                {!collapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer info (only when expanded) */}
        {!collapsed && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-1 text-[11px] text-text-light dark:text-slate-500 font-medium">
              <span>InvoiceFlow v1.0.0</span>
              <span>© 2026 Indian Business billing</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
