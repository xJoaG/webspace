// src/pages/EditProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Globe, Image, Save, Loader, AlertCircle, CheckCircle, Trash2, Ban, UserCheck, Users, Calendar, MessageSquare, Mail, Crown, Shield, Settings, Camera, Eye, EyeOff, Upload, X, Plus, Edit3, Lock, Unlock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleNetwork from '../components/ParticleNetwork';
import { useAuth, API_BASE_URL } from '../context/AuthContext'; // <--- IMPORTED API_BASE_URL

const ALL_GROUPS = ['Basic Plan', 'Premium Plan', 'Junior Support', 'Support', 'Senior Support', 'Admin', 'Owner'];

const DEFAULT_PROFILE_PICTURE_URL = `${API_BASE_URL}/uploads/profile_pictures/default_profile.png`; // Uses imported API_BASE_URL

const EditProfilePage: React.FC = () => {
    const { user, isLoading: authLoading, updateUser, hasPrivilege, isBanned } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        nationality: user?.nationality || '',
        is_profile_public: user?.is_profile_public ?? false,
    });
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(user?.profile_picture_url || null);
    const [clearProfilePicture, setClearProfilePicture] = useState(false); // Flag to signal clearing the picture
    const [isDragOver, setIsDragOver] = useState(false);

    // Admin action states (existing from previous context)
    const [targetUserId, setTargetUserId] = useState('');
    const [banReason, setBanReason] = useState('');
    const [bannedUntil, setBannedUntil] = useState('');
    const [newGroup, setNewGroup] = useState('');
    const [adminActionLoading, setAdminActionLoading] = useState(false);
    const [adminActionMessage, setAdminActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [loading, setLoading] = useState(false); // For profile update loading
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null); // For profile update messages

    const canBan = hasPrivilege(['Admin', 'Owner', 'Senior Support']);
    const canChangeGroup = hasPrivilege(['Admin', 'Owner']);

    useEffect(() => {
        if (!authLoading && !user) {
            // Redirect to homepage if not authenticated
            navigate('/');
        } else if (user) {
            // Initialize form data and profile picture preview from authenticated user
            setFormData({
                name: user.name,
                username: user.username || '',
                bio: user.bio || '',
                nationality: user.nationality || '',
                is_profile_public: user.is_profile_public,
            });
            // Ensure profile_picture_url is correctly sourced (using new secure endpoint if available)
            setProfilePicturePreview(
                user.profile_picture_url
                    ? (user.profile_picture_url.startsWith('http') // Check if it's already a full URL
                        ? user.profile_picture_url
                        : `${API_BASE_URL}/api/profile-pictures/${user.profile_picture_url.split('/').pop()}`) // Extract filename and use new endpoint
                    : DEFAULT_PROFILE_PICTURE_URL
            );
            if (hasPrivilege(['Admin', 'Owner'])) {
                setNewGroup(user.group);
            }
        }
    }, [user, authLoading, navigate, hasPrivilege]); // Removed API_BASE_URL from dependencies

    // Handle file selection from input
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Only image files are allowed for profile pictures.' });
                // Revert to current profile picture or default
                setProfilePictureFile(null);
                setProfilePicturePreview(user?.profile_picture_url ? (user.profile_picture_url.startsWith('http') ? user.profile_picture_url : `${API_BASE_URL}/api/profile-pictures/${user.profile_picture_url.split('/').pop()}`) : DEFAULT_PROFILE_PICTURE_URL);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5 MB limit
                setMessage({ type: 'error', text: 'File size exceeds 5MB limit.' });
                setProfilePictureFile(null);
                setProfilePicturePreview(user?.profile_picture_url ? (user.profile_picture_url.startsWith('http') ? user.profile_picture_url : `${API_BASE_URL}/api/profile-pictures/${user.profile_picture_url.split('/').pop()}`) : DEFAULT_PROFILE_PICTURE_URL);
                return;
            }
            setProfilePictureFile(file);
            setProfilePicturePreview(URL.createObjectURL(file)); // Create a local URL for preview
            setClearProfilePicture(false); // A new file means we are not clearing
            setMessage(null); // Clear previous messages
        } else {
            setProfilePictureFile(null);
            // Don't clear preview unless explicitly removing
        }
    };

    // Handle drag over event for drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    // Handle drag leave event
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    // Handle drop event for drag and drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0]; // Fixed: changed files.files[0] to files[0]
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Only image files are allowed!' });
                setProfilePictureFile(null);
                setProfilePicturePreview(user?.profile_picture_url ? (user.profile_picture_url.startsWith('http') ? user.profile_picture_url : `${API_BASE_URL}/api/profile-pictures/${user.profile_picture_url.split('/').pop()}`) : DEFAULT_PROFILE_PICTURE_URL);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5 MB limit
                setMessage({ type: 'error', text: 'File size exceeds 5MB limit.' });
                setProfilePictureFile(null);
                setProfilePicturePreview(user?.profile_picture_url ? (user.profile_picture_url.startsWith('http') ? user.profile_picture_url : `${API_BASE_URL}/api/profile-pictures/${user.profile_picture_url.split('/').pop()}`) : DEFAULT_PROFILE_PICTURE_URL);
                return;
            }
            setProfilePictureFile(file);
            setProfilePicturePreview(URL.createObjectURL(file));
            setClearProfilePicture(false);
            setMessage(null);
        }
    };

    // Handle clearing the profile picture
    const handleClearProfilePicture = () => {
        setProfilePictureFile(null); // No file selected
        setProfilePicturePreview(DEFAULT_PROFILE_PICTURE_URL); // Clear preview to default
        setClearProfilePicture(true); // Set flag to signal backend to clear
        setMessage(null);
    };

    // Handle input changes for text fields
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setMessage(null); // Clear messages on input
    };

    // Main form submission handler for profile update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null); // Clear previous messages

        if (!user) {
            setMessage({ type: 'error', text: 'User not authenticated.' });
            setLoading(false);
            return;
        }

        const data = new FormData(); // Use FormData for file uploads

        // Append text fields
        data.append('name', formData.name);
        data.append('username', formData.username);
        data.append('bio', formData.bio);
        data.append('nationality', formData.nationality);
        data.append('is_profile_public', String(formData.is_profile_public)); // Booleans as strings

        // Handle profile picture logic
        if (profilePictureFile) {
            data.append('profilePicture', profilePictureFile); // Append the actual file
            data.append('clearProfilePicture', 'false'); // Explicitly not clearing if new file
        } else if (clearProfilePicture) {
            data.append('profilePicture', 'null'); // Signal to backend to remove current picture
            data.append('clearProfilePicture', 'true'); // Explicitly clearing
        } else { // No new file and not explicitly clearing
             // If user already had a picture, and it wasn't cleared, ensure backend knows to keep it
            if (user.profile_picture_url) {
                // We send a non-null placeholder or the old URL itself if no change.
                // Backend's multer.single() will receive `req.file` as undefined,
                // and it will check `req.body.clearProfilePicture` and `req.body.profile_picture_url`.
                data.append('profile_picture_url', user.profile_picture_url); // Send existing URL to backend if no change
            } else {
                data.append('profile_picture_url', 'null'); // Explicitly null if no current and no new
            }
            data.append('clearProfilePicture', 'false'); // Not clearing
        }


        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage({ type: 'error', text: 'Authentication token missing. Please log in again.' });
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type': 'multipart/form-data' is NOT set here.
                    // When using FormData, the browser automatically sets the correct 'Content-Type'
                    // header with the boundary parameter. Manually setting it will break the upload.
                },
                body: data, // Send FormData directly
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: result.message || 'Profile updated successfully!' });
                // Update the user context with the new data received from backend
                // The backend provides the full URL for profile_picture_url
                updateUser(result.user);
                // Reset file states after successful upload
                setProfilePictureFile(null);
                setClearProfilePicture(false);
                // Ensure preview reflects new URL from backend response (which should be the full URL)
                setProfilePicturePreview(result.user.profile_picture_url || DEFAULT_PROFILE_PICTURE_URL);

            } else {
                setMessage({ type: 'error', text: result.message || 'Failed to update profile.' });
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.message || 'Network error. Could not update profile.' });
        } finally {
            setLoading(false);
        }
    };

    // Mock admin action handlers (existing from previous context)
    const handleBanUser = async (permanent: boolean = false) => {
        if (!targetUserId || (!permanent && !bannedUntil) || !banReason) {
            setAdminActionMessage({ type: 'error', text: 'Please fill all ban fields.' });
            return;
        }
        setAdminActionLoading(true);
        setAdminActionMessage(null);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAdminActionMessage({ type: 'success', text: `User ${targetUserId} banned successfully!` });
            setTargetUserId('');
            setBanReason('');
            setBannedUntil('');
        } catch (error: any) {
            setAdminActionMessage({ type: 'error', text: 'Failed to ban user. Please try again.' });
        } finally {
            setAdminActionLoading(false);
        }
    };

    const handleUnbanUser = async () => {
        if (!targetUserId) {
            setAdminActionMessage({ type: 'error', text: 'Please enter a User ID to unban.' });
            return;
        }
        setAdminActionLoading(true);
        setAdminActionMessage(null);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAdminActionMessage({ type: 'success', text: `User ${targetUserId} unbanned successfully!` });
            setTargetUserId('');
        } catch (error: any) {
            setAdminActionMessage({ type: 'error', text: 'Failed to unban user. Please try again.' });
        } finally {
            setAdminActionLoading(false);
        }
    };

    const handleUpdateGroup = async () => {
        if (!targetUserId || !newGroup) {
            setAdminActionMessage({ type: 'error', text: 'Please enter User ID and select a new group.' });
            return;
        }
        setAdminActionLoading(true);
        setAdminActionMessage(null);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAdminActionMessage({ type: 'success', text: `User ${targetUserId} group updated to ${newGroup}!` });
            setTargetUserId('');
            setNewGroup('');
        } catch (error: any) {
            setAdminActionMessage({ type: 'error', text: 'Failed to update group. Please try again.' });
        } finally {
            setAdminActionLoading(false);
        }
    };

    const getGroupColor = (group: string) => {
        switch (group) {
            case 'Owner': return 'from-red-500 to-orange-500';
            case 'Admin': return 'from-purple-500 to-pink-500';
            case 'Senior Support': return 'from-blue-500 to-cyan-500';
            case 'Support': return 'from-green-500 to-emerald-500';
            case 'Junior Support': return 'from-yellow-500 to-orange-500';
            case 'Premium Plan': return 'from-indigo-500 to-purple-500';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="glass-morphism rounded-2xl p-8 border border-white/20 flex items-center space-x-4">
                    <Loader className="h-8 w-8 text-indigo-400 animate-spin" />
                    <p className="text-white text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <ParticleNetwork />
            <Navbar />
            
            <div className="pt-20 pb-16">
                {/* Enhanced Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-3 glass-morphism rounded-full px-8 py-4 mb-8 border border-white/20 shadow-lg">
                            <Edit3 className="h-6 w-6 text-blue-400 animate-pulse" />
                            <span className="text-white font-bold text-lg">Profile Editor</span>
                            <User className="h-6 w-6 text-green-400" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                            Customize Your
                            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent"> 
                                Profile
                            </span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                            Personalize your account settings and manage your C++ Hub presence.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Main Profile Form */}
                    <div className="glass-morphism rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                        {/* Form Header */}
                        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 p-8 border-b border-white/10">
                            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                                <div className="flex items-center space-x-6">
                                    <div className="relative">
                                        <img
                                            src={profilePicturePreview || DEFAULT_PROFILE_PICTURE_URL}
                                            alt="Profile Preview"
                                            className="w-20 h-20 rounded-2xl object-cover border-3 border-white/30 shadow-xl"
                                            onError={(e) => { e.currentTarget.src = DEFAULT_PROFILE_PICTURE_URL; }}
                                        />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                            <Camera className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
                                        <p className="text-gray-300">Update your profile details and preferences</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-center lg:text-right">
                                        <p className="text-sm text-gray-400">User ID</p>
                                        <p className="text-white font-bold font-mono">{user.id}</p>
                                    </div>
                                    <div className={`flex items-center space-x-2 bg-gradient-to-r ${getGroupColor(user.group)} px-4 py-2 rounded-full shadow-lg`}>
                                        <Crown className="h-4 w-4 text-white" />
                                        <span className="text-white font-medium">{user.group}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Moved form tag to wrap the content that should be part of the form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-10"> {/* <-- FORM START */}
                            {message && (
                                <div className={`flex items-center space-x-3 p-4 rounded-xl animate-fade-in ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            )}

                            {/* Ban Status Display */}
                            {isBanned() && (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 flex items-center space-x-4 animate-fade-in">
                                    <div className="p-3 bg-red-500/30 rounded-xl">
                                        <Ban className="h-8 w-8 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-red-400 font-bold text-lg">Account Restricted</h3>
                                        <p className="text-red-300">Reason: {user.ban_reason}</p>
                                        <p className="text-red-300 text-sm">Until: {user.banned_until ? new Date(user.banned_until).toLocaleString() : 'Permanent'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Enhanced Profile Picture Section */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                                    <Camera className="h-6 w-6 text-blue-400" />
                                    <span>Profile Picture</span>
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                    {/* Current Picture */}
                                    <div className="flex justify-center">
                                        <div className="relative group">
                                            <img
                                                src={profilePicturePreview || DEFAULT_PROFILE_PICTURE_URL}
                                                alt="Profile Preview"
                                                className="w-40 h-40 rounded-2xl object-cover border-4 border-white/20 shadow-xl group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { e.currentTarget.src = DEFAULT_PROFILE_PICTURE_URL; }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <Camera className="h-10 w-10 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Upload Area */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div
                                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                                                isDragOver 
                                                    ? 'border-blue-400 bg-blue-500/10' 
                                                    : 'border-white/30 hover:border-blue-400 hover:bg-blue-500/5'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('profile-picture-input')?.click()}
                                        >
                                            <input
                                                id="profile-picture-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <div className="space-y-4">
                                                <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                                                    <Upload className="h-8 w-8 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-semibold text-lg mb-2">
                                                        {profilePictureFile ? profilePictureFile.name : 'Upload New Photo'}
                                                    </h4>
                                                    <p className="text-gray-400 text-sm">
                                                        Drag & drop or click to browse
                                                    </p>
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        Recommended: Square image, max 5MB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <label htmlFor="profile-picture-input-alt" className="flex-1 glass-morphism-dark border border-white/20 rounded-xl px-6 py-3 text-white cursor-pointer hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2 group">
                                                <Image className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                                                <span className="font-medium">Choose File</span>
                                                <input
                                                    id="profile-picture-input-alt"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            
                                            {(profilePicturePreview && profilePicturePreview !== DEFAULT_PROFILE_PICTURE_URL) && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearProfilePicture}
                                                    className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-2 border border-red-500/30"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                    <span>Remove</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                        <User className="h-5 w-5 text-blue-400" />
                                        <span>Basic Information</span>
                                    </h3>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-3">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-3">Username</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                                                placeholder="Your unique username"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-3">Nationality</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                                            <input
                                                type="text"
                                                name="nationality"
                                                value={formData.nationality}
                                                onChange={handleInputChange}
                                                className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                                                placeholder="Your nationality"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-purple-400 flex items-center space-x-2">
                                        <Settings className="h-5 w-5 text-purple-400" />
                                        <span>Privacy Settings</span>
                                    </h3>
                                    
                                    <div className="glass-morphism-dark rounded-xl p-6 border border-white/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {formData.is_profile_public ? <Eye className="h-5 w-5 text-green-400" /> : <EyeOff className="h-5 w-5 text-gray-400" />}
                                                <div>
                                                    <label htmlFor="is_profile_public" className="text-white font-medium cursor-pointer">
                                                        Public Profile
                                                    </label>
                                                    <p className="text-gray-400 text-sm">Allow other users to view your profile</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="is_profile_public"
                                                    name="is_profile_public"
                                                    checked={formData.is_profile_public}
                                                    onChange={handleInputChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-green-500"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Account Stats */}
                                    <div className="glass-morphism-dark rounded-xl p-6 border border-white/10">
                                        <h4 className="text-white font-semibold mb-4">Account Statistics</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-400">12</div>
                                                <div className="text-gray-400 text-sm">Courses</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-400">89h</div>
                                                <div className="text-gray-400 text-sm">Learning</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center space-x-2">
                                    <MessageSquare className="h-5 w-5 text-green-400" />
                                    <span>Bio</span>
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 resize-none"
                                    placeholder="Tell us about yourself, your programming journey, goals, or interests... (max 1000 characters)"
                                    maxLength={1000}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-gray-400 text-sm">Share your story with the C++ Hub community</p>
                                    <span className={`text-sm ${formData.bio.length > 900 ? 'text-orange-400' : 'text-gray-400'}`}>
                                        {formData.bio.length}/1000
                                    </span>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="pt-6 border-t border-white/10">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white font-bold py-5 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3 text-lg hover:from-blue-600 hover:via-cyan-600 hover:to-green-600 transition-all duration-300 hover:scale-105 transform-gpu"
                                >
                                    {loading ? (
                                        <><Loader className="h-6 w-6 animate-spin" /><span>Saving Changes...</span></>
                                    ) : (
                                        <><Save className="h-6 w-6" /><span>Save Profile</span></>
                                    )}
                                </button>
                            </div>
                        </form> {/* <-- FORM END */}
                    </div>

                    {/* Admin Tools Section - Mock functionality */}
                    {(canBan || canChangeGroup) && (
                        <div className="glass-morphism rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 p-8 border-b border-white/10">
                                <div className="flex items-center space-x-3">
                                    <Shield className="h-6 w-6 text-red-400" />
                                    <h2 className="text-2xl font-bold text-white">Administrative Tools</h2>
                                </div>
                                <p className="text-gray-300 mt-2">Manage user permissions and moderation actions (Demo Mode)</p>
                            </div>

                            <div className="p-8 space-y-8">
                                {adminActionMessage && (
                                    <div className={`flex items-center space-x-3 p-4 rounded-xl animate-fade-in ${adminActionMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {adminActionMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                        <p className="font-medium">{adminActionMessage.text}</p>
                                    </div>
                                )}

                                {/* Target User Input */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-3">Target User</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                                        <input
                                            type="text"
                                            value={targetUserId}
                                            onChange={(e) => setTargetUserId(e.target.value)}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                                            placeholder="Enter User ID or Username"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Ban Section */}
                                    {canBan && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-red-400 flex items-center space-x-2">
                                                <Ban className="h-5 w-5" />
                                                <span>User Moderation</span>
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Ban Reason</label>
                                                    <textarea
                                                        value={banReason}
                                                        onChange={(e) => setBanReason(e.target.value)}
                                                        rows={3}
                                                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-400 resize-none"
                                                        placeholder="Specify the reason for this action..."
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Ban Duration (Optional)</label>
                                                    <div className="relative group">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-300" />
                                                        <input
                                                            type="datetime-local"
                                                            value={bannedUntil}
                                                            onChange={(e) => setBannedUntil(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-red-400"
                                                        />
                                                    </div>
                                                    <p className="text-gray-400 text-xs mt-1">Leave empty for permanent ban</p>
                                                </div>
                                                
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleBanUser(false)}
                                                        disabled={adminActionLoading}
                                                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 hover:from-red-600 hover:to-orange-600 transition-all duration-300"
                                                    >
                                                        {adminActionLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" />}
                                                        <span>{bannedUntil ? 'Temporary Ban' : 'Permanent Ban'}</span>
                                                    </button>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={handleUnbanUser}
                                                        disabled={adminActionLoading}
                                                        className="w-full glass-morphism-dark text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 hover:bg-white/20 transition-all duration-300 border border-white/20"
                                                    >
                                                        {adminActionLoading ? <Loader className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5 text-green-400" />}
                                                        <span>Remove Ban</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Group Management */}
                                    {canChangeGroup && (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-purple-400 flex items-center space-x-2">
                                                <Users className="h-5 w-5" />
                                                <span>Group Management</span>
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Assign New Group</label>
                                                    <div className="relative">
                                                        <select
                                                            value={newGroup}
                                                            onChange={(e) => setNewGroup(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400 appearance-none pr-10"
                                                        >
                                                            <option value="" disabled className="bg-gray-800">Select a group</option>
                                                            {ALL_GROUPS.map(group => (
                                                                <option key={group} value={group} className="bg-gray-800">{group}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateGroup}
                                                    disabled={adminActionLoading}
                                                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 hover:from-purple-600 hover:to-indigo-600 transition-all duration-300"
                                                >
                                                    {adminActionLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
                                                    <span>Update Group</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default EditProfilePage;