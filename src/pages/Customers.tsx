import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { Dialog } from '../components/ui/Dialog';
import { INDIAN_STATES } from '../utils/gstEngine';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  History, 
  FileText, 
  IndianRupee,
  AlertTriangle,
  Users
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { 
    customers, 
    invoices, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    state_code: '27',
    country: 'India',
    email: '',
    mobile: '',
    notes: ''
  });

  // Automatically update state code when state is chosen
  const handleStateChange = (stateName: string) => {
    const matchedState = INDIAN_STATES.find(s => s.name === stateName);
    setFormData(prev => ({
      ...prev,
      state: stateName,
      state_code: matchedState ? matchedState.code : ''
    }));
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      company_name: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: 'Maharashtra',
      state_code: '27',
      country: 'India',
      email: '',
      mobile: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      company_name: customer.company_name || '',
      gstin: customer.gstin || '',
      pan: customer.pan || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || 'Maharashtra',
      state_code: customer.state_code || '27',
      country: customer.country || 'India',
      email: customer.email || '',
      mobile: customer.mobile || '',
      notes: customer.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.address) {
      showToast('Name, mobile, and address are required.', 'danger');
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
      } else {
        await addCustomer(formData);
      }
      setIsFormOpen(false);
    } catch (e: any) {
      showToast(e.message, 'danger');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteCustomer(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (e: any) {
        showToast(e.message, 'danger');
      }
    }
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.mobile.includes(searchQuery)
  );

  // Invoices list for history
  const getCustomerInvoices = (customerId: string) => {
    return invoices.filter(inv => inv.customer_id === customerId);
  };

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4.5 w-4.5 text-text-light dark:text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-200"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm shadow-soft hover:shadow-premium transition-all duration-200"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Create Customer</span>
        </button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(cust => {
            const customerInvoices = getCustomerInvoices(cust.id);
            const totalBilled = customerInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);

            return (
              <div 
                key={cust.id} 
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-soft hover:shadow-premium flex flex-col justify-between transition-all duration-200 group"
              >
                <div className="space-y-4">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-text-primary dark:text-slate-200">{cust.name}</h3>
                      {cust.company_name && (
                        <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-slate-400 font-medium">
                          <Building className="h-3.5 w-3.5" />
                          <span>{cust.company_name}</span>
                        </div>
                      )}
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-bold border border-blue-100 bg-blue-50 text-blue-600 rounded-full dark:bg-blue-950/20 dark:border-blue-800/30 dark:text-blue-400 flex items-center justify-center">
                      {cust.state} ({cust.state_code})
                    </span>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-2 text-xs font-semibold text-text-secondary dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-text-light dark:text-slate-500" />
                      <span>{cust.mobile}</span>
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-text-light dark:text-slate-500" />
                        <span className="line-clamp-1">{cust.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-text-light dark:text-slate-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{cust.address}, {cust.city}</span>
                    </div>
                    {cust.gstin && (
                      <div className="mt-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-[10px] flex justify-between font-bold">
                        <span className="text-text-light dark:text-slate-500">GSTIN</span>
                        <span className="text-text-primary dark:text-slate-300">{cust.gstin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer details and actions */}
                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedCustomerHistory(cust)}
                    className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                  >
                    <History className="h-4 w-4" />
                    <span>History ({customerInvoices.length})</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 hover:text-text-primary dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Customer"
                    >
                      <Edit className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cust.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <Users className="h-10 w-10 text-text-light dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-text-primary dark:text-slate-200">No Customers Found</h3>
            <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">Create your first customer to start invoicing.</p>
          </div>
        )}
      </div>

      {/* Customer Form Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? "Edit Customer Details" : "Create New Customer"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number *</label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">GSTIN</label>
              <input
                type="text"
                placeholder="e.g. 27AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                maxLength={15}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">PAN Number</label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan}
                onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                maxLength={10}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Billing Address *</label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">State *</label>
              <select
                value={formData.state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">State Code</label>
              <input
                type="text"
                readOnly
                value={formData.state_code}
                className="w-full h-10 px-3.5 text-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-none text-text-secondary dark:text-slate-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Additional Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-50 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-750 text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs shadow-soft transition-colors"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary dark:text-slate-200">Delete Customer Account?</h4>
              <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">This will permanently remove the customer record. Any historical invoices created for this customer will retain their snapshots but will lose the link to this customer record.</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-50 dark:border-slate-850">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-750 text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
            >
              No, Keep
            </button>
            <button
              onClick={handleDelete}
              className="h-10 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-soft transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Dialog>

      {/* Customer Invoice History Dialog */}
      <Dialog
        isOpen={selectedCustomerHistory !== null}
        onClose={() => setSelectedCustomerHistory(null)}
        title={selectedCustomerHistory ? `${selectedCustomerHistory.name}'s Invoice History` : 'Customer History'}
        size="lg"
      >
        {selectedCustomerHistory && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-text-secondary dark:text-slate-400 justify-between items-center">
              <div>
                <span className="text-text-light dark:text-slate-500 mr-1.5">Total Invoices Billed:</span>
                <span className="text-text-primary dark:text-slate-200 font-extrabold">{getCustomerInvoices(selectedCustomerHistory.id).length}</span>
              </div>
              <div>
                <span className="text-text-light dark:text-slate-500 mr-1.5">Total Sales Revenue:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {formatRupee(getCustomerInvoices(selectedCustomerHistory.id).reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0))}
                </span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-100 dark:border-slate-800/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="py-2.5 pl-3">Invoice No</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5 pr-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                  {getCustomerInvoices(selectedCustomerHistory.id).length > 0 ? (
                    getCustomerInvoices(selectedCustomerHistory.id).map(inv => (
                      <tr key={inv.id} className="text-text-primary dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 pl-3 font-semibold">{inv.invoice_number}</td>
                        <td className="py-3 text-text-secondary dark:text-slate-400">
                          {new Date(inv.invoice_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3">{inv.invoice_type}</td>
                        <td className="py-3 font-bold text-text-primary dark:text-slate-200">{formatRupee(inv.grand_total)}</td>
                        <td className="py-3 pr-3 text-right">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase border
                            ${inv.payment_status === 'Paid' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/15' 
                              : inv.payment_status === 'Partially Paid' 
                              ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/15'
                              : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/15'
                            }
                          `}>
                            {inv.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text-secondary dark:text-slate-400">
                        No transactions registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomerHistory(null)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-750 text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
