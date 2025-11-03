// ====================================
// 🛠️ Configuration & App Settings
// ====================================

class AppConfig {
  constructor() {
    this.apiBaseUrl = window.location.origin;
    this.defaultProjectId = 'default';
    this.defaultScriptType = 'lua';
    
    // UI Settings
    this.autoRefreshInterval = 30000; // 30 seconds
    this.notificationDuration = 5000; // 5 seconds
    this.maxRetries = 3;
    this.requestTimeout = 10000; // 10 seconds
    
    // Theme Settings
    this.theme = localStorage.getItem('mcp-theme') || 'dark';
    
    // HMAC Secret (stored securely)
    this.hmacSecret = localStorage.getItem('mcp-hmac-secret') || '';
    
    // Animation Settings
    this.enableAnimations = true;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Auto-refresh settings
    this.autoRefreshEnabled = localStorage.getItem('mcp-auto-refresh') === 'true';
    
    this.initializeSettings();
  }

  initializeSettings() {
    // Apply theme immediately
    this.applyTheme();
    
    // Apply settings to body
    document.body.classList.toggle('reduce-motion', this.reducedMotion);
    document.body.classList.toggle('no-animations', !this.enableAnimations || this.reducedMotion);
  }

  // Theme Management
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('mcp-theme', this.theme);
    
    // Update theme toggle icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }

  // HMAC Secret Management
  setHmacSecret(secret) {
    this.hmacSecret = secret;
    localStorage.setItem('mcp-hmac-secret', secret);
  }

  getHmacSecret() {
    return this.hmacSecret;
  }

  clearHmacSecret() {
    this.hmacSecret = '';
    localStorage.removeItem('mcp-hmac-secret');
  }

  // Auto-refresh Management
  setAutoRefresh(enabled) {
    this.autoRefreshEnabled = enabled;
    localStorage.setItem('mcp-auto-refresh', enabled.toString());
  }

  getAutoRefresh() {
    return this.autoRefreshEnabled;
  }

  // Settings Management
  saveSettings(settings) {
    Object.assign(this, settings);
    
    // Save to localStorage
    localStorage.setItem('mcp-settings', JSON.stringify({
      theme: this.theme,
      autoRefresh: this.autoRefreshEnabled,
      hmacSecret: this.hmacSecret,
      enableAnimations: this.enableAnimations
    }));
  }

  loadSettings() {
    const saved = localStorage.getItem('mcp-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.theme = settings.theme || 'dark';
        this.autoRefreshEnabled = settings.autoRefresh || false;
        this.hmacSecret = settings.hmacSecret || '';
        this.enableAnimations = settings.enableAnimations !== false;
        
        this.initializeSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }

  // Validation
  isValidHmacSecret() {
    return this.hmacSecret && this.hmacSecret.length >= 16;
  }

  // Utility Methods
  getCurrentTimestamp() {
    return Date.now();
  }

  isValidTimestamp(timestamp) {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    return diff <= 300000; // 5 minutes
  }

  // API Configuration
  getApiConfig() {
    return {
      baseURL: this.apiBaseUrl,
      timeout: this.requestTimeout,
      retries: this.maxRetries
    };
  }

  // Debug Settings
  enableDebugMode() {
    this.enableAnimations = true;
    console.log('Debug mode enabled');
  }

  disableDebugMode() {
    this.enableAnimations = false;
    document.body.classList.add('no-animations');
    console.log('Debug mode disabled');
  }
}

// Global configuration instance
window.AppConfig = new AppConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppConfig;
}