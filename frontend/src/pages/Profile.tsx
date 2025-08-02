import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Tag
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    categoryInterest: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    marketingEmails: false
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showUpgradeRequest, setShowUpgradeRequest] = useState(false);
  const [upgradeRequested, setUpgradeRequested] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validation
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        setLoading(false);
        return;
      }

      // Update user profile via API
      const updateData: any = {
        name: formData.name,
        email: formData.email
      };

      // Only include password if user wants to change it
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put('/auth/profile', updateData);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRequest = async () => {
    try {
      await axios.post('/role-requests', {
        requestedRole: 'SUPPORT_AGENT',
        reason: 'I would like to help respond to support tickets and assist other users.'
      });
      
      setUpgradeRequested(true);
      setShowUpgradeRequest(false);
      setMessage({ 
        type: 'success', 
        text: 'Upgrade request submitted! An admin will review your request.' 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit upgrade request' 
      });
    }
  };

  // Check if user has pending requests
  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        const response = await axios.get('/my-role-requests');
        const pendingRequest = response.data.find((req: any) => req.status === 'PENDING');
        if (pendingRequest) {
          setUpgradeRequested(true);
        }
      } catch (error) {
        console.error('Failed to check pending requests:', error);
      }
    };

    if (user?.role === 'END_USER') {
      checkPendingRequests();
    }
  }, [user]);

  const getRoleBadge = (role: string) => {
    const styles = {
      END_USER: 'bg-blue-100 text-blue-800',
      SUPPORT_AGENT: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      END_USER: 'End User',
      SUPPORT_AGENT: 'Support Agent',
      ADMIN: 'Administrator'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[role as keyof typeof styles]}`}>
        <Shield className="h-4 w-4 mr-1" />
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              {/* Profile Image */}
              <div className="relative inline-block mb-4">
                <div className="h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
                <button className="absolute bottom-0 right-0 h-8 w-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{user?.name}</h3>
              <p className="text-gray-600 mb-4">{user?.email}</p>
              
              {/* Role Badge */}
              <div className="mb-4">
                {user?.role && getRoleBadge(user.role)}
              </div>

              {/* Upgrade Button for End Users */}
              {user?.role === 'END_USER' && !upgradeRequested && (
                <button
                  onClick={() => setShowUpgradeRequest(true)}
                  className="btn btn-primary w-full"
                >
                  Request Role Upgrade
                </button>
              )}

              {upgradeRequested && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">Upgrade request pending</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="card mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Account Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tickets Created</span>
                <span className="text-sm font-medium text-gray-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Comments Posted</span>
                <span className="text-sm font-medium text-gray-900">34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">Aug 2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>
            
            {message && (
              <div className={`flex items-center gap-2 p-4 rounded-md mb-6 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {message.text}
                </span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 input"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Interest - Show only for End Users */}
                {user?.role === 'END_USER' && (
                  <div>
                    <label htmlFor="categoryInterest" className="block text-sm font-medium text-gray-700 mb-2">
                      Category of Interest
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        id="categoryInterest"
                        name="categoryInterest"
                        value={formData.categoryInterest}
                        onChange={handleInputChange}
                        className="pl-10 input"
                      >
                        <option value="">Select your primary interest</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name} - {category.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      This helps us prioritize tickets that match your interests
                    </p>
                  </div>
                )}
              </div>

              {/* Password Change */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Leave password fields empty if you don't want to change your password.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select className="input">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      name="emailNotifications"
                      checked={formData.emailNotifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                      Receive email notifications for ticket updates
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="marketingEmails"
                      name="marketingEmails"
                      checked={formData.marketingEmails}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="marketingEmails" className="ml-2 block text-sm text-gray-900">
                      Receive product updates and announcements
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Upgrade Request Modal */}
      {showUpgradeRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Role Upgrade</h3>
              <button
                onClick={() => setShowUpgradeRequest(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              You can request to be upgraded to a Support Agent role. This will allow you to:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• Respond to support tickets</li>
              <li>• View all tickets in the system</li>
              <li>• Help resolve customer issues</li>
            </ul>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpgradeRequest(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeRequest}
                className="flex-1 btn btn-primary"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;