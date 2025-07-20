// src/pages/EditProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Globe, Lock, Save, ArrowLeft, Upload, Eye, EyeOff, Loader, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParticleNetwork from '../components/ParticleNetwork';
import { useAuth, API_BASE_URL } from '../context/AuthContext';

const DEFAULT_PROFILE_PICTURE_URL = `${API_BASE_URL}/uploads/profile_pictures/default_profile.png`;

const EditProfilePage: React.FC = () => {
    const { user, updateProfile, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        bio: '',
        nationality: '',
        is_profile_public: true,
    });
    
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Populate form with current user data
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                email: user.email || '',
                bio: user.bio || '',
                nationality: user.nationality || '',
                is_profile_public: user.is_profile_public ?? true,
            });
            
            // Set profile picture preview
            if (user.profile_picture_url) {
                const imageUrl = user.profile_picture_url.startsWith('http') 
                    ? user.profile_picture_url 
                    : `${API_BASE_URL}${user.profile_picture_url}`;
                setProfilePicturePreview(imageUrl);
            } else {
                setProfilePicturePreview(DEFAULT_PROFILE_PICTURE_URL);
            }
        }
    }, [user]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select a valid image file.' });
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size must be less than 5MB.' });
                return;
            }
            
            setProfilePicture(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicturePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            
            setMessage(null);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required.';
        }
        
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required.';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters.';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Create FormData for file upload
            const submitData = new FormData();
            
            // Append form fields
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value.toString());
            });
            
            // Append profile picture if selected
            if (profilePicture) {
                submitData.append('profile_picture', profilePicture);
            }
            
            // Make API call with FormData
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage({ type: 'error', text: 'No authentication token found.' });
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type for FormData, let browser set it with boundary
                },
                body: submitData,
            });

            const data = await response.json();
            
            if (response.ok) {
                // Update user data in context
                if (user) {
                    const updatedUser = {
                        ...user,
                        ...data.user,
                        profile_picture_url: data.user.profile_picture_url || user.profile_picture_url
                    };
                    
                    // Update localStorage
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    
                    // Update context (this will trigger re-render)
                    window.location.reload(); // Simple way to refresh user data
                }
                
                setMessage({ type: 'success', text: data.message || 'Profile updated successfully!' });
                
                // Redirect to profile page after success
                setTimeout(() => {
                    navigate(`/profile/${user?.id}`);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
                if (data.errors) {
                    setErrors(data.errors);
                }
            }
        } catch (error: any) {
            console.error('Profile update error:', error);
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="glass-morphism rounded-2xl p-8 border border-white/20 flex items-center space-x-4">
                    <Loader className="h-8 w-8 text-indigo-400 animate-spin" />
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <ParticleNetwork />
            <Navbar />
            
            <div className="pt-20 pb-16">
                {/* Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-3 glass-morphism rounded-full px-8 py-4 mb-8 border border-white/20 shadow-lg">
                            <User className="h-6 w-6 text-blue-400" />
                            <span className="text-white font-bold text-lg">Profile Settings</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                            Edit Your
                            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent"> 
                                Profile
                            </span>
                        </h1>
                        <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                            Update your information and customize how others see your profile.
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-morphism rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                        {/* Back Button */}
                        <div className="p-6 border-b border-white/10">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Back</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Profile Picture Section */}
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white mb-6">Profile Picture</h3>
                                <div className="relative inline-block">
                                    <img
                                        src={profilePicturePreview || DEFAULT_PROFILE_PICTURE_URL}
                                        alt="Profile Preview"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-xl"
                                        onError={(e) => { e.currentTarget.src = DEFAULT_PROFILE_PICTURE_URL; }}
                                    />
                                    <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-full cursor-pointer hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg">
                                        <Upload className="h-5 w-5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-gray-400 text-sm mt-4">
                                    Click the upload button to change your profile picture. Max size: 5MB
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors duration-200"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors duration-200"
                                            placeholder="Choose a unique username"
                                        />
                                    </div>
                                    {errors.username && <p className="text-red-400 text-sm mt-2">{errors.username}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors duration-200"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
                                </div>

                                {/* Nationality */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Nationality</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400" />
                                        <input
                                            type="text"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl pl-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors duration-200"
                                            placeholder="Enter your nationality"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors duration-200 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            {/* Privacy Settings */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h4 className="text-lg font-bold text-white mb-4">Privacy Settings</h4>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h5 className="text-white font-medium">Public Profile</h5>
                                        <p className="text-gray-400 text-sm">Allow others to view your profile</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_profile_public"
                                            checked={formData.is_profile_public}
                                            onChange={handleInputChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Messages */}
                            {message && (
                                <div className={`p-4 rounded-xl text-center ${
                                    message.type === 'success' 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                    <div className="flex items-center justify-center space-x-2">
                                        {message.type === 'success' ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5" />
                                        )}
                                        <span>{message.text}</span>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center space-x-3 text-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader className="h-5 w-5 animate-spin" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => navigate(`/profile/${user.id}`)}
                                    className="flex-1 glass-morphism text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20 flex items-center justify-center space-x-3 text-lg"
                                >
                                    <Eye className="h-5 w-5" />
                                    <span>View Profile</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default EditProfilePage;