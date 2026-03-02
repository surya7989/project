import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, Eye, EyeOff, MessageSquare, ShieldCheck, Loader2, RefreshCw, Lock, User, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export type AuthMode = 'login-password' | 'login-otp' | 'signup';

interface StoreLoginModalProps {
    onLoginSuccess: (phone: string, token: string, customer?: any) => void;
    onClose: () => void;
    storeName?: string;
    initialMode?: AuthMode;
}

// ─── Sub-components Moved Outside to prevent re-creation on every render ─────────────────
const ResendTimer = ({ onResend, countdown, loading }: { onResend: () => void, countdown: number, loading: boolean }) => {
    if (countdown > 0) return <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Resend in <b style={{ color: '#15803d' }}>{countdown}s</b></span>;
    return (
        <button onClick={onResend} disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#15803d', fontWeight: 800, background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Resend OTP
        </button>
    );
};

const PhoneInput = ({ value, onChange, onEnter }: { value: string; onChange: (v: string) => void; onEnter: () => void }) => (
    <div>
        <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Mobile Number</label>
        <div style={{ display: 'flex', gap: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 14px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: 14, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>🇮🇳 +91</span>
            <input
                type="tel" autoFocus
                value={value}
                onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && onEnter()}
                placeholder="Enter 10-digit number"
                maxLength={10}
                style={{ flex: 1, padding: '12px 14px', border: '1.5px solid #e2e8f0', borderLeft: 'none', borderRadius: '0 10px 10px 0', fontSize: 15, fontWeight: 600, color: '#0f172a', outline: 'none', background: '#fff', fontFamily: 'monospace' }}
                onFocus={e => (e.target.style.borderColor = '#15803d')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
        </div>
    </div>
);

const OtpBoxes = ({ phone, otp, mode, setOtpStep, setSignupStep, handleOtpChange, handleOtpKeyDown, handleOtpPaste, otpRefs, countdown, loading, handleSendOtp, clearErrors, setOtp }: {
    phone: string, otp: string[], mode: AuthMode, setOtpStep: any, setSignupStep: any, handleOtpChange: any, handleOtpKeyDown: any, handleOtpPaste: any, otpRefs: any, countdown: number, loading: boolean, handleSendOtp: any, clearErrors: any, setOtp: any
}) => (
    <div>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 20, marginBottom: 8 }}>
                <Phone size={12} color="#15803d" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>+91 {phone}</span>
                <button onClick={() => { mode === 'login-otp' ? setOtpStep('phone') : setSignupStep('phone'); setOtp(['', '', '', '', '', '']); clearErrors(); }} style={{ fontSize: 11, color: '#15803d', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Enter the 6-digit OTP sent to WhatsApp</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }} onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
                <input key={idx} ref={el => { otpRefs.current[idx] = el; }}
                    type="tel" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{ width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 900, borderRadius: 10, border: digit ? '2px solid #15803d' : '2px solid #e2e8f0', background: digit ? '#f0fdf4' : '#f8fafc', color: digit ? '#15803d' : '#0f172a', outline: 'none', transition: 'all 0.15s', fontFamily: 'monospace' }}
                />
            ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
            <ResendTimer countdown={countdown} loading={loading} onResend={() => { setOtp(['', '', '', '', '', '']); handleSendOtp(); }} />
        </div>
    </div>
);

const StoreLoginModal: React.FC<StoreLoginModalProps> = ({
    onLoginSuccess,
    onClose,
    storeName = 'NEXA Store',
    initialMode = 'login-password',
}) => {
    const [mode, setMode] = useState<AuthMode>(initialMode);

    // Shared
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Password login
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    // OTP login
    const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Signup
    const [signupStep, setSignupStep] = useState<'phone' | 'otp' | 'details'>('phone');
    const [signupName, setSignupName] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirm, setSignupConfirm] = useState('');
    const [showSignupPwd, setShowSignupPwd] = useState(false);

    // Countdown for OTP resend
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const clearErrors = () => { setError(''); setSuccess(''); };
    const switchMode = (m: AuthMode) => { setMode(m); clearErrors(); setPhone(''); setPassword(''); setOtp(['', '', '', '', '', '']); setOtpStep('phone'); setSignupStep('phone'); };

    // ─── Password Login ──────────────────────────────────────────────────────
    const handlePasswordLogin = async () => {
        if (!phone || !/^[6-9]\d{9}$/.test(phone)) { setError('Enter a valid 10-digit mobile number'); return; }
        if (!password) { setError('Enter your password'); return; }
        setLoading(true); clearErrors();
        try {
            const res = await api.auth.loginWithPassword(phone, password);
            if (res.success) {
                setSuccess('Login successful! Welcome back 🎉');
                setTimeout(() => onLoginSuccess(res.phone, res.sessionToken, res.customer), 600);
            }
        } catch (err: any) { setError(err.message || 'Login failed'); }
        finally { setLoading(false); }
    };

    // ─── OTP Send ─────────────────────────────────────────────────────────────
    const handleSendOtp = async (phoneNum?: string) => {
        const p = phoneNum || phone;
        if (!p || !/^[6-9]\d{9}$/.test(p)) { setError('Enter a valid 10-digit mobile number'); return; }
        setLoading(true); clearErrors();
        try {
            const res = await api.auth.sendOtp(p);
            if (res.success) {
                setSuccess(res.message || 'OTP sent to your WhatsApp!');
                setCountdown(30);
                if (mode === 'login-otp') { setOtpStep('otp'); setTimeout(() => otpRefs.current[0]?.focus(), 200); }
                if (mode === 'signup') { setSignupStep('otp'); setTimeout(() => otpRefs.current[0]?.focus(), 200); }
            }
        } catch (err: any) { setError(err.message || 'Failed to send OTP'); }
        finally { setLoading(false); }
    };

    // ─── OTP Verify (for OTP login only) ─────────────────────────────────────
    const handleVerifyOtp = async (otpVal?: string) => {
        const finalOtp = otpVal || otp.join('');
        if (finalOtp.length !== 6) { setError('Enter the complete 6-digit OTP'); return; }
        setLoading(true); clearErrors();
        try {
            const res = await api.auth.verifyOtp(phone, finalOtp);
            if (res.success) {
                setSuccess('Verified! Logging you in…');
                setTimeout(() => onLoginSuccess(res.phone, res.sessionToken, res.customer), 700);
            }
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
            // Don't wipe the whole OTP, just focus the last digit so they can fix it
            otpRefs.current[5]?.focus();
        }
        finally { setLoading(false); }
    };

    // ─── Signup OTP Verify → move to details ────────────────────────────────
    const handleSignupOtpVerify = async (otpVal?: string) => {
        const finalOtp = otpVal || otp.join('');
        if (finalOtp.length !== 6) { setError('Enter the complete 6-digit OTP'); return; }
        setLoading(true); clearErrors();
        try {
            // We call verify-otp which creates a guest account first, then we upgrade with signup
            const res = await api.auth.verifyOtp(phone, finalOtp);
            if (res.success) {
                setSuccess('Phone verified! Now set your name & password.');
                setSignupStep('details');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
            otpRefs.current[5]?.focus();
        }
        finally { setLoading(false); }
    };

    // ─── Final Signup ─────────────────────────────────────────────────────────
    const handleSignup = async () => {
        if (!signupName.trim()) { setError('Please enter your full name'); return; }
        if (signupPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (signupPassword !== signupConfirm) { setError('Passwords do not match'); return; }
        setLoading(true); clearErrors();
        try {
            const res = await api.auth.signup(phone, signupName.trim(), signupPassword);
            if (res.success) {
                setSuccess('Account created! Welcome 🎉');
                setTimeout(() => onLoginSuccess(res.phone, res.sessionToken, res.customer), 700);
            }
        } catch (err: any) { setError(err.message || 'Signup failed'); }
        finally { setLoading(false); }
    };

    // ─── OTP Input Handlers ───────────────────────────────────────────────────
    const handleOtpChange = (idx: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const n = [...otp]; n[idx] = val.slice(-1); setOtp(n);
        clearErrors();
        if (val && idx < 5) {
            // Focus next box
            setTimeout(() => otpRefs.current[idx + 1]?.focus(), 10);
        }

        const full = n.join('');
        if (full.length === 6) {
            // Auto-verify when 6 digits are complete
            if (mode === 'login-otp') handleVerifyOtp(full);
            else if (mode === 'signup') handleSignupOtpVerify(full);
        }
    };
    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (p.length === 6) { setOtp(p.split('')); mode === 'login-otp' ? handleVerifyOtp(p) : handleSignupOtpVerify(p); }
    };

    const tabs: { id: AuthMode; label: string; icon: React.ReactNode }[] = [
        { id: 'login-password', label: 'Login', icon: <Lock size={14} /> },
        { id: 'login-otp', label: 'OTP Login', icon: <MessageSquare size={14} /> },
        { id: 'signup', label: 'Sign Up', icon: <User size={14} /> },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'sfModalIn 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
                <style>{`
                    @keyframes sfModalIn { from { opacity:0; transform: scale(0.94) translateY(16px); } to { opacity:1; transform: scale(1) translateY(0); } }
                    .sf-input:focus { border-color: #15803d !important; }
                `}</style>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg,#15803d,#166534)', padding: '20px 24px 16px', position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <X size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={20} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>{storeName}</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Login or create your account</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 16, background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 4 }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => switchMode(t.id)}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 4px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, transition: 'all 0.2s', background: mode === t.id ? '#fff' : 'transparent', color: mode === t.id ? '#15803d' : 'rgba(255,255,255,0.8)' }}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 24px 20px' }}>

                    {/* ── LOGIN WITH PASSWORD ──────────────────────────────── */}
                    {mode === 'login-password' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <PhoneInput value={phone} onChange={setPhone} onEnter={() => document.getElementById('sf-pwd-input')?.focus()} />
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input id="sf-pwd-input"
                                        type={showPwd ? 'text' : 'password'} value={password}
                                        onChange={e => { setPassword(e.target.value); clearErrors(); }}
                                        onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                                        placeholder="Enter your password"
                                        style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                                        onFocus={e => (e.target.style.borderColor = '#15803d')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                    />
                                    <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button onClick={handlePasswordLogin} disabled={loading || phone.length < 10 || !password}
                                style={{ width: '100%', padding: '13px', background: phone.length === 10 && password ? 'linear-gradient(135deg,#15803d,#166534)' : '#e2e8f0', color: phone.length === 10 && password ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: phone.length === 10 && password ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: phone.length === 10 && password ? '0 4px 16px rgba(21,128,61,0.25)' : 'none', transition: 'all 0.2s' }}>
                                {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Lock size={16} /> Login with Password <ArrowRight size={16} /></>}
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                <button onClick={() => switchMode('login-otp')} style={{ fontSize: 12, color: '#15803d', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Forgot password? Login with OTP instead →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── OTP LOGIN ─────────────────────────────────────────── */}
                    {mode === 'login-otp' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {otpStep === 'phone' ? (<>
                                <PhoneInput value={phone} onChange={setPhone} onEnter={handleSendOtp} />
                                <button onClick={() => handleSendOtp()} disabled={loading || phone.length < 10}
                                    style={{ width: '100%', padding: '13px', background: phone.length === 10 ? 'linear-gradient(135deg,#15803d,#166534)' : '#e2e8f0', color: phone.length === 10 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: phone.length === 10 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: phone.length === 10 ? '0 4px 16px rgba(21,128,61,0.25)' : 'none', transition: 'all 0.2s' }}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><MessageSquare size={16} /> Send OTP via WhatsApp <ArrowRight size={16} /></>}
                                </button>
                            </>) : (<>
                                <OtpBoxes
                                    phone={phone} otp={otp} mode={mode}
                                    setOtpStep={setOtpStep} setSignupStep={setSignupStep}
                                    handleOtpChange={handleOtpChange} handleOtpKeyDown={handleOtpKeyDown}
                                    handleOtpPaste={handleOtpPaste} otpRefs={otpRefs}
                                    countdown={countdown} loading={loading}
                                    handleSendOtp={handleSendOtp} clearErrors={clearErrors}
                                    setOtp={setOtp}
                                />
                                <button onClick={() => handleVerifyOtp()} disabled={loading || otp.join('').length < 6}
                                    style={{ width: '100%', padding: '13px', background: otp.join('').length === 6 ? 'linear-gradient(135deg,#15803d,#166534)' : '#e2e8f0', color: otp.join('').length === 6 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><ShieldCheck size={16} /> Verify & Login</>}
                                </button>
                            </>)}
                        </div>
                    )}

                    {/* ── SIGN UP ───────────────────────────────────────────── */}
                    {mode === 'signup' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {signupStep === 'phone' && (<>
                                <PhoneInput value={phone} onChange={setPhone} onEnter={handleSendOtp} />
                                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0 }}>
                                    We'll send a 6-digit OTP to verify your WhatsApp number.
                                </p>
                                <button onClick={() => handleSendOtp()} disabled={loading || phone.length < 10}
                                    style={{ width: '100%', padding: '13px', background: phone.length === 10 ? 'linear-gradient(135deg,#15803d,#166534)' : '#e2e8f0', color: phone.length === 10 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: phone.length === 10 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><MessageSquare size={16} /> Send Verification OTP <ArrowRight size={16} /></>}
                                </button>
                            </>)}

                            {signupStep === 'otp' && (<>
                                <OtpBoxes
                                    phone={phone} otp={otp} mode={mode}
                                    setOtpStep={setOtpStep} setSignupStep={setSignupStep}
                                    handleOtpChange={handleOtpChange} handleOtpKeyDown={handleOtpKeyDown}
                                    handleOtpPaste={handleOtpPaste} otpRefs={otpRefs}
                                    countdown={countdown} loading={loading}
                                    handleSendOtp={handleSendOtp} clearErrors={clearErrors}
                                    setOtp={setOtp}
                                />
                                <button onClick={() => handleSignupOtpVerify()} disabled={loading || otp.join('').length < 6}
                                    style={{ width: '100%', padding: '13px', background: otp.join('').length === 6 ? 'linear-gradient(135deg,#15803d,#166534)' : '#e2e8f0', color: otp.join('').length === 6 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><ShieldCheck size={16} /> Verify OTP</>}
                                </button>
                            </>)}

                            {signupStep === 'details' && (<>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Full Name *</label>
                                    <input type="text" value={signupName} onChange={e => { setSignupName(e.target.value); clearErrors(); }}
                                        placeholder="Enter your full name" autoFocus
                                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                                        onFocus={e => (e.target.style.borderColor = '#15803d')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showSignupPwd ? 'text' : 'password'} value={signupPassword}
                                            onChange={e => { setSignupPassword(e.target.value); clearErrors(); }}
                                            placeholder="Minimum 6 characters"
                                            style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                                            onFocus={e => (e.target.style.borderColor = '#15803d')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                        />
                                        <button onClick={() => setShowSignupPwd(!showSignupPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                            {showSignupPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Confirm Password *</label>
                                    <input type={showSignupPwd ? 'text' : 'password'} value={signupConfirm}
                                        onChange={e => { setSignupConfirm(e.target.value); clearErrors(); }}
                                        onKeyDown={e => e.key === 'Enter' && handleSignup()}
                                        placeholder="Re-enter password"
                                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                                        onFocus={e => (e.target.style.borderColor = '#15803d')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                                    />
                                </div>
                                <button onClick={handleSignup} disabled={loading}
                                    style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#15803d,#166534)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(21,128,61,0.25)', transition: 'all 0.2s' }}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><User size={16} /> Create My Account 🎉</>}
                                </button>
                            </>)}
                        </div>
                    )}

                    {/* Error / Success */}
                    {error && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>⚠️</span>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: 0 }}>{error}</p>
                        </div>
                    )}
                    {success && !error && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>✅</span>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: 0 }}>{success}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 24px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, margin: 0 }}>
                        Secured with WhatsApp OTP • Powered by NEXA POS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StoreLoginModal;
