import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const activeCustomerCreations = useRef<Map<string, Promise<Customer>>>(new Map());

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
    const previousProfiles = { ...profiles };
    
    // Optimistic Update
    setProfiles(prev => ({ ...prev, [type]: newProfile }));
    showToast(`${type} Business profile saved successfully!`, 'success');
    
    api.updateProfile(type, newProfile).then(updated => {
      // Reconcile
      setProfiles(prev => ({ ...prev, [type]: updated }));
    }).catch(error => {
      // Rollback
      setProfiles(previousProfiles);
      showToast(error.message || 'Failed to save profile. Rolled back changes.', 'danger');
    });
  };

  // Customers Actions
  const handleAddCustomer = async (customer: Omit<Customer, 'id'>) => {
    const tempId = `cust_${Date.now()}`;
    const mockCreated = { ...customer, id: tempId } as Customer;
    const previousCustomers = [...customers];
    
    // Optimistic Update
    setCustomers(prev => [...prev, mockCreated].sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Customer added successfully!', 'success');
    
    const apiPromise = api.createCustomer(customer).then(created => {
      // Reconcile: Swap temporary ID with server ID
      setCustomers(prev => prev.map(c => c.id === tempId ? created : c).sort((a, b) => a.name.localeCompare(b.name)));
      activeCustomerCreations.current.delete(tempId);
      return created;
    }).catch(error => {
      // Rollback
      setCustomers(previousCustomers);
      showToast(error.message || 'Failed to add customer. Rolled back changes.', 'danger');
      activeCustomerCreations.current.delete(tempId);
      throw error;
    });
    
    activeCustomerCreations.current.set(tempId, apiPromise);
    return mockCreated;
  };

  const handleUpdateCustomer = async (id: string, customer: Partial<Customer>) => {
    const previousCustomers = [...customers];
    const originalCustomer = customers.find(c => c.id === id);
    if (!originalCustomer) return {} as Customer;
    
    const mockUpdated = { ...originalCustomer, ...customer } as Customer;
    
    // Optimistic Update
    setCustomers(prev => prev.map(c => c.id === id ? mockUpdated : c).sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Customer updated successfully!', 'success');
    
    api.updateCustomer(id, customer).then(updated => {
      // Reconcile
      setCustomers(prev => prev.map(c => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(error => {
      // Rollback
      setCustomers(previousCustomers);
      showToast(error.message || 'Failed to update customer. Rolled back changes.', 'danger');
    });
    
    return mockUpdated;
  };

  const handleDeleteCustomer = async (id: string) => {
    const previousCustomers = [...customers];
    
    // Optimistic Update
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Customer deleted successfully!', 'success');
    
    api.deleteCustomer(id).catch(error => {
      // Rollback
      setCustomers(previousCustomers);
      showToast(error.message || 'Failed to delete customer. Rolled back changes.', 'danger');
    });
  };

  // Products Actions
  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    const tempId = `prod_${Date.now()}`;
    const mockCreated = { ...product, id: tempId } as Product;
    const previousProducts = [...products];
    
    // Optimistic Update
    setProducts(prev => [...prev, mockCreated].sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Product added successfully!', 'success');
    
    api.createProduct(product).then(created => {
      // Reconcile
      setProducts(prev => prev.map(p => p.id === tempId ? created : p).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(error => {
      // Rollback
      setProducts(previousProducts);
      showToast(error.message || 'Failed to add product. Rolled back changes.', 'danger');
    });
    
    return mockCreated;
  };

  const handleUpdateProduct = async (id: string, product: Partial<Product>) => {
    const previousProducts = [...products];
    const originalProduct = products.find(p => p.id === id);
    if (!originalProduct) return {} as Product;
    
    const mockUpdated = { ...originalProduct, ...product } as Product;
    
    // Optimistic Update
    setProducts(prev => prev.map(p => p.id === id ? mockUpdated : p).sort((a, b) => a.name.localeCompare(b.name)));
    showToast('Product updated successfully!', 'success');
    
    api.updateProduct(id, product).then(updated => {
      // Reconcile
      setProducts(prev => prev.map(p => p.id === id ? updated : p).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(error => {
      // Rollback
      setProducts(previousProducts);
      showToast(error.message || 'Failed to update product. Rolled back changes.', 'danger');
    });
    
    return mockUpdated;
  };

  const handleDeleteProduct = async (id: string) => {
    const previousProducts = [...products];
    
    // Optimistic Update
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted successfully!', 'success');
    
    api.deleteProduct(id).catch(error => {
      // Rollback
      setProducts(previousProducts);
      showToast(error.message || 'Failed to delete product. Rolled back changes.', 'danger');
    });
  };

  // Invoices Actions
  const handleAddInvoice = async (invoice: Omit<Invoice, 'id'> & { isDraft?: boolean }) => {
    const tempId = invoice.isDraft ? `draft_${Date.now()}` : `inv_${Date.now()}`;
    const mockCreated = { ...invoice, id: tempId } as Invoice;
    const previousInvoices = [...invoices];
    
    // Optimistic Update
    setInvoices(prev => [mockCreated, ...prev]);
    showToast(invoice.isDraft ? 'Invoice saved as Draft!' : 'Invoice generated successfully!', 'success');
    
    // Wait for inline customer creation to finish first if it exists
    let finalInvoice = { ...invoice };
    if (invoice.customer_id && invoice.customer_id.startsWith('cust_')) {
      const pendingCreation = activeCustomerCreations.current.get(invoice.customer_id);
      if (pendingCreation) {
        try {
          const realCustomer = await pendingCreation;
          finalInvoice.customer_id = realCustomer.id;
          finalInvoice.customer_snapshot = { ...finalInvoice.customer_snapshot, id: realCustomer.id };
        } catch (err) {
          // Rollback if the parent customer creation failed
          setInvoices(previousInvoices);
          showToast('Failed to generate invoice because inline customer creation failed.', 'danger');
          throw new Error('Customer creation failed');
        }
      }
    }
    
    api.createInvoice(finalInvoice).then(created => {
      // Reconcile
      setInvoices(prev => prev.map(i => i.id === tempId ? created : i));
    }).catch(error => {
      // Rollback
      setInvoices(previousInvoices);
      showToast(error.message || 'Failed to save invoice. Rolled back changes.', 'danger');
    });
    
    return mockCreated;
  };

  const handleUpdateInvoice = async (id: string, invoice: Partial<Invoice> & { isDraft?: boolean }) => {
    const previousInvoices = [...invoices];
    const originalInvoice = invoices.find(i => i.id === id);
    if (!originalInvoice) return {} as Invoice;
    
    const mockUpdated = { ...originalInvoice, ...invoice } as Invoice;
    
    // Optimistic Update
    setInvoices(prev => prev.map(i => i.id === id ? mockUpdated : i));
    showToast(invoice.isDraft ? 'Draft updated!' : 'Invoice updated successfully!', 'success');
    
    api.updateInvoice(id, invoice).then(updated => {
      // Reconcile
      setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    }).catch(error => {
      // Rollback
      setInvoices(previousInvoices);
      showToast(error.message || 'Failed to update invoice. Rolled back changes.', 'danger');
    });
    
    return mockUpdated;
  };

  const handleDeleteInvoice = async (id: string) => {
    const previousInvoices = [...invoices];
    
    // Optimistic Update
    setInvoices(prev => prev.filter(i => i.id !== id));
    showToast('Invoice deleted successfully!', 'success');
    
    api.deleteInvoice(id).catch(error => {
      // Rollback
      setInvoices(previousInvoices);
      showToast(error.message || 'Failed to delete invoice. Rolled back changes.', 'danger');
    });
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
