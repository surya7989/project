import React, { useState } from 'react';
import { Shield, Key, Smartphone, Monitor, Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import confetti from 'canvas-confetti';

const SecuritySettings: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
    const [settings, setSettings] = useLocalStorage('nx_security_settings', {
        twoFactor: false,
        loginAlerts: true,
        sessionTimeout: '30',
        ipRestriction: false,
    });
    const [saved, setSaved] = useState(false);

    const handleUpdatePassword = async () => {
        if (!passwords.newPassword || passwords.newPassword !== passwords.confirm) {
            alert("Passwords don't match or are empty!");
            return;
        }

        try {
            // In a real app, this would be an API call
            // For our enhanced mock, we update the local storage user record
            const users = JSON.parse(localStorage.getItem('nx_users') || '[]');
            const currentUser = JSON.parse(sessionStorage.getItem('nx_user') || 'null');

            if (!currentUser) return;

            const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
            if (userIndex === -1) return;

            // Generate SHA-256 hash
            const encoder = new TextEncoder();
            const data = encoder.encode(passwords.newPassword);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashedValue = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            users[userIndex].password = hashedValue;
            localStorage.setItem('nx_users', JSON.stringify(users));

            setSaved(true);
            confetti({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.6 },
                colors: ['#10B981', '#059669']
            });
            setPasswords({ current: '', newPassword: '', confirm: '' });
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Password update failed:', error);
        }
    };

    const sessions = [
        { device: 'Chrome on Windows', location: 'Mumbai, India', time: 'Active now', current: true },
        { device: 'Safari on iPhone', location: 'Mumbai, India', time: '2 hours ago', current: false },
        { device: 'Firefox on MacOS', location: 'Pune, India', time: '1 day ago', current: false },
    ];

    const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-sm flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">Security & Privacy</h2>
            </div>

            {/* Change Password */}
            <div className="p-4 lg:p-6 bg-slate-50 rounded space-y-4">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center space-x-2"><Key className="w-3.5 h-3.5" /><span>Change Password</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                        <label className="text-xs font-bold text-slate-400">Current Password</label>
                        <input type={showPassword ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400">New Password</label>
                        <input type={showPassword ? "text" : "password"} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400">Confirm Password</label>
                        <input type={showPassword ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-sm outline-none" />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={() => setShowPassword(!showPassword)} className="flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}<span>{showPassword ? 'Hide' : 'Show'} passwords</span>
                    </button>
                    <button
                        onClick={handleUpdatePassword}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-sm font-bold text-sm transition-all ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                    >
                        {saved ? <CheckCircle2 className="w-4 h-4 animate-in zoom-in" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{saved ? 'Updated!' : 'Update'}</span>
                    </button>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Security Options */}
            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Security Options</h3>
                {[
                    { key: 'twoFactor' as const, icon: Smartphone, label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
                    { key: 'loginAlerts' as const, icon: AlertCircle, label: 'Login Alerts', desc: 'Get notified when someone logs into your account' },
                    { key: 'ipRestriction' as const, icon: Shield, label: 'IP Restriction', desc: 'Restrict access to specific IP addresses' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-sm transition-all">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center"><item.icon className="w-3.5 h-3.5 text-slate-500" /></div>
                            <div><p className="font-bold text-sm text-slate-900">{item.label}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
                        </div>
                        <ToggleSwitch enabled={settings[item.key]} onChange={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                    </div>
                ))}
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-sm">
                    <div><p className="font-bold text-sm text-slate-900">Session Timeout</p><p className="text-xs text-slate-400">Auto-logout after inactivity</p></div>
                    <select value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none">
                        <option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hour</option><option value="120">2 hours</option>
                    </select>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Active Sessions */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Active Sessions</h3>
                    <button className="text-xs font-bold text-red-500 hover:underline">Revoke All</button>
                </div>
                {sessions.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                        <div className="flex items-center space-x-3">
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                                <p className="font-bold text-sm text-slate-900">{s.device}{s.current && <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-black">Current</span>}</p>
                                <p className="text-xs text-slate-400">{s.location} · {s.time}</p>
                            </div>
                        </div>
                        {!s.current && <button className="text-xs font-bold text-red-500 hover:underline">Revoke</button>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecuritySettings;


