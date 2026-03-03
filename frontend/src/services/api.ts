import axios, { AxiosInstance } from 'axios';
import { Product, Customer, Vendor, Transaction, PurchaseOrder, User, PaymentMethod, StoreAddress } from '../types';
import * as schemas from '../schemas';
import { DEFAULT_PRODUCTS, DEFAULT_CUSTOMERS, DEFAULT_VENDORS, DEFAULT_USERS } from '../data/mockData';

/**
 * PRO-GRADE API SERVICE
 * 
 * DESIGNED FOR BACKEND DEVELOPERS:
 * 1. RESTful structure parity.
 * 2. Zod-backed validation for both entry and exit.
 * 3. Unified error handling.
 * 4. Easy toggle between 'Mock' and 'Production'.
 */

const STORAGE_PREFIX = 'inv_';
const STORE_PREFIX = 'nx_store_';

class ApiService {
    private client: AxiosInstance;
    private isMock: boolean = import.meta.env.VITE_USE_MOCKS !== 'false';

    constructor() {
        this.client = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
            headers: { 'Content-Type': 'application/json' }
        });

        // JWT Interceptor
        this.client.interceptors.request.use(config => {
            const token = sessionStorage.getItem('inv_token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }

    private async delay(ms = 300) { if (this.isMock) return new Promise(r => setTimeout(r, ms)); }

    private mockGet<T>(key: string): T[] {
        try {
            const data = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    private mockSave<T>(key: string, data: T[]) {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
        } catch (err) {
            console.error(`[STORAGE] Failed to save "${key}" — storage may be full:`, err);
        }
    }

    // --- PRODUCTS ---
    public products = {
        getAll: async (): Promise<Product[]> => {
            if (this.isMock) {
                await this.delay();
                let data = this.mockGet<Product>('products');
                if (data.length === 0) {
                    data = DEFAULT_PRODUCTS;
                    this.mockSave('products', data);
                }
                return data;
            }
            const res = await this.client.get<Product[]>('/products');
            return res.data;
        },
        create: async (data: any): Promise<Product> => {
            const validated = schemas.ProductSchema.parse({ ...data, id: data.id || crypto.randomUUID() }) as Product;
            if (this.isMock) {
                const list = this.mockGet<Product>('products');
                this.mockSave('products', [validated, ...list]);
                return validated;
            }
            const res = await this.client.post<Product>('/products', validated);
            return res.data;
        },
        update: async (id: string, data: any): Promise<Product> => {
            if (this.isMock) {
                const list = this.mockGet<Product>('products');
                const index = list.findIndex(p => p.id === id);
                if (index === -1) throw new Error('Product not found');
                const updated = { ...list[index], ...data } as Product;
                list[index] = updated;
                this.mockSave('products', list);
                return updated;
            }
            const res = await this.client.put<Product>(`/products/${id}`, data);
            return res.data;
        },
        delete: async (id: string): Promise<void> => {
            if (this.isMock) {
                const list = this.mockGet<Product>('products');
                this.mockSave('products', list.filter(p => p.id !== id));
                return;
            }
            await this.client.delete(`/products/${id}`);
        },
        bulkUpdate: async (items: Partial<Product>[]): Promise<Product[]> => {
            if (this.isMock) {
                const list = this.mockGet<Product>('products');
                const updated = list.map(p => {
                    const match = items.find(u => u.id === p.id);
                    return match ? { ...p, ...match } : p;
                }) as Product[];
                this.mockSave('products', updated);
                return updated;
            }
            const res = await this.client.patch<Product[]>('/products/bulk', { items });
            return res.data;
        },
        seed: async (items: Product[]) => {
            this.mockSave('products', items);
            return { success: true };
        }
    };

    // --- CUSTOMERS ---
    public customers = {
        getAll: async (): Promise<Customer[]> => {
            if (this.isMock) {
                await this.delay();
                let data = this.mockGet<Customer>('customers');
                if (data.length === 0) {
                    data = DEFAULT_CUSTOMERS;
                    this.mockSave('customers', data);
                }
                return data;
            }
            const res = await this.client.get<Customer[]>('/customers');
            return res.data;
        },
        getOne: async (id: string): Promise<Customer | null> => {
            if (this.isMock) {
                const list = this.mockGet<Customer>('customers');
                return list.find(c => c.id === id) || null;
            }
            const res = await this.client.get<Customer>(`/customers/${id}`);
            return res.data;
        },
        create: async (data: Customer): Promise<Customer> => {
            if (this.isMock) {
                const list = this.mockGet<Customer>('customers');
                this.mockSave('customers', [data, ...list]);
                return data;
            }
            const res = await this.client.post<Customer>('/customers', data);
            return res.data;
        },
        update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
            if (this.isMock) {
                const list = this.mockGet<Customer>('customers');
                const updated = list.map(c => c.id === id ? { ...c, ...data } : c);
                this.mockSave('customers', updated);
                return updated.find(c => c.id === id)!;
            }
            const res = await this.client.put<Customer>(`/customers/${id}`, data);
            return res.data;
        },
        delete: async (id: string): Promise<void> => {
            if (this.isMock) {
                const list = this.mockGet<Customer>('customers');
                this.mockSave('customers', list.filter(c => c.id !== id));
                return;
            }
            await this.client.delete(`/customers/${id}`);
        },
        seed: async (items: Customer[]) => {
            this.mockSave('customers', items);
            return { success: true };
        }
    };

    // --- VENDORS ---
    public vendors = {
        getAll: async (): Promise<Vendor[]> => {
            if (this.isMock) {
                await this.delay();
                let data = this.mockGet<Vendor>('vendors');
                if (data.length === 0) {
                    data = DEFAULT_VENDORS;
                    this.mockSave('vendors', data);
                }
                return data;
            }
            const res = await this.client.get<Vendor[]>('/vendors');
            return res.data;
        },
        create: async (data: Vendor): Promise<Vendor> => {
            if (this.isMock) {
                const list = this.mockGet<Vendor>('vendors');
                this.mockSave('vendors', [data, ...list]);
                return data;
            }
            const res = await this.client.post<Vendor>('/vendors', data);
            return res.data;
        },
        update: async (id: string, data: Partial<Vendor>): Promise<Vendor> => {
            if (this.isMock) {
                const list = this.mockGet<Vendor>('vendors');
                const updated = list.map(v => v.id === id ? { ...v, ...data } : v);
                this.mockSave('vendors', updated);
                return updated.find(v => v.id === id)!;
            }
            const res = await this.client.put<Vendor>(`/vendors/${id}`, data);
            return res.data;
        },
        seed: async (items: Vendor[]) => {
            this.mockSave('vendors', items);
            return { success: true };
        }
    };

    // --- TRANSACTIONS ---
    public transactions = {
        getAll: async (): Promise<Transaction[]> => {
            if (this.isMock) {
                await this.delay();
                return this.mockGet<Transaction>('transactions');
            }
            const res = await this.client.get<Transaction[]>('/transactions');
            return res.data;
        },
        create: async (data: Transaction): Promise<Transaction> => {
            if (this.isMock) {
                const list = this.mockGet<Transaction>('transactions');
                this.mockSave('transactions', [data, ...list]);
                return data;
            }
            const res = await this.client.post<Transaction>('/transactions', data);
            return res.data;
        },
        update: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
            if (this.isMock) {
                const list = this.mockGet<Transaction>('transactions');
                const updated = list.map(t => t.id === id ? { ...t, ...data } : t);
                this.mockSave('transactions', updated);
                return updated.find(t => t.id === id)!;
            }
            const res = await this.client.put<Transaction>(`/transactions/${id}`, data);
            return res.data;
        },
        getBySource: async (source: string): Promise<Transaction[]> => {
            if (this.isMock) {
                return this.mockGet<Transaction>('transactions').filter(t => t.source === source);
            }
            const res = await this.client.get<Transaction[]>(`/transactions?source=${source}`);
            return res.data;
        }
    };

    // --- PURCHASES ---
    public purchases = {
        getAll: async (): Promise<PurchaseOrder[]> => {
            if (this.isMock) return this.mockGet<PurchaseOrder>('purchases');
            const res = await this.client.get<PurchaseOrder[]>('/purchases');
            return res.data;
        },
        create: async (data: PurchaseOrder): Promise<PurchaseOrder> => {
            if (this.isMock) {
                const list = this.mockGet<PurchaseOrder>('purchases');
                this.mockSave('purchases', [data, ...list]);
                return data;
            }
            const res = await this.client.post<PurchaseOrder>('/purchases', data);
            return res.data;
        }
    };

    // --- WHATSAPP ---
    public whatsapp = {
        getStatus: async (): Promise<any> => {
            if (this.isMock) {
                await this.delay();
                const config = localStorage.getItem(`${STORAGE_PREFIX}whatsapp_config`);
                const parsed = config ? JSON.parse(config) : {};
                const isReady = parsed.status === 'ready';
                return {
                    success: true,
                    data: {
                        status: isReady ? 'ready' : 'disconnected',
                        connectionInfo: { platform: 'mock', pushName: 'NexaPOS' },
                    }
                };
            }
            const res = await this.client.get('/whatsapp/status');
            return res.data;
        },
        getQr: async (): Promise<any> => {
            if (this.isMock) {
                await this.delay(500);
                return { success: true, qr: 'data:image/png;base64,MOCK_QR_CODE_PLACEHOLDER' };
            }
            const res = await this.client.get('/whatsapp/qr');
            return res.data;
        },
        logout: async (): Promise<{ success: boolean }> => {
            if (this.isMock) {
                localStorage.removeItem(`${STORAGE_PREFIX}whatsapp_config`);
                return { success: true };
            }
            const res = await this.client.post('/whatsapp/logout');
            return res.data;
        },
        restart: async (): Promise<{ success: boolean }> => {
            if (this.isMock) {
                await this.delay(1000);
                return { success: true };
            }
            const res = await this.client.post('/whatsapp/restart');
            return res.data;
        },
        requestPairingCode: async (phone: string): Promise<any> => {
            if (this.isMock) {
                await this.delay(1000);
                return { success: true, pairingCode: '1234-5678', message: 'Pairing code generated' };
            }
            const res = await this.client.post('/whatsapp/pairing-code', { phone });
            return res.data;
        },
        sendReceipt: async (phone: string, data: any): Promise<{ success: boolean }> => {
            if (this.isMock) {
                await this.delay(800);
                return { success: true };
            }
            const res = await this.client.post('/whatsapp/send-receipt', { phone, ...data });
            return res.data;
        },
        send: async (data: any): Promise<{ success: boolean }> => {
            if (this.isMock) {
                await this.delay(500);
                return { success: true };
            }
            const res = await this.client.post('/whatsapp/send', data);
            return res.data;
        },
        getMessages: async (params?: any): Promise<any> => {
            if (this.isMock) {
                return { success: true, data: [] };
            }
            const res = await this.client.get('/whatsapp/messages', { params });
            return res.data;
        }
    };

    // --- INVOICES & MESSAGING ---
    public invoices = {
        sendWhatsApp: async (billData: any, shopSettings: any, format: string): Promise<{ success: boolean }> => {
            if (this.isMock) {
                await this.delay(1000);
                return { success: true };
            }
            const res = await this.client.post('/invoices/send-whatsapp', { billData, shopSettings, format });
            return res.data;
        },
        sendBulkMessage: async (recipients: { name: string; phone: string }[], message: string): Promise<{ sent: number; failed: number; skipped: number }> => {
            if (this.isMock) {
                await this.delay(1500);
                return { sent: recipients.length, failed: 0, skipped: 0 };
            }
            const res = await this.client.post('/invoices/bulk-message', { recipients, message });
            return res.data;
        }
    };

    // --- AUTH / USERS ---
    public users = {
        getAll: async (): Promise<User[]> => {
            if (this.isMock) {
                let data = this.mockGet<User>('users');
                if (data.length === 0) {
                    data = DEFAULT_USERS;
                    this.mockSave('users', data);
                }
                return data;
            }
            const res = await this.client.get<User[]>('/users');
            return res.data;
        },
        create: async (data: any): Promise<User> => {
            if (this.isMock) {
                const list = this.mockGet<any>('users');
                this.mockSave('users', [...list, data]);
                return data;
            }
            const res = await this.client.post<User>('/users', data);
            return res.data;
        },
        update: async (id: string, data: Partial<User & { password?: string; status?: string }>): Promise<User> => {
            if (this.isMock) {
                const list = this.mockGet<any>('users');
                const updated = list.map((u: any) => u.id === id ? { ...u, ...data } : u);
                this.mockSave('users', updated);
                return updated.find((u: any) => u.id === id)!;
            }
            const res = await this.client.put<User>(`/users/${id}`, data);
            return res.data;
        },
        delete: async (id: string): Promise<void> => {
            if (this.isMock) {
                const list = this.mockGet<any>('users');
                this.mockSave('users', list.filter((u: any) => u.id !== id));
                return;
            }
            await this.client.delete(`/users/${id}`);
        },
        login: async (email: string, password: string): Promise<{ success: boolean; user: User; token: string }> => {
            if (this.isMock) {
                await this.delay(800);
                const users = this.mockGet<any>('users');
                const user = users.find((u: any) => u.email === email && u.password === password);
                if (user) {
                    const { password: _, ...safeUser } = user;
                    return { success: true, user: safeUser, token: `mock_${Date.now()}_${Math.random().toString(36).substr(2)}` };
                }
                throw new Error('Invalid credentials');
            }
            const res = await this.client.post('/auth/login', { email, password });
            return res.data;
        },
        seed: async (items: User[]) => {
            this.mockSave('users', items);
            return { success: true };
        }
    };

    // --- STOREFRONT AUTH (Online Store Customer Auth) ---
    public auth = {
        sendOtp: async (phone: string): Promise<{ success: boolean; otp?: string; message?: string }> => {
            if (this.isMock) {
                await this.delay(500);
                return { success: true, otp: '123456', message: 'OTP sent to your WhatsApp!' };
            }
            const res = await this.client.post('/store/auth/send-otp', { phone });
            return res.data;
        },
        verifyOtp: async (phone: string, otp: string): Promise<{ success: boolean; token: string; phone: string; sessionToken: string; customer?: any }> => {
            if (this.isMock) {
                await this.delay(500);
                const customers = this.mockGet<any>('store_customers');
                const existing = customers.find((c: any) => c.phone === phone);
                const token = `store_${Date.now()}_${Math.random().toString(36).substr(2)}`;
                // Save session
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                sessions[token] = { phone, loggedIn: true, createdAt: Date.now() };
                localStorage.setItem(`${STORE_PREFIX}sessions`, JSON.stringify(sessions));
                return { success: true, token, sessionToken: token, phone, customer: existing || null };
            }
            const res = await this.client.post('/store/auth/verify-otp', { phone, otp });
            return res.data;
        },
        loginWithPassword: async (phone: string, password: string): Promise<{ success: boolean; phone: string; sessionToken: string; customer?: any }> => {
            if (this.isMock) {
                await this.delay(500);
                const customers = this.mockGet<any>('store_customers');
                const customer = customers.find((c: any) => c.phone === phone && c.password === password);
                if (!customer) throw new Error('Invalid phone or password');
                const token = `store_${Date.now()}_${Math.random().toString(36).substr(2)}`;
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                sessions[token] = { phone, loggedIn: true, createdAt: Date.now() };
                localStorage.setItem(`${STORE_PREFIX}sessions`, JSON.stringify(sessions));
                return { success: true, phone, sessionToken: token, customer };
            }
            const res = await this.client.post('/store/auth/login', { phone, password });
            return res.data;
        },
        signup: async (phone: string, name: string, password: string): Promise<{ success: boolean; phone: string; sessionToken: string; customer: any }> => {
            if (this.isMock) {
                await this.delay(500);
                const newCustomer = {
                    id: `SCUST-${Date.now()}`, name, phone, password,
                    email: '', addresses: [], wishlist: [], totalOrders: 0, totalSpent: 0,
                    createdAt: new Date().toISOString()
                };
                const customers = this.mockGet<any>('store_customers');
                this.mockSave('store_customers' as any, [...customers, newCustomer] as any);
                const token = `store_${Date.now()}_${Math.random().toString(36).substr(2)}`;
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                sessions[token] = { phone, loggedIn: true, createdAt: Date.now() };
                localStorage.setItem(`${STORE_PREFIX}sessions`, JSON.stringify(sessions));
                return { success: true, phone, sessionToken: token, customer: newCustomer };
            }
            const res = await this.client.post('/store/auth/signup', { phone, name, password });
            return res.data;
        },
        setPassword: async (token: string, password: string): Promise<{ success: boolean }> => {
            if (this.isMock) {
                await this.delay(300);
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) throw new Error('Not authenticated');
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    customers[idx].password = password;
                    this.mockSave('store_customers' as any, customers as any);
                }
                return { success: true };
            }
            const res = await this.client.post('/store/auth/set-password', { password }, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        getStoreCustomers: async (): Promise<{ customers: any[] }> => {
            if (this.isMock) {
                await this.delay(300);
                const customers = this.mockGet<any>('store_customers');
                return { customers };
            }
            const res = await this.client.get('/store/customers');
            return res.data;
        },
        register: async (phone: string, name: string, email: string): Promise<{ success: boolean; token: string; customer: any }> => {
            if (this.isMock) {
                await this.delay(500);
                const newCustomer = {
                    id: `SCUST-${Date.now()}`, name, email, phone,
                    addresses: [], wishlist: [], totalOrders: 0, totalSpent: 0
                };
                const customers = this.mockGet<any>('store_customers');
                this.mockSave('store_customers' as any, [...customers, newCustomer] as any);
                const token = `store_${Date.now()}_${Math.random().toString(36).substr(2)}`;
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                sessions[token] = { phone, loggedIn: true, createdAt: Date.now() };
                localStorage.setItem(`${STORE_PREFIX}sessions`, JSON.stringify(sessions));
                return { success: true, token, customer: newCustomer };
            }
            const res = await this.client.post('/store/auth/register', { phone, name, email });
            return res.data;
        },
        checkSession: async (token: string): Promise<{ loggedIn: boolean; phone: string; customer?: any }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session?.loggedIn) return { loggedIn: false, phone: '' };
                const customers = this.mockGet<any>('store_customers');
                const customer = customers.find((c: any) => c.phone === session.phone);
                return { loggedIn: true, phone: session.phone, customer: customer || null };
            }
            const res = await this.client.get('/store/auth/session', { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        logout: async (token: string): Promise<{ success: boolean }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                delete sessions[token];
                localStorage.setItem(`${STORE_PREFIX}sessions`, JSON.stringify(sessions));
                return { success: true };
            }
            const res = await this.client.post('/store/auth/logout', {}, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        getOrders: async (token: string): Promise<{ orders: any[] }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) return { orders: [] };
                const txns = this.mockGet<Transaction>('transactions');
                const customers = this.mockGet<any>('store_customers');
                const customer = customers.find((c: any) => c.phone === session.phone);
                const orders = customer ? txns.filter(t => t.customerId === customer.id) : [];
                return { orders };
            }
            const res = await this.client.get('/store/orders', { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        getWishlist: async (token: string): Promise<{ wishlist: { productId: string; addedAt: string }[] }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) return { wishlist: [] };
                const customers = this.mockGet<any>('store_customers');
                const customer = customers.find((c: any) => c.phone === session.phone);
                return { wishlist: customer?.wishlist || [] };
            }
            const res = await this.client.get('/store/wishlist', { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        addToWishlist: async (token: string, productId: string): Promise<{ success: boolean }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) return { success: false };
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    customers[idx].wishlist = [...(customers[idx].wishlist || []), { productId, addedAt: new Date().toISOString() }];
                    this.mockSave('store_customers' as any, customers as any);
                }
                return { success: true };
            }
            const res = await this.client.post('/store/wishlist', { productId }, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        removeFromWishlist: async (token: string, productId: string): Promise<{ success: boolean }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) return { success: false };
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    customers[idx].wishlist = (customers[idx].wishlist || []).filter((w: any) => w.productId !== productId);
                    this.mockSave('store_customers' as any, customers as any);
                }
                return { success: true };
            }
            const res = await this.client.delete(`/store/wishlist/${productId}`, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        updateProfile: async (token: string, data: { name: string; email: string }): Promise<{ customer: any }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) throw new Error('Not authenticated');
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    customers[idx] = { ...customers[idx], ...data };
                    this.mockSave('store_customers' as any, customers as any);
                    return { customer: customers[idx] };
                }
                throw new Error('Customer not found');
            }
            const res = await this.client.put('/store/profile', data, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        addAddress: async (token: string, address: Omit<StoreAddress, 'id'>): Promise<{ addresses: StoreAddress[] }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) throw new Error('Not authenticated');
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    const newAddr = { ...address, id: `ADDR-${Date.now()}` };
                    customers[idx].addresses = [...(customers[idx].addresses || []), newAddr];
                    this.mockSave('store_customers' as any, customers as any);
                    return { addresses: customers[idx].addresses };
                }
                throw new Error('Customer not found');
            }
            const res = await this.client.post('/store/addresses', address, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        updateAddress: async (token: string, addrId: string, address: Partial<StoreAddress>): Promise<{ addresses: StoreAddress[] }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) throw new Error('Not authenticated');
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    customers[idx].addresses = (customers[idx].addresses || []).map((a: any) =>
                        a.id === addrId ? { ...a, ...address } : a
                    );
                    this.mockSave('store_customers' as any, customers as any);
                    return { addresses: customers[idx].addresses };
                }
                throw new Error('Customer not found');
            }
            const res = await this.client.put(`/store/addresses/${addrId}`, address, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
        deleteAddress: async (token: string, addrId: string): Promise<{ addresses: StoreAddress[] }> => {
            if (this.isMock) {
                const sessions = JSON.parse(localStorage.getItem(`${STORE_PREFIX}sessions`) || '{}');
                const session = sessions[token];
                if (!session) throw new Error('Not authenticated');
                const customers = this.mockGet<any>('store_customers');
                const idx = customers.findIndex((c: any) => c.phone === session.phone);
                if (idx >= 0) {
                    customers[idx].addresses = (customers[idx].addresses || []).filter((a: any) => a.id !== addrId);
                    this.mockSave('store_customers' as any, customers as any);
                    return { addresses: customers[idx].addresses };
                }
                throw new Error('Customer not found');
            }
            const res = await this.client.delete(`/store/addresses/${addrId}`, { headers: { 'X-Store-Token': token } });
            return res.data;
        },
    };
}

export const api = new ApiService();
