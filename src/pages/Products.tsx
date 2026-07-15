import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Dialog } from '../components/ui/Dialog';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Tag, 
  Barcode, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

export const Products: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Services',
    hsn_code: '',
    sku: '',
    description: '',
    unit: 'PCS',
    selling_price: 0,
    purchase_price: 0,
    gst_rate: 18,
    cgst_rate: 9,
    sgst_rate: 9,
    stock: 0,
    barcode: '',
    image_url: ''
  });

  const handleGstChange = (val: number) => {
    const rate = Number(val) || 0;
    setFormData(prev => ({
      ...prev,
      gst_rate: rate,
      cgst_rate: rate / 2,
      sgst_rate: rate / 2
    }));
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Goods',
      hsn_code: '',
      sku: '',
      description: '',
      unit: 'PCS',
      selling_price: 0,
      purchase_price: 0,
      gst_rate: 18,
      cgst_rate: 9,
      sgst_rate: 9,
      stock: 0,
      barcode: '',
      image_url: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || 'Goods',
      hsn_code: product.hsn_code || '',
      sku: product.sku || '',
      description: product.description || '',
      unit: product.unit || 'PCS',
      selling_price: Number(product.selling_price) || 0,
      purchase_price: Number(product.purchase_price) || 0,
      gst_rate: Number(product.gst_rate) || 0,
      cgst_rate: Number(product.cgst_rate) || 0,
      sgst_rate: Number(product.sgst_rate) || 0,
      stock: Number(product.stock) || 0,
      barcode: product.barcode || '',
      image_url: product.image_url || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.selling_price < 0) {
      showToast('Product name is required, and selling price must be valid.', 'danger');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      setIsFormOpen(false);
    } catch (e: any) {
      showToast(e.message, 'danger');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteProduct(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (e: any) {
        showToast(e.message, 'danger');
      }
    }
  };

  // Filtered product list
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.hsn_code && p.hsn_code.includes(searchQuery))
  );

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0);
  };

  const units = ['PCS', 'BOX', 'KG', 'LTR', 'MTR', 'NOS', 'BAG', 'DOZ', 'SET', 'UNT'];
  const categories = ['Goods', 'Services', 'Electronics', 'Apparel', 'Food & Beverages', 'Hardware', 'Software', 'Others'];

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
            placeholder="Search catalog by name, sku, HSN..."
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
          <span>Add Product Item</span>
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(prod => (
            <div 
              key={prod.id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-soft hover:shadow-premium flex flex-col justify-between transition-all duration-200 group"
            >
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-text-primary dark:text-slate-200">{prod.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-text-secondary dark:text-slate-400 font-bold uppercase tracking-wider">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{prod.category}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border
                    ${Number(prod.stock) > 10 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20' 
                      : Number(prod.stock) > 0 
                      ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20'
                      : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20'
                    }
                  `}>
                    {prod.stock} {prod.unit}
                  </span>
                </div>

                {/* Pricing / GST Info */}
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50 dark:border-slate-850">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-light dark:text-slate-500">Selling Price</span>
                    <p className="text-sm font-extrabold text-text-primary dark:text-slate-100">{formatRupee(prod.selling_price)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-light dark:text-slate-500">GST Rate</span>
                    <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{prod.gst_rate}% GST</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 text-xs font-semibold text-text-secondary dark:text-slate-400">
                  {prod.hsn_code && (
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-text-light dark:text-slate-500" />
                      <span>HSN Code: <strong className="text-text-primary dark:text-slate-300">{prod.hsn_code}</strong></span>
                    </div>
                  )}
                  {prod.sku && (
                    <div className="flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-text-light dark:text-slate-500" />
                      <span>SKU: <strong className="text-text-primary dark:text-slate-300">{prod.sku}</strong></span>
                    </div>
                  )}
                  {prod.description && (
                    <p className="text-[11px] text-text-secondary dark:text-slate-400 line-clamp-2 mt-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg font-medium">
                      {prod.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-850 flex justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 hover:text-text-primary dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Product"
                >
                  <Edit className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(prod.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <Package className="h-10 w-10 text-text-light dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-text-primary dark:text-slate-200">No Inventory Items</h3>
            <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">Populate your product catalog to start billing instantly.</p>
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? "Edit Product Details" : "Add New Product Item"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Unit of Measurement</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              >
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">HSN Code (Indian Tax standard)</label>
              <input
                type="text"
                placeholder="e.g. 8471"
                value={formData.hsn_code}
                onChange={(e) => setFormData(prev => ({ ...prev, hsn_code: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">SKU / Item Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData(prev => ({ ...prev, selling_price: Number(e.target.value) || 0 }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Purchase Price (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: Number(e.target.value) || 0 }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">GST Rate (%)</label>
              <select
                value={formData.gst_rate}
                onChange={(e) => handleGstChange(Number(e.target.value))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={3}>3% (Precious Metals)</option>
                <option value={5}>5% (Basic goods)</option>
                <option value={12}>12% (Standard rate)</option>
                <option value={18}>18% (Most items/services)</option>
                <option value={28}>28% (Luxury goods)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider mb-1">CGST (%)</label>
                <input
                  type="text"
                  readOnly
                  value={`${formData.cgst_rate}%`}
                  className="w-full h-10 px-3 text-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-none text-text-secondary dark:text-slate-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider mb-1">SGST (%)</label>
                <input
                  type="text"
                  readOnly
                  value={`${formData.sgst_rate}%`}
                  className="w-full h-10 px-3 text-sm border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-none text-text-secondary dark:text-slate-500 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Initial Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) || 0 }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Barcode / Serial</label>
              <input
                type="text"
                placeholder="Scanner input ready"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1.5">Item Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              Save Product
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
              <h4 className="text-sm font-bold text-text-primary dark:text-slate-200">Delete Product Record?</h4>
              <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">This will permanently remove the item from your catalog. It will not affect past invoices, which store snapshot data, but will disable search auto-fill for this item.</p>
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
    </div>
  );
};
