import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Volume2, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const NotificationSettings: React.FC = () => {
    const [settings, setSettings] = useLocalStorage('nx_notification_settings', {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        lowStockAlert: true,
        paymentReminder: true,
        orderUpdates: true,
        weeklyReport: false,
        soundEnabled: true,
    });
    const [justSaved, setJustSaved] = useState(false);

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
    };

    const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">Notification Settings</h2>
                {justSaved && (
                    <div className="flex items-center space-x-2 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-right-4">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Changes Saved</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Channels</h3>
                {[
                    { key: 'emailNotifications' as const, icon: Mail, label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'smsNotifications' as const, icon: Smartphone, label: 'SMS Notifications', desc: 'Receive SMS alerts on your phone' },
                    { key: 'pushNotifications' as const, icon: Bell, label: 'Push Notifications', desc: 'Browser and mobile push alerts' },
                    { key: 'soundEnabled' as const, icon: Volume2, label: 'Notification Sound', desc: 'Play sound for new notifications' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-sm transition-all">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center"><item.icon className="w-3.5 h-3.5 text-slate-500" /></div>
                            <div><p className="font-bold text-sm text-slate-900">{item.label}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
                        </div>
                        <ToggleSwitch enabled={settings[item.key]} onChange={() => toggle(item.key)} />
                    </div>
                ))}
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Alert Types</h3>
                {[
                    { key: 'lowStockAlert' as const, label: 'Low Stock Alerts', desc: 'When inventory falls below threshold' },
                    { key: 'paymentReminder' as const, label: 'Payment Reminders', desc: 'Upcoming and overdue payments' },
                    { key: 'orderUpdates' as const, label: 'Order Updates', desc: 'New orders and status changes' },
                    { key: 'weeklyReport' as const, label: 'Weekly Digest', desc: 'Summary report every Monday' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-sm transition-all">
                        <div><p className="font-bold text-sm text-slate-900">{item.label}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
                        <ToggleSwitch enabled={settings[item.key]} onChange={() => toggle(item.key)} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationSettings;


