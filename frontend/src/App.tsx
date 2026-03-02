import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';
import { useApp } from './context/AppContext';
import { api } from './services/api';
import { Product, Customer, Transaction, PaymentMethod, CartItem } from './types';

// Lazy load pages
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
const StorefrontPage = React.lazy(() => import('./pages/StorefrontPage'));

// Protected Route Component (Security Hardening)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, dataLoaded } = useApp();
    if (!dataLoaded) return <div className="h-screen flex items-center justify-center font-black text-slate-400">Loading...</div>;
    if (!currentUser) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const AdminLayout: React.FC = () => {
    const {
        products, setProducts, customers, setCustomers, vendors, setVendors,
        transactions, setTransactions, purchases,
        currentUser, handleLogout, loadData, dataLoaded
    } = useApp();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { loadData(); }, [loadData]);

    if (!dataLoaded) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FC]">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-500 font-bold text-lg">Loading secure session...</p>
        </div>
    );

    const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

    const handleSaleWrapper = async (cart: CartItem[], total: number, gstAmount: number, custName?: string, custPhone?: string, custAddress?: string, source: 'online' | 'offline' = 'offline', paid?: number, method?: PaymentMethod) => {
        // Stock and Transaction logic preserved
        const stockUpdates = cart.map(item => {
            const p = products.find(p => p.id === item.id);
            const qty = item.quantity || 0;
            const ns = Math.max(0, (p?.stock || 0) - qty);
            return { id: item.id, stock: ns, status: (ns === 0 ? 'Out of Stock' : ns < 10 ? 'Low Stock' : 'In Stock') as Product['status'] };
        });
        api.products.bulkUpdate(stockUpdates);

        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const actualPaid = paid !== undefined ? Number(paid) : total;

        const newTxn: Transaction = {
            id: `INV-${Date.now()}`,
            customerId: 'WALK-IN',
            items: [...cart],
            total, paidAmount: actualPaid, gstAmount, date: localDate,
            method: method || 'cash', status: actualPaid >= total ? 'Paid' : 'Partial', source
        };
        setTransactions(prev => [newTxn, ...prev]);
        api.transactions.create(newTxn);
    };

    return (
        <div className="flex h-screen bg-[#F8F9FC]">
            <Sidebar onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={currentUser} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header activePage="dashboard" onPageChange={() => { }} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} user={currentUser} onRefresh={loadData} products={products} customers={customers} transactions={transactions} />
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 vyapar-scrollbar">
                    <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-t-blue-600 rounded-full animate-spin"></div></div>}>
                        <Routes>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard onNavigateBilling={() => navigate('/admin/billing')} onVisitStore={() => window.open('/', '_blank')} stats={{ inventoryValue, lowStockCount }} products={products} customers={customers} vendors={vendors} transactions={transactions} purchases={purchases} user={currentUser} onRefresh={loadData} />} />
                            <Route path="billing" element={<Billing user={currentUser} products={products} customers={customers} onSaleSuccess={handleSaleWrapper} onRefresh={loadData} />} />
                            <Route path="inventory" element={<Inventory user={currentUser} products={products} onUpdate={setProducts} onRefresh={loadData} />} />
                            <Route path="customers" element={<Customers user={currentUser} customers={customers} transactions={transactions} onUpdate={setCustomers} onUpdateTransactions={setTransactions} onDelete={() => { }} onRefresh={loadData} />} />
                            <Route path="vendors" element={<Vendors user={currentUser} vendors={vendors} purchases={purchases} onUpdate={setVendors} onDelete={() => { }} onRefresh={loadData} />} />
                            <Route path="analytics" element={<Analytics user={currentUser} products={products} customers={customers} vendors={vendors} transactions={transactions} onRefresh={loadData} />} />
                            <Route path="settings" element={<Settings user={currentUser} />} />
                            <Route path="online-store" element={<OnlineStore user={currentUser} onVisitStore={() => window.open('/', '_blank')} transactions={transactions.filter(t => t.source === 'online')} customers={customers} onUpdateOrderStatus={() => { }} products={products} />} />
                            <Route path="admin" element={<AdminAccess user={currentUser} />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const { handleLogin, currentUser } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser && window.location.pathname === '/login') {
            navigate('/admin/dashboard');
        }
    }, [currentUser, navigate]);

    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#F8F9FC]"><div className="w-12 h-12 border-4 border-t-indigo-600 rounded-full animate-spin"></div></div>}>
            <Routes>
                <Route path="/" element={<StorefrontPage />} />
                <Route path="/login" element={<Login onLogin={(user) => { handleLogin(user); navigate('/admin/dashboard'); }} />} />
                <Route path="/admin/*" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default App;
