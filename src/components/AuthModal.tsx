// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader, Sparkles, Shield, Crown, Zap, Check, KeyRound, MessageCircle } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext'; // <--- IMPORTED API_BASE_URL

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'reset_request';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'reset_request' | 'reset_code_entry' | 'reset_password_form' | 'reset_success'>(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [registrationEmailSent, setRegistrationEmailSent] = useState(false);
    const [passwordResetRequested, setPasswordResetRequested] = useState(false); // For initial request confirmation
    const [formData, setFormData] = useState({
        email: '', // Used for login/register
        password: '', // Used for login/register
        password_confirmation: '', // Used for register
        name: '', // Used for register
        username: '', // Used for register
        emailOrUsername: '', // Used for reset request and code entry
        resetCode: '', // NEW: For password reset code entry
        newPassword: '', // NEW: For final password reset form
        confirmNewPassword: '', // NEW: For final password reset form
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [generalMessage, setGeneralMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { login, register, requestPasswordResetCode, verifyResetCode, resetPasswordWithCode, isLoading } = useAuth();

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (mode === 'login' || mode === 'register') {
            if (!formData.email) newErrors.email = 'Email is required.';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid.';
            if (!formData.password) newErrors.password = 'Password is required.';
            else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
        }

        if (mode === 'register') {
            if (!formData.name) newErrors.name = 'Full Name is required.';
            if (!formData.username) newErrors.username = 'Username is required.';
            else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters.';
            if (formData.password !== formData.password_confirmation) newErrors.password_confirmation = 'Passwords do not match.';
        }

        if (mode === 'reset_request') {
            if (!formData.emailOrUsername) newErrors.emailOrUsername = 'Email or Username is required.';
        }

        if (mode === 'reset_code_entry') {
            if (!formData.resetCode) newErrors.resetCode = 'Reset code is required.';
            else if (formData.resetCode.length !== 6) newErrors.resetCode = 'Code must be 6 digits.'; // Assuming 6-digit code
        }

        if (mode === 'reset_password_form') {
            if (!formData.newPassword) newErrors.newPassword = 'New password is required.';
            else if (formData.newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters.';
            if (formData.newPassword !== formData.confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setGeneralMessage(null);

        if (!validateForm()) return;

        try {
            if (mode === 'login') {
                const result = await login({ email: formData.email, password: formData.password });
                if (result.success) {
                    onClose();
                } else {
                    setErrors({ submit: result.message || 'Login failed.' });
                }
            } else if (mode === 'register') {
                const result = await register({
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    password_confirmation: formData.password_confirmation
                });

                if (result.success) {
                    setRegistrationEmailSent(true);
                } else {
                    setErrors({ submit: result.message || 'Registration failed.' });
                }
            } else if (mode === 'reset_request') {
                const result = await requestPasswordResetCode(formData.emailOrUsername);
                if (result.success) {
                    setPasswordResetRequested(true);
                    setGeneralMessage({ type: 'success', text: result.message || 'If an account with that email or username exists, a password reset code has been sent.' });
                    setMode('reset_code_entry'); // Move to code entry step
                } else {
                    setGeneralMessage({ type: 'error', text: result.message || 'Failed to send password reset code.' });
                }
            } else if (mode === 'reset_code_entry') { // NEW: Handle code verification
                const result = await verifyResetCode(formData.emailOrUsername, formData.resetCode);
                if (result.success) {
                    setGeneralMessage({ type: 'success', text: result.message || 'Code verified successfully! Please set your new password.' });
                    setMode('reset_password_form'); // Move to new password form
                } else {
                    setGeneralMessage({ type: 'error', text: result.message || 'Invalid or expired reset code.' });
                }
            } else if (mode === 'reset_password_form') { // NEW: Handle final password reset
                const result = await resetPasswordWithCode(formData.emailOrUsername, formData.resetCode, formData.newPassword);
                if (result.success) {
                    setGeneralMessage({ type: 'success', text: result.message || 'Password reset successfully! You can now log in.' });
                    setMode('reset_success'); // Show final success message
                    setTimeout(() => onClose(), 3000); // Close modal after 3 seconds
                } else {
                    setGeneralMessage({ type: 'error', text: result.message || 'Failed to reset password.' });
                }
            }
        } catch (error: any) {
            setErrors({ submit: 'An unexpected error occurred. Please try again later.' });
            console.error('AuthModal handleSubmit error:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        if (errors.submit) {
             setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.submit;
                return newErrors;
            });
        }
        setGeneralMessage(null);
    };

    const toggleMode = (newMode: 'login' | 'register' | 'reset_request') => {
        setMode(newMode);
        setErrors({});
        setGeneralMessage(null);
        setRegistrationEmailSent(false);
        setPasswordResetRequested(false);
        setFormData({
            email: '', password: '', password_confirmation: '', name: '', username: '',
            emailOrUsername: '', resetCode: '', newPassword: '', confirmNewPassword: '',
        });
    };

    // Render message after successful registration (email verification pending)
    if (registrationEmailSent) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" onClick={onClose} />
                <div className="relative glass-morphism rounded-3xl border border-white/20 w-full max-w-md p-8 shadow-2xl animate-fade-in text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl mb-6 shadow-xl">
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Verification Email Sent!</h2>
                    <p className="text-gray-300 text-lg mb-8">
                        Please check your inbox at <span className="font-bold text-blue-300">{formData.email}</span> for a verification link to activate your account.
                        If you don't see it, check your spam folder.
                    </p>
                    <button onClick={onClose} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-xl">
                        Got it!
                    </button>
                </div>
            </div>
        );
    }

    // Render final success message after password reset
    if (mode === 'reset_success') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" onClick={onClose} />
                <div className="relative glass-morphism rounded-3xl border border-white/20 w-full max-w-md p-8 shadow-2xl animate-fade-in text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl mb-6 shadow-xl">
                        <Check className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Password Reset Successful!</h2>
                    <p className="text-gray-300 text-lg mb-8">
                        {generalMessage?.text || 'Your password has been successfully reset. You can now log in with your new password.'}
                    </p>
                    <button onClick={onClose} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-xl">
                        Close
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" onClick={onClose} />
            <div className="relative glass-morphism rounded-3xl border border-white/20 w-full max-w-md p-8 shadow-2xl animate-fade-in overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full z-10"><X className="h-5 w-5" /></button>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-xl">
                        {mode === 'login' && <Shield className="h-8 w-8 text-white" />}
                        {mode === 'register' && <Crown className="h-8 w-8 text-white" />}
                        {(mode === 'reset_request' || mode === 'reset_code_entry' || mode === 'reset_password_form') && <KeyRound className="h-8 w-8 text-white" />}
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">
                        {mode === 'login' ? 'Welcome Back!' :
                         mode === 'register' ? 'Join C++ Hub' :
                         mode === 'reset_request' ? 'Reset Your Password' :
                         mode === 'reset_code_entry' ? 'Enter Reset Code' :
                         'Set New Password'}
                    </h2>
                    <p className="text-gray-300 text-lg">
                        {mode === 'login' ? 'Continue your coding journey' :
                         mode === 'register' ? 'Start your programming adventure' :
                         mode === 'reset_request' ? 'Enter your email or username to receive a reset code.' :
                         mode === 'reset_code_entry' ? 'A 6-digit code has been sent to your email.' :
                         'Enter your new password below.'}
                    </p>
                </div>
                {generalMessage && (
                    <div className={`p-3 rounded-xl text-center mb-4 ${generalMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {generalMessage.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === 'register' && (
                        <div className="animate-slide-up">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Full Name</label>
                            <div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Enter your full name" />
                            </div>
                            {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
                        </div>
                    )}
                    {mode === 'register' && (
                        <div className="animate-slide-up">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
                            <div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Choose a unique username" />
                            </div>
                            {errors.username && <p className="text-red-400 text-sm mt-2">{errors.username}</p>}
                        </div>
                    )}
                    {(mode === 'login' || mode === 'register') && (
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                            <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Enter your email" />
                            </div>
                            {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
                        </div>
                    )}
                    {(mode === 'login' || mode === 'register') && (
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                            <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Enter your password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><EyeOff className="h-5 w-5" /></button>
                            </div>
                            {errors.password && <p className="text-red-400 text-sm mt-2">{errors.password}</p>}
                        </div>
                    )}
                    {mode === 'register' && (
                        <div className="animate-slide-up">
                            <label className="block text-sm font-bold text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Confirm your password" />
                            </div>
                            {errors.password_confirmation && <p className="text-red-400 text-sm mt-2">{errors.password_confirmation}</p>}
                        </div>
                    )}
                    {mode === 'reset_request' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Email or Username</label>
                            <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type="text" name="emailOrUsername" value={formData.emailOrUsername} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Enter your email or username" />
                            </div>
                            {errors.emailOrUsername && <p className="text-red-400 text-sm mt-2">{errors.emailOrUsername}</p>}
                        </div>
                    )}
                    {mode === 'reset_code_entry' && ( // NEW: Code entry field
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Reset Code</label>
                            <div className="relative group"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                <input type="text" name="resetCode" value={formData.resetCode} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Enter the 6-digit code" maxLength={6} />
                            </div>
                            {errors.resetCode && <p className="text-red-400 text-sm mt-2">{errors.resetCode}</p>}
                            <p className="text-gray-400 text-sm mt-2">Check your email for the reset code.</p>
                        </div>
                    )}
                    {mode === 'reset_password_form' && ( // NEW: New password fields
                        <>
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">New Password</label>
                                <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                    <input type={showPassword ? 'text' : 'password'} name="newPassword" value={formData.newPassword} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Enter your new password" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><EyeOff className="h-5 w-5" /></button>
                                </div>
                                {errors.newPassword && <p className="text-red-400 text-sm mt-2">{errors.newPassword}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Confirm New Password</label>
                                <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                    <input type={showPassword ? 'text' : 'password'} name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleInputChange} className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400" placeholder="Confirm your new password" />
                                </div>
                                {errors.confirmNewPassword && <p className="text-red-400 text-sm mt-2">{errors.confirmNewPassword}</p>}
                            </div>
                        </>
                    )}

                    {errors.submit && <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3"><p className="text-red-400 text-sm text-center">{errors.submit}</p></div>}
                    <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3 text-lg">
                        {isLoading ? <><Loader className="h-5 w-5 animate-spin" /><span>Processing...</span></> :
                         mode === 'login' ? <><Shield className="h-5 w-5" /><span>Sign In</span></> :
                         mode === 'register' ? <><Crown className="h-5 w-5" /><span>Create Account</span></> :
                         mode === 'reset_request' ? <><KeyRound className="h-5 w-5" /><span>Send Reset Code</span></> :
                         mode === 'reset_code_entry' ? <><MessageCircle className="h-5 w-5" /><span>Verify Code</span></> :
                         <><KeyRound className="h-5 w-5" /><span>Reset Password</span></>}
                    </button>
                </form>
                <div className="text-center mt-8">
                    {mode === 'login' && (
                        <>
                            <p className="text-gray-300 text-lg">Don't have an account? <button onClick={() => toggleMode('register')} className="text-blue-400 hover:text-blue-300 font-bold">Sign Up</button></p>
                            <p className="text-gray-300 text-lg mt-2">Forgot your password? <button onClick={() => toggleMode('reset_request')} className="text-blue-400 hover:text-blue-300 font-bold">Reset Here</button></p>
                        </>
                    )}
                    {mode === 'register' && (
                        <p className="text-gray-300 text-lg">Already have an account? <button onClick={() => toggleMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">Sign In</button></p>
                    )}
                    {(mode === 'reset_request' || mode === 'reset_code_entry' || mode === 'reset_password_form') && (
                        <p className="text-gray-300 text-lg">Remember your password? <button onClick={() => toggleMode('login')} className="text-blue-400 hover:text-blue-300 font-bold">Back to Login</button></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;