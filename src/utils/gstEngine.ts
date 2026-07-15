import { InvoiceItem, BusinessProfile } from '../types';

/**
 * Extract 2-digit state code from GSTIN.
 * In India, GSTIN starts with a 2-digit state code (e.g. 27 for Maharashtra).
 */
export const getStateCodeFromGstin = (gstin?: string): string => {
  if (!gstin) return '';
  const clean = gstin.trim();
  if (clean.length >= 2) {
    const code = clean.substring(0, 2);
    if (/^\d+$/.test(code)) return code;
  }
  return '';
};

/**
 * Determine if IGST applies (inter-state transaction).
 * Compare seller state code/name and place of supply state code/name.
 */
export const isInterState = (
  seller: BusinessProfile,
  placeOfSupply: string
): boolean => {
  if (!seller || !placeOfSupply) return false;
  
  // Extract state codes if possible
  const sellerCode = getStateCodeFromGstin(seller.gstin) || seller.state_code;
  const supplyCode = getStateCodeFromGstin(placeOfSupply) || placeOfSupply;
  
  if (sellerCode && supplyCode) {
    return sellerCode.substring(0, 2) !== supplyCode.substring(0, 2);
  }
  
  // Fallback to name comparison
  const sellerState = (seller.state || '').toLowerCase().trim();
  const supplyState = placeOfSupply.toLowerCase().trim();
  return sellerState !== supplyState && !supplyState.includes(sellerState) && !sellerState.includes(supplyState);
};

/**
 * Calculate single item taxes and amount.
 */
export const calculateItem = (
  rate: number,
  quantity: number,
  discountPct: number,
  gstRate: number,
  interState: boolean
): Omit<InvoiceItem, 'product_name' | 'unit'> => {
  const qty = Number(quantity) || 0;
  const rt = Number(rate) || 0;
  const disc = Number(discountPct) || 0;
  const gst = Number(gstRate) || 0;

  const discountedRate = rt * (1 - disc / 100);
  const taxableValue = discountedRate * qty;
  
  const taxAmount = taxableValue * (gst / 100);
  
  let cgst_rate = 0;
  let sgst_rate = 0;
  let cgst_amount = 0;
  let sgst_amount = 0;
  let igst_amount = 0;

  if (interState) {
    igst_amount = taxAmount;
  } else {
    cgst_rate = gst / 2;
    sgst_rate = gst / 2;
    cgst_amount = taxAmount / 2;
    sgst_amount = taxAmount / 2;
  }

  const amount = taxableValue + taxAmount;

  return {
    rate: rt,
    quantity: qty,
    discount_pct: disc,
    gst_rate: gst,
    cgst_rate,
    sgst_rate,
    cgst_amount: Number(cgst_amount.toFixed(2)),
    sgst_amount: Number(sgst_amount.toFixed(2)),
    igst_amount: Number(igst_amount.toFixed(2)),
    amount: Number(amount.toFixed(2))
  };
};

/**
 * Calculate full invoice totals including subtotal, tax totals, round off, and grand total.
 */
export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  seller: BusinessProfile,
  placeOfSupply: string
) => {
  const interState = isInterState(seller, placeOfSupply);
  
  let subtotal = 0;
  let cgst_total = 0;
  let sgst_total = 0;
  let igst_total = 0;
  
  const calculatedItems = items.map(item => {
    const calc = calculateItem(
      item.rate,
      item.quantity,
      item.discount_pct,
      item.gst_rate,
      interState
    );
    
    // Add to running totals
    const discountedRate = item.rate * (1 - item.discount_pct / 100);
    subtotal += discountedRate * item.quantity;
    cgst_total += calc.cgst_amount;
    sgst_total += calc.sgst_amount;
    igst_total += calc.igst_amount;
    
    return {
      ...item,
      ...calc
    };
  });
  
  const rawTotal = subtotal + cgst_total + sgst_total + igst_total;
  const grand_total = Math.round(rawTotal);
  const round_off = Number((grand_total - rawTotal).toFixed(2));
  
  return {
    items: calculatedItems,
    subtotal: Number(subtotal.toFixed(2)),
    cgst_total: Number(cgst_total.toFixed(2)),
    sgst_total: Number(sgst_total.toFixed(2)),
    igst_total: Number(igst_total.toFixed(2)),
    round_off,
    grand_total
  };
};

/**
 * Convert number to words in Indian Rupees format.
 */
export const numberToWords = (num: number): string => {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertAmount = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : ' ');
  };

  const convertSection = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      str += convertAmount(n);
    }
    return str;
  };

  const mainNum = Math.floor(num);
  const paisaNum = Math.round((num - mainNum) * 100);

  let word = '';

  if (mainNum === 0) {
    word = 'Zero ';
  } else {
    let tempNum = mainNum;
    const crores = Math.floor(tempNum / 10000000);
    tempNum %= 10000000;
    
    const lakhs = Math.floor(tempNum / 100000);
    tempNum %= 100000;
    
    const thousands = Math.floor(tempNum / 1000);
    tempNum %= 1000;
    
    const hundreds = tempNum;

    if (crores > 0) {
      word += convertSection(crores) + 'Crore ';
    }
    if (lakhs > 0) {
      word += convertSection(lakhs) + 'Lakh ';
    }
    if (thousands > 0) {
      word += convertSection(thousands) + 'Thousand ';
    }
    if (hundreds > 0) {
      word += convertSection(hundreds);
    }
  }

  word = 'Rupees ' + word.trim();

  if (paisaNum > 0) {
    word += ' and ' + convertSection(paisaNum).trim() + ' Paise';
  }

  return word + ' Only';
};

// Indian States and Union Territories with state codes for easy selection
export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Before Division)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' }
];
