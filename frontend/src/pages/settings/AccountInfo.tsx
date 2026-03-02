import React from 'react';
import { Info, Calendar, Package, Users, Database, Globe } from 'lucide-react';

const AccountInfo: React.FC = () => {
    const accountData = {
        plan: 'Professional',
        accountId: 'NXR-2024-001',
        createdOn: 'January 15, 2024',
        renewalDate: 'January 15, 2025',
        storage: { used: 2.4, total: 10 },
        products: { count: 156, limit: 5000 },
        users: { count: 3, limit: 10 },
        invoices: { count: 1240, limit: 'Unlimited' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-sm flex items-center justify-center">
                    <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">Account Information</h2>
            </div>

            {/* Plan Info */}
            <div className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Current Plan</p>
                        <h3 className="text-2xl font-black mt-1">{accountData.plan}</h3>
                        <p className="text-blue-200 text-xs mt-1">Account ID: {accountData.accountId}</p>
                    </div>
                    <button className="px-6 py-3 bg-white text-blue-600 rounded-sm font-black text-sm">Upgrade Plan</button>
                </div>
            </div>

            {/* Key Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded flex items-center space-x-4">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Account Created</p>
                        <p className="font-black text-slate-900">{accountData.createdOn}</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 rounded flex items-center space-x-4">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Next Renewal</p>
                        <p className="font-black text-slate-900">{accountData.renewalDate}</p>
                    </div>
                </div>
            </div>

            {/* Usage */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Usage Overview</h3>
                {[
                    { icon: Database, label: 'Storage', used: `${accountData.storage.used} GB`, total: `${accountData.storage.total} GB`, pct: (accountData.storage.used / accountData.storage.total) * 100, color: 'bg-blue-600' },
                    { icon: Package, label: 'Products', used: accountData.products.count.toString(), total: accountData.products.limit.toString(), pct: (accountData.products.count / accountData.products.limit) * 100, color: 'bg-green-500' },
                    { icon: Users, label: 'Team Members', used: accountData.users.count.toString(), total: accountData.users.limit.toString(), pct: (accountData.users.count / accountData.users.limit) * 100, color: 'bg-purple-500' },
                    { icon: Globe, label: 'Invoices', used: accountData.invoices.count.toString(), total: accountData.invoices.limit.toString(), pct: 12, color: 'bg-orange-500' },
                ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <item.icon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold text-sm text-slate-900">{item.label}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{item.used} / {item.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className={`${item.color} rounded-full h-2 transition-all`} style={{ width: `${Math.min(item.pct, 100)}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountInfo;


