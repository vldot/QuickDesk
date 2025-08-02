import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  MessageSquare, 
  ArrowUp, 
  ArrowDown,
  Send,
  MoreVertical,
  Tag,
  Share2,
  Copy
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
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await axios.post(`/tickets/${id}/comments`, {
        content: newComment.trim()
      });
      
      setTicket(prev => prev ? {
        ...prev,
        comments: [...prev.comments, response.data]
      } : null);
      
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVote = async (type: 'UP' | 'DOWN') => {
    try {
      const response = await axios.post(`/tickets/${id}/vote`, { type });
      setTicket(prev => prev ? {
        ...prev,
        votes: response.data.votes
      } : null);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/tickets/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareModal(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`;
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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ticket not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {ticket.title}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Created by {ticket.creator.name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
              
              <span className={getStatusBadge(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </span>
              
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {ticket.category.name}
              </span>
              
              <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority} Priority
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-6">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </button>

            {/* Vote Section */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleVote('UP')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowUp className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-lg font-bold text-gray-900 my-1">
                {ticket.votes}
              </span>
              <button
                onClick={() => handleVote('DOWN')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowDown className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Comments ({ticket.comments.length})
              </h2>
            </div>

            {/* Comments List */}
            <div className="space-y-6 mb-6">
              {ticket.comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Be the first to comment on this ticket.
                  </p>
                </div>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.user.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form - Only for Support Agents and Admins */}
            {(user?.role === 'SUPPORT_AGENT' || user?.role === 'ADMIN') && (
              <form onSubmit={handleAddComment} className="border-t pt-6">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="input"
                      disabled={submittingComment}
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Message for End Users */}
            {user?.role === 'END_USER' && (
              <div className="border-t pt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-sm text-blue-700">
                    Only support agents can reply to tickets. Your ticket has been submitted and will be reviewed soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={getStatusBadge(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className={`mt-1 font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${ticket.category.color}20`, color: ticket.category.color }}
                  >
                    {ticket.category.name}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created by</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.creator.name}</dd>
              </div>
              
              {ticket.assignee && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                  <dd className="mt-1 text-sm text-gray-900">{ticket.assignee.name}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(ticket.createdAt)}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT') && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-secondary text-left">
                  Assign to me
                </button>
                <button className="w-full btn btn-secondary text-left">
                  Change status
                </button>
                <button className="w-full btn btn-secondary text-left">
                  Edit priority
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Share Ticket</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Share this ticket with others using the link below:
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={`${window.location.origin}/tickets/${id}`}
                readOnly
                className="flex-1 input text-sm"
              />
              <button
                onClick={copyShareLink}
                className="btn btn-primary flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              Anyone with this link can view the ticket details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;