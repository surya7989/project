import React from 'react';
import { CheckCircle2, Smartphone, MapPin, Mail, Printer, Receipt, Calendar } from 'lucide-react';
import { CartItem } from '../types';

interface ThemedInvoiceProps {
    adminProfile: {
        businessName: string;
        address: string;
        phone: string;
        email: string;
    };
    invoiceTheme: string;
    customerName: string;
    customerPhone: string;
    txnInfo: {
        id: string;
        date: string;
        methodLabel: string;
    } | null;
    cart: CartItem[];
    finalGST: number;
    cgst?: number;
    sgst?: number;
    grandTotal: number;
    calculatedGrandTotal: number;
    couponDiscount?: number;
    paymentSource?: string;
}

const invoiceThemes: Record<string, { primary: string; accent: string }> = {
    vy_restaurant: { primary: '#92400E', accent: '#F59E0B' },
    vy_classic: { primary: '#0284C7', accent: '#38BDF8' },
    vy_stylish: { primary: '#701A75', accent: '#D946EF' },
    vy_elegant: { primary: '#7F1D1D', accent: '#EF4444' },
    vy_pro: { primary: '#111827', accent: '#F59E0B' },
    vy_business: { primary: '#064E3B', accent: '#10B981' },
    vy_minimal: { primary: '#334155', accent: '#64748B' },
};

const ThemedInvoice: React.FC<ThemedInvoiceProps> = ({
    adminProfile,
    invoiceTheme,
    customerName,
    customerPhone,
    txnInfo,
    cart,
    finalGST,
    cgst,
    sgst,
    grandTotal,
    calculatedGrandTotal,
    couponDiscount = 0,
    paymentSource
}) => {
    const activeTheme = invoiceThemes[invoiceTheme] || invoiceThemes.vy_classic;

    const displayCGST = cgst ?? (finalGST / 2);
    const displaySGST = sgst ?? (finalGST / 2);
    const isOnline = paymentSource === 'online' || txnInfo?.methodLabel?.toLowerCase().includes('online');

    const formatCurrency = (val: number) => {
        return val % 1 === 0 ? val.toLocaleString() : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    };

    return (
        <div className="bg-white">
            {/* Model 0: Restaurant Special Layout (Online Invoices Style) */}
            {invoiceTheme === 'vy_restaurant' && (
                <div className="p-10 lg:p-16 bg-white min-h-[1000px] font-sans">
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-slate-100 shadow-sm overflow-hidden">
                                <h1 className="text-4xl font-black italic" style={{ color: activeTheme.primary }}>{adminProfile.businessName?.charAt(0) || 'M'}</h1>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">{adminProfile.businessName}</h1>
                            <div className="mt-4 space-y-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <p>{adminProfile.address}</p>
                                <p>Phone: {adminProfile.phone}</p>
                                <p>{adminProfile.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-6xl font-black tracking-tighter text-slate-200 mb-8">INVOICE</h1>
                            <div className="space-y-2 text-sm font-black text-slate-900">
                                <p className="flex justify-end gap-10"><span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Invoice Number</span> <span>#{txnInfo?.id.slice(-6)}</span></p>
                                <p className="flex justify-end gap-10"><span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Invoice Date</span> <span>{txnInfo?.date.split('|')[0]}</span></p>
                                <p className="flex justify-end gap-10"><span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Payment Method</span> <span className="text-orange-600">{isOnline ? 'ONLINE' : txnInfo?.methodLabel.toUpperCase()}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-16">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2 inline-block">Bill To</p>
                        <h3 className="text-2xl font-black text-slate-900">{customerName || 'Valued Customer'}</h3>
                        <p className="text-sm font-bold text-slate-500 mt-1">{customerPhone}</p>
                    </div>

                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead className="border-b-4 border-slate-900">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-4">#</th>
                                    <th className="py-4">Description</th>
                                    <th className="py-4 text-center">Qty / Unit</th>
                                    <th className="py-4 text-right">Unit Price</th>
                                    <th className="py-4 text-right">Line Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cart.map((item, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="py-6 text-slate-400 font-bold">{idx + 1}</td>
                                        <td className="py-6">
                                            <p className="font-black text-slate-900 text-lg">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">HSN: {item.hsnCode || '8471'}</p>
                                        </td>
                                        <td className="py-6 text-center font-black">{item.quantity} {item.unit}</td>
                                        <td className="py-6 text-right font-bold text-slate-500">₹{formatCurrency(item.price)}</td>
                                        <td className="py-6 text-right font-black text-slate-900 text-lg">₹{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <div className="w-80 space-y-4">
                            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="text-slate-900">₹{formatCurrency(calculatedGrandTotal - finalGST)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Total GST</span>
                                <span className="text-slate-900">₹{formatCurrency(finalGST)}</span>
                            </div>
                            {couponDiscount > 0 && (
                                <div className="flex justify-between text-xs font-black text-green-600 uppercase tracking-widest">
                                    <span>Discount</span>
                                    <span>- ₹{formatCurrency(couponDiscount)}</span>
                                </div>
                            )}
                            <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Amount Due</span>
                                <span className="text-4xl font-black" style={{ color: activeTheme.primary }}>₹{formatCurrency(grandTotal)}</span>
                            </div>
                            <div className="pt-4 flex items-center gap-2 justify-end font-black text-green-600 uppercase text-[10px] tracking-widest">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {isOnline ? 'Paid in Full (Online)' : `Paid - ${txnInfo?.methodLabel}`}
                            </div>
                        </div>
                    </div>

                    <div className="mt-32 pt-16 border-t border-slate-100 flex items-end justify-between">
                        <div className="space-y-6">
                            <div className="w-48 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black italic mb-2" style={{ color: activeTheme.primary }}>{adminProfile.businessName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Hospitality Standard Bill</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Model 1: Classic GST Layout */}
            {invoiceTheme === 'vy_classic' && (
                <div className="p-10 lg:p-16 bg-white min-h-[1000px]">
                    <div className="flex justify-between items-start mb-16">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black italic tracking-tighter" style={{ color: activeTheme.primary }}>{adminProfile.businessName}</h1>
                            <div className="space-y-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {adminProfile.address}</p>
                                <p className="flex items-center gap-2"><Smartphone className="w-3 h-3" /> {adminProfile.phone}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Original Tax Invoice</p>
                            <p className="text-4xl font-black" style={{ color: activeTheme.primary }}>₹{formatCurrency(grandTotal)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-12 text-sm mb-16">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Client Details</p>
                            <p className="text-lg font-black text-slate-900">{customerName || 'Walk-in Customer'}</p>
                            <p className="font-bold text-slate-500">Contact: {customerPhone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Invoice Info</p>
                            <div className="space-y-1 font-bold">
                                <p className="flex justify-between"><span>Inv No:</span> <span>{txnInfo?.id}</span></p>
                                <p className="flex justify-between"><span>Date:</span> <span>{txnInfo?.date}</span></p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Payment</p>
                            <div className="flex items-center gap-2 pt-1 font-black text-green-600 uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {isOnline ? 'Paid Online' : `Paid - ${txnInfo?.methodLabel}`}
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-slate-100 rounded-[32px] overflow-hidden mb-12">
                        <table className="w-full text-left">
                            <thead className="text-white uppercase font-black tracking-widest" style={{ backgroundColor: activeTheme.primary }}>
                                <tr>
                                    <th className="px-6 py-4">S.No</th>
                                    <th className="px-6 py-4">Item & HSN</th>
                                    <th className="px-6 py-4 text-center">Qty</th>
                                    <th className="px-6 py-4 text-right">Rate</th>
                                    <th className="px-6 py-4 text-right">Tax</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cart.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-slate-900">{item.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">HSN: {item.hsnCode || '8471'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black">{item.quantity} {item.unit}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-500">₹{formatCurrency(item.price)}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-700">{item.gstRate}%</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">₹{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-8">
                        <div className="w-80 space-y-3 p-6 bg-slate-50 rounded-[40px] border border-slate-100">
                            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Subtotal</span> <span className="text-slate-900">₹{formatCurrency(calculatedGrandTotal - finalGST)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                                <span>CGST (9%)</span> <span className="text-slate-900">₹{formatCurrency(displayCGST)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                                <span>SGST (9%)</span> <span className="text-slate-900">₹{formatCurrency(displaySGST)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-2 pb-1">
                                <span>Total Tax</span> <span className="text-slate-900">₹{formatCurrency(finalGST)}</span>
                            </div>
                            {couponDiscount > 0 && <div className="flex justify-between text-xs font-black text-green-600 uppercase tracking-widest">
                                <span>Discount</span> <span>- ₹{formatCurrency(couponDiscount)}</span>
                            </div>}
                            <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-2">
                                <span className="text-sm font-black text-slate-900 uppercase">Total Bill</span>
                                <span className="text-3xl font-black" style={{ color: activeTheme.primary }}>₹{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Model 2: Stylish Retail Layout */}
            {invoiceTheme === 'vy_stylish' && (
                <div className="relative p-10 lg:p-16 min-h-[1000px]">
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full -mr-32 -mt-32" style={{ backgroundColor: activeTheme.primary }}></div>
                    <div className="flex items-center gap-10 mb-16 relative">
                        <div className="p-4 rounded-[40px] shadow-2xl border-4 border-white" style={{ backgroundColor: activeTheme.primary }}>
                            <Smartphone className="w-16 h-16 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black italic tracking-tighter" style={{ color: activeTheme.primary }}>{adminProfile.businessName}</h1>
                            <p className="text-lg font-black text-slate-400 uppercase tracking-[0.4em]">{adminProfile.address}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 mb-16">
                        <div className="space-y-6">
                            <div className="p-8 bg-slate-50 rounded-[32px] border-l-[12px]" style={{ borderColor: activeTheme.primary }}>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer Invoice To</p>
                                <h3 className="text-3xl font-black text-slate-900">{customerName || 'Loyal Customer'}</h3>
                                <p className="text-sm font-bold text-slate-500 mt-2 uppercase">Contact: +91 {customerPhone}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-center pt-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill No</p>
                                <p className="text-xl font-black text-slate-900">#{txnInfo?.id.slice(-6)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="text-xl font-black text-slate-900">{txnInfo?.date.split('|')[0]}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-16">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white transition-all">
                                <div className="flex gap-6 items-center">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: activeTheme.accent }}>{idx + 1}</div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900">{item.name}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Qty: {item.quantity} {item.unit} | Price: ₹{formatCurrency(item.price)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900">₹{formatCurrency(item.price * item.quantity)}</p>
                                    <p className="text-[10px] font-black text-green-600 uppercase">GST {item.gstRate}% Applied</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-10 border-t-8 flex items-end justify-between" style={{ borderColor: activeTheme.primary }}>
                        <div className="space-y-2">
                            <p className="text-sm font-black text-slate-400 uppercase italic">Authorized Partner</p>
                            <div className="w-64 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"></div>
                        </div>
                        <div className="text-right space-y-4">
                            <div className="flex justify-end gap-x-10 text-xs font-black text-slate-400 uppercase">
                                <span>Net Items: {cart.length}</span>
                                <span>Net Tax: ₹{formatCurrency(finalGST)}</span>
                            </div>
                            <h1 className="text-7xl font-black tracking-tighter" style={{ color: activeTheme.primary }}>₹{formatCurrency(grandTotal)}</h1>
                        </div>
                    </div>
                </div>
            )}

            {/* Model 3: Elegant Red Executive Layout */}
            {invoiceTheme === 'vy_elegant' && (
                <div className="p-10 lg:p-16 border-t-[20px] shadow-sm min-h-[1000px]" style={{ borderColor: activeTheme.primary }}>
                    <div className="flex justify-between items-center mb-20">
                        <div>
                            <h1 className="text-5xl font-serif text-slate-900 leading-none">{adminProfile.businessName}</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-4 tracking-[0.5em]">{adminProfile.address}</p>
                        </div>
                        <div className="text-right border-l-4 pl-10 h-32 flex flex-col justify-center" style={{ borderColor: activeTheme.primary }}>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Outstanding</p>
                            <p className="text-5xl font-black" style={{ color: activeTheme.primary }}>₹{formatCurrency(grandTotal)}</p>
                        </div>
                    </div>

                    <div className="flex gap-20 mb-20">
                        <div className="w-1/3">
                            <p className="text-[10px] font-black text-slate-400 uppercase border-b-2 pb-2 mb-6" style={{ borderColor: activeTheme.primary }}>Ship To</p>
                            <div className="space-y-2">
                                <p className="text-2xl font-black text-slate-900">{customerName}</p>
                                <p className="text-sm font-bold text-slate-500">{customerPhone}</p>
                            </div>
                        </div>
                        <div className="w-1/3">
                            <p className="text-[10px] font-black text-slate-400 uppercase border-b-2 pb-2 mb-6" style={{ borderColor: activeTheme.primary }}>Information</p>
                            <div className="grid grid-cols-2 gap-y-4 text-xs font-black uppercase text-slate-400">
                                <span>Inv ID:</span> <span className="text-slate-900">#E-{txnInfo?.id.slice(-6)}</span>
                                <span>Created:</span> <span className="text-slate-900">{txnInfo?.date.split('|')[0]}</span>
                                <span>Method:</span> <span className="text-slate-900">{txnInfo?.methodLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-20">
                        <table className="w-full">
                            <thead className="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-400">
                                <tr>
                                    <th className="py-4 text-left">Description</th>
                                    <th className="py-4 text-center">Unit</th>
                                    <th className="py-4 text-center">Qty</th>
                                    <th className="py-4 text-right">Price</th>
                                    <th className="py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {cart.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-6">
                                            <p className="font-black text-slate-900 text-lg uppercase">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">Tax: {item.gstRate}% {item.taxType}</p>
                                        </td>
                                        <td className="py-6 text-center font-bold text-slate-500 uppercase">{item.unit}</td>
                                        <td className="py-6 text-center font-black">x{item.quantity}</td>
                                        <td className="py-6 text-right font-bold text-slate-500">₹{formatCurrency(item.price)}</td>
                                        <td className="py-6 text-right font-black text-slate-900 text-lg">₹{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-20">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Office Use Only</p>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-${txnInfo?.id}`} alt="QR" className="w-32 h-32 border-2 p-2 rounded-xl" />
                        </div>
                        <div className="space-y-4 bg-slate-50 p-10 rounded-br-[60px]">
                            <div className="flex justify-between font-black text-xs uppercase text-slate-400"><span>Net Amount</span><span>₹{formatCurrency(calculatedGrandTotal - finalGST)}</span></div>
                            <div className="flex justify-between font-black text-xs uppercase text-slate-400"><span>GST Contribution</span><span>₹{formatCurrency(finalGST)}</span></div>
                            <div className="flex justify-between font-black text-3xl uppercase text-slate-900 pt-6 border-t-2 border-dashed border-slate-200"><span>Grand Total</span><span>₹{formatCurrency(grandTotal)}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Model 4: Luxury Pro Gold (Luxury Gold) */}
            {invoiceTheme === 'vy_pro' && (
                <div className="bg-[#111827] text-white p-10 lg:p-16 min-h-[1000px]">
                    <div className="flex justify-between items-start mb-24">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.6em]">Premium Member Invoice</p>
                            <h1 className="text-6xl font-black uppercase tracking-tighter text-white">{adminProfile.businessName}</h1>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm">{adminProfile.address}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="w-24 h-24 rounded-full border-4 border-amber-500 flex items-center justify-center text-amber-500 text-4xl font-black italic">V</div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-4">Authorized Pro Partner</p>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[40px] p-10 border border-white/10 mb-16">
                        <div className="grid grid-cols-4 gap-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-white/50">Receipt Number</p>
                                <p className="text-2xl font-black tracking-tighter uppercase text-white">#VPRO-{txnInfo?.id.slice(-8)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-white/50">Issue Date</p>
                                <p className="text-2xl font-black tracking-tighter uppercase text-white">{txnInfo?.date.split('|')[0]}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-white/50">Total Payable</p>
                                <p className="text-2xl font-black tracking-tighter uppercase text-amber-500">₹{formatCurrency(grandTotal)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-white/50">Member Since</p>
                                <p className="text-2xl font-black tracking-tighter uppercase text-white">FEB 2024</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-white/10 rounded-[32px] mb-20 bg-white/5">
                        <table className="w-full text-left">
                            <thead className="bg-white/10 text-[10px] font-black uppercase tracking-widest text-amber-500">
                                <tr>
                                    <th className="px-10 py-6">Lux Item Details</th>
                                    <th className="px-10 py-6 text-center">Qty</th>
                                    <th className="px-10 py-6 text-right">Unit Price</th>
                                    <th className="px-10 py-6 text-right">Line Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cart.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-10 py-8">
                                            <p className="text-xl font-black tracking-tight mb-1">{item.name}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-white/40">Premium Selection | HSN: {item.hsnCode}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center font-black text-2xl tracking-tighter">{item.quantity}</td>
                                        <td className="px-10 py-8 text-right font-bold text-slate-400">₹{formatCurrency(item.price)}</td>
                                        <td className="px-10 py-8 text-right font-black text-amber-500 text-2xl">₹{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="max-w-md">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Terms of luxury</p>
                            <p className="text-xs font-bold text-white/50 leading-relaxed uppercase italic">This is a premium transaction document. All luxury products are subject to exclusive terms and branding guidelines.</p>
                        </div>
                        <div className="text-right space-y-6">
                            <div className="space-y-4 pb-10 border-b border-white/10">
                                <div className="flex justify-end gap-10 text-[10px] font-black text-white/50 uppercase tracking-widest"><span>Tax Component</span><span>₹{formatCurrency(finalGST)}</span></div>
                                <div className="flex justify-end gap-10 text-[10px] font-black text-white/50 uppercase tracking-widest"><span>Base Component</span><span>₹{formatCurrency(calculatedGrandTotal - finalGST)}</span></div>
                            </div>
                            <div className="pt-6">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Net Payable Amount</p>
                                <h1 className="text-8xl font-black tracking-tighter text-white">₹{formatCurrency(grandTotal)}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Model 5: Robust Business Layout (Business Robust) */}
            {invoiceTheme === 'vy_business' && (
                <div className="bg-white p-4 border min-h-[1000px]" style={{ border: `2px solid ${activeTheme.primary}` }}>
                    <div className="flex border-b-2 mb-10" style={{ borderColor: activeTheme.primary }}>
                        <div className="w-1/2 p-6 bg-slate-50 border-r-2" style={{ borderColor: activeTheme.primary }}>
                            <h1 className="text-4xl font-black tracking-tighter uppercase" style={{ color: activeTheme.primary }}>{adminProfile.businessName}</h1>
                            <div className="mt-4 text-[10px] font-black text-slate-500 uppercase space-y-1">
                                <p className="flex items-center gap-2"><MapPin className="w-3 h-3 text-slate-400" /> {adminProfile.address}</p>
                                <p className="flex items-center gap-2"><Smartphone className="w-3 h-3 text-slate-400" /> {adminProfile.phone}</p>
                                <p className="flex items-center gap-2"><Mail className="w-3 h-3 text-slate-400" /> {adminProfile.email}</p>
                            </div>
                        </div>
                        <div className="w-1/2 p-6 flex flex-col justify-center items-end bg-slate-900 text-white">
                            <h1 className="text-6xl font-black uppercase italic tracking-tighter border-b-4 border-emerald-500 mb-2">INVOICE</h1>
                            <p className="text-xs font-black tracking-[0.5em] text-emerald-400 opacity-80 uppercase">Commercial Document</p>
                        </div>
                    </div>

                    <div className="flex mb-10 gap-x-1 border-b-2" style={{ borderColor: activeTheme.primary }}>
                        <div className="w-1/2 p-8 space-y-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Billing Entity</p>
                            <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">{customerName || 'General Client'}</h3>
                            <div className="text-[10px] font-black text-slate-400 space-y-1 uppercase">
                                <p>State Code: 07-Delhi</p>
                                <p>Contact: +91 {customerPhone}</p>
                            </div>
                        </div>
                        <div className="w-1/2 grid grid-cols-2 bg-slate-50">
                            <div className="p-8 border-r-2 border-slate-100 flex flex-col justify-center items-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 leading-none">Voucher No</p>
                                <p className="text-xl font-black text-slate-900">{txnInfo?.id.slice(-8)}</p>
                            </div>
                            <div className="p-8 flex flex-col justify-center items-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 leading-none">Billing Date</p>
                                <p className="text-xl font-black text-slate-900">{txnInfo?.date.split('|')[0]}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl overflow-hidden border-2 mb-10" style={{ borderColor: activeTheme.primary }}>
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-5 border-r border-white/20">Product & Specifications</th>
                                    <th className="px-6 py-5 text-center border-r border-white/20">HSN</th>
                                    <th className="px-6 py-5 text-center border-r border-white/20">Qty</th>
                                    <th className="px-6 py-5 text-right border-r border-white/20">Price/U</th>
                                    <th className="px-6 py-5 text-right">Taxable Val</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 border-t-2" style={{ borderColor: activeTheme.primary }}>
                                {cart.map((item, idx) => (
                                    <tr key={idx} className="text-xs font-black uppercase text-slate-700">
                                        <td className="px-6 py-5 font-black text-slate-900">{item.name}</td>
                                        <td className="px-6 py-5 text-center text-slate-400">{item.hsnCode || '8471'}</td>
                                        <td className="px-6 py-5 text-center">{item.quantity}</td>
                                        <td className="px-6 py-5 text-right">₹{formatCurrency(item.price)}</td>
                                        <td className="px-6 py-5 text-right text-slate-900 font-extrabold text-sm">₹{formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-x-6 h-48 border-t-2 pt-10" style={{ borderColor: activeTheme.primary }}>
                        <div className="flex-1 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase border-b-2 pb-1" style={{ borderColor: activeTheme.primary }}>Authorized By</p>
                                <p className="text-xs font-black text-slate-900">{adminProfile.businessName}</p>
                            </div>
                            <div className="w-32 h-24 bg-white border-2 border-dashed border-slate-200 rounded-xl"></div>
                        </div>
                        <div className="w-96 bg-slate-900 text-white rounded-2xl p-8 flex flex-col justify-between shadow-2xl">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/50 tracking-widest leading-none">
                                <span>Business Final Invoice</span>
                                <span>#{txnInfo?.id.slice(-4)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-xs font-black uppercase text-emerald-400">Total Payable</p>
                                <h1 className="text-5xl font-black italic tracking-tighter">₹{formatCurrency(grandTotal)}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Model 6: Modern Slate (Tech Standard) */}
            {invoiceTheme === 'vy_minimal' && (
                <div className="p-10 lg:p-16 bg-slate-50 min-h-[1000px] font-sans">
                    <div className="max-w-4xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden min-h-[1000px] border border-slate-200">
                        <div className="h-4 w-full" style={{ backgroundColor: activeTheme.primary }}></div>
                        <div className="p-16">
                            <div className="flex justify-between items-start mb-24">
                                <div>
                                    <div className="flex items-center gap-x-4 mb-4">
                                        <div className="w-14 h-14 rounded-[20px] shadow-lg flex items-center justify-center text-white text-3xl font-black" style={{ backgroundColor: activeTheme.primary }}>N</div>
                                        <h1 className="text-4xl font-black tracking-tight text-slate-900">{adminProfile.businessName}</h1>
                                    </div>
                                    <p className="max-w-xs text-xs font-bold text-slate-400 uppercase leading-loose tracking-widest">{adminProfile.address}</p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block px-10 py-5 rounded-[24px] bg-slate-50 border-2 border-slate-100 mb-8">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Invoice Amount</p>
                                        <p className="text-4xl font-black tracking-tighter text-slate-900">₹{formatCurrency(grandTotal)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Customer Reference</p>
                                        <p className="font-black text-slate-900 text-xl">{customerName || 'Standard Client'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-24 mb-24 border-y-2 border-slate-50 py-12">
                                <div className="flex items-center gap-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Calendar className="w-3.5 h-3.5" /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Billing Date</p>
                                        <p className="text-lg font-black text-slate-900">{txnInfo?.date.split('|')[0]}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Receipt className="w-3.5 h-3.5" /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Reference ID</p>
                                        <p className="text-lg font-black text-slate-900">#{txnInfo?.id.slice(-6)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 mb-24">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-x-3 mb-1">
                                                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: activeTheme.primary }}></span>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.name}</h3>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase ml-4">Unit Price: ₹{formatCurrency(item.price)} | Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black tracking-tighter text-slate-900 mb-1">₹{formatCurrency(item.price * item.quantity)}</p>
                                            <div className="flex items-center justify-end gap-x-2 text-[9px] font-black text-blue-600 uppercase">
                                                <CheckCircle2 className="w-3 h-3" /> Includes {item.gstRate}% Tax
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-end pt-20 border-t-2 border-slate-50 h-56">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none mb-6">Payment Secured</p>
                                    <div className="flex gap-x-4">
                                        <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400 uppercase">VISA</div>
                                        <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400 uppercase">UPI</div>
                                        <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400 uppercase">PCI</div>
                                    </div>
                                </div>
                                <div className="text-right space-y-4">
                                    <div className="text-[10px] font-black text-slate-300 uppercase leading-none italic pb-2">Business Representative</div>
                                    <h1 className="text-6xl font-black tracking-tighter italic opacity-80" style={{ color: activeTheme.primary }}>{adminProfile.businessName}</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemedInvoice;
