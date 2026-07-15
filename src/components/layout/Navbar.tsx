import React, { useState } from 'react';
import { useApp, ActivePage } from '../../context/AppContext';
import { Menu, Sun, Moon, Search, Wifi, WifiOff, Building, User } from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  collapsed,
  setMobileOpen
}) => {
  const { 
    activePage, 
    setActivePage,
    gstProfile,
    nongstProfile,
    isOffline, 
    theme, 
    toggleTheme,
    customers,
    products,
    invoices,
    setSelectedInvoiceIdForEdit
  } = useApp();

  const profile = activePage === 'nongst-invoice' ? (nongstProfile || gstProfile) : (gstProfile || nongstProfile);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Translate page ID to Display Title
  const getPageTitle = (page: ActivePage): string => {
    switch (page) {
      case 'dashboard': return 'Dashboard Overview';
      case 'gst-invoice': return 'New GST Invoice';
      case 'nongst-invoice': return 'New Non-GST Invoice';
      case 'invoice-history': return 'Invoice Registry';
      case 'customers': return 'Customer Database';
      case 'products': return 'Inventory & Products';
      case 'reports': return 'Financial Analytics';
      case 'settings': return 'System Settings';
      default: return 'Billing Software';
    }
  };

  // Perform a global fuzzy search
  const getSearchResults = () => {
    if (!searchQuery.trim()) return { customers: [], products: [], invoices: [] };
    const q = searchQuery.toLowerCase().trim();

    const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.company_name && c.company_name.toLowerCase().includes(q)) ||
      c.mobile.includes(q)
    ).slice(0, 3);

    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.hsn_code && p.hsn_code.includes(q))
    ).slice(0, 3);

    const filteredInvoices = invoices.filter(i => 
      i.invoice_number.toLowerCase().includes(q) || 
      i.customer_snapshot.name.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      customers: filteredCustomers,
      products: filteredProducts,
      invoices: filteredInvoices
    };
  };

  const results = getSearchResults();
  const hasResults = results.customers.length > 0 || results.products.length > 0 || results.invoices.length > 0;

  const handleSearchResultClick = (page: ActivePage, id?: string) => {
    if (page === 'gst-invoice' || page === 'nongst-invoice') {
      setSelectedInvoiceIdForEdit(id || null);
    }
    setActivePage(page);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const leftMargin = collapsed ? 'lg:pl-20' : 'lg:pl-64';

  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ease-in-out no-print ${leftMargin}`}>
      {/* Left section: Drawer toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-text-primary dark:text-slate-100 md:text-lg">
          {getPageTitle(activePage)}
        </h1>
      </div>

      {/* Right section: Search bar, Status, Theme toggle, Business Badge */}
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4.5 w-4.5 text-text-light dark:text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Global search (invoices, products...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-200"
          />

          {/* Search dropdown results */}
          {showSearchResults && searchQuery.trim() && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSearchResults(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-premium overflow-hidden p-2">
                {hasResults ? (
                  <div className="space-y-3 p-1 max-h-80 overflow-y-auto">
                    {/* Invoices */}
                    {results.invoices.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-text-light dark:text-slate-500 px-2.5 py-1">Invoices</div>
                        {results.invoices.map(inv => (
                          <button
                            key={inv.id}
                            onClick={() => handleSearchResultClick('invoice-history')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col transition-colors"
                          >
                            <span className="text-xs font-semibold text-text-primary dark:text-slate-200">{inv.invoice_number}</span>
                            <span className="text-[10px] text-text-secondary dark:text-slate-400">{inv.customer_snapshot.name} | ₹{inv.grand_total}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Products */}
                    {results.products.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-text-light dark:text-slate-500 px-2.5 py-1">Products</div>
                        {results.products.map(prod => (
                          <button
                            key={prod.id}
                            onClick={() => handleSearchResultClick('products')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col transition-colors"
                          >
                            <span className="text-xs font-semibold text-text-primary dark:text-slate-200">{prod.name}</span>
                            <span className="text-[10px] text-text-secondary dark:text-slate-400">{prod.hsn_code ? `HSN: ${prod.hsn_code} | ` : ''}Rate: ₹{prod.selling_price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Customers */}
                    {results.customers.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-text-light dark:text-slate-500 px-2.5 py-1">Customers</div>
                        {results.customers.map(cust => (
                          <button
                            key={cust.id}
                            onClick={() => handleSearchResultClick('customers')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col transition-colors"
                          >
                            <span className="text-xs font-semibold text-text-primary dark:text-slate-200">{cust.name}</span>
                            <span className="text-[10px] text-text-secondary dark:text-slate-400">{cust.company_name || 'Individual'} | {cust.mobile}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-center text-text-secondary dark:text-slate-400 py-6">
                    No records matched "{searchQuery}"
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Connectivity Status Indicator */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
            ${isOffline 
              ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800/30 dark:text-emerald-400'
            }
          `}
          title={isOffline ? 'Using Local Offline Storage' : 'Connected to Cloud database'}
        >
          {isOffline ? (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Business Profile Quick Badge */}
        <button 
          onClick={() => setActivePage('settings')}
          className="flex items-center gap-2.5 pl-2.5 border-l border-slate-100 dark:border-slate-850 text-left group"
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-secondary dark:text-slate-400 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Logo" className="object-contain h-full w-full" />
            ) : (
              <Building className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-text-primary dark:text-slate-200 line-clamp-1 max-w-[120px]">
              {profile?.business_name || 'My Business'}
            </span>
            <span className="text-[10px] text-text-secondary dark:text-slate-500 font-medium line-clamp-1 max-w-[120px]">
              {profile?.gstin ? `GSTIN: ${profile.gstin}` : 'Setup Profile'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
