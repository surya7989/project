import React, { useState } from 'react';
import { Palette, Check, Upload, Save, CheckCircle2, Eye, X, Smartphone, Phone, Building2, MapPin, Mail, Printer } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import confetti from 'canvas-confetti';
import Portal from '../../components/Portal';

const themes = [
    { id: 'custom_upload', layout: 'custom_external', name: 'Custom Template (Restaurant)', primary: '#92400E', accent: '#F59E0B', description: 'Power your business with custom-designed hospitality templates. Upload your template folder to synchronize your branding.' },
];

const InvoiceThemes: React.FC = () => {
    const [selectedTheme, setSelectedTheme] = useLocalStorage('nx_invoice_theme', 'classic');
    const [config, setConfig] = useLocalStorage('nx_invoice_config', {
        showLogo: true,
        showGST: true,
        showTerms: true,
        termsText: 'Payment is due within 30 days. Late payments may incur additional charges.',
        footerText: 'Thank you for your business!',
    });
    const [saved, setSaved] = useState(false);
    const [previewTheme, setPreviewTheme] = useState<any | null>(null);

    const [adminProfile] = useLocalStorage('inv_admin_profile', {
        businessName: 'My Store',
        address: '123 Business Street, New Delhi',
        phone: '9876543210',
        email: 'contact@mystore.com',
        avatar: ''
    });

    const handleSave = () => {
        setSaved(true);
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#8B5CF6', '#2563EB']
        });
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-sm flex items-center justify-center">
                        <Palette className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-900">Invoice Themes</h2>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-sm font-bold text-sm transition-all ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg shadow-blue-100`}
                >
                    {saved ? <CheckCircle2 className="w-4 h-4 animate-in zoom-in" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saved ? 'Synchronized!' : 'Save & Sync'}</span>
                </button>
            </div>

            {/* Theme Selection Area */}
            <div className="max-w-xl">
                <div className={`relative p-8 rounded-[32px] border-4 border-dashed transition-all group overflow-hidden bg-white ${selectedTheme === 'custom_upload' ? 'border-orange-500 shadow-2xl shadow-orange-500/10' : 'border-slate-100 hover:border-orange-200'}`}>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-110 transition-transform">
                            <Upload className="w-10 h-10 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Upload Template Folder</h3>
                            <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto">Select your restaurant's custom invoice template folder. Supports HTML/CSS and Asset bundles.</p>
                        </div>

                        <div className="flex gap-3">
                            <label className="cursor-pointer px-8 py-3 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Browse Folder
                                <input type="file" className="hidden" />
                            </label>
                            <button className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Review
                            </button>
                        </div>

                        {selectedTheme === 'custom_upload' && (
                            <div className="pt-4 border-t border-slate-100 w-full">
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> Custom Channel Active
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Invoice Options */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Invoice Options</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-sm">
                    <div className="flex items-center space-x-3">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <div><p className="font-bold text-sm text-slate-900">Business Logo</p><p className="text-xs text-slate-400">Upload your logo for invoices</p></div>
                    </div>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-sm text-sm font-bold text-slate-600">Upload</button>
                </div>
                {[
                    { key: 'showLogo', label: 'Show Logo on Invoice' },
                    { key: 'showGST', label: 'Show GST Breakdown' },
                    { key: 'showTerms', label: 'Show Terms & Conditions' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-sm">
                        <p className="font-bold text-sm text-slate-900">{item.label}</p>
                        <button
                            onClick={() => setConfig(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(config as any)[item.key] ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${(config as any)[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Terms & Conditions</label>
                    <textarea value={config.termsText} onChange={(e) => setConfig({ ...config, termsText: e.target.value })} rows={3} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none resize-none text-sm" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Footer Text</label>
                    <input value={config.footerText} onChange={(e) => setConfig({ ...config, footerText: e.target.value })} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-sm outline-none text-sm" />
                </div>
            </div>

            {/* Preview Modal */}
            {previewTheme && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 leading-tight">Invoice Preview</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{previewTheme.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewTheme(null)} className="p-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Modal Content - The Invoice ScrollArea */}
                            <div className="flex-1 overflow-y-auto p-10 bg-slate-100/30">
                                <div className="bg-white shadow-xl mx-auto max-w-3xl p-8 lg:p-12 min-h-[800px] border border-slate-200">
                                    {/* DYNAMIC LAYOUT ENGINE - RENDERING 6 DISTINCT PROFESSIONAL MODELS */}

                                    {previewTheme.layout === 'restaurant_modern' && (
                                        <div className="space-y-12 font-sans">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black italic shadow-lg mb-6" style={{ backgroundColor: previewTheme.primary, color: 'white' }}>
                                                        {adminProfile.businessName?.charAt(0)?.toUpperCase() || 'M'}
                                                    </div>
                                                    <h1 className="text-4xl font-black tracking-tight text-slate-900">{adminProfile.businessName}</h1>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{adminProfile.address}</p>
                                                </div>
                                                <div className="text-right">
                                                    <h1 className="text-6xl font-black tracking-tighter text-slate-100 uppercase mb-6">INVOICE</h1>
                                                    <div className="space-y-1 text-sm font-black text-slate-900 uppercase">
                                                        <p>Inv: #RS-7721</p>
                                                        <p>Date: 21 Feb 2024</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                                                <p className="text-2xl font-black text-slate-900 tracking-tight">Catering Client</p>
                                                <p className="text-sm font-bold text-slate-500">+91 9988776655</p>
                                            </div>

                                            <table className="w-full text-left">
                                                <thead className="border-b-4 border-slate-900">
                                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <th className="py-4">Item</th>
                                                        <th className="py-4 text-center">Qty</th>
                                                        <th className="py-4 text-right">Price</th>
                                                        <th className="py-4 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {[1, 2].map(i => (
                                                        <tr key={i}>
                                                            <td className="py-6 font-black text-slate-900 text-lg">Signature Dish {i}</td>
                                                            <td className="py-6 text-center font-black">2</td>
                                                            <td className="py-6 text-right font-bold text-slate-500">₹6,225</td>
                                                            <td className="py-6 text-right font-black text-slate-900 text-lg">₹12,450</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div className="flex justify-end pt-12">
                                                <div className="w-64 space-y-4">
                                                    <div className="flex justify-between text-xs font-black text-slate-400 uppercase">
                                                        <span>Subtotal</span>
                                                        <span className="text-slate-900">₹24,900</span>
                                                    </div>
                                                    <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-center">
                                                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</span>
                                                        <span className="text-4xl font-black" style={{ color: previewTheme.primary }}>₹12,450</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {previewTheme.layout === 'gst_standard' && (
                                        <div className="space-y-10">
                                            <div className="flex justify-between items-start border-b-4 pb-10" style={{ borderColor: previewTheme.primary }}>
                                                <div className="flex items-center gap-8">
                                                    <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl" style={{ backgroundColor: previewTheme.primary }}>
                                                        {adminProfile.businessName?.charAt(0)?.toUpperCase() || 'M'}
                                                    </div>
                                                    <div>
                                                        <h1 className="text-4xl font-black uppercase tracking-tight" style={{ color: previewTheme.primary }}>{adminProfile.businessName}</h1>
                                                        <div className="mt-3 space-y-1 text-slate-500 font-bold text-sm uppercase tracking-widest">
                                                            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {adminProfile.address}</p>
                                                            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 {adminProfile.phone}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter mb-6">TAX INVOICE</h2>
                                                    <div className="bg-slate-50 px-10 py-6 rounded-3xl border-2 border-slate-100">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Grand Total</p>
                                                        <p className="text-4xl font-black" style={{ color: previewTheme.primary }}>₹12,450.00</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-12">
                                                <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200">Customer Details</p>
                                                    <p className="text-xl font-black text-slate-900 leading-none">Premium Client</p>
                                                    <p className="text-sm font-bold text-slate-500 mt-2">New Delhi, India</p>
                                                </div>
                                                <div className="p-8">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200">Invoice Info</p>
                                                    <div className="space-y-1 text-sm font-black text-slate-900">
                                                        <p className="flex justify-between"><span>No:</span> <span>#VY-001</span></p>
                                                        <p className="flex justify-between"><span>Date:</span> <span>21 Feb 2024</span></p>
                                                    </div>
                                                </div>
                                                <div className="p-8">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200">Payment</p>
                                                    <div className="flex items-center gap-2 text-green-600 font-black uppercase text-sm mt-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Secured - UPI
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-[40px] overflow-hidden border-2 border-slate-100">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                                                        <tr>
                                                            <th className="px-8 py-5">Item Detail</th>
                                                            <th className="px-8 py-5 text-center">Qty</th>
                                                            <th className="px-8 py-5 text-right">Rate</th>
                                                            <th className="px-8 py-5 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {[1, 2].map(i => (
                                                            <tr key={i}>
                                                                <td className="px-8 py-6">
                                                                    <p className="font-black text-slate-900 text-lg">Premium Item {i}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 tracking-widest">HSN: 8471 | MODEL: PR-X</p>
                                                                </td>
                                                                <td className="px-8 py-6 text-center font-black">1</td>
                                                                <td className="px-8 py-6 text-right font-bold text-slate-500">₹6,225.00</td>
                                                                <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">₹6,225.00</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {previewTheme.layout === 'retail_compact' && (
                                        <div className="relative">
                                            <div className="flex flex-col items-center mb-16">
                                                <div className="w-32 h-32 rounded-full mb-6 border-8 border-white shadow-2xl flex items-center justify-center text-white text-5xl font-black" style={{ backgroundColor: previewTheme.primary }}>
                                                    {adminProfile.businessName?.charAt(0)?.toUpperCase() || 'M'}
                                                </div>
                                                <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">{adminProfile.businessName}</h1>
                                                <div className="h-1.5 w-24 rounded-full mt-4" style={{ backgroundColor: previewTheme.accent }}></div>
                                            </div>

                                            <div className="space-y-6">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex justify-between items-center p-8 bg-slate-50 rounded-[40px] border-2 border-transparent hover:border-slate-200 transition-all">
                                                        <div className="flex gap-6 items-center">
                                                            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{ backgroundColor: previewTheme.accent }}>{i}</div>
                                                            <div>
                                                                <p className="text-2xl font-black text-slate-900">Modern Item {i}</p>
                                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Qty: 01 | Premium Pick</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-black text-slate-900">₹4,150.00</p>
                                                            <p className="text-[10px] font-black text-blue-600 uppercase mt-1">Tax Inclusive</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-16 p-10 rounded-[50px] flex justify-between items-center bg-slate-900 text-white shadow-2xl">
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Due</p>
                                                    <h1 className="text-7xl font-black tracking-tighter text-white">₹12,450.00</h1>
                                                </div>
                                                <div className="text-right space-y-4">
                                                    <Smartphone className="w-20 h-20 text-white/10" />
                                                    <p className="text-xs font-black uppercase italic tracking-widest text-slate-500">Scan to Pay</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {previewTheme.layout === 'executive_split' && (
                                        <div className="font-serif">
                                            <div className="flex justify-between items-center mb-32">
                                                <div className="max-w-md">
                                                    <h1 className="text-6xl text-slate-900 leading-none mb-6">{adminProfile.businessName}</h1>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.6em] border-l-4 pl-6" style={{ borderColor: previewTheme.primary }}>{adminProfile.address}</p>
                                                </div>
                                                <div className="text-right border-r-4 pr-12 h-32 flex flex-col justify-center" style={{ borderColor: previewTheme.primary }}>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 font-sans">Statement Balance</p>
                                                    <p className="text-6xl font-black text-slate-900">₹12,450</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-24 mb-32 border-y py-16 border-slate-100">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-10 font-sans">Bill To</p>
                                                    <p className="text-3xl text-slate-900">Executive Partner</p>
                                                    <p className="text-sm text-slate-400 mt-4 leading-loose">The Corporate House, 4th Floor<br />Central Business District, London</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-10 font-sans">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Voucher</p>
                                                        <p className="text-xl font-black text-slate-900">#E-9821</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Status</p>
                                                        <p className="text-xl font-black text-emerald-600">CLEARED</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <table className="w-full mb-32">
                                                <thead className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-400 font-sans tracking-widest">
                                                    <tr>
                                                        <th className="py-8 text-left">Professional Description</th>
                                                        <th className="py-8 text-center">Unit</th>
                                                        <th className="py-8 text-right">Total Fee</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {[1, 2, 3].map(i => (
                                                        <tr key={i}>
                                                            <td className="py-10">
                                                                <p className="text-2xl text-slate-900 mb-1">Corporate Service Phase 0{i}</p>
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-sans">Professional Asset Management</p>
                                                            </td>
                                                            <td className="py-10 text-center text-lg text-slate-500">Fixed</td>
                                                            <td className="py-10 text-right text-2xl font-black text-slate-900">₹4,150.00</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {previewTheme.layout === 'luxury_gold' && (
                                        <div className="bg-[#0f172a] text-white p-16 rounded-[40px] min-h-[900px]">
                                            <div className="flex justify-between items-start mb-32">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.8em]">Private Member Invoice</p>
                                                    <h1 className="text-7xl font-black uppercase tracking-tighter">{adminProfile.businessName}</h1>
                                                </div>
                                                <div className="w-24 h-24 rounded-full border-4 border-amber-500 flex items-center justify-center text-amber-500 text-5xl font-black italic shadow-[0_0_50px_rgba(245,158,11,0.2)]">V</div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-12 bg-white/5 backdrop-blur-3xl p-12 rounded-[50px] border border-white/10 mb-24">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Reference</p>
                                                    <p className="text-2xl font-black tracking-tighter">#LX-PRO-99</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Balance</p>
                                                    <p className="text-2xl font-black tracking-tighter text-amber-500">₹12,450.00</p>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Member Tier</p>
                                                    <p className="text-2xl font-black tracking-tighter uppercase">DIAMOND ELITE</p>
                                                </div>
                                            </div>

                                            {[1, 2].map(i => (
                                                <div key={i} className="flex justify-between items-center py-12 border-b border-white/10 group hover:bg-white/5 px-8 transition-all rounded-3xl">
                                                    <div>
                                                        <h3 className="text-3xl font-black tracking-tight mb-2 uppercase">Luxury Asset Sample {i}</h3>
                                                        <p className="text-xs font-black text-white/40 uppercase tracking-widest">Exclusive Collection | HSN 8471</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-4xl font-black text-amber-500 tracking-tighter">₹6,225.00</p>
                                                        <span className="text-[10px] px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full font-black uppercase">Tax Paid</span>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="mt-32 pt-20 border-t border-white/10 flex justify-between items-end">
                                                <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em] italic leading-loose">Secure Transaction Verified<br />Auth by NexaRats Premium</p>
                                                <h1 className="text-9xl font-black tracking-tighter italic opacity-10">GOLD</h1>
                                            </div>
                                        </div>
                                    )}

                                    {previewTheme.layout === 'business_robust' && (
                                        <div className="border-[4px] p-6 shadow-sm" style={{ borderColor: previewTheme.primary }}>
                                            <div className="flex border-b-4 pb-0 mb-12" style={{ borderColor: previewTheme.primary }}>
                                                <div className="w-2/3 p-10 bg-slate-50 border-r-4" style={{ borderColor: previewTheme.primary }}>
                                                    <h1 className="text-5xl font-black uppercase tracking-tighter" style={{ color: previewTheme.primary }}>{adminProfile.businessName}</h1>
                                                    <div className="mt-6 text-xs font-black text-slate-500 uppercase tracking-widest space-y-2">
                                                        <p className="flex items-center gap-3"><Building2 className="w-3.5 h-3.5" /> {adminProfile.address}</p>
                                                        <p className="flex items-center gap-3"><Phone className="w-3.5 h-3.5" /> {adminProfile.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="w-1/3 p-10 bg-slate-900 text-white flex flex-col justify-center items-center">
                                                    <h1 className="text-5xl font-black uppercase italic tracking-tighter border-b-4 border-emerald-500 mb-2">BILL</h1>
                                                    <p className="text-[10px] font-black tracking-[0.6em] text-emerald-400 uppercase">OFFICIAL</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-900 text-white p-8 grid grid-cols-4 gap-12 mb-12 rounded-2xl">
                                                {['VOUCHER NO', 'BILL DATE', 'STATE CODE', 'PAN NO'].map((label, idx) => (
                                                    <div key={label} className="space-y-1">
                                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</p>
                                                        <p className="text-xl font-black italic tracking-tighter">{idx === 0 ? '#10293' : idx === 1 ? '21 FEB' : '07-DEL'}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mb-12 rounded-2xl overflow-hidden border-2" style={{ borderColor: previewTheme.primary }}>
                                                <table className="w-full">
                                                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                                        <tr>
                                                            <th className="px-8 py-6 text-left border-r border-white/10">DESCRIPTION</th>
                                                            <th className="px-8 py-6 text-center border-r border-white/10">HSN</th>
                                                            <th className="px-8 py-6 text-right">NET TOTAL</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y-4 border-t-4" style={{ borderColor: previewTheme.primary }}>
                                                        {[1, 2, 3].map(i => (
                                                            <tr key={i} className="text-xs font-black uppercase">
                                                                <td className="px-8 py-6 bg-slate-50 font-black">{adminProfile.businessName} Bulk Item 0{i}</td>
                                                                <td className="px-8 py-6 text-center text-slate-400">8471</td>
                                                                <td className="px-8 py-6 text-right text-lg">₹4,150.00</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="flex justify-between items-center bg-slate-900 p-12 rounded-3xl text-white">
                                                <div className="space-y-2">
                                                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Total Payable Amount</p>
                                                    <h1 className="text-7xl font-black tracking-tighter italic">₹12,450.00</h1>
                                                </div>
                                                <div className="w-48 h-24 bg-white/10 border-4 border-dashed border-white/20 rounded-3xl"></div>
                                            </div>
                                        </div>
                                    )}

                                    {previewTheme.layout === 'modern_slate' && (
                                        <div className="p-16 bg-slate-50 min-h-[900px] rounded-[60px]">
                                            <div className="max-w-4xl mx-auto bg-white rounded-[50px] shadow-2xl overflow-hidden min-h-[800px] border border-slate-200">
                                                <div className="h-6 w-full" style={{ backgroundColor: previewTheme.primary }}></div>
                                                <div className="p-16">
                                                    <div className="flex justify-between items-start mb-32">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-20 h-20 rounded-[30px] shadow-2xl flex items-center justify-center text-white text-4xl font-black" style={{ backgroundColor: previewTheme.primary }}>N</div>
                                                            <h1 className="text-5xl font-black tracking-tighter text-slate-800 uppercase">{adminProfile.businessName}</h1>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="px-10 py-6 bg-slate-50 rounded-[32px] border-2 border-slate-100 mb-6">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Amount</p>
                                                                <p className="text-4xl font-black tracking-tighter text-slate-900">₹12,450.00</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-8 mb-32">
                                                        {[1, 2].map(i => (
                                                            <div key={i} className="flex justify-between items-center group">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-4 mb-2">
                                                                        <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: previewTheme.primary }}></span>
                                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Modern Service Phase 0{i}</h3>
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-400 uppercase ml-6 tracking-widest">Tech Implementation | Rate: ₹6,225</p>
                                                                </div>
                                                                <p className="text-4xl font-black tracking-tighter text-slate-900">₹6,225.00</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex justify-between items-end pt-20 border-t-2 border-slate-50">
                                                        <div className="flex gap-4">
                                                            <div className="w-16 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">VISA</div>
                                                            <div className="w-16 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">UPI</div>
                                                        </div>
                                                        <h1 className="text-6xl font-black tracking-tighter italic opacity-20 uppercase" style={{ color: previewTheme.primary }}>{adminProfile.businessName}</h1>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button onClick={() => setPreviewTheme(null)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-100 transition-all text-sm uppercase tracking-widest">Close Preview</button>
                                <button
                                    onClick={() => {
                                        setSelectedTheme(previewTheme.id);
                                        setPreviewTheme(null);
                                        handleSave();
                                    }}
                                    className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-sm uppercase tracking-widest"
                                > Apply This Model</button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};

export default InvoiceThemes;


