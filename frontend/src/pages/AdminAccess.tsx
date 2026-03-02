import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Key, History, UserPlus, Search, MoreVertical, ShieldAlert, CheckCircle2, XCircle, Trash2, Edit2, X, Save, Eye, EyeOff, Lock } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Portal from '../components/Portal';
import { Plus } from 'lucide-react';
import { api } from '../services/api';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Inactive';
    lastLogin: string;
    permissions: Record<string, AccessLevel>;
    password?: string;
}

const ALL_LEVELS: AccessLevel[] = ['manage', 'cru', 'read', 'none'];

const ACCESS_MODULES = [
    { id: 'dashboard', label: 'Dashboard', levels: ALL_LEVELS },
    { id: 'billing', label: 'Billing', levels: ALL_LEVELS },
    { id: 'inventory', label: 'Inventory', levels: ALL_LEVELS },
    { id: 'customers', label: 'Customers', levels: ALL_LEVELS },
    { id: 'vendors', label: 'Vendors', levels: ALL_LEVELS },
    { id: 'analytics', label: 'Analytics', levels: ALL_LEVELS },
    { id: 'settings', label: 'Settings', levels: ALL_LEVELS },
    { id: 'online-store', label: 'Online Store', levels: ALL_LEVELS },
    { id: 'admin', label: 'Admin Access', levels: ALL_LEVELS }
];

const LEVEL_DESCRIPTIONS: Record<AccessLevel, string> = {
    manage: 'Full control (CRUD + administrative actions).',
    cru: 'Create, Read, Update, and Delete access.',
    read: 'View-only access.',
    none: 'No access (hidden from sidebar).'
};

type AccessLevel = 'manage' | 'cru' | 'read' | 'none';

const PERMISSION_MATRIX: Record<string, Record<string, AccessLevel>> = {
    'Super Admin': {
        'dashboard': 'manage', 'billing': 'manage', 'inventory': 'manage', 'customers': 'manage', 'vendors': 'manage',
        'analytics': 'manage', 'settings': 'manage', 'online-store': 'manage', 'admin': 'manage'
    },
    'Admin': {
        'dashboard': 'manage', 'billing': 'manage', 'inventory': 'manage', 'customers': 'manage', 'vendors': 'manage',
        'analytics': 'manage', 'settings': 'manage', 'online-store': 'manage', 'admin': 'manage'
    },
    'Manager': {
        'dashboard': 'read', 'billing': 'manage', 'inventory': 'manage', 'customers': 'manage', 'vendors': 'manage',
        'analytics': 'manage', 'settings': 'none', 'online-store': 'manage', 'admin': 'read'
    },
    'Cashier': {
        'dashboard': 'none', 'billing': 'manage', 'inventory': 'read', 'customers': 'read', 'vendors': 'none',
        'analytics': 'none', 'settings': 'none', 'online-store': 'none', 'admin': 'none'
    },
    'Staff': {
        'dashboard': 'none', 'billing': 'cru', 'inventory': 'read', 'customers': 'read', 'vendors': 'none',
        'analytics': 'none', 'settings': 'none', 'online-store': 'none', 'admin': 'none'
    },
    'Accountant': {
        'dashboard': 'read', 'billing': 'read', 'inventory': 'read', 'customers': 'read', 'vendors': 'manage',
        'analytics': 'manage', 'settings': 'none', 'online-store': 'none', 'admin': 'none'
    },
    'Delivery Agent': {
        'dashboard': 'none', 'billing': 'none', 'inventory': 'none', 'customers': 'manage', 'vendors': 'none',
        'analytics': 'none', 'settings': 'none', 'online-store': 'none', 'admin': 'none'
    }
};

import { Page, User, AccessLevel as GlobalAccessLevel } from '../types';

interface AdminAccessProps {
    user?: User | null;
}

const AdminAccess: React.FC<AdminAccessProps> = ({ user }) => {
    const permissionLevel = (user?.role === 'Super Admin') ? 'manage' : (user?.permissions?.['admin'] || 'manage');
    const isReadOnly = permissionLevel === 'read';
    const canManageUsers = permissionLevel === 'manage';

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [expandedModule, setExpandedModule] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);


    // New User Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Manager',
        status: 'Active' as const,
        permissions: PERMISSION_MATRIX['Manager']
    });

    const defaultUsers: AdminUser[] = [
        { id: '1', name: 'Surya Teja', email: 'surya@nexarats.com', role: 'Super Admin', status: 'Active', lastLogin: '10 mins ago', permissions: PERMISSION_MATRIX['Super Admin'], password: 'admin123' },
        { id: '2', name: 'Rahul Kumar', email: 'saisurya7989@gmail.com', role: 'Manager', status: 'Active', lastLogin: 'Never', permissions: PERMISSION_MATRIX['Manager'], password: 'rahulkumar7989' },
        { id: '3', name: 'Nexa Staff', email: 'staff@nexarats.com', role: 'Staff', status: 'Active', lastLogin: 'Yesterday', permissions: PERMISSION_MATRIX['Staff'], password: 'staff123' },
        { id: '4', name: 'Accountant', email: 'accounts@nexarats.com', role: 'Accountant', status: 'Inactive', lastLogin: '5 days ago', permissions: PERMISSION_MATRIX['Accountant'], password: 'accounts123' }
    ];

    const [users, setUsers] = useState<AdminUser[]>(defaultUsers);

    // Load users from MongoDB on mount, fallback to localStorage
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const apiUsers = await api.users.getAll();
                if (apiUsers && apiUsers.length > 0) {
                    setUsers(apiUsers.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        status: u.status || 'Active',
                        lastLogin: u.lastLogin || 'Never',
                        permissions: u.permissions || {},
                        password: u.password || '',
                    })));
                    // Keep localStorage in sync for Login fallback
                    localStorage.setItem('nx_admin_users', JSON.stringify(apiUsers));
                } else {
                    // If MongoDB is empty, use localStorage defaults
                    const stored = localStorage.getItem('nx_admin_users');
                    if (stored) setUsers(JSON.parse(stored));
                }
            } catch {
                // API unreachable — use localStorage
                const stored = localStorage.getItem('nx_admin_users');
                if (stored) setUsers(JSON.parse(stored));
            }
        };
        loadUsers();
    }, []);

    // Keep localStorage in sync whenever users change (for Login fallback)
    useEffect(() => {
        localStorage.setItem('nx_admin_users', JSON.stringify(users));
    }, [users]);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInvite = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert('Please fill in all mandatory fields (Name, Email, Password)');
            return;
        }

        const userToAdd: AdminUser = {
            id: `ADM-${Date.now()}`,
            name: newUser.name.trim(),
            email: newUser.email.trim().toLowerCase(),
            password: newUser.password,
            role: newUser.role,
            status: newUser.status,
            lastLogin: 'Never',
            permissions: newUser.permissions
        };

        try {
            setIsSaving(true);
            await api.users.create(userToAdd);
            setUsers(prev => [userToAdd, ...prev]);
            setNewUser({ name: '', email: '', password: '', role: 'Manager', status: 'Active', permissions: PERMISSION_MATRIX['Manager'] });
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('User create sync error:', err);
            alert(`Failed to create user: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (moduleId: string, level: AccessLevel, isDraft: boolean = true) => {
        if (isDraft) {
            setNewUser(prev => ({
                ...prev,
                permissions: { ...prev.permissions, [moduleId]: level }
            }));
        } else {
            setEditingUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    permissions: { ...prev.permissions, [moduleId]: level }
                };
            });
        }
    };

    const cyclePermission = (moduleId: string, isDraft: boolean = true) => {
        const module = ACCESS_MODULES.find(m => m.id === moduleId);
        if (!module) return;

        const currentPerms = isDraft ? newUser.permissions : editingUser?.permissions;
        const currentLevel = currentPerms ? currentPerms[moduleId] : 'none';
        const currentIndex = module.levels.indexOf(currentLevel || 'none');
        const nextIndex = (currentIndex + 1) % module.levels.length;
        const nextLevel = module.levels[nextIndex] as AccessLevel;

        togglePermission(moduleId, nextLevel, isDraft);
    };

    const toggleStatus = (id: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id === id) {
                const updated = { ...u, status: (u.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive' };
                api.users.update(id, { status: updated.status }).catch(err => console.error('User status sync error:', err));
                return updated;
            }
            return u;
        }));
    };

    const deleteUser = (id: string) => {
        if (window.confirm('Are you sure you want to revoke access for this user?')) {
            setUsers(prev => prev.filter(u => u.id !== id));
            api.users.delete(id).catch(err => console.error('User delete sync error:', err));
        }
    };

    const stats = [
        { label: 'Total Admins', value: users.length.toString(), icon: Users, color: 'bg-blue-500' },
        { label: 'Active Sessions', value: users.filter(u => u.status === 'Active').length.toString(), icon: Key, color: 'bg-emerald-500' },
        { label: 'Platform Type', value: 'Enterprise', icon: ShieldCheck, color: 'bg-slate-900' },
        { label: 'Audit Ready', value: 'Yes', icon: History, color: 'bg-purple-600' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-sm flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-xl lg:text-2xl font-black text-slate-900 uppercase leading-none">Admin Access Control</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage platform permissions and user credentials</p>
                    </div>
                </div>
                {canManageUsers && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-sm font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-100"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite User</span>
                    </button>
                )}
            </div>

            {isReadOnly && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-orange-600 p-1.5 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-orange-900 uppercase">View Only Mode</p>
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">You have restricted access to administrator management</p>
                    </div>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded border border-slate-100 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-sm ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* User Management Table */}
            <div className="bg-white rounded border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Access Management</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find by name, email or role..."
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded text-xs font-bold outline-none focus:border-red-500 focus:bg-white transition-all w-full sm:w-80 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">User Details</th>
                                <th className="px-8 py-5">Role / Permissions</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5">Last Activity</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.length > 0 ? filteredUsers.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 text-sm border border-slate-200 group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                                {item.name?.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">{item.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest inline-block w-fit ${item.role.includes('Admin') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {item.role}
                                            </span>
                                            <p className="text-[9px] font-bold text-slate-400 truncate max-w-[150px]">
                                                {Object.values(item.permissions || {}).filter(l => l !== 'none').length} Modules Enabled
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => canManageUsers && toggleStatus(item.id)}
                                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all border ${canManageUsers ? 'cursor-pointer' : 'cursor-default'} ${item.status === 'Active'
                                                    ? 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100'
                                                    : 'text-slate-400 bg-slate-50 border-slate-100 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {item.status === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                <span className="text-[10px] font-black uppercase">{item.status}</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-500">{item.lastLogin}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canManageUsers && (
                                                <>
                                                    <button
                                                        onClick={() => setEditingUser(item)}
                                                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(item.id)}
                                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No matching administrators found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {isModalOpen && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-slate-50 rounded-[24px] w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-300">
                            {/* Header */}
                            <div className="px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                                        <div className="bg-white/20 p-1.5 rounded-lg">
                                            <UserPlus className="w-3 h-3 text-white" />
                                        </div>
                                        Authorize New System Administrator
                                    </h2>
                                    <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest mt-0.5 ml-9">Security & Access Management</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"><X className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50">
                                <div className="grid grid-cols-1 md:grid-cols-[1.1fr,2fr] h-full">
                                    {/* Left Side: Basic Info */}
                                    <div className="p-8 space-y-8 bg-white border-r border-slate-100">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full mt-1.5 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-700 shadow-sm"
                                                    placeholder="Rahul Kumar"
                                                    value={newUser.name}
                                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full mt-1.5 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-700 shadow-sm"
                                                    placeholder="rahul@nexarats.com"
                                                    value={newUser.email}
                                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Password</label>
                                                <div className="relative mt-1.5">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-black text-slate-700 shadow-sm tracking-widest"
                                                        placeholder="••••••••"
                                                        value={newUser.password}
                                                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                                    />
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hidden" />
                                                    <button
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designated Role</label>
                                                <select
                                                    className="w-full mt-1.5 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-black text-slate-700 appearance-none shadow-sm"
                                                    value={newUser.role}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value;
                                                        setNewUser(prev => ({
                                                            ...prev,
                                                            role: newRole,
                                                            permissions: PERMISSION_MATRIX[newRole] || prev.permissions
                                                        }));
                                                    }}
                                                >
                                                    <option>Super Admin</option>
                                                    <option>Admin</option>
                                                    <option>Manager</option>
                                                    <option>Cashier</option>
                                                    <option>Accountant</option>
                                                    <option>Staff</option>
                                                    <option>Delivery Agent</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Permissions Scope */}
                                    <div className="p-8 bg-slate-50 flex flex-col overflow-hidden">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Module access authority</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure granular permissions</p>
                                            </div>
                                            <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase">
                                                {ACCESS_MODULES.length} Modules
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3 pb-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                {ACCESS_MODULES.map((module) => {
                                                    const level = newUser.permissions[module.id] || 'none';
                                                    return (
                                                        <div key={module.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-red-500 transition-all">
                                                            <div className="flex flex-col min-w-0 pr-2">
                                                                <span className="text-[10px] font-black text-slate-900 uppercase truncate mb-0.5">{module.label}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic truncate">Click to cycle access</span>
                                                            </div>
                                                            <button
                                                                onClick={() => cyclePermission(module.id, true)}
                                                                className={`min-w-[85px] px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all border shadow-sm ${level === 'manage' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' :
                                                                    level === 'cru' ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100' :
                                                                        level === 'read' ? 'bg-orange-500 border-orange-500 text-white shadow-orange-100' :
                                                                            'bg-slate-50 border-slate-200 text-slate-400 shadow-none'
                                                                    }`}
                                                            >
                                                                {level}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-slate-200 flex gap-4">
                                            <button
                                                onClick={() => setIsModalOpen(false)}
                                                className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                disabled={isSaving}
                                                onClick={handleInvite}
                                                className={`py-4 bg-red-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-200 flex-[2] active:scale-[0.98] ${isSaving ? 'opacity-80 cursor-wait' : 'hover:bg-red-700'}`}
                                            >
                                                {isSaving ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Authorising...
                                                    </div>
                                                ) : (
                                                    'Authorise User Access'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-slate-50 rounded-[24px] w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-300">
                            {/* Header */}
                            <div className="px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                                        <div className="bg-white/20 p-1.5 rounded-lg">
                                            <Edit2 className="w-3 h-3 text-white" />
                                        </div>
                                        Modify Administrative Authority
                                    </h2>
                                    <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest mt-0.5 ml-9">Security Control Center</p>
                                </div>
                                <button onClick={() => setEditingUser(null)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"><X className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50">
                                <div className="grid grid-cols-1 md:grid-cols-[1.1fr,2fr] h-full">
                                    {/* Left Side: Basic Info */}
                                    <div className="p-8 space-y-8 bg-white border-r border-slate-100">
                                        <div className="flex items-center space-x-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                            <div className="w-14 h-14 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white">
                                                {editingUser.name?.charAt(0) || 'A'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-black text-slate-900 truncate">{editingUser.name}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{editingUser.email}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designated Role</label>
                                                <select
                                                    className="w-full mt-1.5 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-black text-slate-700 appearance-none shadow-sm"
                                                    value={editingUser.role}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value;
                                                        setEditingUser(prev => prev ? {
                                                            ...prev,
                                                            role: newRole,
                                                            permissions: PERMISSION_MATRIX[newRole] || prev.permissions
                                                        } : null);
                                                    }}
                                                >
                                                    <option>Super Admin</option>
                                                    <option>Admin</option>
                                                    <option>Manager</option>
                                                    <option>Cashier</option>
                                                    <option>Accountant</option>
                                                    <option>Staff</option>
                                                    <option>Delivery Agent</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change Security Key</label>
                                                <div className="relative mt-1.5">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-black text-slate-700 shadow-sm tracking-widest"
                                                        value={editingUser.password || ''}
                                                        placeholder="Enter new password"
                                                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, password: e.target.value } : null)}
                                                    />
                                                    <button
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Permissions Scope */}
                                    <div className="p-8 bg-slate-50 flex flex-col overflow-hidden">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Access privilege control</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adjust module permissions</p>
                                            </div>
                                            <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase">
                                                {ACCESS_MODULES.length} Systems
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3 pb-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                {ACCESS_MODULES.map((module) => {
                                                    const level = (editingUser.permissions || {})[module.id] || 'none';
                                                    return (
                                                        <div key={module.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-red-500 transition-all">
                                                            <div className="flex flex-col min-w-0 pr-2">
                                                                <span className="text-[10px] font-black text-slate-900 uppercase truncate mb-0.5">{module.label}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic truncate">Click to cycle access</span>
                                                            </div>
                                                            <button
                                                                onClick={() => cyclePermission(module.id, false)}
                                                                className={`min-w-[85px] px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all border shadow-sm ${level === 'manage' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' :
                                                                    level === 'cru' ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100' :
                                                                        level === 'read' ? 'bg-orange-500 border-orange-500 text-white shadow-orange-100' :
                                                                            'bg-slate-50 border-slate-200 text-slate-400 shadow-none'
                                                                    }`}
                                                            >
                                                                {level}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-slate-200">
                                            <button
                                                disabled={isSaving}
                                                onClick={async () => {
                                                    if (editingUser) {
                                                        try {
                                                            setIsSaving(true);
                                                            await api.users.update(editingUser.id, editingUser);
                                                            setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
                                                            setEditingUser(null);
                                                        } catch (err: any) {
                                                            console.error('User update sync error:', err);
                                                            alert(`Failed to update user: ${err.message}`);
                                                        } finally {
                                                            setIsSaving(false);
                                                        }
                                                    }
                                                }}
                                                className={`w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 group active:scale-[0.98] ${isSaving ? 'opacity-80 cursor-wait' : 'hover:bg-black'}`}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Synchronizing Authority...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform text-emerald-400" />
                                                        Commit Authority Updates
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};

export default AdminAccess;
