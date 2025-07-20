// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleNetwork from '../components/ParticleNetwork';
import { API_BASE_URL } from '../context/AuthContext';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>(); // Get the token from the URL
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true); // Initial loading for token validation
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [tokenValid, setTokenValid] = useState(false); // State to track if the token is valid

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setMessage({ type: 'error', text: 'Password reset link is missing or invalid.' });
                setLoading(false);
                return;
            }

            try {
                // Call backend to validate the token without consuming it
                const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok) {
                    setTokenValid(true);
                    setMessage(null); // Clear any previous messages
                } else {
                    setTokenValid(false);
                    setMessage({ type: 'error', text: data.message || 'Invalid or expired password reset link.' });
                }
            } catch (error) {
                console.error('Error validating reset token:', error);
                setTokenValid(false);
                setMessage({ type: 'error', text: 'Network error. Could not validate reset link.' });
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null); // Clear previous messages

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setLoading(true); // Set loading for the actual password reset process

        try {
            // Call backend to reset the password (this endpoint consumes the token)
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword, confirmPassword }), // Pass newPassword and confirmPassword
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: data.message || 'Your password has been reset successfully. You can now log in.' });
                setTokenValid(false); // Invalidate UI state as token is now consumed
                setTimeout(() => {
                    navigate('/'); // Redirect to homepage or login after success
                }, 5000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to reset password. Please try again.' });
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setMessage({ type: 'error', text: 'Network error. Could not reset password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            <ParticleNetwork />
            <Navbar />

            <div className="pt-20 pb-16">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <div className="inline-flex items-center space-x-3 glass-morphism rounded-full px-8 py-4 mb-8 border border-white/20 shadow-lg">
                        <KeyRound className="h-6 w-6 text-purple-400" />
                        <span className="text-white font-bold text-lg">Password Security</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                        Reset Your
                        <span className="block bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                            Password
                        </span>
                    </h1>
                    <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                        Enter your new password below. Ensure it is strong and unique.
                    </p>
                </div>

                <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-morphism rounded-3xl border border-white/20 shadow-2xl p-8">
                        {loading ? (
                            <div className="text-center py-12">
                                <Loader className="h-12 w-12 text-indigo-400 mx-auto animate-spin mb-6" />
                                <p className="text-white text-lg">Verifying reset link...</p>
                            </div>
                        ) : message && message.type === 'error' ? (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                                <p className="text-red-300 text-lg mb-8">{message.text}</p>
                                <Link to="/" className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-8 rounded-xl">
                                    Go to Home
                                </Link>
                            </div>
                        ) : message && message.type === 'success' ? (
                             <div className="text-center py-12">
                                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-4">Success!</h2>
                                <p className="text-green-300 text-lg mb-8">{message.text}</p>
                                <Link to="/" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl">
                                    Go to Home
                                </Link>
                            </div>
                        ) : tokenValid ? (
                            <form onSubmit={handlePasswordReset} className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">Enter New Password</h2>
                                    <p className="text-gray-300 text-sm mt-2">Your password must be at least 6 characters long.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                                            placeholder="Enter your new password"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><EyeOff className="h-5 w-5" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Confirm New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                                            placeholder="Confirm your new password"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><EyeOff className="h-5 w-5" /></button>
                                    </div>
                                </div>
                                {message && message.type === 'error' && (
                                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
                                        {message.text}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3 text-lg"
                                >
                                    {loading ? <><Loader className="h-5 w-5 animate-spin" /><span>Resetting...</span></> : <><KeyRound className="h-5 w-5" /><span>Reset Password</span></>}
                                </button>
                            </form>
                        ) : (
                            // Fallback for when token is invalid but not an immediate error, or after success
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-4">Invalid Link</h2>
                                <p className="text-gray-300 text-lg mb-8">The password reset link is invalid or has already been used.</p>
                                <Link to="/" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl">
                                    Go to Home
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResetPasswordPage;