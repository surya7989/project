import React, { useState, useEffect } from 'react';
import { Search, Bell, LogOut, Menu, Calendar, RefreshCw, AlertTriangle, Package, IndianRupee, ShoppingBag, X, CheckCircle2 } from 'lucide-react';
import { Page, User, Product, Customer, Transaction } from '../types';

import { useLocalStorage } from '../hooks/useLocalStorage';

interface HeaderProps {
    activePage: Page;
    onPageChange: (page: Page) => void;
    onToggleSidebar: () => void;
    user?: User | null;
    onRefresh?: () => Promise<void>;
    products?: Product[];
    customers?: Customer[];
    transactions?: Transaction[];
}

const Header: React.FC<HeaderProps> = ({ activePage, onPageChange, onToggleSidebar, user, onRefresh, products = [], customers = [], transactions = [] }) => {
    const [profile] = useLocalStorage('inv_admin_profile', {
        name: 'NEXA Admin',
        avatar: ''
    });

    const [refreshing, setRefreshing] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const displayName = profile.name.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin';

    const titles: Partial<Record<Page, { title: string; subtitle: string }>> = {
        dashboard: { title: 'Dashboard', subtitle: `Welcome back, ${displayName}. Here's what's happening today.` },
        'invoice:create': { title: 'Billing Dashboard', subtitle: 'Dashboard > Billing' },
        'product:manage': { title: 'Inventory Dashboard', subtitle: 'Track stock levels, movement, and profitability' },
        customers: { title: 'Customer Management', subtitle: 'Manage and track all your customers in one place.' },
        vendors: { title: 'Vendors', subtitle: 'Manage vendor accounts, payment history, and outstanding amounts.' },
        analytics: { title: 'Analytics Dashboard', subtitle: 'Overview of product, customer, and vendor performance' },
        'settings:manage': { title: 'Settings', subtitle: 'Manage your business information' },


        'online-store': { title: 'Online Store Management', subtitle: 'Manage your digital storefront and orders' },
        storefront: { title: 'NEXA POS Storefront', subtitle: 'Customer-facing ordering portal' },
        'user:manage': { title: 'Admin Access', subtitle: 'Manage system administrators and permissions' },
        'payment:manage': { title: 'Payment Management', subtitle: 'Track and manage all payments' },
        'audit:read': { title: 'Audit Logs', subtitle: 'View system audit trail and activity logs' },
        'inventory:adjust': { title: 'Inventory Adjustment', subtitle: 'Adjust stock levels and manage inventory' },
        billing: { title: 'Billing Dashboard', subtitle: 'Dashboard > Billing' },
        inventory: { title: 'Inventory Dashboard', subtitle: 'Track stock levels, movement, and profitability' },
        settings: { title: 'Settings', subtitle: 'Manage your business information' },
        'admin-access': { title: 'Admin Access', subtitle: 'Manage system administrators and permissions' },
        login: { title: '', subtitle: '' },
    };

    const { title, subtitle } = titles[activePage] || { title: 'Page', subtitle: '' };

    const handleRefresh = async () => {
        if (!onRefresh || refreshing) return;
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setTimeout(() => setRefreshing(false), 600);
        }
    };

    // Build notifications from real data
    const notifications: { id: string; type: 'warning' | 'info' | 'success'; icon: React.ElementType; text: string; detail: string }[] = [];

    const outOfStock = products.filter(p => p.status === 'Out of Stock');
    const lowStock = products.filter(p => p.status === 'Low Stock');
    const pendingCustomers = customers.filter(c => c.pending > 0);
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
    const todayTxns = transactions.filter(t => t.date === todayStr);

    if (outOfStock.length > 0) {
        notifications.push({
            id: 'oos', type: 'warning', icon: AlertTriangle,
            text: `${outOfStock.length} product${outOfStock.length > 1 ? 's' : ''} out of stock`,
            detail: outOfStock.slice(0, 3).map(p => p.name).join(', ') + (outOfStock.length > 3 ? '...' : '')
        });
    }
    if (lowStock.length > 0) {
        notifications.push({
            id: 'ls', type: 'warning', icon: Package,
            text: `${lowStock.length} product${lowStock.length > 1 ? 's' : ''} running low`,
            detail: lowStock.slice(0, 3).map(p => `${p.name} (${p.stock})`).join(', ') + (lowStock.length > 3 ? '...' : '')
        });
    }
    if (pendingCustomers.length > 0) {
        const totalPending = pendingCustomers.reduce((s, c) => s + c.pending, 0);
        notifications.push({
            id: 'cp', type: 'info', icon: IndianRupee,
            text: `₹${totalPending.toLocaleString('en-IN')} pending from ${pendingCustomers.length} customer${pendingCustomers.length > 1 ? 's' : ''}`,
            detail: pendingCustomers.slice(0, 3).map(c => `${c.name}: ₹${c.pending}`).join(', ')
        });
    }
    if (todayTxns.length > 0) {
        const todayTotal = todayTxns.reduce((s, t) => s + (Number(t.total) || 0), 0);
        notifications.push({
            id: 'ts', type: 'success', icon: ShoppingBag,
            text: `${todayTxns.length} sale${todayTxns.length > 1 ? 's' : ''} today — ₹${todayTotal.toLocaleString('en-IN')}`,
            detail: `Last: ${todayTxns[todayTxns.length - 1]?.id || ''}`
        });
    }
    if (notifications.length === 0) {
        notifications.push({
            id: 'none', type: 'success', icon: CheckCircle2,
            text: 'All clear! No alerts right now.',
            detail: 'Your store is running smoothly.'
        });
    }

    const activeAlerts = notifications.filter(n => n.type === 'warning').length;

    return (
        <header className="h-16 lg:h-20 bg-white shadow-sm px-4 lg:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="w-3.5 h-3.5" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
                    <p className="text-xs lg:text-sm text-gray-500 truncate hidden sm:block">{subtitle}</p>
                </div>

            </div>

            <div className="flex items-center space-x-3 lg:space-x-5">
                {activePage === 'dashboard' && (
                    <div className="hidden md:flex items-center gap-3 mr-1">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Access: {user?.role || 'Admin'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                                {currentTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Refresh Button */}
                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Refresh data from database"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <Bell className="w-4 h-4" />
                        {activeAlerts > 0 && (
                            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                    {notifications.map(n => (
                                        <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start space-x-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'warning' ? 'bg-amber-100' : n.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                                                    }`}>
                                                    <n.icon className={`w-3.5 h-3.5 ${n.type === 'warning' ? 'text-amber-600' : n.type === 'success' ? 'text-green-600' : 'text-blue-600'
                                                        }`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800">{n.text}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{n.detail}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-slate-100 bg-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                                        Live data from your store
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>


                <button
                    onClick={() => onPageChange('settings:manage')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
                    title="Go to Settings"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-transparent group-hover:border-blue-100 transition-all shadow-sm">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Admin" className="w-full h-full object-cover" />
                        ) : (
                            profile.name?.charAt(0) || 'A'
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;
