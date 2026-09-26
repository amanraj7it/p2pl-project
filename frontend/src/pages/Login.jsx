import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../index.css';

export default function Login() {
    const navigate = useNavigate();

    const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify' | 'reset'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('donor');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                const sessionObj = {
                    userId: data.user.id,
                    role: data.user.role,
                    name: data.user.name,
                    email: data.user.email
                };
                localStorage.setItem('hl_session', JSON.stringify(sessionObj));
                const target = data.user.role === 'donor' ? '/donor' :
                    data.user.role === 'volunteer' ? '/volunteer' :
                        data.user.role === 'ngo' ? '/ngo' : '/dashboard';
                window.location.href = target;
                return;
            } else {
                alert(data.message || 'Invalid email or password.');
            }
        } catch (e) {
            alert('Server error.');
        }
        setLoading(false);
    };

    const handleSendOTP = async (e, mode) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, mode })
            });
            const data = await res.json();
            if (data.ok) {
                if (mode === 'register') setView('verify');
                if (mode === 'forgot') setView('reset');
            } else {
                alert(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            alert('Server error');
        }
        setLoading(false);
    };

    const handleVerify = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, name, password, role })
            });
            const data = await res.json();
            if (data.success) {
                const sessionObj = {
                    userId: data.user.id,
                    role: data.user.role,
                    name: data.user.name,
                    email: data.user.email
                };
                localStorage.setItem('hl_session', JSON.stringify(sessionObj));
                const target = data.user.role === 'donor' ? '/donor' :
                    data.user.role === 'volunteer' ? '/volunteer' :
                        data.user.role === 'ngo' ? '/ngo' : '/dashboard';
                window.location.href = target;
                return;
            } else {
                alert(data.message || 'Invalid code');
            }
        } catch (err) { alert('Server error'); }
        setLoading(false);
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                alert('Password successfully updated.');
                setView('login');
            } else {
                alert(data.message || 'Invalid code');
            }
        } catch (err) { alert('Server error'); }
        setLoading(false);
    };

    const variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-black font-sans">
            {/* Ambient Full-Bleed Video Background */}
            <video
                className="absolute inset-0 w-full h-full object-cover pointer-events-none anim-fade-in"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4"
                autoPlay
                muted
                loop
                playsInline
            />

            {/* Back to Home Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all shadow-lg hover:border-white/30 cursor-pointer"
            >
                ← Back to Home
            </button>

            {/* Glassmorphic Auth Card */}
            <div className="relative w-full max-w-[420px] min-h-[460px] mx-4 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-10 p-8 text-white flex flex-col justify-center backdrop-blur-2xl bg-black/45 border border-white/15">
                <AnimatePresence mode="wait">
                    {view === 'login' && (
                        <motion.form key="login" onSubmit={handleLogin} variants={variants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-center">
                            <h1 className="text-3xl font-display font-bold mb-6 text-center tracking-tight">Sign In</h1>
                            <div className="mb-4">
                                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all font-medium" />
                            </div>
                            <div className="mb-6">
                                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all font-medium" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light text-white rounded-xl py-3.5 font-bold transition-colors mb-4 shadow-lg cursor-pointer">
                                {loading ? 'Logging in...' : 'Login into Account'}
                            </button>
                            <div className="flex justify-between text-sm font-medium mb-5">
                                <button type="button" onClick={() => setView('forgot')} className="text-white/80 hover:text-white hover:underline transition-all cursor-pointer">Forgot password?</button>
                                <button type="button" onClick={() => setView('register')} className="text-white/80 hover:text-white hover:underline transition-all cursor-pointer">Create an account</button>
                            </div>

                        </motion.form>
                    )}

                    {view === 'register' && (
                        <motion.form key="register" onSubmit={e => handleSendOTP(e, 'register')} variants={variants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-center">
                            <h1 className="text-2xl font-display font-bold mb-4 text-center">Register</h1>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {['donor', 'ngo', 'volunteer'].map(r => (
                                    <button type="button" key={r} onClick={() => setRole(r)} className={`cursor-pointer border border-white/20 rounded-lg p-2 text-center text-xs font-semibold transition-all ${role === r ? 'bg-primary border-primary text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>
                                        {r === 'donor' && '🎁 Donor'}
                                        {r === 'ngo' && '🤝 NGO'}
                                        {r === 'volunteer' && '🏃 Vol'}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-3 mb-6">
                                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20" />
                                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20" />
                                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light text-white rounded-xl py-3.5 font-bold transition-colors mb-4 cursor-pointer">
                                {loading ? 'Sending Code...' : 'Create Account'}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={() => setView('login')} className="text-sm font-medium text-white/80 hover:text-white hover:underline transition-all cursor-pointer">Already have an account? Sign in</button>
                            </div>
                        </motion.form>
                    )}

                    {view === 'verify' && (
                        <motion.form key="verify" onSubmit={handleVerify} variants={variants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-center text-center">
                            <h1 className="text-2xl font-display font-bold mb-2">Check your email</h1>
                            <p className="text-sm text-white/70 mb-4">We've sent a 4-digit code to <span className="font-bold text-white">{email}</span>.</p>
                            <input type="text" placeholder="4-digit code" maxLength="4" value={code} onChange={e => setCode(e.target.value)} required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 text-center tracking-[8px] text-lg font-bold mb-6" />
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light text-white rounded-xl py-3.5 font-bold transition-colors mb-4 cursor-pointer">
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                            <button type="button" onClick={() => setView('register')} className="text-sm font-medium text-white/80 hover:text-white hover:underline transition-all cursor-pointer">Back to register</button>
                        </motion.form>
                    )}

                    {view === 'forgot' && (
                        <motion.form key="forgot" onSubmit={e => handleSendOTP(e, 'forgot')} variants={variants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-center">
                            <h1 className="text-2xl font-display font-bold mb-2 text-center">Reset Password</h1>
                            <p className="text-sm text-white/70 mb-6 text-center">Enter your email address and we'll send you a 4-digit reset code.</p>
                            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 mb-6" />
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light text-white rounded-xl py-3.5 font-bold transition-colors mb-4 cursor-pointer">
                                {loading ? 'Sending Code...' : 'Send Reset Code'}
                            </button>
                            <div className="text-center"><button type="button" onClick={() => setView('login')} className="text-sm font-medium text-white/80 hover:text-white hover:underline transition-all cursor-pointer">Back to login</button></div>
                        </motion.form>
                    )}

                    {view === 'reset' && (
                        <motion.form key="reset" onSubmit={handleReset} variants={variants} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full justify-center text-center">
                            <h1 className="text-2xl font-display font-bold mb-2">New Password</h1>
                            <p className="text-sm text-white/70 mb-4">Code sent to <span className="font-bold text-white">{email}</span>.</p>
                            <input type="text" placeholder="4-digit code" maxLength="4" value={code} onChange={e => setCode(e.target.value)} required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 text-center tracking-[8px] text-lg font-bold mb-4" />
                            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 mb-6" />
                            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light text-white rounded-xl py-3.5 font-bold transition-colors mb-4 cursor-pointer">
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                            <button type="button" onClick={() => setView('login')} className="text-sm font-medium text-white/80 hover:text-white hover:underline transition-all cursor-pointer">Back to login</button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            {/* Creators Footer */}
            <div className="absolute bottom-6 left-0 w-full text-center text-white/70 text-xs md:text-sm font-medium z-10 pointer-events-none">
                <p className="tracking-[0.25em] uppercase mb-2 text-[11px] text-white/50 font-semibold">Created By</p>
                <div className="flex justify-center gap-3 md:gap-4 flex-wrap max-w-3xl mx-auto px-4 opacity-90 drop-shadow-lg">
                    <span className="hover:text-white transition-colors pointer-events-auto cursor-default">Aman Raj</span>
                    <span className="text-white/30">&bull;</span>
                    <span className="hover:text-white transition-colors pointer-events-auto cursor-default">Bhakti Tyagi</span>
                    <span className="text-white/30">&bull;</span>
                    <span className="hover:text-white transition-colors pointer-events-auto cursor-default">Divya Sri KP</span>
                    <span className="text-white/30">&bull;</span>
                    <span className="hover:text-white transition-colors pointer-events-auto cursor-default">Harish P</span>
                    <span className="text-white/30">&bull;</span>
                    <span className="hover:text-white transition-colors pointer-events-auto cursor-default">Bhaviya A</span>
                    <span className="text-white/30">&bull;</span>
                    <span className="hover:text-white transition-colors pointer-events-auto cursor-default">Samyuktha</span>
                </div>
            </div>
        </div>
    );
}
