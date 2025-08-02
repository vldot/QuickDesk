import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Clock,
  User,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  votes: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    comments: number;
  };
  userVote?: 'UP' | 'DOWN' | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  _count: {
    tickets: number;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showOpenOnly, setShowOpenOnly] = useState(true); // Default enabled
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, [statusFilter, categoryFilter, searchTerm, showOpenOnly, sortBy, sortOrder]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      
      // Apply filters
      if (statusFilter) {
        params.append('status', statusFilter);
      } else if (showOpenOnly) {
        // When toggle is on and no specific status filter, show open tickets only
        params.append('status', 'OPEN');
      }
      
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      // Add sorting
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      // Increase limit to show more tickets
      params.append('limit', '50');

      const response = await axios.get(`/tickets?${params.toString()}`);
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleVote = async (ticketId: string, type: 'UP' | 'DOWN', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (votingStates[ticketId]) return;

    setVotingStates(prev => ({ ...prev, [ticketId]: true }));

    try {
      const response = await axios.post(`/tickets/${ticketId}/vote`, { type });
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              votes: response.data.votes, 
              userVote: ticket.userVote === type ? null : type 
            }
          : ticket
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVotingStates(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'RESOLVED' | 'CLOSED', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await axios.put(`/tickets/${ticketId}/status`, { status: newStatus });
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // If same sort field, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If different sort field, set new field with appropriate default order
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'createdAt' ? 'desc' : 'desc');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'badge-open',
      IN_PROGRESS: 'badge-in-progress', 
      RESOLVED: 'badge-resolved',
      CLOSED: 'badge-closed'
    };
    return `badge ${styles[status as keyof typeof styles]}`;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600'
    };
    return colors[priority as keyof typeof colors];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canChangeStatus = (ticket: Ticket) => {
    return user?.id === ticket.creator.id && 
           ticket._count.comments > 0 && 
           (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED');
  };

  const getSortOptions = () => [
    { value: 'createdAt', label: 'Date Created', icon: Clock },
    { value: 'updatedAt', label: 'Last Updated', icon: Clock },
    { value: 'votes', label: 'Most Upvoted', icon: ArrowUp },
    { value: 'comments', label: 'Most Commented', icon: MessageSquare },
    { value: 'priority', label: 'Priority', icon: Filter }
  ];

  // Calculate filtered stats
  const filteredStats = {
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    total: tickets.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'ADMIN' ? 'Admin Dashboard' : 
             user?.role === 'SUPPORT_AGENT' ? 'Support Dashboard' : 
             'My Tickets'}
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        
        <Link
          to="/create-ticket"
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.open}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <User className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Showing</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card mb-6">
        <div className="space-y-4">
          {/* First Row: Search and Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input"
                />
              </div>
            </div>

            {/* Show Open Only Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Show Open Only</span>
              <button
                onClick={() => setShowOpenOnly(!showOpenOnly)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  showOpenOnly ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    showOpenOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Second Row: Filters and Sorting */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
                disabled={showOpenOnly}
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input flex-1"
                >
                  {getSortOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      Sort by {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(showOpenOnly || statusFilter || categoryFilter || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {showOpenOnly && !statusFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Open Only
                  <button
                    onClick={() => setShowOpenOnly(false)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {statusFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Status: {statusFilter.replace('_', ' ')}
                  <button
                    onClick={() => setStatusFilter('')}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {categoryFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {categories.find(c => c.id === categoryFilter)?.name}
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tickets List */}
      <div className="card">
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {showOpenOnly && !searchTerm && !statusFilter && !categoryFilter
                  ? "No open tickets to display. Try toggling off 'Show Open Only' to see all tickets."
                  : "Try adjusting your filters or search terms."}
              </p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-primary-600"
                      >
                        {ticket.title}
                      </Link>
                      <span className={getStatusBadge(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
                      >
                        {ticket.category.name}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{ticket.creator.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{ticket._count.comments} comments</span>
                      </div>
                      
                      <div className={`flex items-center space-x-1 ${getPriorityColor(ticket.priority)}`}>
                        <span className="font-medium">{ticket.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    {/* Owner Actions - Close Ticket */}
                    {canChangeStatus(ticket) && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleStatusChange(ticket.id, 'CLOSED', e)}
                          className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                          title="Mark as resolved and close"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Close</span>
                        </button>
                      </div>
                    )}

                    {/* Vote buttons */}
                    <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1">
                      <button 
                        onClick={(e) => handleVote(ticket.id, 'UP', e)}
                        disabled={votingStates[ticket.id]}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                          ticket.userVote === 'UP' ? 'text-green-600 bg-green-100' : 'text-gray-400'
                        } ${votingStates[ticket.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Upvote this ticket"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      
                      <span className={`text-sm font-medium px-1 ${
                        ticket.votes > 0 ? 'text-green-600' : 
                        ticket.votes < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {ticket.votes}
                      </span>
                      
                      <button 
                        onClick={(e) => handleVote(ticket.id, 'DOWN', e)}
                        disabled={votingStates[ticket.id]}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                          ticket.userVote === 'DOWN' ? 'text-red-600 bg-red-100' : 'text-gray-400'
                        } ${votingStates[ticket.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Downvote this ticket"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;