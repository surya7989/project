import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product, Customer, Vendor, Transaction, PurchaseOrder, User, Page } from '../types';
import { api } from '../services/api';
import { DEFAULT_PRODUCTS, DEFAULT_CUSTOMERS, DEFAULT_VENDORS, DEFAULT_USERS } from '../data/mockData';
import { useSessionStorage } from '../hooks/useSessionStorage';

interface AppContextType {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    vendors: Vendor[];
    setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    purchases: PurchaseOrder[];
    setPurchases: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    page: Page;
    setPage: (page: Page) => void;
    dataLoaded: boolean;
    loadData: () => Promise<void>;
    handleLogout: () => void;
    handleLogin: (user: User) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [page, setPage] = useSessionStorage<Page>('inv_page', 'dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
    const [currentUser, setCurrentUser] = useSessionStorage<User | null>('inv_user', null);
    const [dataLoaded, setDataLoaded] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [prods, custs, vends, txns, purch, allUsers] = await Promise.all([
                api.products.getAll().catch(() => []),
                api.customers.getAll().catch(() => []),
                api.vendors.getAll().catch(() => []),
                api.transactions.getAll().catch(() => []),
                api.purchases.getAll().catch(() => []),
                api.users.getAll().catch(() => []),
            ]);

            // Seeding if empty
            if (prods.length === 0) {
                await api.products.seed(DEFAULT_PRODUCTS).catch((err) => console.error('[SEED] Products seed failed:', err));
                setProducts(DEFAULT_PRODUCTS);
            } else setProducts(prods);

            if (custs.length === 0) {
                await api.customers.seed(DEFAULT_CUSTOMERS).catch((err) => console.error('[SEED] Customers seed failed:', err));
                setCustomers(DEFAULT_CUSTOMERS);
            } else setCustomers(custs);

            if (vends.length === 0) {
                await api.vendors.seed(DEFAULT_VENDORS).catch((err) => console.error('[SEED] Vendors seed failed:', err));
                setVendors(DEFAULT_VENDORS);
            } else setVendors(vends);

            const defaultPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'demo1234';
            // Seed if no users, OR if existing users are missing passwords (stale localStorage)
            const needsReseed = allUsers.length === 0 || allUsers.every((u: any) => !u.password);
            if (needsReseed) {
                const usersWithPasswords = DEFAULT_USERS.map(u => ({
                    ...u,
                    password: defaultPassword
                }));
                await api.users.seed(usersWithPasswords).catch((err) => console.error('[SEED] Users seed failed:', err));
            }

            setTransactions(txns);
            setPurchases(purch);
            setDataLoaded(true);
        } catch (error) {
            console.error('Failed to load application data:', error);
            // Even on error, we mark as loaded so the app can show the UI (maybe with empty data)
            setDataLoaded(true);
        }
    }, []);

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('inv_user');
        sessionStorage.removeItem('inv_token');
        setCurrentUser(null);
        setPage('login');
    }, [setCurrentUser, setPage]);

    const handleLogin = useCallback((user: User) => {
        setCurrentUser(user);
        setPage('dashboard');
    }, [setCurrentUser, setPage]);

    React.useEffect(() => {
        loadData();

        // REAL-TIME SYNC: Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('inv_')) {
                console.log('[REAL-TIME] External storage change detected, syncing data...');
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadData]);

    const value = React.useMemo(() => ({
        products, setProducts,
        customers, setCustomers,
        vendors, setVendors,
        transactions, setTransactions,
        purchases, setPurchases,
        currentUser, setCurrentUser,
        page, setPage,
        dataLoaded, loadData,
        handleLogout, handleLogin
    }), [
        products, customers, vendors, transactions, purchases,
        currentUser, page, dataLoaded, loadData,
        handleLogout, handleLogin
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
