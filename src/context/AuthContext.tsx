// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// IMPORTANT: HARDCODE YOUR BACKEND API URL HERE FOR PRODUCTION DEPLOYMENT
// For local development, use your localhost address.
// For production, replace this with your actual deployed backend URL (e.g., 'https://api.cpp-hub.com').
export const API_BASE_URL = 'https://api.cpp-hub.com';

export const DEFAULT_PROFILE_PICTURE_URL = `${API_BASE_URL}/uploads/profile_pictures/default_profile.png`;

// --- Type Definitions ---
interface User {
  id: number;
  name: string;
  email: string;
  is_verified: boolean; // Directly use is_verified as it comes from backend
  email_verified_at: string | null; // For frontend logic, derived from is_verified
  bio: string | null;
  nationality: string | null;
  profile_picture_url: string | null;
  is_profile_public: boolean;
  username: string | null;
  group: string; // Corresponds to group_name in backend
  banned_until: string | null;
  ban_reason: string | null;
  // Add other fields from JWT payload if needed, e.g., programming_languages, active_projects
}

interface AuthContextType {
  user: User | null;
  // Adjusted return types for clarity on success/failure and messages
  login: (credentials: any) => Promise<{ success: boolean; message?: string; errors?: string[] }>;
  register: (data: any) => Promise<{ success: boolean; message?: string; errors?: string[] }>;
  logout: () => void;
  isLoading: boolean;
  isVerifying: boolean; // Can be used to show loading state during external verification process (e.g., when the verification link is clicked)
  showVerificationPopup: boolean;
  setShowVerificationPopup: React.Dispatch<React.SetStateAction<boolean>>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string; }>;
  // NEW: Code-based password reset functions
  requestPasswordResetCode: (emailOrUsername: string) => Promise<{ success: boolean; message?: string; }>;
  verifyResetCode: (emailOrUsername: string, code: string) => Promise<{ success: boolean; message?: string; tempToken?: string }>;
  resetPasswordWithCode: (emailOrUsername: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string; }>;

  updateUser: (newUserData: Partial<User>) => void;
  hasPrivilege: (requiredGroups: string | string[]) => boolean;
  isBanned: () => boolean;
  showBanPopup: boolean;
  setShowBanPopup: React.Dispatch<React.SetStateAction<boolean>>;
  // NEW: Profile update function
  updateProfile: (profileData: any) => Promise<{ success: boolean; message?: string; user?: User }>;
  // NEW: Fetch user profile function
  fetchUserProfile: (userId: string) => Promise<{ success: boolean; user?: any; message?: string }>;
}

// Define the hierarchy of groups for frontend authorization
const GROUP_HIERARCHY: { [key: string]: number } = {
    'Basic Plan': 0,
    'Premium Plan': 1,
    'Junior Support': 2,
    'Support': 3,
    'Senior Support': 4,
    'Admin': 5,
    'Owner': 6,
};

// --- Context Definition ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- AuthProvider Component ---
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Initialize to true, assume loading until checked
    const [isVerifying, setIsVerifying] = useState(false);
    const [showVerificationPopup, setShowVerificationPopup] = useState(false);
    const [showBanPopup, setShowBanPopup] = useState(false);

    // Helper to check if a given user object is currently banned
    const isUserObjectBanned = (userObj: User | null): boolean => {
        if (!userObj || !userObj.banned_until) {
            return false;
        }
        const bannedUntilDate = new Date(userObj.banned_until);
        return bannedUntilDate > new Date(); // Check if banned_until is in the future
    };

    // Helper to set user and manage local storage, verification/ban popups
    const setUserData = (userData: any | null, token: string | null = null) => {
        if (userData) {
            // Map backend user data structure to frontend User interface
            const mappedUser: User = {
                id: userData.id,
                name: userData.name || userData.username || 'User', // Fallback for name
                email: userData.email,
                is_verified: !!userData.is_verified, // Ensure boolean
                email_verified_at: userData.is_verified ? new Date().toISOString() : null, // Set timestamp if verified
                bio: userData.bio || null,
                nationality: userData.nationality || null,
                profile_picture_url: userData.profile_picture_url || null,
                is_profile_public: userData.is_profile_public ?? true, // Default to true if not set
                username: userData.username || userData.email.split('@')[0], // Fallback for username
                group: userData.group || userData.group_name || 'Basic Plan', // Use group or group_name from backend
                banned_until: userData.banned_until || null,
                ban_reason: userData.ban_reason || null,
            };

            setUser(mappedUser);
            localStorage.setItem('user', JSON.stringify(mappedUser));
            if (token) {
                localStorage.setItem('token', token);
            }

            // Manage popups based on the updated user data
            if (!mappedUser.is_verified) {
                setShowVerificationPopup(true);
            } else {
                setShowVerificationPopup(false);
            }

            if (isUserObjectBanned(mappedUser)) {
                setShowBanPopup(true);
            } else {
                setShowBanPopup(false);
            }

        } else {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setShowVerificationPopup(false);
            setShowBanPopup(false);
        }
    };

    const login = async (credentials: any): Promise<{ success: boolean; message?: string; errors?: string[] }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                setUserData(data.user, data.token);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message, errors: data.errors };
            }
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: any): Promise<{ success: boolean; message?: string; errors?: string[] }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (response.ok) {
                return { success: true, message: responseData.message };
            } else {
                return { success: false, message: responseData.message, errors: responseData.errors };
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUserData(null);
    };

    const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message?: string; }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'Failed to resend email.' };
            }
        } catch (error: any) {
            console.error('Resend verification email error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Function to request a password reset code
    const requestPasswordResetCode = async (emailOrUsername: string): Promise<{ success: boolean; message?: string; }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername }),
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, message: data.message || 'If an account with that email or username exists, a password reset code has been sent.' };
            } else {
                return { success: false, message: data.message || 'Failed to request password reset code.' };
            }
        } catch (error: any) {
            console.error('Request password reset code error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Function to verify the password reset code
    const verifyResetCode = async (emailOrUsername: string, code: string): Promise<{ success: boolean; message?: string; tempToken?: string }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, code }),
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, message: data.message, tempToken: data.tempToken };
            } else {
                return { success: false, message: data.message || 'Invalid or expired reset code.' };
            }
        } catch (error: any) {
            console.error('Verify reset code error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Function to reset password with the code
    const resetPasswordWithCode = async (emailOrUsername: string, code: string, newPassword: string): Promise<{ success: boolean; message?: string; }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-with-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, code, newPassword }),
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, message: data.message || 'Password has been reset successfully.' };
            } else {
                return { success: false, message: data.message || 'Failed to reset password.' };
            }
        } catch (error: any) {
            console.error('Reset password with code error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Function to update user profile
    const updateProfile = async (profileData: any): Promise<{ success: boolean; message?: string; user?: User }> => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { success: false, message: 'No authentication token found.' };
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData),
            });

            const data = await response.json();
            if (response.ok) {
                // Update user data in context
                setUserData(data.user, token);
                return { success: true, message: data.message, user: data.user };
            } else {
                return { success: false, message: data.message || 'Failed to update profile.' };
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        } finally {
            setIsLoading(false);
        }
    };

    // NEW: Function to fetch user profile by ID
    const fetchUserProfile = async (userId: string): Promise<{ success: boolean; user?: any; message?: string }> => {
        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Content-Type': 'application/json' };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'GET',
                headers,
            });

            const data = await response.json();
            if (response.ok) {
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message || 'Failed to fetch user profile.' };
            }
        } catch (error: any) {
            console.error('Fetch user profile error:', error);
            return { success: false, message: error.message || 'Network error or server unavailable.' };
        }
    };

    // Function to update user data in context and local storage, potentially re-evaluating popups
    const updateUser = (newUserData: Partial<User>) => {
        setUser(prevUser => {
            if (!prevUser) return null; // If no previous user, cannot update

            const updatedUser: User = {
                ...prevUser,
                ...newUserData,
                // Ensure `is_verified` is correctly set and `email_verified_at` updated
                is_verified: newUserData.is_verified !== undefined ? !!newUserData.is_verified : prevUser.is_verified,
                email_verified_at: newUserData.is_verified ? new Date().toISOString() : (newUserData.is_verified === false ? null : prevUser.email_verified_at),
            };

            // Update local storage and re-evaluate popups
            setUserData(updatedUser, localStorage.getItem('token'));
            return updatedUser;
        });
    };

    // Helper to check if the current user is banned
    const isBanned = (): boolean => {
        return isUserObjectBanned(user);
    };

    // Helper to check if the current user has a specific privilege level
    const hasPrivilege = (requiredGroups: string | string[]) : boolean => {
        if (!user) return false;

        const userPrivilege = GROUP_HIERARCHY[user.group] ?? -1;

        if (Array.isArray(requiredGroups)) {
            for (const group of requiredGroups) {
                const requiredPrivilege = GROUP_HIERARCHY[group] ?? -1;
                if (userPrivilege >= requiredPrivilege) {
                    return true;
                }
            }
            return false;
        }

        const requiredPrivilege = GROUP_HIERARCHY[requiredGroups] ?? -1;
        return userPrivilege >= requiredPrivilege;
    };

    // Initial load: Check for user in localStorage and potentially fetch full user data
    React.useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        const fetchUserData = async (token: string) => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUserData(userData.user, token);
                } else {
                    console.error('Failed to fetch user data:', response.statusText);
                    logout();
                }
            } catch (error) {
                console.error('Network error fetching user data:', error);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        if (savedUser && savedToken) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // Set initial user data from localStorage immediately for faster UI render
                setUser(parsedUser);
                // Then fetch fresh data from backend to ensure it's up-to-date
                fetchUserData(savedToken);
            } catch (error) {
                console.error('Error parsing saved user or token:', error);
                logout();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const value = {
        user,
        login,
        register,
        logout,
        isLoading,
        isVerifying,
        showVerificationPopup,
        setShowVerificationPopup,
        resendVerificationEmail,
        requestPasswordResetCode,
        verifyResetCode,
        resetPasswordWithCode,
        updateUser,
        isBanned,
        showBanPopup,
        setShowBanPopup,
        hasPrivilege,
        updateProfile,
        fetchUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};