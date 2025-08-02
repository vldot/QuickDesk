import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  BarChart3, 
  UserCheck, 
  UserX,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  Ticket,
  TrendingUp,
  Activity,
  MessageSquare,
  Calendar,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface UpgradeRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  currentRole: string;
  requestedRole: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedAt?: string;
  processedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  ticketCount: number;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  color: string;
  createdAt?: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalTickets: number;
  openTickets: number;
  pendingRequests: number;
  activeAgents: number;
  ticketsByCategory: Array<{
    id: string;
    name: string;
    color: string;
    description: string;
    _count: { tickets: number };
  }>;
  ticketsByStatus: Array<{
    status: string;
    count: number;
  }>;
  ticketsByPriority: Array<{
    priority: string;
    count: number;
  }>;
  weeklyTickets: Array<{
    date: string;
    tickets: number;
    comments: number;
  }>;
  userActivity: Array<{
    name: string;
    tickets: number;
    comments: number;
  }>;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'requests' | 'categories'>('overview');
  const [loading, setLoading] = useState(true);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Category management state
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteCategory, setDeleteCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [categoryErrors, setCategoryErrors] = useState<any>({});
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Preset colors for quick selection
  const CATEGORY_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
    '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [analyticsRes, requestsRes, usersRes, ticketsRes] = await Promise.all([
        axios.get('/admin/analytics'),
        axios.get('/role-requests'),
        axios.get('/admin/users'),
        axios.get('/tickets?limit=5&sortBy=createdAt&sortOrder=desc')
      ]);

      // Enhanced analytics data
      const analyticsData = analyticsRes.data;
      
      // Fetch additional analytics data
      const [statusRes, priorityRes, weeklyRes, userActivityRes] = await Promise.all([
        axios.get('/admin/analytics/status'),
        axios.get('/admin/analytics/priority'),
        axios.get('/admin/analytics/weekly'),
        axios.get('/admin/analytics/user-activity')
      ]);

      setAnalytics({
        ...analyticsData,
        ticketsByStatus: statusRes.data,
        ticketsByPriority: priorityRes.data,
        weeklyTickets: weeklyRes.data,
        userActivity: userActivityRes.data
      });

      setUpgradeRequests(requestsRes.data);
      setUsers(usersRes.data.map((user: any) => ({
        ...user,
        ticketCount: user._count.tickets
      })));

      // Create recent activity from real data
      const activity: ActivityItem[] = [];
      
      // Add recent tickets
      ticketsRes.data.tickets.slice(0, 3).forEach((ticket: any) => {
        activity.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          message: `${ticket.creator.name} submitted a new ticket: "${ticket.title}"`,
          time: formatTimeAgo(ticket.createdAt),
          color: 'green',
          createdAt: ticket.createdAt
        });
      });

      // Add recent role requests
      requestsRes.data.slice(0, 2).forEach((request: any) => {
        activity.push({
          id: `request-${request.id}`,
          type: 'role_request',
          message: `${request.user.name} requested role upgrade to ${request.requestedRole.replace('_', ' ')}`,
          time: formatTimeAgo(request.createdAt),
          color: 'blue',
          createdAt: request.createdAt
        });
      });

      // Sort by most recent
      activity.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      setRecentActivity(activity.slice(0, 5));
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load admin data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const handleUpgradeRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      
      await axios.put(`/role-requests/${requestId}`, {
        status
      });
      
      // Refresh data
      fetchData();
      
      setMessage({ 
        type: 'success', 
        text: `Request ${action}d successfully!` 
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || `Failed to ${action} request` 
      });

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Category Management Functions
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
    setCategoryErrors({});
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    setDeleteCategory({ id: categoryId, name: categoryName });
  };

  const validateCategoryForm = () => {
    const errors: any = {};
    
    if (!categoryForm.name.trim()) {
      errors.name = 'Category name is required';
    } else if (categoryForm.name.length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (categoryForm.name.length > 50) {
      errors.name = 'Category name must be less than 50 characters';
    }

    if (!categoryForm.color || !/^#[0-9A-F]{6}$/i.test(categoryForm.color)) {
      errors.color = 'Please provide a valid hex color';
    }

    setCategoryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCategoryForm()) {
      return;
    }

    setCategoryLoading(true);
    
    try {
      if (editingCategory) {
        // Update existing category
        await axios.put(`/categories/${editingCategory.id}`, categoryForm);
        setMessage({ type: 'success', text: 'Category updated successfully!' });
      } else {
        // Create new category
        await axios.post('/categories', categoryForm);
        setMessage({ type: 'success', text: 'Category created successfully!' });
      }

      // Reset form and close modal
      setCategoryForm({ name: '', description: '', color: '#3B82F6' });
      setShowCreateCategory(false);
      setEditingCategory(null);
      setCategoryErrors({});
      
      // Refresh data
      fetchData();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save category' 
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setCategoryLoading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategory) return;

    setCategoryLoading(true);
    
    try {
      await axios.delete(`/categories/${deleteCategory.id}`);
      
      setMessage({ 
        type: 'success', 
        text: 'Category deleted successfully!' 
      });
      
      setDeleteCategory(null);
      
      // Refresh data
      fetchData();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to delete category' 
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setCategoryLoading(false);
    }
  };

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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
  const STATUS_COLORS = {
    'OPEN': '#3B82F6',
    'IN_PROGRESS': '#F59E0B', 
    'RESOLVED': '#10B981',
    'CLOSED': '#6B7280'
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">
          Manage users, requests, and system analytics
        </p>

        {message && (
          <div className={`mt-4 flex items-center gap-2 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'requests', label: 'Role Requests', icon: UserCheck },
            { key: 'categories', label: 'Categories', icon: Tag }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.key === 'requests' && upgradeRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {upgradeRequests.filter(r => r.status === 'PENDING').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTickets}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.openTickets}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.pendingRequests}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.activeAgents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center space-x-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.color === 'green' ? 'bg-green-500' :
                      activity.color === 'blue' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-gray-600 flex-1">{activity.message}</span>
                    <span className="text-gray-400">{activity.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets by Category */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ticketsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="_count.tickets" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tickets by Status */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.ticketsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.ticketsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Ticket Trends */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Ticket & Comment Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.weeklyTickets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="tickets" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="comments" stackId="1" stroke="#10B981" fill="#10B981" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* User Activity */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top User Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.userActivity.slice(0, 8)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#3B82F6" name="Tickets" />
                  <Bar dataKey="comments" fill="#10B981" name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets by Priority</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.ticketsByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Role Requests Tab */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Role Upgrade Requests</h2>
            <span className="text-sm text-gray-500">
              {upgradeRequests.filter(r => r.status === 'PENDING').length} pending requests
            </span>
          </div>

          <div className="space-y-4">
            {upgradeRequests.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All role upgrade requests have been processed.
                </p>
              </div>
            ) : (
              upgradeRequests.map(request => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{request.user.name}</h4>
                          <span className="text-gray-500">({request.user.email})</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">Requesting upgrade from</span>
                          {getRoleBadge(request.currentRole)}
                          <span className="text-sm text-gray-600">to</span>
                          {getRoleBadge(request.requestedRole)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Requested {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {request.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleUpgradeRequest(request.id, 'approve')}
                            className="btn btn-success flex items-center space-x-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpgradeRequest(request.id, 'reject')}
                            className="btn btn-danger flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.ticketCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Disable
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Categories Management Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Category Management</h2>
                <p className="text-gray-600 mt-1">Manage ticket categories and their properties</p>
              </div>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Category</span>
              </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics?.ticketsByCategory.map(category => (
                <div key={category.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit category"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete category"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{category.description || 'No description'}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {category._count.tickets} ticket{category._count.tickets !== 1 ? 's' : ''}
                    </span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${category.color}20`, 
                        color: category.color 
                      }}
                    >
                      {category.name}
                    </span>
                  </div>
                </div>
              ))}

              {(!analytics?.ticketsByCategory || analytics.ticketsByCategory.length === 0) && (
                <div className="col-span-full text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first category.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Category Analytics */}
          {analytics?.ticketsByCategory && analytics.ticketsByCategory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ticketsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="_count.tickets" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Category Modal */}
      {(showCreateCategory || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateCategory(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '', color: '#3B82F6' });
                  setCategoryErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`input ${categoryErrors.name ? 'border-red-300' : ''}`}
                  placeholder="e.g., Technical Support"
                />
                {categoryErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{categoryErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="categoryDescription"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  placeholder="Brief description of this category"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="categoryColor"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="input"
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div
                    className="h-8 w-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: categoryForm.color }}
                  ></div>
                </div>
              </div>

              {/* Preset Colors */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Colors</p>
                <div className="flex space-x-2">
                  {CATEGORY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                      className={`h-6 w-6 rounded border-2 ${
                        categoryForm.color === color ? 'border-gray-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: `${categoryForm.color}20`, 
                    color: categoryForm.color 
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {categoryForm.name || 'Category Name'}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCategory(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', color: '#3B82F6' });
                    setCategoryErrors({});
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categoryLoading}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryLoading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
              <button
                onClick={() => setDeleteCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Are you sure you want to delete the category "{deleteCategory.name}"?
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    This action cannot be undone. All tickets in this category will need to be reassigned.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteCategory(null)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={categoryLoading}
                className="flex-1 btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categoryLoading ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;