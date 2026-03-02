import React, { useState } from 'react';
import { Save, Upload, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import confetti from 'canvas-confetti';

const ProfileSettings: React.FC = () => {
    const [profile, setProfile] = useLocalStorage('inv_admin_profile', {
        name: 'Admin',
        email: '',
        phone: '',
        businessName: 'My Store',
        address: '',
        role: 'Administrator',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=random'
    });
    const [saved, setSaved] = useState(false);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setSaved(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0284C7', '#10B981', '#38BDF8']
        });
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">Admin Profile</h2>
                <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-sm font-bold text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {saved ? <CheckCircle2 className="w-3.5 h-3.5 animate-in zoom-in" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saved ? 'Saved!' : 'Save'}</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 lg:p-6 bg-slate-50 rounded">
                <div className="w-20 h-20 rounded bg-blue-100 flex items-center justify-center text-2xl font-black text-blue-600 overflow-hidden shrink-0">
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-lg">{profile.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{profile.role}</p>
                </div>
                <div>
                    <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                    />
                    <label
                        htmlFor="avatar-upload"
                        className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2.5 rounded-sm text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                        <Upload className="w-3.5 h-3.5" /><span>Upload Photo</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone</label>
                    <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Business Name</label>
                    <input value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Address</label>
                    <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} rows={3} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;


