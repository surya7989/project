import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Admin layout
import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';

// Lazy load Admin pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Vendors = React.lazy(() => import('./pages/Vendors'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/settings/Settings'));
const OnlineStore = React.lazy(() => import('./pages/OnlineStore'));
const Storefront = React.lazy(() => import('./pages/Storefront'));
const Login = React.lazy(() => import('./pages/Login'));
const AdminAccess = React.lazy(() => import('./pages/AdminAccess'));

// Public storefront
const StorefrontPage = React.lazy(() => import('./pages/StorefrontPage'));

import { useSessionStorage } from './hooks/useSessionStorage';
import { Globe, Lock, ArrowLeft } from 'lucide-react';

import { Page, Product, Customer, Vendor, CartItem, Transaction, PurchaseOrder, User, OrderStatus, PaymentMethod } from './types';
import { DEFAULT_PRODUCTS, DEFAULT_CUSTOMERS, DEFAULT_VENDORS } from './data/mockData';

import { useLocalStorage } from './hooks/useLocalStorage';
import { api } from './services/api';

import { useApp } from './context/AppContext';

// =============================================
// ADMIN PANEL — mounted at /admin/*
// =============================================
const AdminPanel: React.FC = () => {
    const {
        products, setProducts, customers, setCustomers, vendors, setVendors,
        transactions, setTransactions, purchases, setPurchases,
        currentUser, setCurrentUser, page, setPage, dataLoaded, loadData,
        handleLogout, handleLogin
    } = useApp();

    const [previewCart, setPreviewCart] = useState<{ id: string; qty: number }[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const [settingsValue] = useLocalStorage('nx_store_settings', {
        name: 'NEXA Store',
        domain: 'shop.nexapos.com',
        currency: 'INR (₹) - Indian Rupee',
        minOrder: '499',
        isOnline: true
    });

    const storeSettings = settingsValue || { name: 'NEXA Store', isOnline: true };

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('view_creds') || params.has('login_email')) {
            handleLogout();
        }
    }, [handleLogout]);

    useEffect(() => {
        document.title = `${currentUser?.name || 'NEXA'} POS - Inventory Control`;
    }, [currentUser]);

    const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

    // SALE HANDLER — simplified wrapper
    const handleSaleWrapper = async (
        cart: CartItem[],
        total: number,
        gstAmount: number,
        custName?: string,
        custPhone?: string,
        custAddress?: string,
        source: 'online' | 'offline' = 'offline',
        paid?: number,
        method?: PaymentMethod
    ) => {
        // Stock update
        const updatedProducts = products.map(p => {
            const sold = cart.find((c: any) => c.id === p.id);
            if (!sold) return p;
            const quantity = sold.quantity || (sold as any).qty || 0;
            const newStock = Math.max(0, p.stock - quantity);
            return {
                ...p,
                stock: newStock,
                status: (newStock === 0 ? 'Out of Stock' : newStock < 10 ? 'Low Stock' : 'In Stock') as Product['status'],
            };
        });
        setProducts(updatedProducts);

        // Persist stock update
        const stockUpdates = cart.map(item => {
            const currentProduct = products.find(p => p.id === item.id);
            const quantity = item.quantity || (item as any).qty || 0;
            const newStock = Math.max(0, (currentProduct?.stock || 0) - quantity);
            return {
                id: item.id,
                stock: newStock,
                status: (newStock === 0 ? 'Out of Stock' : newStock < 10 ? 'Low Stock' : 'In Stock') as Product['status']
            };
        });
        api.products.bulkUpdate(stockUpdates).catch(err => console.error('Stock sync error:', err));

        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Customer Logic
        const actualPaid = paid !== undefined ? Number(paid) : total;
        const pendingAmount = Math.max(0, total - actualPaid);
        const txnStatus = actualPaid >= total ? 'Paid' : actualPaid > 0 ? 'Partial' : 'Unpaid';

        let finalCustId = 'WALK-IN';
        if ((custName && custName.trim()) || (custPhone && custPhone.trim())) {
            const phone = custPhone?.trim() || '';
            const existingCustomer = phone !== '' ? customers.find(c => c.phone === phone) : null;
            finalCustId = existingCustomer ? existingCustomer.id : `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const nameToUse = (custName && custName.trim()) || (existingCustomer?.name) || `Customer +91${phone}`;

            if (existingCustomer) {
                const updatedCust: Customer = {
                    ...existingCustomer,
                    name: nameToUse,
                    totalInvoices: (existingCustomer.totalInvoices || 0) + 1,
                    totalPaid: (existingCustomer.totalPaid || 0) + actualPaid,
                    pending: (existingCustomer.pending || 0) + pendingAmount,
                    status: (existingCustomer.pending || 0) + pendingAmount > 0 ? 'Partial' : 'Paid',
                    channel: existingCustomer.channel === 'offline' && source === 'online' ? 'both' : (existingCustomer.channel || source)
                };
                setCustomers(prev => prev.map(c => c.id === existingCustomer.id ? updatedCust : c));
                api.customers.update(existingCustomer.id, updatedCust).catch(err => console.error('Customer update sync error:', err));
            } else {
                const newCustomer: Customer = {
                    id: finalCustId, name: nameToUse, email: '', phone,
                    totalPaid: actualPaid,
                    pending: pendingAmount,
                    status: pendingAmount > 0 ? 'Partial' : 'Paid',
                    lastTransaction: localDate, totalInvoices: 1, address: custAddress || '',
                    channel: source
                };
                setCustomers(prev => [...prev, newCustomer]);
                api.customers.create(newCustomer).catch(err => console.error('Customer create sync error:', err));
            }
        }

        // Transaction
        const newTxn: Transaction = {
            id: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
            customerId: finalCustId,
            items: [...cart],
            total,
            paidAmount: actualPaid,
            gstAmount,
            date: localDate,
            method: (method as PaymentMethod) || 'cash',
            status: txnStatus,
            source,
            orderStatus: source === 'online' ? 'Pending' : undefined
        };
        setTransactions(prev => [newTxn, ...prev]);

        try { await api.transactions.create(newTxn); } catch (err) { console.error('Sale sync error:', err); }
    };

    const updateOrderStatus = async (txnId: string, newStatus: OrderStatus) => {
        setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, orderStatus: newStatus } : t));
        api.transactions.update(txnId, { orderStatus: newStatus }).catch(err => console.error('Order status sync error:', err));
    };

    const handleDeleteCustomer = async (id: string) => {
        if (!window.confirm('Delete customer?')) return;
        setCustomers(prev => prev.filter(c => c.id !== id));
        api.customers.delete(id).catch(err => console.error('Customer delete error:', err));
    };

    if (page === 'login' || !currentUser) return <Login onLogin={handleLogin} />;
    if (!dataLoaded) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FC]">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-500 font-bold text-lg">Loading secure session...</p>
        </div>
    );

    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <Dashboard
                    onNavigateBilling={() => setPage('billing')}
                    onVisitStore={() => window.open('/', '_blank')}
                    stats={{ inventoryValue, lowStockCount }}
                    products={products} customers={customers} vendors={vendors} transactions={transactions} purchases={purchases} user={currentUser} onRefresh={loadData}
                />;
            case 'billing':
                return <Billing user={currentUser} products={products} customers={customers} onSaleSuccess={handleSaleWrapper} onRefresh={loadData} />;
            case 'inventory':
                return <Inventory user={currentUser} products={products} onUpdate={setProducts} onRefresh={loadData} />;
            case 'customers':
                return <Customers user={currentUser} customers={customers} transactions={transactions} onUpdate={setCustomers} onUpdateTransactions={setTransactions} onDelete={handleDeleteCustomer} onRefresh={loadData} />;
            case 'vendors':
                return <Vendors user={currentUser} vendors={vendors} purchases={purchases} onUpdate={setVendors} onDelete={(id) => setVendors(prev => prev.filter(v => v.id !== id))} onRefresh={loadData} />;
            case 'analytics':
                return <Analytics user={currentUser} products={products} customers={customers} vendors={vendors} transactions={transactions} onRefresh={loadData} />;
            case 'settings':
                return <Settings user={currentUser} />;
            case 'online-store':
                return <OnlineStore
                    user={currentUser} onVisitStore={() => window.open('/', '_blank')}
                    transactions={transactions.filter(t => t.source === 'online')} customers={customers}
                    onUpdateOrderStatus={updateOrderStatus} products={products}
                />;
            case 'admin':
                return <AdminAccess user={currentUser} />;
            case 'storefront':
                return storeSettings.isOnline ? (
                    <Storefront
                        products={products} loadingProducts={false} userPhone={currentUser?.email || 'admin'}
                        sessionToken="admin-preview" customerProfile={null} orders={[]} wishlistIds={[]}
                        storeName={storeSettings?.name || 'NEXA Store'} onCheckoutSuccess={async (cart, total, gst, name, phone, addr, method) => handleSaleWrapper(cart, total, gst, name, phone, addr, 'online', total, method)}
                        onLogout={() => setPage('online-store')} onUpdateProfile={() => { }} onAddAddress={async () => ({})} onUpdateAddress={() => { }} onDeleteAddress={() => { }} onReloadOrders={() => { }}
                        onToggleWishlist={() => { }} isLoggedIn={true} onRequireLogin={() => { }} onBackToAdmin={() => setPage('online-store')} cart={previewCart} setCart={setPreviewCart}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl">
                        <Lock className="w-16 h-16 text-rose-500 mb-6" />
                        <h1 className="text-3xl font-black text-slate-900 mb-4">Store Offline</h1>
                        <button onClick={() => setPage('online-store')} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl">Back to Admin</button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex h-screen bg-[#F8F9FC]">
            <Sidebar
                activePage={page}
                onPageChange={setPage}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={currentUser}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    activePage={page}
                    onPageChange={setPage}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    user={currentUser}
                    onRefresh={loadData}
                    products={products}
                    customers={customers}
                    transactions={transactions}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 vyapar-scrollbar bg-[#F8F9FC]" style={{ position: 'relative' }}>
                    <React.Suspense fallback={
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    }>
                        {renderPage()}
                    </React.Suspense>
                </main>

            </div>
        </div>
    );
};

// =============================================
// APP — Root router
// =============================================
const App: React.FC = () => {
    return (
        <React.Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-[#F8F9FC]">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        }>
            <Routes>
                {/* Public storefront at / */}
                <Route path="/" element={<StorefrontPage />} />

                {/* Admin panel at /admin */}
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/*" element={<AdminPanel />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </React.Suspense>
    );
};

export default App;
