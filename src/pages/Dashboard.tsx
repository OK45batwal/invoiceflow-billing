import React, { useEffect, useState } from 'react';
import { useApp, ActivePage } from '../context/AppContext';
import { api } from '../services/api';
import { 
  IndianRupee, 
  Users, 
  Package, 
  Receipt, 
  Percent, 
  ArrowUpRight, 
  TrendingUp, 
  PlusCircle, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { setActivePage, setSelectedInvoiceIdForEdit } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Quick Action Handler
  const handleQuickAction = (page: ActivePage) => {
    setSelectedInvoiceIdForEdit(null);
    setActivePage(page);
  };

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Visual metrics configuration
  const cards = [
    {
      title: "Today's Sales",
      value: formatRupee(stats?.todaySales),
      icon: IndianRupee,
      color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30",
      desc: "Total invoiced value today"
    },
    {
      title: "Today's Invoices",
      value: stats?.todayInvoices || 0,
      icon: Receipt,
      color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30",
      desc: "Invoices generated today"
    },
    {
      title: "Monthly Sales",
      value: formatRupee(stats?.monthlySales),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
      desc: "Sales in current calendar month"
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/30",
      desc: "Registered customer records"
    },
    {
      title: "Active Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
      desc: "Items in product catalog"
    },
    {
      title: "GST Collected",
      value: formatRupee(stats?.totalGstCollected),
      icon: Percent,
      color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30",
      desc: "Total tax collected (CGST+SGST+IGST)"
    }
  ];

  // Dummy monthly points for custom SVG line chart
  const graphPoints = [12, 19, 32, 26, 45, 60, 52, 78, 65, 88, 92, 105];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxPoint = Math.max(...graphPoints);
  
  // Create path for line graph
  const width = 500;
  const height = 180;
  const padding = 20;
  const points = graphPoints.map((val, idx) => {
    const x = padding + (idx / (graphPoints.length - 1)) * (width - padding * 2);
    const y = height - padding - (val / maxPoint) * (height - padding * 2);
    return `${x},${y}`;
  });
  
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div className="space-y-6 pb-12">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-soft flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary dark:text-slate-400 uppercase tracking-wider">{card.title}</span>
                <h2 className="text-2xl font-extrabold text-text-primary dark:text-slate-100">{card.value}</h2>
                <p className="text-[10px] text-text-light dark:text-slate-500 font-medium">{card.desc}</p>
              </div>
              <div className={`p-4 rounded-2xl ${card.color} flex-shrink-0`}>
                <Icon className="h-6 w-6" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (SVG Premium Design) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm uppercase font-bold tracking-wider text-text-secondary dark:text-slate-400">Sales Trend</h3>
              <p className="text-xs text-text-light dark:text-slate-500">Monthly invoice turnover growth</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
              <span>+34% vs last year</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          
          {/* Custom SVG Line Chart */}
          <div className="relative pt-4 w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = padding + r * (height - padding * 2);
                return (
                  <line 
                    key={i} 
                    x1={padding} 
                    y1={y} 
                    x2={width - padding} 
                    y2={y} 
                    className="stroke-slate-100 dark:stroke-slate-800" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                );
              })}
              
              {/* Gradient Area */}
              <path d={areaD} fill="url(#chartGradient)" />
              
              {/* Chart Line */}
              <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Interaction Dots */}
              {points.map((pt, idx) => {
                const [x, y] = pt.split(',');
                return (
                  <g key={idx} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="7" className="fill-white stroke-primary stroke-2 shadow dark:fill-slate-900" />
                    <circle cx={x} cy={y} r="3" className="fill-primary" />
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between px-4 text-[10px] text-text-secondary dark:text-slate-400 font-semibold mt-2">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-soft space-y-4">
          <div>
            <h3 className="text-sm uppercase font-bold tracking-wider text-text-secondary dark:text-slate-400">Quick Actions</h3>
            <p className="text-xs text-text-light dark:text-slate-500">Shortcuts to speed up workflows</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleQuickAction('gst-invoice')}
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/20 hover:shadow-soft text-left group transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary dark:text-slate-200">New GST Invoice</h4>
                <p className="text-[10px] text-text-secondary dark:text-slate-400">Create inter/intra state tax bills</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction('nongst-invoice')}
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/20 hover:shadow-soft text-left group transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary dark:text-slate-200">New Non-GST Invoice</h4>
                <p className="text-[10px] text-text-secondary dark:text-slate-400">Simple offline bills or estimates</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction('customers')}
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/20 hover:shadow-soft text-left group transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary dark:text-slate-200">Add Customer</h4>
                <p className="text-[10px] text-text-secondary dark:text-slate-400">Register customer contact details</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickAction('products')}
              className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/20 hover:shadow-soft text-left group transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary dark:text-slate-200">New Product Item</h4>
                <p className="text-[10px] text-text-secondary dark:text-slate-400">Add item, rate and HSN to inventory</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm uppercase font-bold tracking-wider text-text-secondary dark:text-slate-400">Recent Invoices</h3>
            <p className="text-xs text-text-light dark:text-slate-500 font-medium">Quick access to the last 5 invoices</p>
          </div>
          <button 
            onClick={() => handleQuickAction('invoice-history')} 
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <span>View All Registry</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider">
                <th className="pb-3.5 pl-2">Invoice No</th>
                <th className="pb-3.5">Customer / Company</th>
                <th className="pb-3.5">Type</th>
                <th className="pb-3.5">Date</th>
                <th className="pb-3.5">Total Amount</th>
                <th className="pb-3.5">Payment Status</th>
                <th className="pb-3.5 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
              {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
                stats.recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="text-sm text-text-primary dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-semibold pl-2">
                      {inv.invoice_number}
                      {inv.id.startsWith('draft_') && (
                        <span className="ml-1.5 px-2 py-0.5 text-[9px] font-bold uppercase border border-amber-200 bg-amber-50 text-amber-600 rounded-full dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-400">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="font-semibold text-text-primary dark:text-slate-200">
                        {inv.customer_snapshot.name}
                      </div>
                      <div className="text-[10px] text-text-secondary dark:text-slate-500">
                        {inv.customer_snapshot.company_name || 'Individual'}
                      </div>
                    </td>
                    <td className="py-4 text-xs font-semibold text-text-secondary dark:text-slate-400">
                      {inv.invoice_type}
                    </td>
                    <td className="py-4 text-xs text-text-secondary dark:text-slate-400">
                      {new Date(inv.invoice_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 font-bold text-text-primary dark:text-slate-100">
                      {formatRupee(inv.grand_total)}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-bold uppercase border
                        ${inv.payment_status === 'Paid' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800/30 dark:text-emerald-400' 
                          : inv.payment_status === 'Partially Paid' 
                          ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800/30 dark:text-amber-400'
                          : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-800/30 dark:text-rose-400'
                        }
                      `}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => {
                          setSelectedInvoiceIdForEdit(inv.id);
                          setActivePage(inv.invoice_type === 'GST' ? 'gst-invoice' : 'nongst-invoice');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-text-secondary dark:text-slate-400 font-medium">
                    No recent invoices found. Click "New GST Invoice" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
