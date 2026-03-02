import React, { useState } from 'react';
import { Clock, Bell, MessageSquare, Mail, Save, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import confetti from 'canvas-confetti';

const RemindersSettings: React.FC = () => {
    const [config, setConfig] = useLocalStorage('nx_reminders_config', {
        paymentReminder: true,
        stockReminder: true,
        expiryReminder: true,
        gstFilingReminder: true,
        paymentFrequency: '3',
        stockThreshold: '10',
        expiryDays: '30',
        reminderTime: '09:00',
        channels: { email: true, sms: false, whatsapp: true, push: true },
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#2563EB']
        });
        setTimeout(() => setSaved(false), 3000);
    };

    const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-sm flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-900">Reminders</h2>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-sm font-bold text-sm transition-all ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg shadow-blue-100`}
                >
                    {saved ? <CheckCircle2 className="w-4 h-4 animate-in zoom-in" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saved ? 'Saved!' : 'Save'}</span>
                </button>
            </div>

            {/* Reminder Types */}
            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Automated Reminders</h3>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                    <div>
                        <p className="font-bold text-sm text-slate-900">Payment Reminders</p>
                        <p className="text-xs text-slate-400">Send automatic reminders for pending payments</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select value={config.paymentFrequency} onChange={(e) => setConfig({ ...config, paymentFrequency: e.target.value })} className="px-3 py-1.5 border border-slate-200 rounded-sm text-xs outline-none">
                            <option value="1">Every day</option><option value="3">Every 3 days</option><option value="7">Weekly</option><option value="15">Bi-weekly</option>
                        </select>
                        <ToggleSwitch enabled={config.paymentReminder} onChange={() => setConfig(prev => ({ ...prev, paymentReminder: !prev.paymentReminder }))} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                    <div>
                        <p className="font-bold text-sm text-slate-900">Low Stock Alerts</p>
                        <p className="text-xs text-slate-400">Alert when stock falls below threshold</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-400">Below</span>
                            <input type="number" value={config.stockThreshold} onChange={(e) => setConfig({ ...config, stockThreshold: e.target.value })} className="w-14 px-2 py-1.5 border border-slate-200 rounded-sm text-xs text-center outline-none" />
                            <span className="text-xs text-slate-400">units</span>
                        </div>
                        <ToggleSwitch enabled={config.stockReminder} onChange={() => setConfig(prev => ({ ...prev, stockReminder: !prev.stockReminder }))} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                    <div>
                        <p className="font-bold text-sm text-slate-900">Expiry Reminders</p>
                        <p className="text-xs text-slate-400">Notify before product expiry</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                            <input type="number" value={config.expiryDays} onChange={(e) => setConfig({ ...config, expiryDays: e.target.value })} className="w-14 px-2 py-1.5 border border-slate-200 rounded-sm text-xs text-center outline-none" />
                            <span className="text-xs text-slate-400">days before</span>
                        </div>
                        <ToggleSwitch enabled={config.expiryReminder} onChange={() => setConfig(prev => ({ ...prev, expiryReminder: !prev.expiryReminder }))} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                    <div>
                        <p className="font-bold text-sm text-slate-900">GST Filing Reminder</p>
                        <p className="text-xs text-slate-400">Remind before GST filing deadlines</p>
                    </div>
                    <ToggleSwitch enabled={config.gstFilingReminder} onChange={() => setConfig(prev => ({ ...prev, gstFilingReminder: !prev.gstFilingReminder }))} />
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Timing */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                <div><p className="font-bold text-sm text-slate-900">Default Reminder Time</p><p className="text-xs text-slate-400">Time of day to send reminders</p></div>
                <input type="time" value={config.reminderTime} onChange={(e) => setConfig({ ...config, reminderTime: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none" />
            </div>

            <hr className="border-slate-100" />

            {/* Channels */}
            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Reminder Channels</h3>
                {[
                    { key: 'email' as const, icon: Mail, label: 'Email' },
                    { key: 'sms' as const, icon: Bell, label: 'SMS' },
                    { key: 'whatsapp' as const, icon: MessageSquare, label: 'WhatsApp' },
                    { key: 'push' as const, icon: Bell, label: 'Push Notifications' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-sm transition-all">
                        <div className="flex items-center space-x-3">
                            <item.icon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-sm text-slate-900">{item.label}</span>
                        </div>
                        <ToggleSwitch
                            enabled={config.channels[item.key]}
                            onChange={() => setConfig(prev => ({ ...prev, channels: { ...prev.channels, [item.key]: !prev.channels[item.key] } }))}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RemindersSettings;


