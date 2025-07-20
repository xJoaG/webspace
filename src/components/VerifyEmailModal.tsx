// src/components/VerifyEmailModal.tsx
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, RotateCcw, X, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VerifyEmailModal: React.FC = () => {
    const { user, resendVerificationEmail, setShowVerificationPopup, isLoading: authLoading, logout } = useAuth();
  const [countdown, setCountdown] = useState(0); // Initialize to 0, so it's clickable initially
  const [isCooldownActive, setIsCooldownActive] = useState(false); // New state to manage cooldown
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Effect to manage the resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCooldownActive && countdown > 0) { // Only count down if cooldown is active and countdown is above 0
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isCooldownActive && countdown === 0) {
      setIsCooldownActive(false); // End cooldown when countdown reaches 0
      setResendMessage(null); // Clear message when cooldown ends
    }
    return () => clearTimeout(timer); // Cleanup on unmount or dependency change
  }, [countdown, isCooldownActive]);

  // Effect to react to user verification status change from AuthContext
  useEffect(() => {
    if (user && user.is_verified) {
      setShowVerificationPopup(false);
    }
  }, [user, setShowVerificationPopup]);

  const handleResendEmail = async () => {
    if (!user || !user.email) {
      setResendMessage({ type: 'error', text: 'No user email found to resend verification.' });
      return;
    }

    setIsCooldownActive(true); // Start the cooldown immediately
    setCountdown(60); // Set countdown to 60 seconds
    setResendMessage(null); // Clear previous messages

    try {
      const result = await resendVerificationEmail(user.email);
      if (result.success) {
        setResendMessage({ type: 'success', text: result.message || 'Verification email resent successfully! Check your inbox.' });
      } else {
        setResendMessage({ type: 'error', text: result.message || 'Failed to resend verification email.' });
        // If resend failed, we might want to end cooldown early, or still force them to wait.
        // For now, let cooldown continue as per original request, but it's a UX choice.
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      setResendMessage({ type: 'error', text: 'Network error or server unavailable. Please try again.' });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
        <div className="relative glass-morphism rounded-3xl border border-white/20 w-full max-w-md p-8 shadow-2xl animate-fade-in text-center">
            <Loader className="h-12 w-12 text-indigo-400 mx-auto animate-spin mb-4" />
            <p className="text-white">Loading user status...</p>
        </div>
      </div>
    );
  }

  if (user.is_verified) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay: Not clickable to close */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />

      {/* Modal Content */}
      <div className="relative glass-morphism rounded-3xl border border-white/20 w-full max-w-md p-8 shadow-2xl animate-fade-in">
        {/* No close button here (X) to make it unclosable by user */}
        <div className="text-center mb-8">
          <div className="bg-indigo-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Mail className="h-10 w-10 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-300">
            Your account is not yet verified. Please check your inbox and click the verification link sent to:
                    
                    {/* Logout button */}
                    <button
                        onClick={logout}
                        className="w-full bg-red-500/20 backdrop-blur-sm text-red-400 py-3 rounded-lg font-semibold hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 flex items-center justify-center space-x-2"
                    >
                        <span>Logout</span>
                    </button>
          </p>
        </div>

        {/* Email display */}
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10 text-center">
          <p className="text-white font-medium text-lg">{user.email}</p>
        </div>

        {/* Resend message (success/error) */}
        {resendMessage && (
            <div className={`p-3 rounded-xl text-center mb-4 ${resendMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {resendMessage.text}
            </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <p className="text-gray-400 text-sm text-center">
            After clicking the link in your email, refresh this page or log in again.
          </p>
          <button
            onClick={handleResendEmail}
            disabled={isCooldownActive} // Disable if cooldown is active
            className="w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCooldownActive ? ( // Show countdown if cooldown is active
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Resend in {countdown}s</span>
              </>
            ) : ( // Show resend button if not on cooldown
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-gray-400 text-sm">
            Didn't receive the email? Check your spam folder or contact{' '}
            <a href="/support" className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
              support
            </a>
            . If you close this tab, you will need to log in again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailModal;