const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'END_USER' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: { id: true, name: true, email: true, role: true }
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// USER ROUTES
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// UPDATE PROFILE ROUTE
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    // Prepare update data
    const updateData = { name, email };

    // If user wants to change password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required to change password' });
      }

      // Verify current password
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// CATEGORY ROUTES
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { tickets: true } } }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const category = await prisma.category.create({
      data: { name, description, color, createdBy: req.user.id }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// TICKET ROUTES
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const where = {};
    
    // Role-based filtering
    if (req.user.role === 'END_USER') {
      where.createdBy = req.user.id;
    }
    
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: true,
        _count: { select: { comments: true } },
        votesList: {
          where: { userId: req.user.id },
          select: { type: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Add user vote information to each ticket
    const ticketsWithUserVote = tickets.map(ticket => ({
      ...ticket,
      userVote: ticket.votesList.length > 0 ? ticket.votesList[0].type : null,
      votesList: undefined // Remove votesList from response
    }));

    const total = await prisma.ticket.count({ where });

    res.json({
      tickets: ticketsWithUserVote,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { title, description, categoryId, priority = 'MEDIUM' } = req.body;
    
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        categoryId,
        priority,
        createdBy: req.user.id
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        category: true
      }
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: true,
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    if (req.user.role === 'END_USER' && ticket.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// UPDATE TICKET STATUS ROUTE
app.put('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { _count: { select: { comments: true } } }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    // Owner can close their own tickets if there are comments
    // Support agents and admins can change any status
    const canChangeStatus = 
      req.user.role === 'ADMIN' || 
      req.user.role === 'SUPPORT_AGENT' ||
      (req.user.id === ticket.createdBy && 
       status === 'CLOSED' && 
       ticket._count.comments > 0);

    if (!canChangeStatus) {
      return res.status(403).json({ 
        error: 'You can only close your own tickets after receiving responses' 
      });
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { 
        status,
        ...(status === 'CLOSED' ? { closedAt: new Date() } : {})
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: true
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// COMMENT ROUTES
app.post('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId: id,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// VOTE ROUTES
app.post('/api/tickets/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'UP' or 'DOWN'

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ticketId: {
          userId: req.user.id,
          ticketId: id
        }
      }
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Update vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type }
        });
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          type,
          userId: req.user.id,
          ticketId: id
        }
      });
    }

    // Update ticket votes count
    const upVotes = await prisma.vote.count({
      where: { ticketId: id, type: 'UP' }
    });
    const downVotes = await prisma.vote.count({
      where: { ticketId: id, type: 'DOWN' }
    });

    await prisma.ticket.update({
      where: { id },
      data: { votes: upVotes - downVotes }
    });

    res.json({ success: true, votes: upVotes - downVotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// GET USER'S VOTE FOR A TICKET
app.get('/api/tickets/:id/user-vote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vote = await prisma.vote.findUnique({
      where: {
        userId_ticketId: {
          userId: req.user.id,
          ticketId: id
        }
      }
    });

    res.json({ userVote: vote ? vote.type : null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user vote' });
  }
});

// ADMIN ROUTES
app.get('/api/admin/analytics', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } });
    const resolvedTickets = await prisma.ticket.count({ where: { status: 'RESOLVED' } });
    const totalUsers = await prisma.user.count();
    const pendingRequests = await prisma.roleUpgradeRequest.count({ where: { status: 'PENDING' } });
    const activeAgents = await prisma.user.count({ where: { role: 'SUPPORT_AGENT' } });
    
    const ticketsByCategory = await prisma.category.findMany({
      include: { _count: { select: { tickets: true } } }
    });

    res.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      totalUsers,
      pendingRequests,
      activeAgents,
      ticketsByCategory
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/admin/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { tickets: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ROLE UPGRADE REQUEST ROUTES
app.post('/api/role-requests', authenticateToken, async (req, res) => {
  try {
    const { requestedRole, reason } = req.body;
    const userId = req.user.id;

    // Validation
    if (!requestedRole || !['SUPPORT_AGENT', 'ADMIN'].includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid requested role' });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.roleUpgradeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending upgrade request' });
    }

    // Create request
    const request = await prisma.roleUpgradeRequest.create({
      data: {
        userId,
        requestedRole,
        currentRole: req.user.role,
        reason: reason || 'User requested role upgrade'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create role request error:', error);
    res.status(500).json({ error: 'Failed to create upgrade request' });
  }
});

app.get('/api/role-requests', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const requests = await prisma.roleUpgradeRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        processedByUser: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Fetch role requests error:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade requests' });
  }
});

app.put('/api/role-requests/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the request
    const request = await prisma.roleUpgradeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update request status
    const updatedRequest = await prisma.roleUpgradeRequest.update({
      where: { id },
      data: {
        status,
        processedAt: new Date(),
        processedBy: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    // If approved, update user role
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole }
      });
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Process role request error:', error);
    res.status(500).json({ error: 'Failed to process upgrade request' });
  }
});

// GET USER'S ROLE REQUESTS
app.get('/api/my-role-requests', authenticateToken, async (req, res) => {
  try {
    const requests = await prisma.roleUpgradeRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Fetch my role requests error:', error);
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});