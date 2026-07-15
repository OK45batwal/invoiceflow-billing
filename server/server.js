import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { supabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// --- Business Profile Routes ---
app.get('/api/profile', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .order('profile_type', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const profile = req.body;
    
    // Check if a profile already exists for this type
    const { data: existing, error: fetchError } = await supabase
      .from('business_profile')
      .select('id')
      .eq('profile_type', type)
      .limit(1);
      
    if (fetchError) throw fetchError;
    
    let result;
    if (existing && existing.length > 0) {
      // Update
      const { data, error } = await supabase
        .from('business_profile')
        .update({ ...profile, updated_at: new Date() })
        .eq('id', existing[0].id)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      // Insert
      const { data, error } = await supabase
        .from('business_profile')
        .insert([{ ...profile, profile_type: type }])
        .select();
      if (error) throw error;
      result = data[0];
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Customers Routes ---
app.get('/api/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('customers').select('*');
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,mobile.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([req.body])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Products Routes ---
app.get('/api/products', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('products').select('*');
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([req.body])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Invoices Routes ---
app.get('/api/invoices', async (req, res) => {
  try {
    const { search, type, status, start_date, end_date } = req.query;
    let query = supabase.from('invoices').select('*');
    
    if (type) {
      query = query.eq('invoice_type', type);
    }
    if (status) {
      query = query.eq('payment_status', status);
    }
    if (start_date) {
      query = query.gte('invoice_date', start_date);
    }
    if (end_date) {
      query = query.lte('invoice_date', end_date);
    }
    
    if (search) {
      // Since customer details are inside customer_snapshot, we search invoice_number or customer_snapshot->>name
      query = query.or(`invoice_number.ilike.%${search}%,customer_snapshot->>name.ilike.%${search}%,customer_snapshot->>company_name.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('invoice_date', { ascending: false }).order('invoice_number', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', req.params.id)
      .single();
      
    if (invError) throw invError;
    
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', req.params.id);
      
    if (itemsError) throw itemsError;
    
    res.json({ ...invoice, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;
    
    // Insert invoice header
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select();
      
    if (invError) throw invError;
    
    const newInvoice = invoice[0];
    
    // Insert invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: newInvoice.id
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);
      
    if (itemsError) {
      // Attempt to rollback by deleting invoice header
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      throw itemsError;
    }

    // Update product stock if stock exists
    for (const item of items) {
      if (item.product_id && item.quantity) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (prod && prod.stock !== null) {
          const newStock = prod.stock - item.quantity;
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
        }
      }
    }
    
    res.status(201).json({ ...newInvoice, items: itemsWithInvoiceId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;
    const invoiceId = req.params.id;
    
    // Update invoice header
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', invoiceId)
      .select();
      
    if (invError) throw invError;
    
    // Delete existing items
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);
      
    if (deleteError) throw deleteError;
    
    // Insert new items
    const itemsWithInvoiceId = items.map(item => {
      const cleanItem = { ...item };
      delete cleanItem.id;
      delete cleanItem.invoice_id;
      return {
        ...cleanItem,
        invoice_id: invoiceId
      };
    });
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId);
      
    if (itemsError) throw itemsError;
    
    res.json({ ...invoice[0], items: itemsWithInvoiceId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Dashboard Stats Route ---
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Invoices list
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*');
    if (invError) throw invError;
    
    // Customers count
    const { count: customerCount, error: custError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    if (custError) throw custError;

    // Products count
    const { count: productCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    if (prodError) throw prodError;

    // Calculation variables
    let todaySales = 0;
    let todayInvoices = 0;
    let monthlySales = 0;
    let totalGstCollected = 0;
    
    invoices.forEach(inv => {
      const isGstOrNonGst = ['GST', 'Non-GST'].includes(inv.invoice_type);
      const invDateStr = inv.invoice_date;
      const amount = Number(inv.grand_total) || 0;
      const cgst = Number(inv.cgst_total) || 0;
      const sgst = Number(inv.sgst_total) || 0;
      const igst = Number(inv.igst_total) || 0;
      
      if (invDateStr === today && isGstOrNonGst) {
        todaySales += amount;
        todayInvoices += 1;
      }
      
      if (invDateStr >= firstDayOfMonth && isGstOrNonGst) {
        monthlySales += amount;
      }
      
      if (isGstOrNonGst) {
        totalGstCollected += (cgst + sgst + igst);
      }
    });
    
    // Recent 5 Invoices
    const { data: recentInvoices, error: recError } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false })
      .order('invoice_number', { ascending: false })
      .limit(5);
      
    if (recError) throw recError;
    
    res.json({
      todaySales,
      todayInvoices,
      monthlySales,
      totalCustomers: customerCount || 0,
      totalProducts: productCount || 0,
      totalGstCollected,
      recentInvoices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Reports API ---
app.get('/api/reports', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = supabase.from('invoices').select('*');
    if (start_date) query = query.gte('invoice_date', start_date);
    if (end_date) query = query.lte('invoice_date', end_date);
    
    const { data: invoices, error } = await query.order('invoice_date', { ascending: true });
    if (error) throw error;
    
    // Generate simple aggregation report
    let totalSales = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    const dailySalesMap = {};
    
    invoices.forEach(inv => {
      const amt = Number(inv.grand_total) || 0;
      const cgst = Number(inv.cgst_total) || 0;
      const sgst = Number(inv.sgst_total) || 0;
      const igst = Number(inv.igst_total) || 0;
      
      totalSales += amt;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      
      const date = inv.invoice_date;
      if (!dailySalesMap[date]) {
        dailySalesMap[date] = 0;
      }
      dailySalesMap[date] += amt;
    });
    
    const dailySales = Object.entries(dailySalesMap).map(([date, amount]) => ({
      date,
      amount
    }));
    
    res.json({
      totalSales,
      totalTax: totalCgst + totalSgst + totalIgst,
      totalCgst,
      totalSgst,
      totalIgst,
      invoices,
      dailySales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`InvoiceFlow backend running on port ${PORT}`);
});
