// src/pages/VerificationResultPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import ParticleNetwork from '../components/ParticleNetwork';
import { useAuth, API_BASE_URL } from '../context/AuthContext';

const VerificationResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { updateUser } = useAuth();
    const [status, setStatus] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (token) {
            // Verify the email with the token
            verifyEmail(token);
        } else {
            // Fallback to URL parameters for status and message
            const urlStatus = searchParams.get('status');
            const urlMessage = searchParams.get('message');
            
            setStatus(urlStatus);
            setMessage(urlMessage);
            
            // Optional: Redirect to home page after a delay for success/already-verified cases
            if (urlStatus === 'success' || urlStatus === 'already-verified') {
                setTimeout(() => {
                    navigate('/');
                }, 5000);
            }
        }
    }, [searchParams, navigate]);
    
    const verifyEmail = async (token: string) => {
        setIsVerifying(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-email/${token}`, {
                method: 'GET',
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
                
                // Update user verification status if logged in
                updateUser({ is_verified: true });
                
                // Redirect after success
                setTimeout(() => {
                    navigate('/');
                }, 5000);
            } else {
                if (response.status === 409) {
                    setStatus('already-verified');
                    setMessage(data.message || 'Email is already verified.');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed.');
                }
            }
        } catch (error) {
            console.error('Email verification error:', error);
            setStatus('error');
            setMessage('Network error. Please try again later.');
        } finally {
            setIsVerifying(false);
        }
    };

    const renderContent = () => {
        if (isVerifying) {
            return (
                <>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400 mx-auto mb-6"></div>
                    <h1 className="text-2xl font-bold text-white mb-4">Verifying Email...</h1>
                    <p className="text-gray-300 mb-8">
                        Please wait while we verify your email address.
                    </p>
                </>
            );
        }


        switch (status) {
            case 'success':
                return (
                    <>
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-4">Email Verified Successfully!</h1>
                        <p className="text-gray-300 mb-8">
                            {message || 'Thank you for verifying your email. You can now log in to access your account.'}
                        </p>
                        <Link to="/" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl">
                            Go to Home
                        </Link>
                    </>
                );
            case 'already-verified':
                return (
                    <>
                        <Clock className="h-16 w-16 text-blue-400 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-4">Email Already Verified</h1>
                        <p className="text-gray-300 mb-8">
                            {message || 'Your email address has already been verified. You can log in at any time.'}
                        </p>
                        <Link to="/" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl">
                            Go to Home
                        </Link>
                    </>
                );
            case 'error': // Generic error, e.g., token invalid or missing
            default: // Catch-all for other cases or missing status
                return (
                    <>
                        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
                        <p className="text-gray-300 mb-8">
                            {message || 'The verification link is invalid or has expired. Please try again or contact support.'}
                        </p>
                        <Link to="/" className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-8 rounded-xl">
                            Back to Home
                        </Link>
                    </>
                );
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            <ParticleNetwork />

            <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                <div className="glass-morphism rounded-2xl border border-white/20 p-8 max-w-md w-full text-center animate-fade-in">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VerificationResultPage;