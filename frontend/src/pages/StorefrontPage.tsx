import React, { useState, useEffect, useCallback } from 'react';
import StoreLoginModal from './StoreLogin';
import StorefrontMain from './Storefront';
import { api } from '../services/api';
import { Product, StoreAddress, StoreCustomerProfile, Customer, PaymentMethod, Transaction } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const StorefrontPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecking, setAuthChecking] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [userPhone, setUserPhone] = useState('');
    const [customerProfile, setCustomerProfile] = useState<StoreCustomerProfile | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [wishlistIds, setWishlistIds] = useState<string[]>([]);
    const [sessionToken, setSessionToken] = useLocalStorage<string>('nx_store_session', '');
    const [cart, setCart] = useLocalStorage<{ id: string; qty: number }[]>('nx_store_cart', []);

    const [storeSettings] = useLocalStorage('nx_store_settings', {
        name: 'NEXA Store',
        domain: 'shop.nexapos.com',
        currency: 'INR (₹) - Indian Rupee',
        minOrder: '499',
        isOnline: true,
    });

    // ─── Check existing session on mount ──────────────────────────────────────
    useEffect(() => {
        const checkSession = async () => {
            if (!sessionToken) { setAuthChecking(false); return; }

            // Safety timeout: don't stick on spinner forever
            const timeout = setTimeout(() => {
                if (authChecking) {
                    console.warn('Session check timed out');
                    setAuthChecking(false);
                }
            }, 6000);

            try {
                const res = await api.auth.checkSession(sessionToken);
                if (res.loggedIn) {
                    setIsLoggedIn(true);
                    setUserPhone(res.phone);
                    if (res.customer) {
                        setCustomerProfile(res.customer);
                        setWishlistIds((res.customer.wishlist || []).map((w: any) => w.productId));
                    }
                } else {
                    setSessionToken('');
                }
            } catch (err) {
                console.error('Session check error:', err);
                setSessionToken('');
            } finally {
                clearTimeout(timeout);
                setAuthChecking(false);
            }
        };
        checkSession();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Load products (always — no login required) ───────────────────────────
    const loadProducts = useCallback(async () => {
        try {
            const prods = await api.products.getAll();
            setProducts(prods.length > 0 ? prods : []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    // Listen for cross-tab updates (e.g. from Admin Panel)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'inv_products') {
                console.log('🔄 Inventory updated in another tab, refreshing store...');
                loadProducts();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadProducts]);

    // ─── Load orders & wishlist (only when logged in) ─────────────────────────
    const loadOrders = useCallback(async () => {
        if (!sessionToken) return;
        try {
            const res = await api.auth.getOrders(sessionToken);
            if (res.orders) setOrders(res.orders);
        } catch { setOrders([]); }
    }, [sessionToken]);

    const loadWishlist = useCallback(async () => {
        if (!sessionToken) return;
        try {
            const res = await api.auth.getWishlist(sessionToken);
            if (res.wishlist) setWishlistIds(res.wishlist.map((w: any) => w.productId));
        } catch { setWishlistIds([]); }
    }, [sessionToken]);

    useEffect(() => {
        if (isLoggedIn) { loadOrders(); loadWishlist(); }
    }, [isLoggedIn, loadOrders, loadWishlist]);

    // ─── Handle login success ──────────────────────────────────────────────────
    const handleLoginSuccess = (phone: string, token: string, customer?: any) => {
        setSessionToken(token);
        setUserPhone(phone);
        setIsLoggedIn(true);
        setShowAuthModal(false);
        if (customer) {
            setCustomerProfile(customer);
            setWishlistIds((customer.wishlist || []).map((w: any) => w.productId));
        }
        // Force a re-load of orders/wishlist now that we have a token
        loadOrders();
        loadWishlist();
    };

    // ─── Handle logout ─────────────────────────────────────────────────────────
    const handleLogout = async () => {
        try { if (sessionToken) await api.auth.logout(sessionToken); } catch { /* ignore */ }
        setSessionToken(''); setIsLoggedIn(false); setUserPhone('');
        setCustomerProfile(null); setOrders([]); setWishlistIds([]);
        setCart([]);
        sessionStorage.removeItem('nx_store_tab');
    };

    // ─── Guard: require login before protected actions ─────────────────────────
    const requireLogin = (action: () => void) => {
        if (!isLoggedIn) { setShowAuthModal(true); return; }
        action();
    };

    // ─── Update profile ────────────────────────────────────────────────────────
    const handleUpdateProfile = async (name: string, email: string) => {
        try {
            const res = await api.auth.updateProfile(sessionToken, { name, email });
            if (res.customer) setCustomerProfile(prev => ({ ...prev!, name: res.customer.name, email: res.customer.email }));
        } catch (err) { console.error('Profile update error:', err); }
    };

    // ─── Address CRUD ──────────────────────────────────────────────────────────
    const handleAddAddress = async (address: Omit<StoreAddress, 'id'>) => {
        try {
            const res = await api.auth.addAddress(sessionToken, address);
            if (res.addresses) setCustomerProfile(prev => prev ? { ...prev, addresses: res.addresses } : null);
            return res;
        } catch (err) { console.error('Add address error:', err); throw err; }
    };

    const handleUpdateAddress = async (addrId: string, address: Partial<StoreAddress>) => {
        try {
            const res = await api.auth.updateAddress(sessionToken, addrId, address);
            if (res.addresses) setCustomerProfile(prev => prev ? { ...prev, addresses: res.addresses } : null);
        } catch (err) { console.error('Update address error:', err); }
    };

    const handleDeleteAddress = async (addrId: string) => {
        try {
            const res = await api.auth.deleteAddress(sessionToken, addrId);
            if (res.addresses) setCustomerProfile(prev => prev ? { ...prev, addresses: res.addresses } : null);
        } catch (err) { console.error('Delete address error:', err); }
    };

    // ─── Wishlist toggle (requires login) ─────────────────────────────────────
    const handleToggleWishlist = async (productId: string) => {
        if (!isLoggedIn) { setShowAuthModal(true); return; }
        const isInWishlist = wishlistIds.includes(productId);
        if (isInWishlist) setWishlistIds(prev => prev.filter(id => id !== productId));
        else setWishlistIds(prev => [...prev, productId]);
        try {
            if (isInWishlist) await api.auth.removeFromWishlist(sessionToken, productId);
            else await api.auth.addToWishlist(sessionToken, productId);
        } catch {
            if (isInWishlist) setWishlistIds(prev => [...prev, productId]);
            else setWishlistIds(prev => prev.filter(id => id !== productId));
        }
    };

    // ─── Checkout (requires login) ─────────────────────────────────────────────
    const handleCheckout = async (
        cartItems: any[],
        total: number,
        gstAmount: number,
        custName?: string,
        custPhone?: string,
        custAddress?: string,
        paymentMethod?: PaymentMethod,
    ) => {
        try {
            const localDate = new Date().toISOString().split('T')[0];
            const finalPhone = custPhone?.trim() || userPhone;
            const finalName = custName?.trim() || (customerProfile?.name || `Customer +91${userPhone}`);
            const custId = customerProfile?.id || `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

            const orderId = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
            const newTxn: Transaction = {
                id: orderId,
                customerId: custId,
                customerName: finalName,
                customerPhone: finalPhone,
                deliveryAddress: custAddress || '',
                items: cartItems.map(item => ({ ...item, quantity: item.quantity || item.qty || 1 })),
                total,
                paidAmount: total,
                gstAmount,
                date: localDate,
                method: paymentMethod || 'cash',
                status: 'Paid',
                source: 'online',
                orderStatus: 'Pending',
            } as any; // Cast because Transaction might not have all fields yet (like customerName)

            await api.transactions.create(newTxn);

            // Sync Customer Data to main POS database
            const customerData: Customer = {
                id: custId,
                name: finalName,
                phone: finalPhone || '',
                email: customerProfile?.email || '',
                totalPaid: (customerProfile?.totalSpent || 0) + total,
                pending: 0,
                status: 'Paid',
                channel: 'both', // It's an online sale, but they exist in POS now
                totalOrders: (customerProfile?.totalOrders || 0) + 1,
                lastTransaction: localDate,
                address: custAddress || (customerProfile?.addresses?.[0]?.city || ''), // Use city or something better as fallback
                totalInvoices: (customerProfile?.totalOrders || 0) + 1,
            } as any;

            // Update in-page profile if exists
            if (customerProfile) {
                setCustomerProfile({
                    ...customerProfile,
                    totalOrders: customerData.totalOrders || 0,
                    totalSpent: customerData.totalPaid || 0,
                });
            }

            // Persistence: Try update first, then create if failing or just always push to api
            // For mock api, it's safer to ensure it exists.
            try {
                // Check if customer exists in POS DB
                const existingInPOS = await api.customers.getOne(custId).catch(() => null);
                if (existingInPOS) {
                    await api.customers.update(custId, customerData).catch(() => { });
                } else {
                    await api.customers.create(customerData).catch(() => { });
                }
            } catch (err) {
                console.error('POS Customer Sync failed:', err);
                // Fallback to simple create/update
                api.customers.update(custId, customerData).catch(() =>
                    api.customers.create(customerData).catch(() => { })
                );
            }

            setOrders(prev => [newTxn, ...prev]);
            setCart([]);

            const stockUpdates = cartItems.map(item => ({
                id: item.id,
                stock: Math.max(0, (products.find(p => p.id === item.id)?.stock || 0) - (item.quantity || item.qty || 1)),
            }));

            setProducts(prev => prev.map(p => {
                const update = stockUpdates.find(u => u.id === p.id);
                if (!update) return p;
                return {
                    ...p,
                    stock: update.stock,
                    status: (update.stock === 0 ? 'Out of Stock' : update.stock < 10 ? 'Low Stock' : 'In Stock') as Product['status']
                };
            }));
            api.products.bulkUpdate(stockUpdates).catch(() => { });
            setTimeout(() => loadProducts(), 1000);
        } catch (err) {
            console.error('Checkout error:', err);
            throw err;
        }
    };


    // ─── Auth checking spinner ─────────────────────────────────────────────────
    if (authChecking) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
                    <div style={{ position: 'absolute', inset: 0, border: '4px solid #d1fae5', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: '4px solid transparent', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
                    <div style={{ position: 'absolute', inset: 12, border: '4px solid transparent', borderBottomColor: '#34d399', borderRadius: '50%', animation: 'spin-rev 0.8s linear infinite' }} />
                </div>
                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                `}</style>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>NEXA Store</h2>
                    <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13, margin: 0 }}>Authenticating session…</p>
                </div>
            </div>
        );
    }

    // ─── Store offline check ──────────────────────────────────────────────────
    if (!storeSettings?.isOnline) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: 32, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div style={{ width: 120, height: 120, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', marginBottom: 32 }}>🔒</div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 16, letterSpacing: '-1px' }}>Store Temporarily Closed</h1>
                <p style={{ color: '#64748b', fontWeight: 600, maxWidth: 460, fontSize: 16, lineHeight: 1.6, margin: '0 0 32px' }}>
                    {storeSettings?.name || 'NEXA'} is currently undergoing maintenance or is not accepting online orders at the moment. Please check back later!
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>Retry</button>
                    <button onClick={() => window.location.href = '/'} style={{ padding: '12px 24px', background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Back to Admin</button>
                </div>
            </div>
        );
    }

    // ─── Main storefront (always shown — login popup on demand) ───────────────
    return (
        <>
            {/* Auth Modal Popup */}
            {showAuthModal && (
                <StoreLoginModal
                    onLoginSuccess={handleLoginSuccess}
                    onClose={() => setShowAuthModal(false)}
                    storeName={storeSettings?.name || 'NEXA Store'}
                />
            )}

            <StorefrontMain
                products={products}
                loadingProducts={loading}
                userPhone={userPhone}
                sessionToken={sessionToken}
                customerProfile={customerProfile}
                orders={orders}
                wishlistIds={wishlistIds}
                cart={cart}
                setCart={setCart}
                storeName={storeSettings?.name || 'NEXA Store'}
                isLoggedIn={isLoggedIn}
                onCheckoutSuccess={handleCheckout}
                onLogout={handleLogout}
                onUpdateProfile={handleUpdateProfile}
                onAddAddress={handleAddAddress}
                onUpdateAddress={handleUpdateAddress}
                onDeleteAddress={handleDeleteAddress}
                onReloadOrders={loadOrders}
                onToggleWishlist={handleToggleWishlist}
                onRequireLogin={() => setShowAuthModal(true)}
            />
        </>
    );
};

export default StorefrontPage;
