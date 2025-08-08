// Settings Page Functionality
class SettingsManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadUserSettings();
    this.setupEventListeners();
    this.updateSubscriptionInfo();
  }

  setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }

    // Firm form
    const firmForm = document.getElementById('firmForm');
    if (firmForm) {
      firmForm.addEventListener('submit', (e) => this.handleFirmUpdate(e));
    }

    // Firm dropdown change
    const preferredFirm = document.getElementById('preferredFirm');
    if (preferredFirm) {
      preferredFirm.addEventListener('change', (e) => this.handleFirmChange(e));
    }

    // Mobile sync toggle
    const mobileSyncEnabled = document.getElementById('mobileSyncEnabled');
    if (mobileSyncEnabled) {
      mobileSyncEnabled.addEventListener('change', (e) => this.handleMobileSyncToggle(e));
    }

    // Billing buttons
    const manageBilling = document.getElementById('manageBilling');
    if (manageBilling) {
      manageBilling.addEventListener('click', () => this.openBillingPortal());
    }

    const upgradeSubscription = document.getElementById('upgradeSubscription');
    if (upgradeSubscription) {
      upgradeSubscription.addEventListener('click', () => this.showUpgradeOptions());
    }

    // Danger zone
    const deleteAccount = document.getElementById('deleteAccount');
    if (deleteAccount) {
      deleteAccount.addEventListener('click', () => this.handleDeleteAccount());
    }
  }

  loadUserSettings() {
    if (!authSystem || !authSystem.getCurrentUser()) {
      // Redirect to home if not logged in
      window.location.href = '../index.html';
      return;
    }

    const user = authSystem.getCurrentUser();
    
    // Populate profile fields
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileInitials = document.getElementById('profileInitials');

    if (profileName) profileName.value = user.name || '';
    if (profileEmail) profileEmail.value = user.email || '';
    if (profileInitials) profileInitials.value = user.initials || '';

    // Load firm settings
    const preferredFirm = document.getElementById('preferredFirm');
    const customFirmName = document.getElementById('customFirmName');
    const mileageRate = document.getElementById('mileageRate');

    if (user.firmSettings) {
      if (preferredFirm) preferredFirm.value = user.firmSettings.preferredFirm || '';
      if (customFirmName) customFirmName.value = user.firmSettings.customFirmName || '';
      if (mileageRate) mileageRate.value = user.firmSettings.mileageRate || '0.655';
      
      this.handleFirmChange({ target: preferredFirm });
    }

    // Load mobile sync settings
    const mobileSyncEnabled = document.getElementById('mobileSyncEnabled');
    if (mobileSyncEnabled && user.mobileSync) {
      mobileSyncEnabled.checked = user.mobileSync.enabled || false;
      this.handleMobileSyncToggle({ target: mobileSyncEnabled });
    }
  }

  updateSubscriptionInfo() {
    if (!authSystem || !authSystem.getCurrentUser()) return;

    const user = authSystem.getCurrentUser();
    const subscriptionTier = document.getElementById('subscriptionTier');
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    const demoExpirySection = document.getElementById('demoExpirySection');
    const demoExpiry = document.getElementById('demoExpiry');

    if (subscriptionTier) {
      const tierDisplayName = {
        'demo': '7-Day Demo',
        'basic': 'Web Access ($30/month)',
        'premium': 'Web + Mobile + AI ($50/month)',
        'admin': 'Administrator Access'
      }[user.subscriptionTier] || 'Unknown';
      
      subscriptionTier.textContent = tierDisplayName;
      subscriptionTier.className = `subscription__value subscription__value--${user.subscriptionTier}`;
    }

    if (subscriptionStatus) {
      const statusDisplayName = {
        'active': 'Active',
        'demo': 'Demo Active',
        'cancelled': 'Cancelled',
        'expired': 'Expired'
      }[user.subscriptionStatus] || 'Unknown';
      
      subscriptionStatus.textContent = statusDisplayName;
      subscriptionStatus.className = `subscription__value subscription__value--${user.subscriptionStatus}`;
    }

    // Show demo expiry for demo users
    if (user.subscriptionTier === 'demo' && user.demoExpiry) {
      if (demoExpirySection) demoExpirySection.style.display = 'block';
      if (demoExpiry) {
        const expiryDate = new Date(user.demoExpiry);
        demoExpiry.textContent = expiryDate.toLocaleDateString();
      }
    }
  }

  handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const user = authSystem.getCurrentUser();
    
    // Update user data
    user.name = formData.get('name');
    user.initials = formData.get('initials');
    
    // Save to localStorage
    authSystem.saveUserState();
    authSystem.updateUI();
    
    this.showMessage('Profile updated successfully!', 'success');
  }

  handleFirmUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const user = authSystem.getCurrentUser();
    
    // Initialize firm settings if not exists
    if (!user.firmSettings) user.firmSettings = {};
    
    // Update firm settings
    user.firmSettings.preferredFirm = formData.get('preferredFirm');
    user.firmSettings.customFirmName = formData.get('customFirmName');
    user.firmSettings.mileageRate = parseFloat(formData.get('mileageRate')) || 0.655;
    
    // Save to localStorage
    authSystem.saveUserState();
    
    this.showMessage('Firm settings saved successfully!', 'success');
  }

  handleFirmChange(e) {
    const customFirmGroup = document.getElementById('customFirmGroup');
    if (customFirmGroup) {
      if (e.target.value === 'custom') {
        customFirmGroup.style.display = 'block';
      } else {
        customFirmGroup.style.display = 'none';
      }
    }
  }

  handleMobileSyncToggle(e) {
    const mobileSyncInfo = document.getElementById('mobileSyncInfo');
    const user = authSystem.getCurrentUser();
    
    if (!user.mobileSync) user.mobileSync = {};
    user.mobileSync.enabled = e.target.checked;
    
    if (mobileSyncInfo) {
      mobileSyncInfo.style.display = e.target.checked ? 'block' : 'none';
    }
    
    // Save to localStorage
    authSystem.saveUserState();
    
    const message = e.target.checked ? 'Mobile sync enabled!' : 'Mobile sync disabled!';
    this.showMessage(message, 'info');
  }

  openBillingPortal() {
    // This would integrate with Stripe billing portal in production
    alert('Billing portal would open here. This is a mock for now.\n\nIn production, this would open Stripe Customer Portal for subscription management.');
  }

  showUpgradeOptions() {
    const user = authSystem.getCurrentUser();
    
    if (user.subscriptionTier === 'demo') {
      const choice = confirm('Upgrade your demo to continue using Claim Cipher!\n\n• Web Access: $30/month\n• Web + Mobile + AI: $50/month\n\nWould you like to proceed to billing?');
      if (choice) {
        this.openBillingPortal();
      }
    } else if (user.subscriptionTier === 'basic') {
      const choice = confirm('Upgrade to Premium for:\n\n• Mobile app access\n• AI-powered damage summaries\n• Advanced analytics\n• Priority support\n\nUpgrade to Premium ($50/month)?');
      if (choice) {
        this.openBillingPortal();
      }
    } else {
      this.showMessage('You already have the highest tier subscription!', 'info');
    }
  }

  handleDeleteAccount() {
    const user = authSystem.getCurrentUser();
    
    if (user.type === 'admin') {
      alert('Administrator accounts cannot be deleted through this interface.');
      return;
    }
    
    const confirmation = prompt('This will permanently delete your account and all data.\n\nType "DELETE" to confirm:');
    
    if (confirmation === 'DELETE') {
      // In production, this would call an API to delete the account
      alert('Account deletion request submitted. This is a mock implementation.\n\nIn production, this would permanently delete your account.');
      
      // For demo, just log out
      authSystem.logout();
      window.location.href = '../index.html';
    } else if (confirmation !== null) {
      this.showMessage('Account deletion cancelled - confirmation text did not match.', 'warning');
    }
  }

  showMessage(message, type = 'info') {
    // Use the auth system's notification system
    if (authSystem && authSystem.showMessage) {
      authSystem.showMessage(message, type);
    } else {
      // Fallback
      alert(message);
    }
  }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth system to be ready
  const initSettings = () => {
    if (typeof authSystem !== 'undefined') {
      new SettingsManager();
    } else {
      setTimeout(initSettings, 100);
    }
  };
  initSettings();
});