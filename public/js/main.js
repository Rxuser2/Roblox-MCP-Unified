// ====================================
// 🚀 Main Application Entry Point
// ====================================

class RobloxMCPApp {
  constructor() {
    this.isInitialized = false;
    this.autoRefreshTimer = null;
    this.init();
  }

  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen();
      
      // Load settings
      window.AppConfig.loadSettings();
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Start auto-refresh if enabled
      this.startAutoRefresh();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('🎮 Roblox MCP Dashboard initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.handleInitializationError(error);
    }
  }

  async initializeComponents() {
    // Initialize notification system
    window.notificationSystem = new window.NotificationSystem();
    
    // Initialize chart manager
    window.chartManager = new window.ChartManager();
    
    // Check for required dependencies
    this.checkDependencies();
    
    // Setup theme
    this.setupTheme();
    
    // Setup connection monitoring
    this.setupConnectionMonitoring();
  }

  checkDependencies() {
    const dependencies = {
      'Chart.js': () => typeof Chart !== 'undefined',
      'Font Awesome': () => document.querySelector('link[href*="font-awesome"]')
    };

    const missing = [];
    
    for (const [name, check] of Object.entries(dependencies)) {
      if (!check()) {
        missing.push(name);
      }
    }

    if (missing.length > 0) {
      console.warn('Missing dependencies:', missing);
      // Show warning but don't fail initialization
      setTimeout(() => {
        window.NotificationSystem.warning(
          `Some features may not work properly. Missing: ${missing.join(', ')}`
        );
      }, 2000);
    }
  }

  setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleGlobalKeyboard(e));
    
    // Window events
    window.addEventListener('beforeunload', () => this.cleanup());
    window.addEventListener('focus', () => this.handleWindowFocus());
    window.addEventListener('blur', () => this.handleWindowBlur());
    
    // Visibility change
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  async loadInitialData() {
    try {
      // Load dashboard data first
      if (window.UIManager) {
        await window.UIManager.loadDashboardData();
      }
      
      // Show welcome message if no HMAC secret configured
      if (!window.AppConfig.isValidHmacSecret()) {
        this.showWelcomeMessage();
      }
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Don't show error for initial load, might just be connection issue
    }
  }

  showWelcomeMessage() {
    setTimeout(() => {
      window.NotificationSystem.info(
        'Welcome to Roblox MCP Dashboard! Please configure your HMAC secret in settings to get started.',
        {
          action: {
            text: 'Configure Now',
            callback: () => window.UIManager?.openSettings()
          },
          duration: 10000
        }
      );
    }, 1000);
  }

  setupTheme() {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', window.AppConfig.theme);
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      window.chartManager?.updateThemeColors();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  setupConnectionMonitoring() {
    // Monitor connection status changes
    setInterval(() => {
      if (navigator.onLine) {
        this.checkServerConnection();
      }
    }, 30000); // Check every 30 seconds
  }

  async checkServerConnection() {
    try {
      await window.MCPAPI.checkHealth();
      // Connection is good
    } catch (error) {
      if (this.isInitialized) {
        window.NotificationSystem.warning('Server connection lost. Trying to reconnect...');
      }
    }
  }

  startAutoRefresh() {
    if (window.AppConfig.getAutoRefresh()) {
      this.autoRefreshTimer = setInterval(() => {
        if (!document.hidden) {
          this.refreshCurrentSection();
        }
      }, window.AppConfig.autoRefreshInterval);
    }
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  refreshCurrentSection() {
    if (window.UIManager && window.UIManager.currentSection) {
      window.UIManager.loadSectionData(window.UIManager.currentSection);
    }
  }

  // Event Handlers
  handleGlobalKeyboard(e) {
    // Global shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'k':
          e.preventDefault();
          this.focusSearch();
          break;
        case ',':
          e.preventDefault();
          window.UIManager?.openSettings();
          break;
        case 'r':
          if (e.shiftKey) {
            e.preventDefault();
            this.refreshCurrentSection();
          }
          break;
      }
    }

    // Function keys
    switch (e.key) {
      case 'F5':
        e.preventDefault();
        this.refreshCurrentSection();
        break;
    }
  }

  focusSearch() {
    const searchInput = document.getElementById('search-scripts');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  handleWindowFocus() {
    // Resume auto-refresh when window gains focus
    this.startAutoRefresh();
    
    // Refresh data if been away for a while
    if (Date.now() - this.lastFocus > 60000) { // 1 minute
      this.refreshCurrentSection();
    }
    
    this.lastFocus = Date.now();
  }

  handleWindowBlur() {
    // Pause auto-refresh when window loses focus
    this.stopAutoRefresh();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.stopAutoRefresh();
    } else {
      this.startAutoRefresh();
      this.refreshCurrentSection();
    }
  }

  handleOnline() {
    window.NotificationSystem.success('Connection restored!');
    this.checkServerConnection();
    this.refreshCurrentSection();
  }

  handleOffline() {
    window.NotificationSystem.warning('You are offline. Some features may not work.');
  }

  // Loading Screen Management
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        if (app) {
          app.style.display = 'block';
          app.classList.add('fade-in-up');
        }
      }, 1000); // Show loading for at least 1 second
    }
  }

  handleInitializationError(error) {
    this.hideLoadingScreen();
    
    // Show error message
    window.NotificationSystem.error(
      'Failed to initialize dashboard. Please refresh the page.',
      {
        persistent: true,
        action: {
          text: 'Refresh Page',
          callback: () => window.location.reload()
        }
      }
    );

    // Show debug info in console
    console.group('Initialization Error Details');
    console.error('Error:', error);
    console.log('App Config:', window.AppConfig);
    console.log('User Agent:', navigator.userAgent);
    console.log('Online Status:', navigator.onLine);
    console.groupEnd();
  }

  // Utility Methods
  getAppInfo() {
    return {
      version: '1.0.0',
      initialized: this.isInitialized,
      theme: window.AppConfig.theme,
      autoRefresh: window.AppConfig.getAutoRefresh(),
      connectionStatus: window.UIManager?.connectionStatus || 'unknown',
      currentSection: window.UIManager?.currentSection || 'dashboard',
      timestamp: new Date().toISOString()
    };
  }

  exportData() {
    return {
      appInfo: this.getAppInfo(),
      settings: {
        theme: window.AppConfig.theme,
        autoRefresh: window.AppConfig.getAutoRefresh(),
        hmacSecret: window.AppConfig.getHmacSecret() ? '***configured***' : 'not configured'
      },
      stats: window.UIManager ? {
        currentSection: window.UIManager.currentSection,
        connectionStatus: window.UIManager.connectionStatus
      } : {}
    };
  }

  clearAllData() {
    // Clear local storage
    localStorage.removeItem('mcp-settings');
    localStorage.removeItem('mcp-theme');
    localStorage.removeItem('mcp-hmac-secret');
    localStorage.removeItem('mcp-auto-refresh');
    
    // Clear notifications
    window.NotificationSystem.clear();
    
    // Show confirmation
    window.NotificationSystem.info('All local data cleared. Page will refresh.');
    
    // Refresh after delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  // Cleanup
  cleanup() {
    this.stopAutoRefresh();
    
    // Destroy charts
    window.chartManager?.destroyAllCharts();
    
    // Save settings
    if (window.AppConfig) {
      window.AppConfig.saveSettings({});
    }
  }

  // Debug Methods
  enableDebugMode() {
    window.AppConfig.enableDebugMode();
    
    // Add debug panel
    this.createDebugPanel();
    
    // Log app info
    console.log('Debug Mode Enabled');
    console.log('App Info:', this.getAppInfo());
    console.log('API Config:', window.MCPAPI?.getApiConfig());
  }

  createDebugPanel() {
    if (document.getElementById('debug-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-md);
      font-family: var(--font-mono);
      font-size: 12px;
      max-width: 300px;
      z-index: var(--z-tooltip);
      backdrop-filter: blur(10px);
    `;

    panel.innerHTML = `
      <div style="margin-bottom: var(--spacing-sm); font-weight: 600;">
        🔧 Debug Panel
      </div>
      <div id="debug-info"></div>
      <div style="margin-top: var(--spacing-sm);">
        <button onclick="window.appInstance?.exportData()" style="margin-right: var(--spacing-xs);">Export</button>
        <button onclick="window.appInstance?.clearAllData()">Clear</button>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;

    document.body.appendChild(panel);

    // Update debug info
    this.updateDebugInfo();
    
    // Update every 5 seconds
    setInterval(() => this.updateDebugInfo(), 5000);
  }

  updateDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    if (!debugInfo) return;

    const info = this.getAppInfo();
    debugInfo.innerHTML = `
      Status: ${info.initialized ? '✅' : '❌'}<br>
      Theme: ${info.theme}<br>
      Section: ${info.currentSection}<br>
      Connection: ${info.connectionStatus}<br>
      Auto Refresh: ${info.autoRefresh ? 'On' : 'Off'}<br>
      Time: ${new Date().toLocaleTimeString()}
    `;
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for dependencies to load
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });

  // Create and initialize app
  window.appInstance = new RobloxMCPApp();
});

// Make app globally available for debugging
window.RobloxMCPApp = RobloxMCPApp;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RobloxMCPApp;
}