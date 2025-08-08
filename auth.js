// Authentication System
class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.masterUsers = [
      { email: 'vernon@claimcipher.com', password: 'master2024', name: 'Vernon Long', initials: 'VL', type: 'admin' },
      { email: 'nneka@claimcipher.com', password: 'master2024', name: 'Nneka Johnson', initials: 'NJ', type: 'admin' }
    ];
    this.init();
  }

  init() {
    this.loadUserState();
    this.setupEventListeners();
    this.updateUI();
    this.checkDemoExpiry();
  }

  loadUserState() {
    const userData = localStorage.getItem('claimCipher_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  saveUserState() {
    if (this.currentUser) {
      localStorage.setItem('claimCipher_user', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('claimCipher_user');
    }
  }

  setupEventListeners() {
    // Login button in menu
    document.addEventListener('click', (e) => {
      if (e.target.id === 'loginBtn' || e.target.closest('#loginBtn')) {
        this.showLoginModal();
      }
    });

    // User icon dropdown
    const userIcon = document.getElementById('userIcon');
    const userDropdown = document.getElementById('userDropdown');
    if (userIcon && userDropdown) {
      userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.remove('show');
        }
      });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Demo login
    const demoBtn = document.getElementById('demoLogin');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => this.startDemo());
    }

    // Close modal
    const closeBtn = document.getElementById('closeLogin');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideLoginModal());
    }

    // Logout
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        e.preventDefault();
        this.logout();
      }
    });

    // Click outside modal to close
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideLoginModal();
        }
      });
    }
  }

  showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Check master users first
    const masterUser = this.masterUsers.find(u => u.email === email && u.password === password);
    if (masterUser) {
      this.currentUser = {
        ...masterUser,
        loginDate: new Date().toISOString(),
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        demoExpiry: null
      };
      this.saveUserState();
      this.updateUI();
      this.hideLoginModal();
      this.showMessage('Welcome back, ' + masterUser.name + '!', 'success');
      return;
    }

    // Check stored users
    const storedUsers = JSON.parse(localStorage.getItem('claimCipher_users') || '[]');
    const user = storedUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.currentUser = {
        ...user,
        loginDate: new Date().toISOString()
      };
      this.saveUserState();
      this.updateUI();
      this.hideLoginModal();
      this.showMessage('Welcome back, ' + user.name + '!', 'success');
      
      // Check subscription status
      this.checkSubscriptionStatus();
    } else {
      this.showMessage('Invalid email or password. Try the demo instead!', 'error');
    }
  }

  startDemo() {
    const demoUser = {
      email: 'demo@claimcipher.com',
      name: 'Demo User',
      initials: 'DU',
      type: 'user',
      subscriptionTier: 'demo',
      subscriptionStatus: 'demo',
      demoStart: new Date().toISOString(),
      demoExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      loginDate: new Date().toISOString()
    };

    this.currentUser = demoUser;
    this.saveUserState();
    this.updateUI();
    this.hideLoginModal();
    this.showMessage('Welcome to your 7-day free demo!', 'success');
  }

  logout() {
    this.currentUser = null;
    this.saveUserState();
    this.updateUI();
    this.showMessage('You have been logged out successfully', 'info');
  }

  checkDemoExpiry() {
    if (this.currentUser && this.currentUser.subscriptionTier === 'demo') {
      const now = new Date();
      const expiry = new Date(this.currentUser.demoExpiry);
      
      if (now > expiry) {
        this.showSubscriptionModal();
        return false;
      }
      
      // Show warning at 24 hours left
      const hoursLeft = Math.floor((expiry - now) / (1000 * 60 * 60));
      if (hoursLeft <= 24 && hoursLeft > 0) {
        this.showMessage(`Demo expires in ${hoursLeft} hours. Subscribe to continue!`, 'warning');
      }
    }
    return true;
  }

  checkSubscriptionStatus() {
    if (!this.currentUser) return false;
    
    if (this.currentUser.type === 'admin') return true;
    
    if (this.currentUser.subscriptionStatus === 'cancelled' || 
        this.currentUser.subscriptionStatus === 'expired') {
      this.showSubscriptionModal();
      return false;
    }
    
    return this.checkDemoExpiry();
  }

  showSubscriptionModal() {
    // This will be implemented in the billing system
    alert('Your access has expired. Please subscribe to continue using Claim Cipher.');
  }

  updateUI() {
    this.updateSidebar();
    this.updateUserIcon();
    this.updateDemoWarning();
  }

  updateSidebar() {
    const loginMenuItem = document.getElementById('loginMenuItem');
    const userMenuItem = document.getElementById('userMenuItem');
    
    if (this.currentUser) {
      if (loginMenuItem) loginMenuItem.style.display = 'none';
      if (userMenuItem) {
        userMenuItem.style.display = 'block';
        const initialsEl = userMenuItem.querySelector('.user__initials');
        if (initialsEl) {
          initialsEl.textContent = this.currentUser.initials;
        }
      }
    } else {
      if (loginMenuItem) loginMenuItem.style.display = 'block';
      if (userMenuItem) userMenuItem.style.display = 'none';
    }
  }

  updateUserIcon() {
    const userIcons = document.querySelectorAll('.user__initials');
    userIcons.forEach(icon => {
      if (this.currentUser) {
        icon.textContent = this.currentUser.initials;
        icon.style.display = 'flex';
      } else {
        icon.style.display = 'none';
      }
    });
  }

  updateDemoWarning() {
    let warningEl = document.getElementById('demoWarning');
    
    if (this.currentUser && this.currentUser.subscriptionTier === 'demo') {
      const now = new Date();
      const expiry = new Date(this.currentUser.demoExpiry);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      if (!warningEl) {
        warningEl = document.createElement('div');
        warningEl.id = 'demoWarning';
        warningEl.className = 'demo-warning';
        document.body.appendChild(warningEl);
      }
      
      warningEl.innerHTML = `
        <div class="demo-warning__content">
          <span class="demo-warning__icon">⚠️</span>
          <span class="demo-warning__text">DEMO MODE - ${daysLeft} days remaining</span>
          <button class="demo-warning__subscribe">Subscribe Now</button>
        </div>
      `;
      warningEl.style.display = 'block';
    } else {
      if (warningEl) {
        warningEl.style.display = 'none';
      }
    }
  }

  showMessage(message, type = 'info') {
    // Create or update notification
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 4000);
  }

  // Public API
  isLoggedIn() {
    return this.currentUser !== null && this.checkSubscriptionStatus();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.type === 'admin';
  }

  getUserInitials() {
    return this.currentUser ? this.currentUser.initials : '';
  }
}

// Initialize authentication system when DOM is loaded
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
  authSystem = new AuthSystem();
});