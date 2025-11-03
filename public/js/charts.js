// ====================================
// 🔔 Notification System
// ====================================

class NotificationSystem {
  constructor() {
    this.container = document.getElementById('notifications');
    this.notifications = [];
    this.maxNotifications = 5;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('Notifications container not found');
      return;
    }

    // Create notification styles if not exists
    this.createStyles();
  }

  createStyles() {
    if (document.getElementById('notification-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: relative;
        margin-bottom: var(--spacing-sm);
        opacity: 0;
        transform: translateX(100%);
        animation: slideInRight 0.3s ease forwards;
      }
      
      .notification.hide {
        animation: slideOutRight 0.3s ease forwards;
      }
      
      .notification.success { border-left-color: var(--secondary-color); }
      .notification.error { border-left-color: var(--accent-red); }
      .notification.warning { border-left-color: var(--accent-orange); }
      .notification.info { border-left-color: var(--primary-color); }
    `;
    document.head.appendChild(styles);
  }

  show(message, type = 'info', options = {}) {
    const {
      title = this.getDefaultTitle(type),
      duration = window.AppConfig.notificationDuration,
      action = null,
      persistent = false
    } = options;

    // Remove oldest notification if max reached
    if (this.notifications.length >= this.maxNotifications) {
      this.remove(this.notifications[0].id);
    }

    const notification = this.create(message, title, type, action);
    this.notifications.push(notification);

    // Auto-remove if not persistent
    if (!persistent && duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, duration);
    }

    // Add click to dismiss
    notification.element.addEventListener('click', () => {
      this.remove(notification.id);
    });

    return notification.id;
  }

  create(message, title, type, action) {
    const id = Date.now() + Math.random();
    
    const element = document.createElement('div');
    element.className = `notification ${type}`;
    element.innerHTML = `
      <div class="notification-icon">
        <i class="${this.getIcon(type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${this.escapeHtml(title)}</div>
        <div class="notification-message">${this.escapeHtml(message)}</div>
        ${action ? `<button class="notification-action">${this.escapeHtml(action.text)}</button>` : ''}
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add action handler
    if (action) {
      const actionBtn = element.querySelector('.notification-action');
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (action.callback) action.callback();
        this.remove(id);
      });
    }

    // Add close handler
    const closeBtn = element.querySelector('.notification-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.remove(id);
    });

    this.container.appendChild(element);

    return {
      id,
      element,
      type,
      title,
      message
    };
  }

  remove(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    const element = notification.element;
    element.classList.add('hide');

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);

    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clear() {
    this.notifications.forEach(notification => {
      notification.element.remove();
    });
    this.notifications = [];
  }

  getDefaultTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type] || 'Notification';
  }

  getIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  // Static methods for backward compatibility
  static show(message, type = 'info', options = {}) {
    if (!window.notificationSystem) {
      window.notificationSystem = new NotificationSystem();
    }
    return window.notificationSystem.show(message, type, options);
  }

  static success(message, options = {}) {
    return NotificationSystem.show(message, 'success', options);
  }

  static error(message, options = {}) {
    return NotificationSystem.show(message, 'error', options);
  }

  static warning(message, options = {}) {
    return NotificationSystem.show(message, 'warning', options);
  }

  static info(message, options = {}) {
    return NotificationSystem.show(message, 'info', options);
  }

  static clear() {
    if (window.notificationSystem) {
      window.notificationSystem.clear();
    }
  }
}

// Create global notification system
window.NotificationSystem = NotificationSystem;

// ====================================
// 📊 Chart Management System
// ====================================

class ChartManager {
  constructor() {
    this.charts = new Map();
    this.defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
          }
        },
        y: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
          }
        }
      }
    };
  }

  createChart(canvasId, type, data, options = {}) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return null;
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`Canvas with id "${canvasId}" not found`);
      return null;
    }

    // Destroy existing chart
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const ctx = canvas.getContext('2d');
    const chartOptions = this.mergeOptions(options);

    const chart = new Chart(ctx, {
      type,
      data,
      options: chartOptions
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  mergeOptions(options) {
    return {
      ...this.defaultOptions,
      ...options,
      plugins: {
        ...this.defaultOptions.plugins,
        ...options.plugins
      },
      scales: {
        x: {
          ...this.defaultOptions.scales.x,
          ...options.scales?.x
        },
        y: {
          ...this.defaultOptions.scales.y,
          ...options.scales?.y
        }
      }
    };
  }

  updateChart(canvasId, newData) {
    const chart = this.charts.get(canvasId);
    if (!chart) return false;

    chart.data = newData;
    chart.update('active');
    return true;
  }

  destroyChart(canvasId) {
    const chart = this.charts.get(canvasId);
    if (chart) {
      chart.destroy();
      this.charts.delete(canvasId);
      return true;
    }
    return false;
  }

  destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  // Predefined chart types
  createScriptTypesChart(canvasId, scriptsByType) {
    const labels = Object.keys(scriptsByType);
    const data = Object.values(scriptsByType);
    
    const colors = [
      '#4f46e5', // Primary
      '#10b981', // Success
      '#f59e0b', // Warning
      '#ef4444', // Error
      '#8b5cf6', // Purple
      '#ec4899'  // Pink
    ];

    const chartData = {
      labels: labels.map(type => type.toUpperCase()),
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 1
      }]
    };

    const options = {
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    return this.createChart(canvasId, 'doughnut', chartData, options);
  }

  createActivityChart(canvasId, activityData) {
    const labels = activityData.map(item => item.date);
    const data = activityData.map(item => item.count);

    const chartData = {
      labels,
      datasets: [{
        label: 'Script Activity',
        data,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    const options = {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: true
        },
        y: {
          beginAtZero: true
        }
      }
    };

    return this.createChart(canvasId, 'line', chartData, options);
  }

  // Theme updates
  updateThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    
    this.defaultOptions.plugins.legend.labels.color = styles.getPropertyValue('--text-primary');
    
    this.defaultOptions.scales.x.ticks.color = styles.getPropertyValue('--text-secondary');
    this.defaultOptions.scales.y.ticks.color = styles.getPropertyValue('--text-secondary');
    
    this.defaultOptions.scales.x.grid.color = styles.getPropertyValue('--border-color');
    this.defaultOptions.scales.y.grid.color = styles.getPropertyValue('--border-color');

    // Update existing charts
    this.charts.forEach(chart => {
      chart.update('none');
    });
  }
}

// Create global chart manager
window.ChartManager = new ChartManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, ChartManager };
}