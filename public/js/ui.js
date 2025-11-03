// ====================================
// 🎨 UI Management & User Interactions
// ====================================

class UIManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.isLoading = false;
    this.connectionStatus = 'disconnected';
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeTheme();
    this.startConnectionCheck();
    this.initializeAnimations();
  }

  // Event Binding
  bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettings());
    }

    // Action buttons
    document.querySelectorAll('.action-btn, .btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAction(e));
    });

    // Search functionality
    const searchInput = document.getElementById('search-scripts');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    // Modal events
    this.bindModalEvents();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Window events
    window.addEventListener('resize', () => this.handleResize());
  }

  // Navigation Handling
  handleNavigation(e) {
    const item = e.currentTarget;
    const section = item.dataset.section;
    const action = item.dataset.action;

    if (section) {
      this.showSection(section);
      this.updateActiveNavItem(item);
    }

    if (action) {
      this.handleActionButton(action);
    }
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentSection = sectionName;
      
      // Load section data
      this.loadSectionData(sectionName);
    }
  }

  updateActiveNavItem(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    activeItem.classList.add('active');
  }

  loadSectionData(sectionName) {
    switch (sectionName) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'scripts':
        this.loadScriptsData();
        break;
      case 'backup':
        this.loadBackupData();
        break;
      case 'analytics':
        this.loadAnalyticsData();
        break;
    }
  }

  // Dashboard Management
  async loadDashboardData() {
    try {
      this.showLoading('dashboard');
      
      const stats = await window.MCPAPI.getProjectStats();
      this.updateDashboardStats(stats);
      
      this.hideLoading('dashboard');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.handleAPIError(error);
    }
  }

  updateDashboardStats(stats) {
    const elements = {
      'scripts-count': stats.totalScripts || 0,
      'projects-count': Object.keys(stats.scriptsByType || {}).length,
      'database-size': this.formatFileSize(stats.projectStatus?.database_size || 0),
      'server-status': 'Online'
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        element.classList.add('countup');
        this.animateCounter(element, parseInt(value) || 0);
      }
    });
  }

  // Script Management
  async loadScriptsData() {
    try {
      this.showLoading('scripts');
      
      const scripts = await window.MCPAPI.getAllScripts();
      this.renderScriptsList(scripts);
      
      this.hideLoading('scripts');
    } catch (error) {
      console.error('Failed to load scripts:', error);
      this.handleAPIError(error);
    }
  }

  renderScriptsList(scripts) {
    const container = document.getElementById('scripts-list');
    if (!container) return;

    if (!scripts || scripts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-code"></i>
          <h3>No Scripts Found</h3>
          <p>Create your first script to get started!</p>
          <button class="btn primary" onclick="window.UIManager.openScriptModal()">
            <i class="fas fa-plus"></i> Create Script
          </button>
        </div>
      `;
      return;
    }

    const scriptsHTML = scripts.map(script => `
      <div class="script-card hover-lift" data-script="${script.name}">
        <div class="script-header">
          <div>
            <h3 class="script-title">${this.escapeHtml(script.name)}</h3>
            <div class="script-meta">
              <span class="script-type ${script.script_type}">${script.script_type.toUpperCase()}</span>
              <span><i class="fas fa-folder"></i> ${script.project_id}</span>
              <span><i class="fas fa-clock"></i> ${this.formatDate(script.created_at)}</span>
            </div>
          </div>
          <div class="script-actions">
            <button class="btn btn-sm secondary" onclick="window.UIManager.editScript('${script.name}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm secondary" onclick="window.UIManager.viewScript('${script.name}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm secondary" onclick="window.UIManager.duplicateScript('${script.name}')">
              <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn btn-sm secondary" onclick="window.UIManager.deleteScript('${script.name}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="script-preview">
          ${this.escapeHtml(script.content.substring(0, 200))}${script.content.length > 200 ? '...' : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = scriptsHTML;
    this.applyStaggerAnimation(container);
  }

  // Action Handlers
  handleAction(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.action || e.currentTarget.dataset.section;
    
    if (action) {
      this.handleActionButton(action);
    }
  }

  handleActionButton(action) {
    switch (action) {
      case 'create':
        this.openScriptModal();
        break;
      case 'validate':
        this.openValidateModal();
        break;
      case 'backup':
        this.createBackup();
        break;
      case 'status':
        this.showProjectStatus();
        break;
      case 'edit':
        // Handle edit action
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  // Script Modal Management
  openScriptModal(scriptName = null) {
    const modal = document.getElementById('script-modal');
    const form = document.getElementById('script-form');
    const title = document.getElementById('script-modal-title');
    
    if (!modal || !form) return;

    // Reset form
    form.reset();
    
    // Set mode
    if (scriptName) {
      title.textContent = 'Edit Script';
      this.loadScriptData(scriptName);
    } else {
      title.textContent = 'Create Script';
    }

    this.showModal(modal);
  }

  async loadScriptData(scriptName) {
    try {
      const scripts = await window.MCPAPI.getAllScripts();
      const script = scripts.find(s => s.name === scriptName);
      
      if (script) {
        document.getElementById('script-name').value = script.name;
        document.getElementById('script-type').value = script.script_type;
        document.getElementById('script-project').value = script.project_id;
        document.getElementById('script-content').value = script.content;
      }
    } catch (error) {
      console.error('Failed to load script data:', error);
      this.handleAPIError(error);
    }
  }

  closeScriptModal() {
    const modal = document.getElementById('script-modal');
    if (modal) {
      this.hideModal(modal);
    }
  }

  // Modal Management
  bindModalEvents() {
    // Script modal
    const scriptModal = document.getElementById('script-modal');
    const scriptClose = document.getElementById('script-modal-close');
    const scriptForm = document.getElementById('script-form');

    if (scriptClose) {
      scriptClose.addEventListener('click', () => this.closeScriptModal());
    }

    if (scriptForm) {
      scriptForm.addEventListener('submit', (e) => this.handleScriptSubmit(e));
    }

    // Settings modal
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-modal-close');
    const settingsForm = document.getElementById('settings-form');

    if (settingsClose) {
      settingsClose.addEventListener('click', () => this.closeSettings());
    }

    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
    }

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal);
        }
      });
    });
  }

  showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      this.populateSettings();
      this.showModal(modal);
    }
  }

  closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      this.hideModal(modal);
    }
  }

  populateSettings() {
    const hmacInput = document.getElementById('hmac-secret');
    const autoRefreshInput = document.getElementById('auto-refresh');
    
    if (hmacInput) {
      hmacInput.value = window.AppConfig.getHmacSecret();
    }
    
    if (autoRefreshInput) {
      autoRefreshInput.checked = window.AppConfig.getAutoRefresh();
    }
  }

  // Form Handlers
  async handleScriptSubmit(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('script-name').value,
      content: document.getElementById('script-content').value,
      script_type: document.getElementById('script-type').value,
      project_id: document.getElementById('script-project').value
    };

    try {
      this.setLoadingState(e.target, true);
      
      await window.MCPAPI.createScript(formData);
      window.NotificationSystem.show('Script created successfully!', 'success');
      this.closeScriptModal();
      this.loadScriptsData();
      
    } catch (error) {
      this.handleAPIError(error);
    } finally {
      this.setLoadingState(e.target, false);
    }
  }

  async handleSettingsSubmit(e) {
    e.preventDefault();
    
    const hmacSecret = document.getElementById('hmac-secret').value;
    const autoRefresh = document.getElementById('auto-refresh').checked;

    try {
      window.AppConfig.setHmacSecret(hmacSecret);
      window.MCPAPI.setHmacSecret(hmacSecret);
      window.AppConfig.setAutoRefresh(autoRefresh);

      // Test connection
      const testBtn = document.getElementById('test-connection-btn');
      if (testBtn) {
        await this.testConnection();
      }

      window.NotificationSystem.show('Settings saved successfully!', 'success');
      this.closeSettings();
      
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async testConnection() {
    try {
      const health = await window.MCPAPI.checkHealth();
      window.NotificationSystem.show('Connection test successful!', 'success');
      this.updateConnectionStatus('connected');
    } catch (error) {
      window.NotificationSystem.show('Connection test failed!', 'error');
      this.updateConnectionStatus('disconnected');
    }
  }

  // Theme Management
  toggleTheme() {
    window.AppConfig.toggleTheme();
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      icon.className = window.AppConfig.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  initializeTheme() {
    this.updateThemeIcon();
  }

  // Connection Status
  updateConnectionStatus(status) {
    this.connectionStatus = status;
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    if (indicator && text) {
      indicator.className = `status-indicator ${status}`;
      
      switch (status) {
        case 'connected':
          text.textContent = 'Connected';
          break;
        case 'connecting':
          text.textContent = 'Connecting...';
          break;
        case 'disconnected':
          text.textContent = 'Disconnected';
          break;
        case 'error':
          text.textContent = 'Error';
          break;
      }
    }
  }

  startConnectionCheck() {
    this.checkConnection();
    setInterval(() => this.checkConnection(), 30000); // Check every 30 seconds
  }

  async checkConnection() {
    try {
      this.updateConnectionStatus('connecting');
      await window.MCPAPI.checkHealth();
      this.updateConnectionStatus('connected');
    } catch (error) {
      this.updateConnectionStatus('disconnected');
    }
  }

  // Loading States
  showLoading(section) {
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
      sectionElement.classList.add('loading');
    }
  }

  hideLoading(section) {
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
      sectionElement.classList.remove('loading');
    }
  }

  setLoadingState(element, loading) {
    if (loading) {
      element.classList.add('loading');
      element.disabled = true;
    } else {
      element.classList.remove('loading');
      element.disabled = false;
    }
  }

  // Animations
  initializeAnimations() {
    if (window.AppConfig.reducedMotion) return;

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    });

    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach(el => {
      observer.observe(el);
    });
  }

  applyStaggerAnimation(container) {
    const children = container.querySelectorAll('.script-card, .stat-card');
    children.forEach((child, index) => {
      child.style.animationDelay = `${index * 0.1}s`;
      child.classList.add('fade-in-up');
    });
  }

  animateCounter(element, target) {
    if (window.AppConfig.reducedMotion) {
      element.textContent = target;
      return;
    }

    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  }

  // Utility Methods
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const scriptCards = document.querySelectorAll('.script-card');
    
    scriptCards.forEach(card => {
      const name = card.querySelector('.script-title').textContent.toLowerCase();
      const content = card.querySelector('.script-preview').textContent.toLowerCase();
      
      if (name.includes(query) || content.includes(query)) {
        card.style.display = 'block';
        card.classList.add('fade-in-up');
      } else {
        card.style.display = 'none';
      }
    });
  }

  handleKeyboard(e) {
    // ESC key to close modals
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        this.hideModal(modal);
      });
    }
    
    // Ctrl/Cmd + N to create script
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.openScriptModal();
    }
  }

  handleResize() {
    // Handle responsive adjustments
    this.updateLayout();
  }

  updateLayout() {
    // Update layout based on screen size
    const sidebar = document.querySelector('.sidebar');
    const isMobile = window.innerWidth < 1024;
    
    if (sidebar) {
      sidebar.style.display = isMobile ? 'none' : 'block';
    }
  }

  handleAPIError(error) {
    console.error('API Error:', error);
    const message = window.MCPAPI.getErrorMessage(error);
    window.NotificationSystem.show(message, 'error');
  }
}

// Create global UI manager instance
window.UIManager = new UIManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}