// src/pages/VerificationResultPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import ParticleNetwork from '../components/ParticleNetwork'; // Import ParticleNetwork

const VerificationResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const urlStatus = searchParams.get('status');
        const urlMessage = searchParams.get('message');

        setStatus(urlStatus);
        setMessage(urlMessage);

        // Optional: Redirect to home page after a delay for success/already-verified cases
        if (urlStatus === 'success' || urlStatus === 'already-verified') {
            setTimeout(() => {
                navigate('/'); // Redirect to the root (homepage: cpp-hub.com)
            }, 5000); // Redirect after 5 seconds
        }

    }, [searchParams, navigate]); // Removed 'user' dependency as this page doesn't interact with user context directly here

    const renderContent = () => {
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
        <div className="relative min-h-screen overflow-hidden"> {/* Use relative and overflow-hidden for ParticleNetwork */}
            <ParticleNetwork /> {/* ParticleNetwork as background */}

            <div className="absolute inset-0 flex items-center justify-center p-4 z-10"> {/* Ensure content is on top */}
                <div className="glass-morphism rounded-2xl border border-white/20 p-8 max-w-md w-full text-center animate-fade-in">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default VerificationResultPage;