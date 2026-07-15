-- InvoiceFlow Database Schema Migration
-- Applied on Supabase PostgreSQL

-- Create business_profile table
CREATE TABLE IF NOT EXISTS business_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    email VARCHAR(255),
    website VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    alt_phone VARCHAR(20),
    bank_name VARCHAR(255),
    branch VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    upi_id VARCHAR(100),
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    email VARCHAR(255),
    mobile VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    hsn_code VARCHAR(20),
    sku VARCHAR(50),
    description TEXT,
    unit VARCHAR(20) DEFAULT 'PCS',
    selling_price NUMERIC(12,2) NOT NULL,
    purchase_price NUMERIC(12,2),
    gst_rate NUMERIC(5,2) DEFAULT 0.00,
    cgst_rate NUMERIC(5,2) DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    barcode VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) NOT NULL, -- 'GST', 'Non-GST', 'Quotation', 'Estimate', 'Proforma', 'Challan'
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_mode VARCHAR(50) NOT NULL, -- 'Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'
    payment_status VARCHAR(50) DEFAULT 'Unpaid', -- 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'
    place_of_supply VARCHAR(100) NOT NULL,
    reverse_charge BOOLEAN DEFAULT FALSE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_snapshot JSONB NOT NULL,
    seller_snapshot JSONB NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cgst_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sgst_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    igst_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    round_off NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    hsn_code VARCHAR(20),
    quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'PCS',
    rate NUMERIC(12,2) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0.00,
    gst_rate NUMERIC(5,2) DEFAULT 0.00,
    cgst_rate NUMERIC(5,2) DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) DEFAULT 0.00,
    cgst_amount NUMERIC(12,2) DEFAULT 0.00,
    sgst_amount NUMERIC(12,2) DEFAULT 0.00,
    igst_amount NUMERIC(12,2) DEFAULT 0.00,
    amount NUMERIC(12,2) NOT NULL
);
