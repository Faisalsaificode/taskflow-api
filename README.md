# TaskFlow API

A scalable REST API with JWT Authentication and Role-Based Access Control (RBAC) built with Node.js, Express, and MongoDB.

## Features

### Backend (Primary Focus)
- **Authentication & Authorization**
  - User registration & login with bcrypt password hashing
  - JWT token-based authentication
  - Role-based access control (user vs admin)
  - Secure token handling with expiration
  - Password change functionality

- **Task Management (CRUD)**
  - Create, Read, Update, Delete tasks
  - Task status: pending, in-progress, completed, cancelled
  - Priority levels: low, medium, high, urgent
  - Due dates and tags support
  - Bulk status updates
  - Task statistics

- **Admin Features**
  - User management (view, update, delete)
  - User activation/deactivation
  - Dashboard statistics
  - Access to all tasks

- **Security & Scalability**
  - Helmet.js for HTTP security headers
  - Rate limiting (100 requests/15 minutes)
  - Input validation with express-validator
  - MongoDB injection prevention (mongo-sanitize)
  - CORS configuration
  - Request logging with Winston

### Frontend (Minimal)
- Simple UI for authentication (login/register)
- Protected dashboard requiring JWT
- Task CRUD operations
- Admin panel for user management
- Error/success message display

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: Helmet, express-rate-limit, bcryptjs
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston, Morgan

## Project Structure

```
taskflow-api/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── taskController.js    # Task CRUD logic
│   │   └── adminController.js   # Admin operations
│   ├── middleware/
│   │   ├── auth.js              # JWT verification & RBAC
│   │   ├── errorMiddleware.js   # Global error handling
│   │   └── validation.js        # Input validation rules
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Task.js              # Task schema
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── taskRoutes.js        # Task endpoints
│   │   └── adminRoutes.js       # Admin endpoints
│   ├── utils/
│   │   ├── errorHandler.js      # Custom error classes
│   │   └── logger.js            # Winston logger
│   ├── docs/
│   │   └── swagger.js           # API documentation config
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Entry point
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js               # API helper module
│   │   └── app.js               # Main application
│   └── index.html
└── README.md
```

## Quick Start

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd taskflow-api
```

2. **Install dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Start MongoDB** (if local)
```bash
mongod
```

5. **Run the server**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

6. **Access the application**
- Frontend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/api/v1/health

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/v1/auth/register | Register new user | Public |
| POST | /api/v1/auth/login | Login user | Public |
| GET | /api/v1/auth/me | Get current user | Private |
| PUT | /api/v1/auth/me | Update profile | Private |
| PUT | /api/v1/auth/change-password | Change password | Private |
| POST | /api/v1/auth/logout | Logout user | Private |

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/v1/tasks | Get all tasks (paginated) | Private |
| GET | /api/v1/tasks/:id | Get single task | Private |
| POST | /api/v1/tasks | Create task | Private |
| PUT | /api/v1/tasks/:id | Update task | Private |
| DELETE | /api/v1/tasks/:id | Delete task | Private |
| GET | /api/v1/tasks/stats | Get task statistics | Private |
| PATCH | /api/v1/tasks/bulk-status | Bulk update status | Private |

### Admin
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/v1/admin/users | Get all users | Admin |
| GET | /api/v1/admin/users/:id | Get user details | Admin |
| PUT | /api/v1/admin/users/:id | Update user | Admin |
| DELETE | /api/v1/admin/users/:id | Delete user | Admin |
| PATCH | /api/v1/admin/users/:id/deactivate | Deactivate user | Admin |
| PATCH | /api/v1/admin/users/:id/activate | Activate user | Admin |
| GET | /api/v1/admin/stats | Dashboard statistics | Admin |

## API Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password@123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password@123"
  }'
```

### Create Task (with JWT)
```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Complete project",
    "description": "Finish the API implementation",
    "priority": "high",
    "dueDate": "2025-01-15T10:00:00.000Z",
    "tags": ["work", "important"]
  }'
```

### Get Tasks with Filters
```bash
curl "http://localhost:5000/api/v1/tasks?status=pending&priority=high&page=1&limit=10" \
  -H "Authorization: Bearer <your_token>"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/taskflow_db |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | Token expiration | 7d |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15 min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
| CORS_ORIGIN | Allowed CORS origin | * |

## Security Features

1. **Password Security**: bcrypt with 12 salt rounds
2. **JWT Tokens**: Signed tokens with expiration, issuer, and audience claims
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Input Validation**: All inputs validated and sanitized
5. **NoSQL Injection Prevention**: mongo-sanitize middleware
6. **HTTP Security Headers**: Helmet.js configuration
7. **CORS**: Configurable cross-origin settings

## Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'admin',
  isActive: Boolean,
  lastLogin: Date,
  passwordChangedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Schema
```javascript
{
  title: String,
  description: String,
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  dueDate: Date,
  tags: [String],
  user: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Documentation

Interactive Swagger documentation is available at:
```
http://localhost:5000/api-docs
```

## License

MIT License

## Author

Faisal - Backend Developer Intern Assignment
