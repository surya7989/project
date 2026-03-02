import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, Mail, Phone, ExternalLink, BookOpen, Video, FileText, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const faqs = [
    { q: 'How do I add a new product to inventory?', a: 'Go to Inventory page → Click "Add Product" → Fill in the details including name, price, stock quantity, and GST rate → Click Save.' },
    { q: 'How do I generate a bill/invoice?', a: 'Navigate to Billing → Search and add products to cart → Click "Proceed to Payment" → Select payment method → Confirm payment.' },
    { q: 'How do I configure GST rates?', a: 'Go to Settings → GST Configuration → Set your GSTIN, default rate, and enable/disable CGST, SGST, and IGST components.' },
    { q: 'Can I export my data?', a: 'Yes! Go to Analytics → Select the report type → Choose date range → Click "Export PDF" or "Export Excel" to download.' },
    { q: 'How do I manage customer payments?', a: 'Go to Customers page → Find the customer → View their payment history and pending amounts. You can track partial payments and update status.' },
    { q: 'How do I set up WhatsApp notifications?', a: 'Go to Settings → WhatsApp → Enter your WhatsApp Business number → Enable the message types you want (order confirmation, payment receipt, etc.).' },
];

const HelpSupport: React.FC = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [contactForm, setContactForm] = useState({ subject: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSendMessage = () => {
        if (!contactForm.subject || !contactForm.message) return;
        setSent(true);
        confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#6366F1', '#4F46E5']
        });
        setContactForm({ subject: '', message: '' });
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-sm flex items-center justify-center">
                    <HelpCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">Help & Support</h2>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: BookOpen, label: 'Documentation', desc: 'Guides and tutorials', color: 'bg-blue-50 text-blue-600' },
                    { icon: Video, label: 'Video Tutorials', desc: 'Step-by-step videos', color: 'bg-purple-50 text-purple-600' },
                    { icon: FileText, label: 'Release Notes', desc: 'Latest updates', color: 'bg-green-50 text-green-600' },
                ].map((item, idx) => (
                    <button key={idx} className="p-4 bg-slate-50 rounded text-left hover:shadow-md transition-all group">
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center mb-3 ${item.color}`}>
                            <item.icon className="w-3.5 h-3.5" />
                        </div>
                        <p className="font-black text-sm text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                        <ExternalLink className="w-3 h-3 text-slate-300 mt-2 group-hover:text-blue-500" />
                    </button>
                ))}
            </div>

            <hr className="border-slate-100" />

            {/* FAQ */}
            <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3">Frequently Asked Questions</h3>
                {faqs.map((faq, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-sm overflow-hidden">
                        <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-all"
                        >
                            <span className="font-bold text-sm text-slate-900 pr-4">{faq.q}</span>
                            {openFaq === idx ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        </button>
                        {openFaq === idx && (
                            <div className="px-4 pb-4">
                                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <hr className="border-slate-100" />

            {/* Contact Support */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Contact Support</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-sm flex items-center space-x-3">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                            <p className="font-bold text-sm text-blue-600">support@nexarats.com</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-sm flex items-center space-x-3">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Phone</p>
                            <p className="font-bold text-sm text-blue-600">+91 1800 123 4567</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-6 bg-slate-50 rounded space-y-4">
                    <div className="flex items-center space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <h4 className="font-black text-sm text-slate-900">Send a Message</h4>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Subject</label>
                        <input value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} placeholder="What do you need help with?" className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-sm outline-none text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                        <textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Describe your issue or question..." rows={4} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-sm outline-none resize-none text-sm" />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        className={`px-6 py-3 rounded-sm font-bold text-sm transition-all flex items-center space-x-2 ${sent ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {sent ? <CheckCircle2 className="w-4 h-4 animate-in zoom-in" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        <span>{sent ? 'Message Sent!' : 'Send Message'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpSupport;


