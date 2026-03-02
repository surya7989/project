const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const IS_PROD = import.meta.env.PROD;

/**
 * Local Storage Mock DB
 * Used only in development or as a temporary emergency cache.
 */
const mockDb = {
    get: (key: string) => {
        const data = localStorage.getItem(`inv_${key}`);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error(`[CRITICAL] LocalStorage Corrupted for key: inv_${key}. Resetting to empty array.`);
            return [];
        }
    },
    save: (key: string, data: any) => {
        try {
            localStorage.setItem(`inv_${key}`, JSON.stringify(data));
        } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.error(`[CRITICAL] Browser Storage Full! Key: inv_${key}. Cannot save changes locally.`);
                alert('CRITICAL ERROR: Browser storage is full. Please delete some old data or use a real backend to save this product.');
            } else {
                console.error(`[ERROR] Failed to save to localStorage:`, e);
            }
        }
    }
};

/**
 * Hash a password using SHA-256 for mock security.
 */
async function hashPassword(password: string): Promise<string> {
    const salt = 'nexarats_secure_salt_v1';
    const msgUint8 = new TextEncoder().encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const sessionToken = sessionStorage.getItem('inv_token');

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options?.headers
    });

    if (sessionToken) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `API Error: ${res.status}`);
        }
        return res.json();
    } catch (error: any) {
        // In Production, we do NOT fall back to localStorage silently as it creates data fragmentation.
        // We only allow it in Development or if explicitly enabled via a flag.
        const isNetworkError = error.message === 'Failed to fetch';

        if (isNetworkError && !IS_PROD) {
            console.warn(`[DEV ONLY] API Unreachable (${endpoint}). Falling back to LocalStorage.`);

            const path = endpoint.split('?')[0].split('/')[1]; // e.g. 'products' from '/products'
            const method = options?.method || 'GET';
            const body = options?.body ? JSON.parse(options.body as string) : null;
            const segments = endpoint.split('/').filter(Boolean); // ['', 'products', '123'] -> ['products', '123']

            // GET ALL
            if (method === 'GET' && segments.length === 1) {
                return mockDb.get(path) as T;
            }

            // GET ONE
            if (method === 'GET' && segments.length === 2) {
                const data = mockDb.get(path);
                return data.find((item: any) => item.id === segments[1]) as T;
            }

            // CREATE / SEED / AUTH
            if (method === 'POST') {
                const data = mockDb.get(path);

                // MOCK LOGIN
                if (endpoint.includes('/users/login') || endpoint.includes('/auth/login-password')) {
                    const { email, phone, password } = body;
                    const loginKey = email || phone;
                    const user = data.find((u: any) => u.email === loginKey || u.phone === loginKey);

                    if (user) {
                        const hashed = await hashPassword(password);
                        // In mock mode, we fallback to plain comparison if the stored password isn't a hash yet (for legacy mock data)
                        const isMatch = (user.password === hashed) || (user.password === password);

                        if (isMatch) {
                            return {
                                success: true,
                                token: `mock_jwt_${btoa(loginKey)}`,
                                user,
                                phone: user.phone,
                                loggedIn: true,
                                customer: user
                            } as any;
                        }
                    }
                    throw new Error('Invalid credentials');
                }

                // MOCK SIGNUP / SET PASSWORD
                if (endpoint.includes('/auth/signup') || endpoint.includes('/auth/set-password')) {
                    const hashed = await hashPassword(body.password);
                    const newItem = { ...body, password: hashed, id: body.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
                    mockDb.save(path, [newItem, ...data]);
                    return { success: true, user: newItem, token: `mock_jwt_${btoa(body.phone || body.email)}` } as any;
                }

                if (endpoint.endsWith('/seed')) {
                    const seedKey = endpoint.includes('products') ? 'products' : path;
                    const seedData = body[seedKey] || [];
                    const merged = [...data];
                    seedData.forEach((item: any) => {
                        if (!merged.find((m: any) => m.id === item.id)) merged.push(item);
                    });
                    mockDb.save(path, merged);
                    return { success: true, [path]: merged } as any;
                }
                const newItem = { ...body, id: body.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
                mockDb.save(path, [newItem, ...data]);
                return newItem as T;
            }

            // UPDATE
            if (method === 'PUT' && segments.length === 2) {
                const data = mockDb.get(path);
                const updated = data.map((item: any) => item.id === segments[1] ? { ...item, ...body } : item);
                mockDb.save(path, updated);
                return body as T;
            }

            // BULK UPDATE (Special case for products)
            if (method === 'PUT' && endpoint.includes('bulk/update')) {
                const data = mockDb.get('products');
                const updates = body.products || [];
                const updated = data.map((item: any) => {
                    const upItem = updates.find((u: any) => u.id === item.id);
                    return upItem ? { ...item, ...upItem } : item;
                });
                mockDb.save('products', updated);
                return updated as any;
            }

            // MOCK WHATSAPP
            if (endpoint.includes('/whatsapp/status')) {
                return { success: true, data: { status: 'ready', connectionInfo: { pushName: 'Nexarats Admin', phoneNumber: '9100000000', platform: 'Mock' }, queueLength: 0, reconnectAttempts: 0, uptime: 3600 } } as any;
            }

            if (endpoint.includes('/whatsapp/qr')) {
                return { success: true, qr: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_WHATSAPP_QR' } as any;
            }

            if (endpoint.includes('/invoices/send-bulk-message')) {
                const { customers } = body;
                return { success: true, sent: customers.length, failed: 0, skipped: 0 } as any;
            }

            // DELETE
            if (method === 'DELETE' && segments.length === 2) {
                const data = mockDb.get(path);
                mockDb.save(path, data.filter((item: any) => item.id !== segments[1]));
                return { success: true } as any;
            }
        }
        throw error;
    }
}

/**
 * Layer 2: Resource Factory (Layering Pattern)
 * Reduces repetition for standard CRUD operations.
 */
const createResource = <T>(path: string, seedKey?: string) => ({
    getAll: () => request<T[]>(path),
    getOne: (id: string) => request<T>(`${path}/${id}`),
    create: (data: any) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<T>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`${path}/${id}`, { method: 'DELETE' }),
    seed: (items?: any[]) => request<any>(`${path}/seed`, {
        method: 'POST',
        body: items ? JSON.stringify({ [seedKey || path.replace('/', '')]: items }) : undefined
    }),
});

/**
 * Layer 3: Consolidated API Implementation
 * Exposes a single 'api' key with partitioned resources.
 */
export const api = {
    products: {
        ...createResource<any>('/products', 'products'),
        bulkUpdate: (products: any[]) =>
            request<any[]>('/products/bulk/update', { method: 'PUT', body: JSON.stringify({ products }) }),
    },

    customers: createResource<any>('/customers', 'customers'),

    vendors: createResource<any>('/vendors', 'vendors'),

    transactions: {
        ...createResource<any>('/transactions'),
        getBySource: (source: 'online' | 'offline') =>
            request<any[]>(`/transactions/source/${source}`),
    },

    purchases: {
        getAll: () => request<any[]>('/purchases'),
        create: (data: any) => request<any>('/purchases', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: any) => request<any>(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => request<any>(`/purchases/${id}`, { method: 'DELETE' }),
    },

    users: {
        ...createResource<any>('/users', 'users'),
        login: (email: string, password: string) =>
            request<any>('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    },

    whatsapp: {
        getStatus: () => request<any>('/whatsapp/status'),
        getQr: () => request<any>('/whatsapp/qr'),
        send: (data: any) => request<any>('/whatsapp/send', { method: 'POST', body: JSON.stringify(data) }),
        sendReceipt: (to: string, receipt: any) =>
            request<any>('/whatsapp/send-receipt', { method: 'POST', body: JSON.stringify({ to, receipt }) }),
        sendBulk: (messages: any[]) =>
            request<any>('/whatsapp/send-bulk', { method: 'POST', body: JSON.stringify({ messages }) }),
        getMessages: (params?: any) => {
            const query = new URLSearchParams(params as any);
            return request<any>(`/whatsapp/messages?${query.toString()}`);
        },
        requestPairingCode: (phoneNumber: string) =>
            request<any>('/whatsapp/pair', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
        logout: () => request<any>('/whatsapp/logout', { method: 'POST' }),
        restart: () => request<any>('/whatsapp/restart', { method: 'POST' }),
    },

    auth: {
        sendOtp: (phone: string) =>
            request<any>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
        verifyOtp: (phone: string, otp: string) =>
            request<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
        checkSession: (token: string) =>
            request<any>('/auth/session', { headers: { 'X-Session-Token': token } }),
        logout: (token: string) =>
            request<any>('/auth/logout', { method: 'POST', headers: { 'X-Session-Token': token } }),
        getProfile: (token: string) =>
            request<any>('/auth/profile', { headers: { 'X-Session-Token': token } }),
        updateProfile: (token: string, data: any) =>
            request<any>('/auth/profile', { method: 'PUT', headers: { 'X-Session-Token': token }, body: JSON.stringify(data) }),
        addAddress: (token: string, address: any) =>
            request<any>('/auth/addresses', { method: 'POST', headers: { 'X-Session-Token': token }, body: JSON.stringify(address) }),
        updateAddress: (token: string, addrId: string, address: any) =>
            request<any>(`/auth/addresses/${addrId}`, { method: 'PUT', headers: { 'X-Session-Token': token }, body: JSON.stringify(address) }),
        deleteAddress: (token: string, addrId: string) =>
            request<any>(`/auth/addresses/${addrId}`, { method: 'DELETE', headers: { 'X-Session-Token': token } }),
        getOrders: (token: string) =>
            request<any>('/auth/orders', { headers: { 'X-Session-Token': token } }),
        getStoreCustomers: () =>
            request<any>('/auth/store-customers'),
        getWishlist: (token: string) =>
            request<any>('/auth/wishlist', { headers: { 'X-Session-Token': token } }),
        addToWishlist: (token: string, productId: string) =>
            request<any>('/auth/wishlist', { method: 'POST', headers: { 'X-Session-Token': token }, body: JSON.stringify({ productId }) }),
        removeFromWishlist: (token: string, productId: string) =>
            request<any>(`/auth/wishlist/${productId}`, { method: 'DELETE', headers: { 'X-Session-Token': token } }),
        signup: (phone: string, name: string, password: string) =>
            request<any>('/auth/signup', { method: 'POST', body: JSON.stringify({ phone, name, password }) }),
        loginWithPassword: (phone: string, password: string) =>
            request<any>('/auth/login-password', { method: 'POST', body: JSON.stringify({ phone, password }) }),
        setPassword: (token: string, password: string) =>
            request<any>('/auth/set-password', { method: 'POST', headers: { 'X-Session-Token': token }, body: JSON.stringify({ password }) }),
    },

    invoices: {
        generate: async (transactionId: string, format: 'a4' | 'thermal' = 'a4', shopSettings?: any) => {
            const res = await fetch(`${API_BASE}/invoices/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, format, shopSettings }),
            });
            if (!res.ok) throw new Error('PDF generation failed');
            return res.blob();
        },
        generateDirect: async (bill: any, shopSettings?: any, format: 'a4' | 'thermal' = 'a4') => {
            const res = await fetch(`${API_BASE}/invoices/generate-direct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bill, shopSettings, format }),
            });
            if (!res.ok) throw new Error('PDF generation failed');
            return res.blob();
        },
        sendWhatsApp: (bill: any, shopSettings?: any, format: 'a4' | 'thermal' = 'a4') =>
            request<any>('/invoices/send-whatsapp', { method: 'POST', body: JSON.stringify({ bill, shopSettings, format }) }),
        sendBulkMessage: (customers: any[], messageTemplate: string) =>
            request<any>('/invoices/send-bulk-message', { method: 'POST', body: JSON.stringify({ customers, messageTemplate }) }),
    }
};

