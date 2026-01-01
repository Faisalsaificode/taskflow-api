/**
 * TaskFlow Frontend Application
 * Fixed version with proper event handling
 */

class TaskFlowApp {
  constructor() {
    this.currentUser = null;
    this.currentPage = 1;
    this.tasksPerPage = 10;
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkAuth();
  }

  cacheElements() {
    
    this.authSection = document.getElementById('auth-section');
    this.dashboardSection = document.getElementById('dashboard-section');
    this.adminPanel = document.getElementById('admin-panel');

    
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.taskForm = document.getElementById('task-form');

    
    this.userInfo = document.getElementById('user-info');
    this.userName = document.getElementById('user-name');
    this.userRole = document.getElementById('user-role');

    
    this.taskList = document.getElementById('task-list');
    this.taskModal = document.getElementById('task-modal');
    this.pagination = document.getElementById('pagination');

    
    this.statTotal = document.getElementById('stat-total');
    this.statPending = document.getElementById('stat-pending');
    this.statProgress = document.getElementById('stat-progress');
    this.statCompleted = document.getElementById('stat-completed');

    
    this.filterStatus = document.getElementById('filter-status');
    this.filterPriority = document.getElementById('filter-priority');
    this.searchInput = document.getElementById('search-input');

    
    this.messageEl = document.getElementById('message');
  }

  bindEvents() {
    const self = this;

    
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => self.switchTab(tab.dataset.tab));
    });

    
    this.loginForm.addEventListener('submit', (e) => self.handleLogin(e));
    this.registerForm.addEventListener('submit', (e) => self.handleRegister(e));

    
    document.getElementById('logout-btn').addEventListener('click', () => self.handleLogout());

    
    document.getElementById('add-task-btn').addEventListener('click', () => self.openTaskModal());
    document.getElementById('modal-close').addEventListener('click', () => self.closeTaskModal());
    this.taskForm.addEventListener('submit', (e) => self.handleTaskSubmit(e));

    
    this.filterStatus.addEventListener('change', () => self.loadTasks());
    this.filterPriority.addEventListener('change', () => self.loadTasks());
    this.searchInput.addEventListener('input', self.debounce(() => self.loadTasks(), 300));

    
    document.getElementById('view-users-btn').addEventListener('click', () => self.loadUsers());
    document.getElementById('view-admin-stats-btn').addEventListener('click', () => self.loadAdminStats());

    
    this.taskModal.addEventListener('click', (e) => {
      if (e.target === self.taskModal) self.closeTaskModal();
    });
  }

  
  async checkAuth() {
    if (!API.token) {
      this.showAuthSection();
      return;
    }

    try {
      const response = await API.auth.getProfile();
      this.currentUser = response.data.user;
      this.showDashboard();
    } catch (error) {
      API.setToken(null);
      this.showAuthSection();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await API.auth.login({ email, password });
      API.setToken(response.data.token);
      this.currentUser = response.data.user;
      this.showMessage('Login successful!', 'success');
      this.showDashboard();
      this.loginForm.reset();
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const userData = {
      name: document.getElementById('register-name').value,
      email: document.getElementById('register-email').value,
      password: document.getElementById('register-password').value,
      role: document.getElementById('register-role').value,
    };

    try {
      const response = await API.auth.register(userData);
      API.setToken(response.data.token);
      this.currentUser = response.data.user;
      this.showMessage('Registration successful!', 'success');
      this.showDashboard();
      this.registerForm.reset();
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  async handleLogout() {
    try {
      await API.auth.logout();
    } catch (error) {
      
    }
    API.setToken(null);
    this.currentUser = null;
    this.showMessage('Logged out successfully', 'success');
    this.showAuthSection();
  }

  
  showAuthSection() {
    this.authSection.classList.remove('hidden');
    this.dashboardSection.classList.add('hidden');
    this.userInfo.classList.add('hidden');
  }

  showDashboard() {
    this.authSection.classList.add('hidden');
    this.dashboardSection.classList.remove('hidden');
    this.userInfo.classList.remove('hidden');

    
    this.userName.textContent = this.currentUser.name;
    this.userRole.textContent = this.currentUser.role;
    this.userRole.className = `badge badge-${this.currentUser.role}`;

    
    if (this.currentUser.role === 'admin') {
      this.adminPanel.classList.remove('hidden');
    } else {
      this.adminPanel.classList.add('hidden');
    }

    
    this.loadTasks();
    this.loadStats();
  }

  switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    if (tab === 'login') {
      this.loginForm.classList.remove('hidden');
      this.registerForm.classList.add('hidden');
    } else {
      this.loginForm.classList.add('hidden');
      this.registerForm.classList.remove('hidden');
    }
  }

  
  async loadTasks() {
    const params = {
      page: this.currentPage,
      limit: this.tasksPerPage,
    };

    if (this.filterStatus.value) params.status = this.filterStatus.value;
    if (this.filterPriority.value) params.priority = this.filterPriority.value;
    if (this.searchInput.value) params.search = this.searchInput.value;

    try {
      const response = await API.tasks.getAll(params);
      this.renderTasks(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  renderTasks(tasks) {
    const self = this;

    if (tasks.length === 0) {
      this.taskList.innerHTML = '<div class="empty-state">No tasks found. Create one!</div>';
      return;
    }

    this.taskList.innerHTML = tasks.map(task => `
      <div class="task-item priority-${task.priority}">
        <div class="task-info">
          <h4>${this.escapeHtml(task.title)}</h4>
          <div class="task-meta">
            <span class="status-${task.status}">${task.status}</span>
            <span>Priority: ${task.priority}</span>
            ${task.dueDate ? `<span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-sm btn-secondary edit-btn" data-id="${task._id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${task._id}">Delete</button>
        </div>
      </div>
    `).join('');

    
    this.taskList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => self.editTask(btn.dataset.id));
    });

    
    this.taskList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => self.deleteTask(btn.dataset.id));
    });
  }

  renderPagination(pagination) {
    const self = this;

    if (pagination.totalPages <= 1) {
      this.pagination.innerHTML = '';
      return;
    }

    let html = `<button class="prev-btn" ${pagination.page === 1 ? 'disabled' : ''}>Prev</button>`;

    for (let i = 1; i <= pagination.totalPages; i++) {
      html += `<button class="page-btn ${i === pagination.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button class="next-btn" ${pagination.page === pagination.totalPages ? 'disabled' : ''}>Next</button>`;

    this.pagination.innerHTML = html;

    
    const prevBtn = this.pagination.querySelector('.prev-btn');
    const nextBtn = this.pagination.querySelector('.next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (pagination.page > 1) {
          self.currentPage = pagination.page - 1;
          self.loadTasks();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (pagination.page < pagination.totalPages) {
          self.currentPage = pagination.page + 1;
          self.loadTasks();
        }
      });
    }

    this.pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        self.currentPage = parseInt(btn.dataset.page);
        self.loadTasks();
      });
    });
  }

  async loadStats() {
    try {
      const response = await API.tasks.getStats();
      const stats = response.data;

      const total = Object.values(stats.byStatus || {}).reduce((a, b) => a + b, 0);
      this.statTotal.textContent = total;
      this.statPending.textContent = stats.byStatus?.pending || 0;
      this.statProgress.textContent = stats.byStatus?.['in-progress'] || 0;
      this.statCompleted.textContent = stats.byStatus?.completed || 0;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  openTaskModal(task = null) {
  const self = this;
  
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) {
    modalTitle.textContent = task ? 'Edit Task' : 'Add Task';
  }

  document.getElementById('task-id').value = task?._id || '';
  document.getElementById('task-title').value = task?.title || '';
  document.getElementById('task-description').value = task?.description || '';
  document.getElementById('task-status').value = task?.status || 'pending';
  document.getElementById('task-priority').value = task?.priority || 'medium';
  document.getElementById('task-due-date').value = task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '';
  document.getElementById('task-tags').value = task?.tags?.join(', ') || '';

  
  const assignGroup = document.getElementById('assign-user-group');
  const assignSelect = document.getElementById('task-assign-to');

  if (assignGroup && this.currentUser.role === 'admin') {
    assignGroup.style.display = 'block';
    
    
    API.admin.getUsers().then(response => {
      console.log('Users loaded:', response.data); 
      
      let options = '<option value="">-- Assign to myself --</option>';
      
      response.data.forEach(user => {
        const selected = task && task.user && task.user._id === user._id ? 'selected' : '';
        options += `<option value="${user._id}" ${selected}>${user.name} (${user.email})</option>`;
      });
      
      assignSelect.innerHTML = options;
    }).catch(err => {
      console.error('Failed to load users:', err);
      assignSelect.innerHTML = '<option value="">-- Assign to myself --</option>';
    });
  } else if (assignGroup) {
    assignGroup.style.display = 'none';
  }

  this.taskModal.classList.remove('hidden');
}

  closeTaskModal() {
    this.taskModal.classList.add('hidden');
    this.taskForm.reset();
  }

  async handleTaskSubmit(e) {
    e.preventDefault();

    const self = this;
    const taskId = document.getElementById('task-id').value;
    const taskData = {
      title: document.getElementById('task-title').value,
      description: document.getElementById('task-description').value,
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
    };

    const dueDate = document.getElementById('task-due-date').value;
    if (dueDate) taskData.dueDate = new Date(dueDate).toISOString();

    const tags = document.getElementById('task-tags').value;
    if (tags) taskData.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

    
    const assignTo = document.getElementById('task-assign-to');
    if (assignTo && assignTo.value) {
      taskData.userId = assignTo.value;
    }

    try {
      if (taskId) {
        await API.tasks.update(taskId, taskData);
        self.showMessage('Task updated successfully!', 'success');
      } else {
        await API.tasks.create(taskData);
        self.showMessage('Task created successfully!', 'success');
      }

      self.closeTaskModal();
      self.loadTasks();
      self.loadStats();
    } catch (error) {
      self.showMessage(error.message, 'error');
    }
  }

  async editTask(id) {
    try {
      const response = await API.tasks.getOne(id);
      this.openTaskModal(response.data);
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  async deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await API.tasks.delete(id);
      this.showMessage('Task deleted successfully!', 'success');
      this.loadTasks();
      this.loadStats();
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  
  async loadUsers() {
    const self = this;

    try {
      const response = await API.admin.getUsers();
      const adminContent = document.getElementById('admin-content');
      adminContent.innerHTML = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(user => `
              <tr>
                <td>${this.escapeHtml(user.name)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td><span class="badge badge-${user.role}">${user.role}</span></td>
                <td>${user.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  ${user._id !== this.currentUser.id ? `
                    <button class="btn btn-sm btn-secondary toggle-status-btn" data-id="${user._id}" data-active="${user.isActive}">
                      ${user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      
      adminContent.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          self.toggleUserStatus(btn.dataset.id, btn.dataset.active === 'true');
        });
      });
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  async loadAdminStats() {
    try {
      const response = await API.admin.getStats();
      const stats = response.data;
      const adminContent = document.getElementById('admin-content');
      adminContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Users</h3>
            <span>${stats.users.total}</span>
          </div>
          <div class="stat-card">
            <h3>Active Users</h3>
            <span>${stats.users.active}</span>
          </div>
          <div class="stat-card">
            <h3>Admins</h3>
            <span>${stats.users.admins}</span>
          </div>
          <div class="stat-card">
            <h3>Total Tasks</h3>
            <span>${stats.tasks.total}</span>
          </div>
        </div>
      `;
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  async toggleUserStatus(userId, isActive) {
    try {
      if (isActive) {
        await API.admin.deactivateUser(userId);
        this.showMessage('User deactivated', 'success');
      } else {
        await API.admin.activateUser(userId);
        this.showMessage('User activated', 'success');
      }
      this.loadUsers();
    } catch (error) {
      this.showMessage(error.message, 'error');
    }
  }

  
  showMessage(text, type) {
    this.messageEl.textContent = text;
    this.messageEl.className = `message ${type}`;
    this.messageEl.classList.remove('hidden');

    setTimeout(() => {
      this.messageEl.classList.add('hidden');
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}


const app = new TaskFlowApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});