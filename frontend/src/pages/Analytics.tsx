import React, { useState, useMemo } from 'react';
import { TrendingUp, IndianRupee, Users, ShieldCheck, ArrowUp, ArrowDown, FileText, Download, Calendar, Filter, BarChart3, PieChart, DollarSign, Package, ShoppingCart, ArrowRight, RefreshCw } from 'lucide-react';
import { Product, Customer, Vendor, Transaction, User } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AnalyticsProps {
    products: Product[];
    customers: Customer[];
    vendors: Vendor[];
    transactions: Transaction[];
    user?: User | null;
    onRefresh?: () => Promise<void>;
}

const Analytics: React.FC<AnalyticsProps> = ({ products, customers, vendors, transactions, user, onRefresh }) => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (!onRefresh || refreshing) return;
        setRefreshing(true);
        try { await onRefresh(); } finally { setTimeout(() => setRefreshing(false), 600); }
    };
    const permissionLevel = (user?.role === 'Super Admin') ? 'manage' : (user?.permissions?.['analytics'] || 'read');
    const isReadOnly = permissionLevel === 'read';
    const [selectedReport, setSelectedReport] = useState('sales');
    const [dateRange, setDateRange] = useState('this_month');

    const [gstConfig] = useLocalStorage('nx_gst_config', {
        defaultRate: '18',
        enableCGST: true,
        enableSGST: true,
        enableIGST: false,
    });



    // Helper to check if a date falls within the selected range - Enhanced for local matching
    const isWithinRange = (dateStr: string) => {
        if (!dateStr) return false;

        const cleanDateStr = dateStr.split(' | ')[0];

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const itemDate = new Date(cleanDateStr);

        switch (dateRange) {
            case 'today':
                return cleanDateStr === todayStr;
            case 'this_week':
                const startOfWeek = new Date();
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return itemDate >= startOfWeek;
            case 'this_month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return itemDate >= startOfMonth;
            case 'this_quarter':
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                return itemDate >= new Date(now.getFullYear(), quarterMonth, 1);
            case 'this_year':
                return itemDate >= new Date(now.getFullYear(), 0, 1);
            default:
                return true;
        }
    };

    // Filtered data based on time range
    const filteredTransactions = useMemo(() => {
        // Pre-parse today's date once for efficiency
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Memoize date boundaries
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const filterFunc = (dateStr: string) => {
            if (!dateStr) return false;
            const cleanDateStr = dateStr.split(' | ')[0];
            const itemDate = new Date(cleanDateStr);

            switch (dateRange) {
                case 'today': return cleanDateStr === todayStr;
                case 'this_week': return itemDate >= startOfWeek;
                case 'this_month': return itemDate >= startOfMonth;
                case 'this_quarter': return itemDate >= startOfQuarter;
                case 'this_year': return itemDate >= startOfYear;
                default: return true;
            }
        };

        return transactions.filter(t => filterFunc(t.date));
    }, [transactions, dateRange]);


    // Summary Metrics - Optimized to O(N) using Product Map
    const metrics = useMemo(() => {
        const productMap = new Map(products.map(p => [p.id, p]));
        const activeCustomerIds = new Set(customers.map(c => c.id));

        const validTransactions = filteredTransactions.filter(t => t.customerId === 'WALK-IN' || activeCustomerIds.has(t.customerId));

        let totalRevenue = 0;
        let totalGst = 0;
        let totalCogs = 0;

        validTransactions.forEach(t => {
            totalRevenue += Number(t.total) || 0;
            totalGst += Number(t.gstAmount) || 0;

            t.items.forEach(item => {
                const product = productMap.get(item.id);
                if (product) {
                    totalCogs += (Number(product.purchasePrice) || 0) * (Number(item.quantity) || 0);
                }
            });
        });

        const netProfit = totalRevenue - totalGst - totalCogs;
        const inventoryValuation = products.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);

        return {
            revenue: totalRevenue,
            gst: totalGst,
            netProfit,
            cogs: totalCogs,
            inventoryValuation,
            customerCount: customers.length,
            transactionCount: validTransactions.length,
            avgOrder: validTransactions.length > 0 ? totalRevenue / validTransactions.length : 0
        };
    }, [filteredTransactions, products, customers]);

    const reports = [
        { id: 'sales', title: 'Sales Report', icon: DollarSign, description: 'Revenue, transactions, and sales trends' },
        { id: 'inventory', title: 'Inventory Report', icon: BarChart3, description: 'Stock levels, movement, and valuation' },
        { id: 'profit', title: 'Profit & Loss', icon: TrendingUp, description: 'Income, expenses, and net profit' },
        { id: 'gst', title: 'GST Report', icon: PieChart, description: 'CGST, SGST, and IGST breakdown' },
        { id: 'customer', title: 'Customer Report', icon: FileText, description: 'Payment history, outstanding, and activity' },
    ];

    const handleExport = () => {
        let csvContent = "";
        let fileName = `nexapos_${selectedReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

        if (selectedReport === 'sales') {
            const headers = ["Transaction ID", "Date", "Customer", "Status", "Amount"];
            const rows = filteredTransactions.map(t => [
                t.id,
                t.date,
                customers.find(c => c.id === t.customerId)?.name || 'Walk-in',
                t.status,
                t.total
            ]);
            csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        } else if (selectedReport === 'inventory') {
            const headers = ["Product Name", "SKU", "Category", "Stock", "Unit", "Status", "Price", "Value"];
            const rows = products.map(p => [
                p.name,
                p.sku,
                p.category,
                p.stock,
                p.unit || 'Units',
                p.status,
                p.price,
                p.price * p.stock
            ]);
            csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        } else if (selectedReport === 'profit') {
            const headers = ["Category", "Label", "Amount"];
            const rows = [
                ["Income", "Gross Sales", metrics.revenue],
                ["Income", "Tax Liabilities", -metrics.gst],
                ["Income", "Net Revenue", metrics.revenue - metrics.gst],
                ["Expense", "Product COGS", metrics.cogs],
                ["Expense", "Total Costs", metrics.cogs],
                ["Final", "Net Profit/Loss", metrics.netProfit]
            ];
            csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        } else if (selectedReport === 'gst') {
            const headers = ["Transaction ID", "Date", "Total Amount", "GST Amount", "CGST", "SGST"];
            const rows = filteredTransactions.map(t => [
                t.id,
                t.date,
                t.total,
                t.gstAmount || 0,
                (t.gstAmount || 0) / 2,
                (t.gstAmount || 0) / 2
            ]);
            csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        } else if (selectedReport === 'customer') {
            const headers = ["Customer Name", "Phone", "Total Purchases", "Outstanding", "Last Visit"];
            const rows = customers.map(c => [
                c.name,
                c.phone || '',
                c.totalPaid || 0,
                c.pending || 0,
                c.lastTransaction || 'Never'
            ]);
            csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {isReadOnly && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-orange-600 p-1.5 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-orange-900 uppercase">View Only Mode</p>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">You have restricted access to analytics and reports</p>
                    </div>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { title: 'Total Revenue', value: `₹${metrics.revenue.toLocaleString()}`, icon: IndianRupee, color: 'bg-emerald-500', trend: 'Live' },
                    { title: 'Net Profit', value: `₹${metrics.netProfit.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-600', trend: 'Real-time' },
                    { title: 'Tax Collected', value: `₹${metrics.gst.toLocaleString()}`, icon: ShieldCheck, color: 'bg-indigo-500', trend: 'Audit' },
                    { title: 'Valuation', value: `₹${metrics.inventoryValuation.toLocaleString()}`, icon: Package, color: 'bg-orange-500', trend: 'Asset' },
                ].map((card, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                                <card.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.title}</p>
                        <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Report Icons Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {reports.map(r => (
                    <button
                        key={r.id}
                        onClick={() => setSelectedReport(r.id)}
                        className={`p-6 rounded-2xl border-2 text-left transition-all group ${selectedReport === r.id
                            ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                            : 'border-white bg-white hover:border-slate-100 hover:shadow-lg shadow-sm'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${selectedReport === r.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400'
                            }`}>
                            <r.icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-sm text-slate-900">{r.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">{r.description}</p>
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-3 overflow-x-auto vyapar-scrollbar pb-2 md:pb-0">
                    <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent text-xs font-black uppercase tracking-wider outline-none text-slate-600 cursor-pointer"
                        >
                            <option value="today">Today</option>
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="this_quarter">This Quarter</option>
                            <option value="this_year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                        <Filter className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {onRefresh && (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={`p-3 rounded-xl transition-all border ${refreshing ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100'}`}
                            title="Refresh Analytics"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Data</span>
                    </button>
                </div>
            </div>

            {/* Dynamic Report Content */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {reports.find(r => r.id === selectedReport)?.title}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                            Live visualization of your business data
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Real-time Sync Active</span>
                    </div>
                </div>

                <div className="p-8">
                    {selectedReport === 'sales' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Sales</p>
                                    <p className="text-3xl font-black text-slate-900">₹{metrics.revenue.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Orders</p>
                                    <p className="text-3xl font-black text-slate-900">{metrics.transactionCount}</p>
                                </div>
                                <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Avg Ticket Size</p>
                                    <p className="text-3xl font-black text-slate-900">₹{Math.round(metrics.avgOrder).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Transaction ID</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTransactions.slice(0, 10).map((t, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-black text-blue-600 text-sm">{t.id}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{t.date}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-900">{customers.find(c => c.id === t.customerId)?.name || 'Walk-in'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>{t.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">₹{t.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {filteredTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest">No sales data in this period</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'inventory' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Stock</p>
                                    <p className="text-2xl font-black text-slate-900">{products.reduce((s, p) => s + p.stock, 0)} Units</p>
                                </div>
                                <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                                    <p className="text-[10px] font-black text-red-400 uppercase mb-1">Out of Stock</p>
                                    <p className="text-2xl font-black text-red-600">{products.filter(p => p.stock === 0).length} Items</p>
                                </div>
                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Low Stock</p>
                                    <p className="text-2xl font-black text-orange-600">{products.filter(p => p.stock > 0 && p.stock < 10).length} Items</p>
                                </div>
                                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Asset Value</p>
                                    <p className="text-2xl font-black text-blue-600">₹{metrics.inventoryValuation.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Product Details</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Stock</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.slice(0, 10).map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-black text-sm text-slate-900">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-600">{p.category}</td>
                                                <td className="px-6 py-4 text-sm font-black tracking-tighter">{p.stock} {p.unit || 'Units'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${p.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600' :
                                                        p.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                                                        }`}>{p.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">₹{(p.price * p.stock).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'profit' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRight className="w-3 h-3 text-emerald-500" /> Income Breakdown
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-100/50">
                                            <span className="text-sm font-bold text-slate-600">Gross Sales</span>
                                            <span className="text-sm font-black text-slate-900">₹{metrics.revenue.toLocaleString()}</span>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-100/50">
                                            <span className="text-sm font-bold text-slate-600">Tax Liabilities</span>
                                            <span className="text-sm font-black text-rose-500">- ₹{metrics.gst.toLocaleString()}</span>
                                        </div>
                                        <div className="p-5 bg-emerald-50 rounded-2xl flex justify-between items-center border border-emerald-100">
                                            <span className="text-sm font-black text-emerald-700 uppercase tracking-tight">Net Revenue</span>
                                            <span className="text-lg font-black text-emerald-700">₹{(metrics.revenue - metrics.gst).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRight className="w-3 h-3 text-rose-500" /> Outflow Breakdown
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-100/50">
                                            <span className="text-sm font-bold text-slate-600">Product COGS</span>
                                            <span className="text-sm font-black text-slate-900">₹{metrics.cogs.toLocaleString()}</span>
                                        </div>

                                        <div className="p-5 bg-rose-50 rounded-2xl flex justify-between items-center border border-rose-100">
                                            <span className="text-sm font-black text-rose-700 uppercase tracking-tight">Total Costs</span>
                                            <span className="text-lg font-black text-rose-700">₹{metrics.cogs.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[32px] border-2 text-center transition-all ${metrics.netProfit >= 0 ? 'bg-emerald-500 border-emerald-400 shadow-xl shadow-emerald-100' : 'bg-rose-500 border-rose-400 shadow-xl shadow-rose-100'
                                }`}>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-center">Final Net Profit/Loss</p>
                                <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter text-center">
                                    {metrics.netProfit < 0 && '-'}₹{Math.abs(metrics.netProfit).toLocaleString()}
                                </h2>
                                <p className="text-white/80 text-xs font-bold mt-4 max-w-md mx-auto">
                                    {metrics.netProfit >= 0
                                        ? "Your business is running in profit. Keep up the great work!"
                                        : "Heads up! Your expenses and COGS exceed your revenue for this period."}
                                </p>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'gst' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 text-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">CGST Collected</p>
                                    <h4 className="text-3xl font-black text-slate-900">₹{(metrics.gst / 2).toLocaleString()}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Central Goods & Service Tax</p>
                                </div>
                                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 text-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">SGST Collected</p>
                                    <h4 className="text-3xl font-black text-slate-900">₹{(metrics.gst / 2).toLocaleString()}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">State Goods & Service Tax</p>
                                </div>
                                <div className="p-8 rounded-3xl bg-slate-900 text-center shadow-xl shadow-slate-200">
                                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3">Total Payable</p>
                                    <h4 className="text-4xl font-black text-white">₹{metrics.gst.toLocaleString()}</h4>
                                    <p className="text-[10px] font-bold text-indigo-300/50 mt-2 tracking-widest italic font-mono">GST REG: {gstConfig.enableIGST ? 'MULTI-STATE' : 'INTRA-STATE'}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-sm font-black text-slate-900 mb-4">GST Configuration Summary</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Default Slab</p>
                                        <p className="text-sm font-black text-slate-700">{gstConfig.defaultRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CGST Status</p>
                                        <p className={`text-sm font-black ${gstConfig.enableCGST ? 'text-emerald-500' : 'text-slate-300'}`}>{gstConfig.enableCGST ? 'ENABLED' : 'DISABLED'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SGST Status</p>
                                        <p className={`text-sm font-black ${gstConfig.enableSGST ? 'text-emerald-500' : 'text-slate-300'}`}>{gstConfig.enableSGST ? 'ENABLED' : 'DISABLED'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Transaction Taxed</p>
                                        <p className="text-sm font-black text-slate-700">{filteredTransactions.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedReport === 'customer' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database</p>
                                        <p className="text-2xl font-black text-slate-900">{customers.length}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                        <ShoppingCart className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Today</p>
                                        <p className="text-2xl font-black text-slate-900">
                                            {new Set(transactions.filter(t => t.date === new Date().toISOString().split('T')[0]).map(t => t.customerId)).size}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <ArrowUp className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total LTV</p>
                                        <p className="text-2xl font-black text-slate-900">₹{customers.reduce((s, c) => s + (c.totalPaid || 0), 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                                        <ArrowDown className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Credit</p>
                                        <p className="text-2xl font-black text-slate-900">₹{customers.reduce((s, c) => s + (c.pending || 0), 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Customer Name</th>
                                            <th className="px-6 py-4">Total Purchases</th>
                                            <th className="px-6 py-4">Outstanding</th>
                                            <th className="px-6 py-4">Last Visit</th>
                                            <th className="px-6 py-4 text-right">Loyalty Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {customers.sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0)).slice(0, 5).map((c, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                                                        {c.name?.charAt(0) || 'C'}
                                                    </div>
                                                    <span className="font-black text-sm text-slate-900">{c.name}</span>
                                                </td>
                                                <td className="px-6 py-4 font-black text-slate-900 text-sm">₹{(c.totalPaid || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-xs font-black text-rose-500">₹{(c.pending || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.lastTransaction || 'Never'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black">
                                                        {Math.floor((c.totalPaid || 0) / 100)} PTS
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
