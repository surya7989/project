import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import confetti from 'canvas-confetti';

const GSTSettings: React.FC = () => {
    const [config, setConfig] = useLocalStorage('nx_gst_config', {
        gstNumber: '1234567890',
        enableCGST: true,
        enableSGST: true,
        enableIGST: false,
        enableComposition: false,
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#0284C7', '#10B981']
        });
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">GST Configuration</h2>
                <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-sm font-bold text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {saved ? <CheckCircle2 className="w-3.5 h-3.5 animate-in zoom-in" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saved ? 'Saved!' : 'Save'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">GSTIN Number</label>
                    <input value={config.gstNumber} onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </div>

            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Tax Components</h3>
                {[
                    { key: 'enableCGST', label: 'CGST (Central GST)', desc: 'Applied for intra-state transactions' },
                    { key: 'enableSGST', label: 'SGST (State GST)', desc: 'Applied for intra-state transactions' },
                    { key: 'enableIGST', label: 'IGST (Integrated GST)', desc: 'Applied for inter-state transactions' },
                    { key: 'enableComposition', label: 'Composition Scheme', desc: 'Simplified tax for small businesses' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                        <div><p className="font-bold text-sm text-slate-900">{item.label}</p><p className="text-xs text-slate-400">{item.desc}</p></div>
                        <button
                            onClick={() => setConfig(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(config as any)[item.key] ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${(config as any)[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GSTSettings;


