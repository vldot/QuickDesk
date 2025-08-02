import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Ticket
} from 'lucide-react';

interface UpgradeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: string;
  requestedRole: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  ticketCount: number;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'requests' | 'categories'>('overview');
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      currentRole: 'END_USER',
      requestedRole: 'SUPPORT_AGENT',
      requestedAt: '2025-08-02T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      currentRole: 'END_USER',
      requestedRole: 'SUPPORT_AGENT',
      requestedAt: '2025-08-01T15:20:00Z',
      status: 'pending'
    }
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@quickdesk.com',
      role: 'ADMIN',
      createdAt: '2025-08-01T00:00:00Z',
      ticketCount: 0
    },
    {
      id: '2',
      name: 'Support Agent',
      email: 'agent@quickdesk.com',
      role: 'SUPPORT_AGENT',
      createdAt: '2025-08-01T08:00:00Z',
      ticketCount: 5
    },
    {
      id: '3',
      name: 'Test User',
      email: 'user@quickdesk.com',
      role: 'END_USER',
      createdAt: '2025-08-01T12:00:00Z',
      ticketCount: 3
    }
  ]);

  const [stats, setStats] = useState({
    totalUsers: 15,
    totalTickets: 28,
    openTickets: 12,
    pendingRequests: 2,
    activeAgents: 3
  });

  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleUpgradeRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setUpgradeRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
          : req
      )
    );

    // In real app, you'd call API here
    console.log(`${action} request ${requestId}`);
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

  if (user?.role !== 'ADMIN') {
    return null;
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
          Manage users, requests, and system settings
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
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
              {tab.key === 'requests' && upgradeRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {upgradeRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAgents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">John Doe submitted a new ticket</span>
                <span className="text-gray-400">2 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Jane Smith requested role upgrade</span>
                <span className="text-gray-400">5 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Ticket #123 status changed to In Progress</span>
                <span className="text-gray-400">10 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Requests Tab */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Role Upgrade Requests</h2>
            <span className="text-sm text-gray-500">
              {upgradeRequests.filter(r => r.status === 'pending').length} pending requests
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
                          <h4 className="font-medium text-gray-900">{request.userName}</h4>
                          <span className="text-gray-500">({request.userEmail})</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">Requesting upgrade from</span>
                          {getRoleBadge(request.currentRole)}
                          <span className="text-sm text-gray-600">to</span>
                          {getRoleBadge(request.requestedRole)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Requested {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {request.status === 'pending' ? (
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
                          request.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'approved' ? 'Approved' : 'Rejected'}
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
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Management</h2>
          <p className="text-gray-600">Category management interface coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;