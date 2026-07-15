import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { BusinessProfile, Customer, Product, Invoice } from '../types';

export type ActivePage = 'dashboard' | 'gst-invoice' | 'nongst-invoice' | 'customers' | 'products' | 'reports' | 'settings' | 'invoice-history';
export type Theme = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

interface AppContextType {
  gstProfile: BusinessProfile | null;
  nongstProfile: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  selectedInvoiceIdForEdit: string | null;
  setSelectedInvoiceIdForEdit: (id: string | null) => void;
  theme: Theme;
  toggleTheme: () => void;
  loading: boolean;
  isOffline: boolean;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  updateProfile: (type: 'GST' | 'Non-GST', profile: BusinessProfile) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'> & { isDraft?: boolean }) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice> & { isDraft?: boolean }) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Record<'GST' | 'Non-GST', BusinessProfile | null>>({
    'GST': null,
    'Non-GST': null
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [selectedInvoiceIdForEdit, setSelectedInvoiceIdForEdit] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('invoiceflow_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync theme with system and localstorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('invoiceflow_theme') as Theme;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch Data
  const refreshData = async () => {
    setLoading(true);
    try {
      const profiles = await api.getProfiles();
      const gst = profiles.find(p => p.profile_type === 'GST') || null;
      const nongst = profiles.find(p => p.profile_type === 'Non-GST') || null;
      setProfiles({
        'GST': gst,
        'Non-GST': nongst
      });

      const custs = await api.getCustomers();
      setCustomers(custs);

      const prods = await api.getProducts();
      setProducts(prods);

      const invs = await api.getInvoices();
      setInvoices(invs);
      
      setIsOffline(api.isOffline());
    } catch {
      setIsOffline(true);
      showToast('Offline Mode: Server is unreachable. Saving changes locally.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Business Profile Actions
  const handleUpdateProfile = async (type: 'GST' | 'Non-GST', newProfile: BusinessProfile) => {
    try {
      const updated = await api.updateProfile(type, newProfile);
      setProfiles(prev => ({ ...prev, [type]: updated }));
      showToast(`${type} Business profile saved successfully!`, 'success');
    } catch {
      showToast('Profile saved offline.', 'info');
      setProfiles(prev => ({ ...prev, [type]: { ...newProfile, profile_type: type } }));
    }
  };

  // Customers Actions
  const handleAddCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      const created = await api.createCustomer(customer);
      setCustomers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      showToast('Customer added successfully!', 'success');
      return created;
    } catch {
      showToast('Customer saved offline.', 'info');
      const tempId = `cust_${Date.now()}`;
      const mockCreated = { ...customer, id: tempId } as Customer;
      setCustomers(prev => [...prev, mockCreated].sort((a, b) => a.name.localeCompare(b.name)));
      return mockCreated;
    }
  };

  const handleUpdateCustomer = async (id: string, customer: Partial<Customer>) => {
    try {
      const updated = await api.updateCustomer(id, customer);
      setCustomers(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      showToast('Customer updated successfully!', 'success');
      return updated;
    } catch {
      showToast('Customer updated offline.', 'info');
      const mockUpdated = { ...customers.find(c => c.id === id), ...customer } as Customer;
      setCustomers(prev => prev.map(c => c.id === id ? mockUpdated : c));
      return mockUpdated;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Customer deleted successfully!', 'success');
    } catch {
      showToast('Customer deleted offline.', 'info');
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  // Products Actions
  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const created = await api.createProduct(product);
      setProducts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      showToast('Product added successfully!', 'success');
      return created;
    } catch {
      showToast('Product saved offline.', 'info');
      const tempId = `prod_${Date.now()}`;
      const mockCreated = { ...product, id: tempId } as Product;
      setProducts(prev => [...prev, mockCreated].sort((a, b) => a.name.localeCompare(b.name)));
      return mockCreated;
    }
  };

  const handleUpdateProduct = async (id: string, product: Partial<Product>) => {
    try {
      const updated = await api.updateProduct(id, product);
      setProducts(prev => prev.map(p => p.id === id ? updated : p).sort((a, b) => a.name.localeCompare(b.name)));
      showToast('Product updated successfully!', 'success');
      return updated;
    } catch {
      showToast('Product updated offline.', 'info');
      const mockUpdated = { ...products.find(p => p.id === id), ...product } as Product;
      setProducts(prev => prev.map(p => p.id === id ? mockUpdated : p));
      return mockUpdated;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product deleted successfully!', 'success');
    } catch {
      showToast('Product deleted offline.', 'info');
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Invoices Actions
  const handleAddInvoice = async (invoice: Omit<Invoice, 'id'> & { isDraft?: boolean }) => {
    try {
      const created = await api.createInvoice(invoice);
      setInvoices(prev => [created, ...prev]);
      showToast(invoice.isDraft ? 'Invoice saved as Draft!' : 'Invoice generated successfully!', 'success');
      return created;
    } catch {
      showToast('Saved invoice locally (offline).', 'info');
      const tempId = invoice.isDraft ? `draft_${Date.now()}` : `inv_${Date.now()}`;
      const mockCreated = { ...invoice, id: tempId } as Invoice;
      setInvoices(prev => [mockCreated, ...prev]);
      return mockCreated;
    }
  };

  const handleUpdateInvoice = async (id: string, invoice: Partial<Invoice> & { isDraft?: boolean }) => {
    try {
      const updated = await api.updateInvoice(id, invoice);
      setInvoices(prev => prev.map(i => i.id === id ? updated : i));
      showToast(invoice.isDraft ? 'Draft updated!' : 'Invoice updated successfully!', 'success');
      return updated;
    } catch {
      showToast('Invoice updated locally (offline).', 'info');
      const mockUpdated = { ...invoices.find(i => i.id === id), ...invoice } as Invoice;
      setInvoices(prev => prev.map(i => i.id === id ? mockUpdated : i));
      return mockUpdated;
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      showToast('Invoice deleted successfully!', 'success');
    } catch {
      showToast('Invoice deleted offline.', 'info');
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <AppContext.Provider
      value={{
        gstProfile: profiles['GST'],
        nongstProfile: profiles['Non-GST'],
        customers,
        products,
        invoices,
        activePage,
        setActivePage,
        selectedInvoiceIdForEdit,
        setSelectedInvoiceIdForEdit,
        theme,
        toggleTheme,
        loading,
        isOffline,
        toasts,
        showToast,
        removeToast,
        refreshData,
        updateProfile: handleUpdateProfile,
        addCustomer: handleAddCustomer,
        updateCustomer: handleUpdateCustomer,
        deleteCustomer: handleDeleteCustomer,
        addProduct: handleAddProduct,
        updateProduct: handleUpdateProduct,
        deleteProduct: handleDeleteProduct,
        addInvoice: handleAddInvoice,
        updateInvoice: handleUpdateInvoice,
        deleteInvoice: handleDeleteInvoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
