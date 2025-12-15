import { useState, useEffect } from 'react';
import axios from 'axios'; // Make sure to import axios
import { useTheme } from '../../context/ThemeContext';
import API from '../../api/axios';

interface AnnouncementFormData {
  title: string;
  description: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: any;
}

const CreateAnnouncement = () => {
  const { themeConfig } = useTheme();
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    description: '',
    content: '',
    priority: 'medium',
    category: 'general',
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [categories] = useState([
    { value: 'general', label: 'General', icon: '📢' },
    { value: 'maintenance', label: 'Maintenance', icon: '🛠️' },
    { value: 'update', label: 'Update', icon: '🔄' },
    { value: 'security', label: 'Security', icon: '🔒' },
    { value: 'event', label: 'Event', icon: '🎉' },
    { value: 'urgent', label: 'Urgent', icon: '🚨' }
  ]);

  // Get authentication token on mount
  useEffect(() => {
    // Check where your token is stored
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('adminToken') ||
                  sessionStorage.getItem('token');
    
    console.log('Auth token found:', token ? 'Yes' : 'No');
    setAuthToken(token);
    
    // Also log API config for debugging
    console.log('API Configuration:', {
      baseURL: API.defaults.baseURL,
      headers: API.defaults.headers?.common,
    });
  }, []);

  // Reset form after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePriorityClick = (priority: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({
      ...prev,
      priority
    }));
  };

  const handleCategoryClick = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check authentication first
    const token = authToken || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('adminToken');
    
    if (!token) {
      setError('Authentication required. Please log in as admin first.');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.title.trim() || !formData.description.trim() || !formData.content.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate dates
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates');
      setLoading(false);
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate <= startDate) {
      setError('End date must be after start date');
      setLoading(false);
      return;
    }

    try {
      // Format dates to ISO string
      const submissionData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      // Make the API request with authentication
      const response = await API.post<ApiResponse>('/auth/announcements', submissionData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          title: '',
          description: '',
          content: '',
          priority: 'medium',
          category: 'general',
          startDate: '',
          endDate: '',
          isActive: true
        });
      } else {
        setError(response.data.message || 'Failed to create announcement');
      }
    } catch (err: any) {
      console.error('API Error:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Server responded with error
          const errorMessage = err.response.data?.message || err.response.statusText;
          
          if (err.response.status === 401) {
            setError('Session expired or invalid token. Please log in again.');
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('adminToken');
            setAuthToken(null);
          } else if (err.response.status === 403) {
            setError('Access denied. Admin privileges required.');
          } else if (err.response.status === 404) {
            setError('Endpoint not found. Please check the API URL.');
          } else {
            setError(`Server error: ${errorMessage}`);
          }
        } else if (err.request) {
          // No response received
          setError('No response from server. Please check your connection.');
        } else {
          // Request setup error
          setError(`Request error: ${err.message}`);
        }
      } else {
        // Non-axios error
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('adminToken');
    
    if (token) {
      console.log('Token found:', token.substring(0, 20) + '...');
      setAuthToken(token);
      setError(null);
    } else {
      setError('No authentication token found. Please log in.');
    }
  };

  // Login redirect function
  const redirectToLogin = () => {
    window.location.href = '/login'; 
  };

  return (
<div className="min-h-screen p-4 md:p-6 relative overflow-hidden  dark:bg-gray-900">
  <div className="relative max-w-4xl mx-auto ">
    {/* Header with Glassmorphism */}
    <div className="mb-8 bg-gray-25 rounded-xl">
      <div className="glass-card rounded-2xl border border-white/20 shadow-lg p-3 md:p-8">
        <div className="flex items-center gap-4 mb-2 ">
          <div className="w-14 h-8 rounded-xl glass-icon flex items-center justify-center">
            <span className="text-3xl">📢</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              Create New Announcement
            </h1>
            <p className="text-gray-600 dark:text-gray-200 mt-2">
              Share important updates and information with your team
            </p>
          </div>
        </div>
        
        {/* Auth Status Display */}
        {/* {!authToken && (
          <div className="mt-6 glass-card-warning rounded-xl border border-amber-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full glass-icon-warning flex items-center justify-center">
                  <span className="text-xl">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Authentication Required
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Admin access needed to create announcements
                  </p>
                </div>
              </div>
              <button
                onClick={redirectToLogin}
                className="glass-button-primary px-5 py-2.5"
              >
                Login as Admin
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>

    {/* Success Message */}
    {success && (
      <div className="mb-6 glass-card-success rounded-2xl border border-emerald-500/30">
        <div className="flex items-center gap-4 p-5">
          <div className="w-14 h-14 rounded-full glass-icon-success flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white">
              Announcement Created Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Your announcement has been published and is now visible to users.
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Error Message */}
    {error && (
      <div className="mb-6 glass-card-error rounded-2xl border border-rose-500/30">
        <div className="flex items-center gap-4 p-5">
          <div className="w-14 h-14 rounded-full glass-icon-error flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-white text-lg">⚠</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white">
              {error.includes('Authentication') ? 'Authentication Error' : 'Error'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{error}</p>
            {error.includes('Authentication') && !authToken && (
              <button
                onClick={redirectToLogin}
                className="glass-button-error mt-3 px-4 py-2"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Main Form Container */}
    <div className="glass-card rounded-2xl border border-white/20 shadow-xl overflow-hidden bg-gray-25 ">
      {/* Form Header */}
      <div className="glass-header p-6 border-b border-white/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl glass-icon flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Announcement Details
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Fill in all required fields to create your announcement
              </p>
            </div>
          </div>
        
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        {/* Basic Information Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg glass-icon flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Basic Information
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* Title */}
            <div className="glass-input p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Announcement Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="glass-input-field w-full py-3"
                placeholder="Enter a clear and descriptive title..."
                disabled={!authToken}
              />
            </div>

            {/* Description */}
            <div className="glass-input p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Short Description *
              </label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
               
                className="glass-input-field w-full py-3"
                placeholder="Brief summary of what this announcement is about..."
                disabled={!authToken}
              />
            </div>

            {/* Full Content */}
            <div className="glass-input p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Full Content *
              </label>
             <input
                                            type="text"
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            required
                                            className="glass-input-field w-full py-3"
                                            placeholder="Write the complete announcement content here..."
                                            disabled={!authToken}
                                        />
              {/* <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports markdown formatting
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.content.length} characters
                </p>
              </div> */}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg glass-icon flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Settings & Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Selection */}
            <div className="glass-card-inner p-5 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                Priority Level
              </label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handlePriorityClick(priority)}
                    disabled={!authToken}
                    className={`flex-1 p-4 rounded-lg border transition-all duration-200 ${
                      formData.priority === priority
                        ? `${getPriorityColor(priority)} shadow-lg scale-105`
                        : 'glass-button-secondary'
                    } ${!authToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        priority === 'high' ? 'bg-red-500/20' :
                        priority === 'medium' ? 'bg-yellow-500/20' :
                        'bg-green-500/20'
                      }`}>
                        <span className="text-xl">
                          {priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white capitalize">
                        {priority}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div className="glass-card-inner p-5 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryClick(cat.value)}
                    disabled={!authToken}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.category === cat.value
                        ? 'glass-button-active shadow-lg scale-105'
                        : 'glass-button-secondary'
                    } ${!authToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full glass-icon flex items-center justify-center">
                        <span className="text-lg">{cat.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {cat.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg glass-icon flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Schedule & Timing
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card-inner p-5 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="glass-input-field"
                disabled={!authToken}
              />
              {formData.startDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Starts: {new Date(formData.startDate).toLocaleString()}
                </p>
              )}
            </div>

            <div className="glass-card-inner p-5 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="glass-input-field"
                disabled={!authToken}
              />
              {formData.endDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Ends: {new Date(formData.endDate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Toggle */}
        {/* <div className="mb-8">
          <div className="glass-card-inner p-5 rounded-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg glass-icon flex items-center justify-center">
                  <span className="text-xl">🔘</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Active Status
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.isActive 
                      ? 'Visible immediately after publishing' 
                      : 'Saved as draft (hidden from users)'}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => authToken && setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                disabled={!authToken}
                className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 ease-in-out focus:outline-none ${
                  formData.isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                } ${!authToken ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out shadow-lg ${
                    formData.isActive ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  formData.isActive ? 'bg-emerald-400' : 'bg-gray-400'
                }`}></span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.isActive ? 'Active' : 'Inactive'} Mode
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-xs px-3 py-1 glass-badge rounded-lg text-gray-500 dark:text-gray-400">
                  {formData.isActive ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Submit Button Section */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg glass-icon-success flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">
                  Ready to Publish
                </h3>
                {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review all details before publishing to your audience
                </p> */}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !authToken}
              className={`glass-button-submit  bg-green-800 px-8 py-4 font-bold rounded-lg shadow-xl transition-all duration-300 ${
                loading || !authToken ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white">Publishing...</span>
                </span>
              ) : !authToken ? (
                <span className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <span className="text-white">Login Required</span>
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <span className="text-xl">✨</span>
                  <span className="text-white text-lg">Publish Announcement</span>
                  <span className="text-xl">📢</span>
                </span>
              )}
            </button>
          </div>
          
          {/* Form Stats */}
          {/* <div className="mt-8 pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 glass-card-inner rounded-lg">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formData.title.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Title Length
                </div>
              </div>
              <div className="text-center p-4 glass-card-inner rounded-lg">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formData.content.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Content Chars
                </div>
              </div>
              <div className="text-center p-4 glass-card-inner rounded-lg">
                <div className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
                  {formData.priority}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Priority
                </div>
              </div>
              <div className="text-center p-4 glass-card-inner rounded-lg">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formData.isActive ? 'Active' : 'Draft'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </form>
    </div>
  </div>

  {/* Add custom animation styles */}
  <style jsx>{`
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(20px, -20px) scale(1.05); }
      66% { transform: translate(-15px, 10px) scale(0.95); }
    }
  `}</style>
</div>
  );
};

export default CreateAnnouncement;