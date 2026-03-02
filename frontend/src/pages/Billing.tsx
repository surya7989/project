import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, CheckCircle2, CreditCard, Smartphone, Receipt, Coins, X, ChevronRight, LayoutGrid, LayoutList, Building2, ArrowLeftRight, User as UserIcon, Phone, Printer, Send, Copy, Calendar, ArrowLeft, HelpCircle, ShieldCheck, MapPin, Mail, Lock as LockIcon, Loader2, RefreshCw, UserPlus, UserCheck } from 'lucide-react';
import { Product, CartItem, PaymentMethod, Transaction, User, Customer } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { api } from '../services/api';
import ThemedInvoice from '../components/ThemedInvoice';
import Portal from '../components/Portal';
import CartItemCard from '../components/billing/CartItemCard';

interface BillingProps {
    products: Product[];
    customers?: Customer[];
    onSaleSuccess: (cart: CartItem[], total: number, gstAmount: number, customerName?: string, customerPhone?: string, address?: string, source?: 'online' | 'offline', paidAmount?: number, method?: PaymentMethod) => void;
    user?: User | null;
    onRefresh?: () => Promise<void>;
}

const Billing: React.FC<BillingProps> = ({ products, customers = [], onSaleSuccess, user, onRefresh }) => {
    const permissionLevel = (user?.role === 'Super Admin') ? 'manage' : (user?.permissions?.['billing'] || 'none');
    const isReadOnly = permissionLevel === 'read';
    const canCreateInvoices = permissionLevel === 'manage' || permissionLevel === 'cru';
    const canManageInvoices = permissionLevel === 'manage' || permissionLevel === 'cru';
    const [gstConfig] = useLocalStorage('nx_gst_config', {
        defaultRate: '18',
        enableCGST: true,
        enableSGST: true,
        enableIGST: false,
        taxInclusive: false,
    });

    const [cart, setCart] = useState<CartItem[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMode, setPaymentMode] = useState<PaymentMethod>('cash');
    const [isSuccess, setIsSuccess] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCart, setShowCart] = useState(false);
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [cashReceived, setCashReceived] = useState<number>(0);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [txnInfo, setTxnInfo] = useState<{ id: string; date: string; methodLabel: string } | null>(null);
    const [sendingReceipt, setSendingReceipt] = useState(false);
    const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
    const [refreshing, setRefreshing] = useState(false);
    // Customer lookup
    const [customerSearchInput, setCustomerSearchInput] = useState('');
    const [phoneLookupDone, setPhoneLookupDone] = useState(false);
    const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Search customers by phone or name (partial match)
    const customerMatches = useMemo(() => {
        const input = customerSearchInput.trim().toLowerCase();
        if (input.length < 3) return [];
        return customers.filter(c =>
            (c.phone && c.phone.includes(input)) ||
            (c.name && c.name.toLowerCase().includes(input))
        ).filter(c => c.id !== 'WALK-IN').slice(0, 5);
    }, [customerSearchInput, customers]);

    // Invoice Theme & Profile
    const [adminProfile] = useLocalStorage('inv_admin_profile', {
        businessName: 'My Store',
        address: 'Business Address',
        phone: '',
        email: '',
        avatar: ''
    });
    const [invoiceTheme] = useLocalStorage('nx_invoice_theme', 'vy_classic');
    const [invoiceConfig] = useLocalStorage('nx_invoice_config', {
        showLogo: true,
        showGST: true,
        showTerms: true,
        termsText: 'Payment is due within 30 days.',
        footerText: 'Thank you for your business!'
    });

    const invoiceThemes: Record<string, { primary: string; accent: string }> = {
        vy_classic: { primary: '#0EA5E9', accent: '#38BDF8' },
        vy_stylish: { primary: '#701A75', accent: '#D946EF' },
        vy_elegant: { primary: '#7F1D1D', accent: '#EF4444' },
        vy_pro: { primary: '#111827', accent: '#F59E0B' },
        vy_business: { primary: '#064E3B', accent: '#10B981' },
        vy_minimal: { primary: '#334155', accent: '#64748B' },
    };

    const activeTheme = invoiceThemes[invoiceTheme] || invoiceThemes.vy_classic;

    const handlePrint = () => {
        window.print();
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;
        setCart(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                if (exists.quantity >= product.stock) return prev;
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setShowCart(true);
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const nextQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: nextQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

    // Per-item Tax calculation logic
    const cartTaxes = cart.map(item => {
        const qty = item.quantity;
        const price = item.price;
        const rate = item.gstRate || 0;
        const isInclusive = item.taxType === 'Inclusive';

        const lineTotal = price * qty;
        let tax = 0;
        let base = 0;

        if (isInclusive) {
            base = lineTotal / (1 + rate / 100);
            tax = lineTotal - base;
        } else {
            base = lineTotal;
            tax = (lineTotal * rate) / 100;
        }

        return { tax, total: isInclusive ? lineTotal : lineTotal + tax };
    });

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalGSTAmount = cartTaxes.reduce((acc, curr) => acc + curr.tax, 0);
    const calculatedGrandTotal = cartTaxes.reduce((acc, curr) => acc + curr.total, 0);

    const cgstValue = gstConfig.enableCGST ?? true;
    const sgstValue = gstConfig.enableSGST ?? true;
    const igstValue = gstConfig.enableIGST ?? false;

    const cgst = cgstValue ? totalGSTAmount / 2 : 0;
    const sgst = sgstValue ? totalGSTAmount / 2 : 0;
    const igst = igstValue ? totalGSTAmount : 0;

    const finalGST = igstValue ? igst : (cgst + sgst);
    const grandTotal = Math.max(0, calculatedGrandTotal - couponDiscount);

    const applyCoupon = () => {
        const code = couponCode.toUpperCase().trim();
        if (code === 'WELCOME10') {
            setCouponDiscount(Math.round((subtotal + finalGST) * 0.1));
        } else if (code === 'SAVE100') {
            setCouponDiscount(100);
        } else if (code === '') {
            setCouponDiscount(0);
        } else {
            // If it's a number, apply as fixed coupon amount
            const val = parseFloat(code);
            if (!isNaN(val)) setCouponDiscount(val);
        }
    };

    const handleProceedToPayment = () => {
        setShowCustomerInfo(true);
    };

    const handleCustomerInfoSubmit = () => {
        setShowCustomerInfo(false);
        setShowPayment(true);
        setCashReceived(grandTotal);
    };

    const handlePhoneSelect = (c: Customer) => {
        setMatchedCustomer(c);
        setPhoneLookupDone(true);
        setIsNewCustomer(false);
        setCustomerName(c.name);
        setCustomerPhone(c.phone);
        setCustomerSearchInput(c.phone);
    };

    const handleSearchLookup = () => {
        const input = customerSearchInput.trim();
        const exact = customers.find(c => (c.phone === input || c.name.toLowerCase() === input.toLowerCase()) && c.id !== 'WALK-IN');
        if (exact) {
            handlePhoneSelect(exact);
        } else {
            setPhoneLookupDone(true);
            const isPotentialPhone = /^[0-9]{10}$/.test(input);
            if (isPotentialPhone) {
                setIsNewCustomer(true);
                setMatchedCustomer(null);
                setCustomerPhone(input);
                setCustomerName('');
            } else {
                setIsNewCustomer(true);
                setMatchedCustomer(null);
                setCustomerPhone('');
                setCustomerName(input);
            }
        }
    };

    const handleRefresh = async () => {
        if (!onRefresh || refreshing) return;
        setRefreshing(true);
        try { await onRefresh(); } finally { setTimeout(() => setRefreshing(false), 600); }
    };

    const handleCheckout = () => {
        const now = new Date();
        const info = {
            id: `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
            date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' | ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            methodLabel: paymentMode === 'cash' ? 'Offline - Cash' : paymentMode === 'upi' ? 'Online - UPI' : paymentMode === 'card' ? 'Online - Card' : paymentMode === 'bank_transfer' ? 'Online - Bank' : 'Online - Split'
        };
        setTxnInfo(info);
        setIsSuccess(true);
        // Pass cashReceived as paidAmount and actual paymentMode to track correctly
        onSaleSuccess(cart, grandTotal, finalGST, customerName, customerPhone, '', 'offline', cashReceived, paymentMode);
    };

    const resetBilling = () => {
        setIsSuccess(false);
        setShowPayment(false);
        setCart([]);
        setShowCart(false);
        setCustomerName('');
        setCustomerPhone('');
        setCashReceived(0);
        setCouponCode('');
        setCouponDiscount(0);
        setTxnInfo(null);
        setSendingReceipt(false);
        setSendStatus('idle');
        setCustomerSearchInput('');
        setPhoneLookupDone(false);
        setMatchedCustomer(null);
        setIsNewCustomer(false);
    };

    const handleSendReceipt = async () => {
        if (!customerPhone || !txnInfo) return;
        setSendingReceipt(true);
        setSendStatus('idle');
        try {
            const billData = {
                invoiceNumber: txnInfo.id,
                id: txnInfo.id,
                date: new Date().toISOString(),
                customerName: customerName || 'Walk-in Customer',
                customerPhone: customerPhone,
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    gstRate: item.gstRate || 0,
                    taxType: item.taxType || 'Exclusive',
                    hsnCode: (item as any).hsnCode || '',
                    unit: (item as any).unit || 'NOS',
                })),
                grandTotal: grandTotal,
                total: grandTotal,
                gstAmount: finalGST,
                paymentMode: paymentMode,
            };

            const shopSettings = {
                shopName: adminProfile.businessName || 'My Store',
                address: adminProfile.address || '',
                phone: adminProfile.phone || '',
                email: adminProfile.email || '',
            };

            await api.invoices.sendWhatsApp(billData, shopSettings, 'a4');
            setSendStatus('sent');
        } catch (err) {
            console.error('Send receipt error:', err);
            setSendStatus('error');
        } finally {
            setSendingReceipt(false);
        }
    };

    return (
        <div className="flex h-full gap-4 lg:gap-6 relative">
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Search & Actions */}
                <div className="bg-white p-3 lg:p-4 rounded border border-slate-100 shadow-sm flex items-center justify-between mb-4 lg:mb-6">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, SKU or barcode"
                            className="w-full pl-12 pr-4 py-2.5 lg:py-3 bg-slate-50 border-none rounded-sm text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2 lg:space-x-3 ml-2 lg:ml-4">
                        <div className="flex bg-slate-100 p-1 rounded-sm">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-sm ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-sm ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-400'}`}><LayoutList className="w-3.5 h-3.5" /></button>
                        </div>
                        {/* Mobile cart toggle button */}
                        <button
                            onClick={() => setShowCart(!showCart)}
                            className="lg:hidden relative p-2 bg-blue-600 text-white rounded-sm"
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {isReadOnly && (
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 mb-6">
                        <div className="bg-orange-600 p-1.5 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-orange-900 uppercase">Billing Locked (Read Only)</p>
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">You can browse items but cannot create new invoices</p>
                        </div>
                    </div>
                )}

                {/* Product Display Area */}
                <div className="flex-1 overflow-y-auto pr-2 vyapar-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                            {filteredProducts.map(p => (
                                <div key={p.id} className="bg-white p-3 lg:p-4 rounded border border-slate-100 shadow-sm relative group cursor-pointer hover:border-blue-500 transition-all">
                                    <div className="aspect-square bg-slate-50 rounded-sm mb-3 lg:mb-4 overflow-hidden relative flex items-center justify-center">
                                        {p.image ? (
                                            <img
                                                src={p.image}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                alt={p.name}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-600 font-black text-4xl">
                                                {p.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <span className={`absolute top-2 right-2 px-2 py-1 rounded-sm text-[10px] font-black uppercase ${p.status === 'In Stock' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                            }`}>{p.status}</span>
                                    </div>
                                    <h4 className="font-black text-slate-900 text-sm mb-1">{p.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-lg font-black text-slate-900">₹{p.price}</p>
                                                {p.mrp > p.price && (
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[10px] text-slate-400 line-through font-bold">₹{p.mrp}</p>
                                                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-black">
                                                            {(((p.mrp - p.price) / p.mrp) * 100).toFixed(1)}% OFF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Stock: {p.stock}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <ShieldCheck className="w-2.5 h-2.5 text-slate-300" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                    {p.gstRate}% {p.taxType} Tax
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            disabled={isReadOnly}
                                            onClick={() => addToCart(p)}
                                            className={`p-2 rounded-sm shadow-lg ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white shadow-sky-100'}`}
                                        >
                                            {isReadOnly ? <LockIcon className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded border border-slate-100 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-4">Product</th>
                                        <th className="px-4 lg:px-6 py-4 hidden sm:table-cell">Category</th>
                                        <th className="px-4 lg:px-6 py-4">Price</th>
                                        <th className="px-4 lg:px-6 py-4 hidden md:table-cell">Status</th>
                                        <th className="px-4 lg:px-6 py-4">Stock</th>
                                        <th className="px-4 lg:px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 lg:px-6 py-4 flex items-center space-x-3">
                                                {p.image ? (
                                                    <img src={p.image} className="w-10 h-10 rounded-sm object-cover" alt={p.name} />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-blue-50 text-blue-600 font-black text-lg">
                                                        {p.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <span className="font-black text-sm">{p.name}</span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 text-xs font-bold text-slate-500 hidden sm:table-cell">{p.category}</td>
                                            <td className="px-4 lg:px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-slate-900">₹{p.price}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{p.gstRate}% {p.taxType}</span>
                                                    {p.mrp > p.price && (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 line-through font-bold">₹{p.mrp}</span>
                                                            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 rounded-full font-black">
                                                                {(((p.mrp - p.price) / p.mrp) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'In Stock' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>{p.status}</span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 font-black">{p.stock}</td>
                                            <td className="px-4 lg:px-6 py-4">
                                                <button
                                                    disabled={isReadOnly}
                                                    onClick={() => addToCart(p)}
                                                    className={`p-2 rounded-sm ${isReadOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                                                >
                                                    {isReadOnly ? <LockIcon className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Summary Sidebar - responsive */}
            {/* Mobile overlay */}
            {showCart && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowCart(false)} />}
            <div className={`
        fixed lg:static inset-y-0 right-0 z-50
        w-[320px] lg:w-[380px] xl:w-[400px] bg-white rounded-l-[32px] lg:rounded-[32px] border border-slate-100 shadow-xl flex flex-col shrink-0 overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Bill Summary</h3>
                    <div className="flex items-center space-x-3">
                        {canManageInvoices && <button onClick={() => setCart([])} className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline">Clear All</button>}
                        <button onClick={() => setShowCart(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Receipt className="w-16 h-16 mb-4" />
                            <p className="font-black text-sm">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                onUpdateQty={updateQty}
                                onRemove={removeFromCart}
                            />
                        ))
                    )}
                </div>

                <div className="p-4 lg:p-8 bg-slate-50 border-t border-slate-100 space-y-4 lg:space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Coupon Code"
                                className="flex-1 px-3 lg:px-4 py-2.5 lg:py-3 bg-white border border-slate-200 rounded-sm text-sm outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={applyCoupon}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-sm font-black text-sm transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                        <div className="space-y-2 border-t border-slate-200 pt-4 text-xs font-bold text-slate-500">
                            <div className="flex justify-between"><span>Subtotal (Net)</span><span className="text-slate-900">₹{((calculatedGrandTotal || 0) - (finalGST || 0)).toLocaleString()}</span></div>
                            {cgstValue && (
                                <div className="flex justify-between"><span>CGST (Split)</span><span className="text-slate-900">₹{cgst.toLocaleString()}</span></div>
                            )}
                            {sgstValue && (
                                <div className="flex justify-between"><span>SGST (Split)</span><span className="text-slate-900">₹{sgst.toLocaleString()}</span></div>
                            )}
                            {igstValue && (
                                <div className="flex justify-between"><span>IGST Total</span><span className="text-slate-900">₹{igst.toLocaleString()}</span></div>
                            )}
                            <div className="flex justify-between border-t border-slate-100 pt-1 text-slate-900"><span>Weighted Tax Total</span><span>₹{finalGST.toLocaleString()}</span></div>
                            {couponDiscount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount</span>
                                    <span>-₹{(couponDiscount || 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-lg lg:text-xl font-black text-slate-900">Grand Total</span>
                            <span className="text-2xl lg:text-3xl font-black text-slate-900">₹{(grandTotal || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        disabled={cart.length === 0 || isReadOnly}
                        onClick={handleProceedToPayment}
                        className={`w-full font-black py-4 lg:py-5 rounded flex items-center justify-center space-x-3 shadow-xl transition-all ${isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-[#10B981] hover:bg-[#059669] text-white'
                            }`}
                    >
                        {isReadOnly ? <LockIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                        <span>{isReadOnly ? 'Billing Restricted' : 'Proceed to Payment'}</span>
                    </button>
                </div>
            </div>
            {/* Improved Customer Info Modal */}
            {showCustomerInfo && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 lg:p-6">
                        <div className="bg-white rounded w-full max-w-md shadow-2xl overflow-hidden relative">
                            {/* Close Button */}
                            <button
                                onClick={() => { setShowCustomerInfo(false); setCustomerSearchInput(''); setMatchedCustomer(null); setIsNewCustomer(false); }}
                                className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-sm transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/20 rounded flex items-center justify-center mb-4">
                                    <Phone className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white">Customer Details</h2>
                                <p className="text-blue-200 text-sm font-medium mt-1">Associate this sale with a customer</p>
                            </div>

                            {/* Form */}
                            <div className="p-6 lg:p-8 space-y-6">

                                {/* Search Bar */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Search Existing Customer
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={customerSearchInput}
                                            onChange={(e) => setCustomerSearchInput(e.target.value)}
                                            placeholder="Find by name or 10-digit mobile"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-sm text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all font-black"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Suggestions dropdown */}
                                    {customerSearchInput.length >= 3 && customerMatches.length > 0 && (
                                        <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                            <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Suggestions</p>
                                            {customerMatches.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setMatchedCustomer(c);
                                                        setCustomerName(c.name);
                                                        setCustomerPhone(c.phone);
                                                        setCustomerSearchInput('');
                                                        setIsNewCustomer(false);
                                                    }}
                                                    className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                        <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-black text-slate-800 truncate">{c.name}</p>
                                                        <p className="text-xs font-bold text-slate-400">{c.phone}</p>
                                                    </div>
                                                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 ml-auto" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2">
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Customer Info</span>
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                            {matchedCustomer ? 'Matched Name' : 'Customer Name *'}
                                        </label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => { setCustomerName(e.target.value); if (matchedCustomer) setMatchedCustomer(null); }}
                                                placeholder="Enter customer name"
                                                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-sm text-[13px] font-black outline-none transition-all ${matchedCustomer ? 'bg-green-50 border-green-100 text-green-900' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                            {matchedCustomer ? 'Matched Mobile' : 'Mobile Number *'}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="tel"
                                                value={customerPhone}
                                                onChange={(e) => { setCustomerPhone(e.target.value.replace(/[^0-9]/g, '')); if (matchedCustomer) setMatchedCustomer(null); }}
                                                placeholder="Enter 10-digit mobile number"
                                                maxLength={10}
                                                className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-sm text-[13px] font-black outline-none transition-all ${matchedCustomer ? 'bg-green-50 border-green-100 text-green-900' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bill Amount Preview */}
                                <div className="p-4 bg-blue-50 rounded-sm border border-blue-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-blue-700">Total Bill Amount</span>
                                    <span className="text-xl font-black text-blue-700">₹{(grandTotal || 0).toLocaleString()}</span>
                                </div>

                                {/* Continue Button */}
                                <button
                                    onClick={handleCustomerInfoSubmit}
                                    disabled={(customerName.trim() === '' && customerPhone.trim() !== '') || (customerPhone.trim() !== '' && customerPhone.length < 10)}
                                    className={`w-full font-black py-4 rounded-sm flex items-center justify-center space-x-3 shadow-lg transition-all text-sm ${((customerName.trim() === '' && customerPhone.trim() !== '') || (customerPhone.trim() !== '' && customerPhone.length < 10))
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-green-200/50'
                                        }`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Proceed to Payment</span>
                                </button>

                                {/* Skip Option */}
                                <button
                                    onClick={() => {
                                        setCustomerName('');
                                        setCustomerPhone('');
                                        setShowCustomerInfo(false);
                                        setShowPayment(true);
                                        setCashReceived(grandTotal);
                                    }}
                                    className="w-full text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest py-2 transition-colors text-center"
                                >
                                    Skip — Continue as Walk-in
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 lg:p-6">
                        <div className="bg-white rounded lg:rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setShowPayment(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-sm transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Sidebar for Payment Methods */}
                            <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 lg:p-8 space-y-2 lg:space-y-4 flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
                                <h3 className="hidden lg:block text-lg font-black text-slate-900 mb-4 lg:mb-8">Select Payment</h3>
                                {[
                                    { id: 'cash', label: 'Offline (Cash)', icon: Coins },
                                    { id: 'upi', label: 'Online (UPI)', icon: Smartphone },
                                    { id: 'card', label: 'Online (Card)', icon: CreditCard },
                                    { id: 'split', label: 'Online (Split)', icon: ArrowLeftRight },
                                    { id: 'bank_transfer', label: 'Online (Bank)', icon: Building2 },
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMode(method.id as PaymentMethod)}
                                        className={`flex-shrink-0 lg:w-full flex items-center justify-between p-3 lg:p-5 rounded-sm lg:rounded border-2 transition-all ${paymentMode === method.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3 lg:space-x-4">
                                            <method.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                            <span className="font-black text-xs lg:text-sm">{method.label}</span>
                                        </div>
                                        <ChevronRight className="w-3 h-3 hidden lg:block" />
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Content */}
                            <div className="flex-1 p-6 lg:p-12 bg-white flex flex-col overflow-y-auto">
                                <div className="flex-1">
                                    {paymentMode === 'cash' && (
                                        <div className="space-y-6 lg:space-y-8">
                                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900">Cash Payment</h2>
                                            <div className="space-y-4">
                                                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest">Cash Received</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl lg:text-2xl font-black text-slate-300">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={cashReceived || ''}
                                                        onChange={(e) => setCashReceived(Number(e.target.value))}
                                                        className="w-full pl-12 pr-6 py-4 lg:py-6 bg-slate-50 border-2 border-slate-100 rounded lg:rounded text-2xl lg:text-3xl font-black outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-sm border border-blue-100 flex justify-between items-center">
                                                <span className="text-sm font-bold text-blue-700">Bill Amount</span>
                                                <span className="text-xl font-black text-blue-700">₹{grandTotal.toLocaleString()}</span>
                                            </div>
                                            <div className={`p-6 lg:p-8 rounded lg:rounded-[32px] border ${cashReceived >= grandTotal ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <p className="text-slate-500 text-sm font-bold uppercase mb-2">Change to Return</p>
                                                <p className={`text-3xl lg:text-4xl font-black ${cashReceived >= grandTotal ? 'text-green-600' : 'text-slate-900'}`}>
                                                    ₹ {cashReceived >= (grandTotal || 0) ? ((cashReceived || 0) - (grandTotal || 0)).toLocaleString() : '0'}
                                                </p>
                                                {cashReceived > 0 && cashReceived < grandTotal && (
                                                    <p className="text-sm font-bold text-red-500 mt-2">₹{(grandTotal - cashReceived).toLocaleString()} more needed</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {paymentMode === 'upi' && (
                                        <div className="space-y-6 lg:space-y-8">
                                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900">UPI Payment</h2>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map(app => (
                                                    <div key={app} className="p-4 lg:p-5 border-2 border-slate-100 rounded flex items-center space-x-3 lg:space-x-4 cursor-pointer hover:border-blue-600 transition-all">
                                                        <div className="w-8 lg:w-10 h-8 lg:h-10 bg-slate-50 rounded-sm"></div>
                                                        <span className="font-bold text-slate-900 text-sm">{app}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <input type="text" placeholder="user@upi or 9876543210" className="w-full px-6 py-4 lg:py-5 bg-slate-50 border-2 border-slate-100 rounded lg:rounded text-base lg:text-lg font-bold outline-none" />
                                        </div>
                                    )}

                                    {paymentMode === 'card' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900">Card Payment</h2>
                                            <div className="space-y-4">
                                                <input placeholder="1234 5678 9012 3456" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                                <input placeholder="Card Holder Name" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input placeholder="MM/YY" className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                                    <input placeholder="CVV" className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMode === 'split' && (
                                        <div className="space-y-6 lg:space-y-8">
                                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900">Split Payment</h2>
                                            <p className="text-sm text-slate-400 font-bold">Split the total amount across multiple payment methods</p>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cash Amount</label>
                                                    <input type="number" placeholder="0" className="w-full mt-2 px-4 py-3 bg-white border border-slate-200 rounded-sm text-lg font-black outline-none" />
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">UPI / Card Amount</label>
                                                    <input type="number" placeholder="0" className="w-full mt-2 px-4 py-3 bg-white border border-slate-200 rounded-sm text-lg font-black outline-none" />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                                <p className="text-sm font-bold text-blue-600">Total: ₹{(grandTotal || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMode === 'bank_transfer' && (
                                        <div className="space-y-6 lg:space-y-8">
                                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900">Bank Transfer</h2>
                                            <div className="space-y-4">
                                                <input placeholder="Account Number" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                                <input placeholder="IFSC Code" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                                <input placeholder="Account Holder Name" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded text-base lg:text-lg font-bold outline-none" />
                                            </div>
                                            <div className="p-4 bg-green-50 rounded border border-green-100">
                                                <p className="text-sm font-bold text-green-600">Amount: ₹{grandTotal.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 lg:mt-8">
                                    <button onClick={handleCheckout} className="w-full bg-[#10B981] text-white py-4 lg:py-6 rounded lg:rounded-[32px] text-lg lg:text-2xl font-black shadow-xl hover:bg-[#059669] transition-all">
                                        {isSuccess ? '✅ Payment Successful!' : `Confirm ${paymentMode.replace('_', ' ')} Payment`}
                                    </button>
                                    <p className="text-center text-xs text-slate-400 font-bold mt-4 uppercase tracking-[0.2em]">Secured by 256-bit SSL Encryption</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
            {/* Payment Success Screen */}
            {isSuccess && txnInfo && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Green Header */}
                            <div className="bg-[#10B981] p-10 flex flex-col items-center text-white text-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 border-4 border-white/20">
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-3xl font-black mb-2">Payment Successful</h2>
                                <p className="text-white/80 font-bold opacity-90">Your transaction has been completed successfully</p>
                            </div>

                            {/* Amount Display */}
                            <div className="p-8 lg:p-10 flex flex-col items-center border-b border-slate-50">
                                <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">Amount Paid</p>
                                <h1 className="text-5xl font-black text-slate-900">₹{(paymentMode === 'cash' ? (cashReceived || 0) : (grandTotal || 0)).toLocaleString()}</h1>
                            </div>

                            {/* Transaction Details */}
                            <div className="p-8 lg:p-10 space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-50 rounded flex items-center justify-center">
                                        <Receipt className="w-3.5 h-3.5 text-[#10B981]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                                        <p className="font-black text-slate-900">{txnInfo.methodLabel}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded flex items-center justify-center">
                                        <span className="text-blue-600 font-black text-xs">#</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</p>
                                        <p className="font-black text-slate-900">{txnInfo.id}</p>
                                    </div>
                                    <button className="p-2 hover:bg-slate-100 rounded-sm transition-colors">
                                        <Copy className="w-3 h-3 text-slate-400" />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                                        <p className="font-black text-slate-900">{txnInfo.date}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 space-y-4">
                                    <button
                                        onClick={resetBilling}
                                        className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded font-black flex items-center justify-center space-x-3 shadow-lg shadow-green-100 transition-all active:scale-95"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5 text-white" />
                                        <span>Back to Billing Dashboard</span>
                                    </button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center justify-center space-x-2 py-4 px-4 bg-white border-2 border-slate-100 rounded font-black text-slate-600 hover:bg-slate-50 transition-all text-sm"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Print Invoice</span>
                                        </button>
                                        <button
                                            onClick={handleSendReceipt}
                                            disabled={!customerPhone || sendingReceipt}
                                            className={`flex items-center justify-center space-x-2 py-4 px-4 rounded font-black transition-all text-sm ${sendStatus === 'sent'
                                                ? 'bg-green-50 border-2 border-green-200 text-green-600'
                                                : sendStatus === 'error'
                                                    ? 'bg-red-50 border-2 border-red-200 text-red-600'
                                                    : !customerPhone
                                                        ? 'bg-slate-50 border-2 border-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-white border-2 border-slate-100 text-slate-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600'
                                                }`}
                                        >
                                            {sendingReceipt ? (
                                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Sending...</span></>
                                            ) : sendStatus === 'sent' ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5" /><span>Sent via WhatsApp!</span></>
                                            ) : sendStatus === 'error' ? (
                                                <><X className="w-3.5 h-3.5" /><span>Failed — Retry</span></>
                                            ) : (
                                                <><div className="-rotate-45"><Send className="w-3.5 h-3.5" /></div><span>{customerPhone ? 'Send via WhatsApp' : 'No Phone Number'}</span></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Help Link */}
                            <div className="p-8 pt-0 flex flex-col items-center">
                                <p className="text-xs font-bold text-slate-400 mb-2">Need help with this transaction?</p>
                                <button className="flex items-center space-x-2 text-[#10B981] font-black text-sm hover:underline">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span>Contact Support</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
            {/* Printable Invoice Component (Hidden from UI, visible only to @media print) */}
            <div id="printable-invoice" className="print-only p-8 bg-white min-h-screen text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>

                <ThemedInvoice
                    adminProfile={adminProfile}
                    invoiceTheme={invoiceTheme}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    txnInfo={txnInfo}
                    cart={cart}
                    finalGST={finalGST}
                    calculatedGrandTotal={calculatedGrandTotal}
                    grandTotal={grandTotal}
                    couponDiscount={couponDiscount}
                />
            </div>
        </div>
    );
};

export default Billing;


