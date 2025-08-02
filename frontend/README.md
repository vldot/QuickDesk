# QuickDesk - Help Desk System

A modern, responsive help desk solution built for the Odoo CGC Hackathon 2025. QuickDesk streamlines communication between users and support teams with an intuitive interface and powerful features.

## Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Ticket Management** - Create, view, search, and filter support tickets
- **Real-time Comments** - Threaded conversations on tickets
- **Voting System** - Upvote/downvote tickets for priority ranking
- **Category System** - Organize tickets by customizable categories
- **Role-based Dashboards** - Different views for End Users, Support Agents, and Admins

### User Roles
- **End Users** - Create tickets, view own tickets, comment and vote
- **Support Agents** - View all tickets, respond to tickets, manage assignments
- **Admins** - Full system access, user management, category management, analytics

### Technical Features
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Search & Filtering** - Advanced filtering by status, category, priority
- **Clean UI/UX** - Modern interface built with Tailwind CSS
- **RESTful API** - Well-structured backend APIs
- **Database Relations** - Properly normalized PostgreSQL database

## Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **PostgreSQL** - Primary database
- **Prisma ORM** - Database modeling and migrations
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Tailwind CSS** - Styling and responsive design
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/vldot/QuickDesk.git
cd QuickDesk
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run db:generate
npm run db:push

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start frontend development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Demo Accounts

Use these accounts to test different user roles:

- **Admin**: admin@quickdesk.com / admin123
- **Support Agent**: agent@quickdesk.com / agent123  
- **End User**: user@quickdesk.com / user123

## Database Schema

The system uses a well-structured PostgreSQL database with the following main entities:

- **Users** - Authentication and role management
- **Categories** - Ticket categorization
- **Tickets** - Core support tickets with status tracking
- **Comments** - Threaded conversations
- **Votes** - Ticket voting system
- **Attachments** - File upload support (planned)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - List tickets (with filtering)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/comments` - Add comment
- `POST /api/tickets/:id/vote` - Vote on ticket

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (Admin only)

### Admin
- `GET /api/admin/analytics` - System analytics

## Project Structure

```
quickdesk/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Deployment

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://username:password@localhost:5432/quickdesk_db"
JWT_SECRET="your-secret-key"
PORT=5000

# Frontend
VITE_API_URL="http://localhost:5000/api"
```

### Production Build
```bash
# Backend
npm start

# Frontend
npm run build
npm run preview
```

## License
MIT License - feel free to use this project as a starting point for your own help desk system!

By **vldot** for the Odoo CGC Hackathon 2025


---