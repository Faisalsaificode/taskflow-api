const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: `
##  Scalable REST API with Authentication & Role-Based Access Control

### ✨ Features
-  JWT Authentication
-  Role-Based Access Control (User & Admin)
-  Task Management (CRUD)
-  Statistics & Analytics
-  Search & Filtering
-  Pagination

###  Authentication
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

###  Password Requirements
- Minimum 8 characters
- Uppercase, lowercase, number, special character (@$!%*?&)
- Example: \`Password@123\`
      `,
      contact: {
        name: 'Faisal - Backend Developer',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'API health check endpoint',
      },
      {
        name: 'Authentication',
        description: 'User registration, login, and profile management',
      },
      {
        name: 'Tasks',
        description: 'Task CRUD operations and management',
      },
      {
        name: 'Admin',
        description: 'Admin-only user management endpoints',
      },
    ],
    paths: {
      
      '/api/v1/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Check if the API server is running',
          responses: {
            200: { description: 'Server is running' },
          },
        },
      },

     
      '/api/v1/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Create a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: {
                  name: 'John Doe',
                  email: 'john@example.com',
                  password: 'Password@123',
                  role: 'user',
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation error' },
            409: { description: 'User already exists' },
          },
        },
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user and receive JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: {
                  email: 'john@example.com',
                  password: 'Password@123',
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Profile retrieved successfully' },
            401: { description: 'Not authenticated' },
          },
        },
        put: {
          tags: ['Authentication'],
          summary: 'Update user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                example: {
                  name: 'John Updated',
                  email: 'john.updated@example.com',
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated successfully' },
            401: { description: 'Not authenticated' },
            409: { description: 'Email already in use' },
          },
        },
      },
      '/api/v1/auth/change-password': {
        put: {
          tags: ['Authentication'],
          summary: 'Change password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                example: {
                  currentPassword: 'Password@123',
                  newPassword: 'NewPassword@456',
                },
              },
            },
          },
          responses: {
            200: { description: 'Password changed successfully' },
            401: { description: 'Current password incorrect' },
          },
        },
      },
      '/api/v1/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },


      '/api/v1/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'Get all tasks',
          description: 'Retrieve tasks with filtering, sorting, and pagination',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Items per page' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in-progress', 'completed', 'cancelled'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in title/description' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['createdAt', 'dueDate', 'priority', 'title'] } },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: {
            200: { description: 'Tasks retrieved successfully' },
            401: { description: 'Not authenticated' },
          },
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create a new task',
          description: 'Admin can assign tasks to other users using userId',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: {
                  title: 'Complete API Documentation',
                  description: 'Write comprehensive docs',
                  status: 'pending',
                  priority: 'high',
                  dueDate: '2025-01-15T10:00:00.000Z',
                  tags: ['work', 'important'],
                  userId: '507f1f77bcf86cd799439011',
                },
              },
            },
          },
          responses: {
            201: { description: 'Task created successfully' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/v1/tasks/stats': {
        get: {
          tags: ['Tasks'],
          summary: 'Get task statistics',
          description: 'Get counts by status and priority',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Statistics retrieved successfully' },
          },
        },
      },
      '/api/v1/tasks/bulk-status': {
        patch: {
          tags: ['Tasks'],
          summary: 'Bulk update task status',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                example: {
                  taskIds: ['id1', 'id2', 'id3'],
                  status: 'completed',
                },
              },
            },
          },
          responses: {
            200: { description: 'Tasks updated successfully' },
          },
        },
      },
      '/api/v1/tasks/{id}': {
        get: {
          tags: ['Tasks'],
          summary: 'Get task by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Task retrieved successfully' },
            404: { description: 'Task not found' },
          },
        },
        put: {
          tags: ['Tasks'],
          summary: 'Update task',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                example: {
                  title: 'Updated Title',
                  status: 'in-progress',
                  priority: 'urgent',
                },
              },
            },
          },
          responses: {
            200: { description: 'Task updated successfully' },
            404: { description: 'Task not found' },
          },
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete task',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Task deleted successfully' },
            404: { description: 'Task not found' },
          },
        },
      },

   
      '/api/v1/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get dashboard statistics',
          description: 'Get system-wide user and task statistics',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Statistics retrieved successfully' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/v1/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Get all users',
          description: 'Retrieve all users with pagination and filters',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['user', 'admin'] } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Users retrieved successfully' },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/v1/admin/users/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'User retrieved successfully' },
            404: { description: 'User not found' },
          },
        },
        put: {
          tags: ['Admin'],
          summary: 'Update user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                example: {
                  name: 'Updated Name',
                  email: 'updated@example.com',
                  role: 'admin',
                  isActive: true,
                },
              },
            },
          },
          responses: {
            200: { description: 'User updated successfully' },
            404: { description: 'User not found' },
          },
        },
        delete: {
          tags: ['Admin'],
          summary: 'Delete user',
          description: 'Delete user and all their tasks',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'User deleted successfully' },
            404: { description: 'User not found' },
          },
        },
      },
      '/api/v1/admin/users/{id}/deactivate': {
        patch: {
          tags: ['Admin'],
          summary: 'Deactivate user',
          description: 'Soft delete - user cannot login',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'User deactivated successfully' },
          },
        },
      },
      '/api/v1/admin/users/{id}/activate': {
        patch: {
          tags: ['Admin'],
          summary: 'Activate user',
          description: 'Reactivate a deactivated user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'User activated successfully' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;