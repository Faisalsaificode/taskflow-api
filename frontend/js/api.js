/**
 * API Helper Module
 * Handles all HTTP requests to the backend
 */
const API = {
  baseURL: '/api/v1',
  token: localStorage.getItem('token'),

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  /**
   * Get headers for requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  },

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Request failed',
          errors: data.errors,
        };
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        
        this.setToken(null);
        window.location.reload();
      }
      throw error;
    }
  },

  
  auth: {
    async register(userData) {
      return API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    async login(credentials) {
      return API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    async getProfile() {
      return API.request('/auth/me');
    },

    async updateProfile(data) {
      return API.request('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async changePassword(passwords) {
      return API.request('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwords),
      });
    },

    async logout() {
      return API.request('/auth/logout', {
        method: 'POST',
      });
    },
  },

  
  tasks: {
    async getAll(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
      return API.request(endpoint);
    },

    async getOne(id) {
      return API.request(`/tasks/${id}`);
    },

    async create(taskData) {
      return API.request('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
    },

    async update(id, taskData) {
      return API.request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      });
    },

    async delete(id) {
      return API.request(`/tasks/${id}`, {
        method: 'DELETE',
      });
    },

    async getStats() {
      return API.request('/tasks/stats');
    },

    async bulkUpdateStatus(taskIds, status) {
      return API.request('/tasks/bulk-status', {
        method: 'PATCH',
        body: JSON.stringify({ taskIds, status }),
      });
    },
  },

  
  admin: {
    async getUsers(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
      return API.request(endpoint);
    },

    async getUser(id) {
      return API.request(`/admin/users/${id}`);
    },

    async updateUser(id, data) {
      return API.request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async deleteUser(id) {
      return API.request(`/admin/users/${id}`, {
        method: 'DELETE',
      });
    },

    async deactivateUser(id) {
      return API.request(`/admin/users/${id}/deactivate`, {
        method: 'PATCH',
      });
    },

    async activateUser(id) {
      return API.request(`/admin/users/${id}/activate`, {
        method: 'PATCH',
      });
    },

    async getStats() {
      return API.request('/admin/stats');
    },
  },
};