// Billing System
class BillingSystem {
  constructor() {
    this.currentPlan = null;
    this.paymentMethods = [];
    this.billingHistory = [];
    this.init();
  }

  init() {
    this.checkUserAccess();
    this.loadBillingData();
    this.setupEventListeners();
    this.updateUI();
  }

  checkUserAccess() {
    if (!authSystem || !authSystem.getCurrentUser()) {
      // Redirect to home if not logged in
      window.location.href = '../index.html';
      return;
    }
  }

  setupEventListeners() {
    // Plan selection buttons
    document.querySelectorAll('.plan__button').forEach(button => {
      button.addEventListener('click', (e) => {
        const plan = e.target.getAttribute('data-plan');
        this.selectPlan(plan);
      });
    });

    // Payment method buttons
    const addPaymentBtn = document.getElementById('addPaymentMethod');
    if (addPaymentBtn) {
      addPaymentBtn.addEventListener('click', () => this.addPaymentMethod());
    }

    const updatePaymentBtn = document.getElementById('updatePaymentMethod');
    if (updatePaymentBtn) {
      updatePaymentBtn.addEventListener('click', () => this.updatePaymentMethod());
    }

    // Account reactivation
    const reactivateBtn = document.getElementById('reactivateAccount');
    if (reactivateBtn) {
      reactivateBtn.addEventListener('click', () => this.reactivateAccount());
    }

    const updatePaymentWarningBtn = document.getElementById('updatePayment');
    if (updatePaymentWarningBtn) {
      updatePaymentWarningBtn.addEventListener('click', () => this.updatePaymentMethod());
    }

    // Enterprise contact
    const contactSalesBtn = document.getElementById('contactSales');
    if (contactSalesBtn) {
      contactSalesBtn.addEventListener('click', () => this.contactSales());
    }

    // Subscription modal
    const closeSubscription = document.getElementById('closeSubscription');
    if (closeSubscription) {
      closeSubscription.addEventListener('click', () => this.hideSubscriptionModal());
    }

    const confirmSubscription = document.getElementById('confirmSubscription');
    if (confirmSubscription) {
      confirmSubscription.addEventListener('click', () => this.confirmSubscription());
    }

    // Click outside modal to close
    const subscriptionModal = document.getElementById('subscriptionModal');
    if (subscriptionModal) {
      subscriptionModal.addEventListener('click', (e) => {
        if (e.target === subscriptionModal) {
          this.hideSubscriptionModal();
        }
      });
    }
  }

  loadBillingData() {
    const user = authSystem.getCurrentUser();
    
    // Load payment methods
    this.paymentMethods = user.paymentMethods || [];
    
    // Load billing history
    this.billingHistory = user.billingHistory || [];
    
    // Generate mock billing history for admin users
    if (user.type === 'admin' && this.billingHistory.length === 0) {
      this.billingHistory = this.generateMockBillingHistory();
    }
  }

  generateMockBillingHistory() {
    const history = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      history.push({
        id: `inv_${Date.now()}_${i}`,
        date: date.toISOString(),
        amount: i === 0 ? 50 : (i % 2 === 0 ? 50 : 30),
        status: 'paid',
        plan: i === 0 ? 'Premium' : (i % 2 === 0 ? 'Premium' : 'Basic'),
        method: 'Visa •••• 4242'
      });
    }
    
    return history;
  }

  updateUI() {
    this.updateSubscriptionStatus();
    this.updatePaymentMethod();
    this.updateBillingHistory();
    this.updatePlanButtons();
    this.checkForWarnings();
  }

  updateSubscriptionStatus() {
    const user = authSystem.getCurrentUser();
    const currentPlan = document.getElementById('currentPlan');
    const currentStatus = document.getElementById('currentStatus');
    const nextBilling = document.getElementById('nextBilling');
    const billingAmount = document.getElementById('billingAmount');
    const demoInfo = document.getElementById('demoInfo');
    const demoExpiryDate = document.getElementById('demoExpiryDate');

    if (!user) return;

    // Plan name
    const planNames = {
      'demo': '7-Day Demo',
      'basic': 'Web Access',
      'premium': 'Premium',
      'admin': 'Administrator'
    };
    
    if (currentPlan) {
      currentPlan.textContent = planNames[user.subscriptionTier] || 'Unknown';
      currentPlan.className = `subscription__value subscription__value--${user.subscriptionTier}`;
    }

    // Status
    const statusNames = {
      'active': 'Active',
      'demo': 'Demo Active',
      'cancelled': 'Cancelled', 
      'expired': 'Expired',
      'past_due': 'Past Due'
    };
    
    if (currentStatus) {
      currentStatus.textContent = statusNames[user.subscriptionStatus] || 'Unknown';
      currentStatus.className = `subscription__value subscription__value--${user.subscriptionStatus}`;
    }

    // Demo-specific info
    if (user.subscriptionTier === 'demo') {
      if (demoInfo) demoInfo.style.display = 'block';
      if (demoExpiryDate && user.demoExpiry) {
        demoExpiryDate.textContent = new Date(user.demoExpiry).toLocaleDateString();
      }
      if (nextBilling) nextBilling.textContent = 'Demo Period';
      if (billingAmount) billingAmount.textContent = 'Free';
    } else {
      if (demoInfo) demoInfo.style.display = 'none';
      
      // Next billing date (simulate monthly billing)
      if (nextBilling) {
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextBilling.textContent = nextDate.toLocaleDateString();
      }
      
      // Billing amount
      if (billingAmount) {
        const amounts = { 'basic': '$30.00', 'premium': '$50.00', 'admin': 'N/A' };
        billingAmount.textContent = amounts[user.subscriptionTier] || 'N/A';
      }
    }
  }

  updatePaymentMethod() {
    const paymentInfo = document.getElementById('paymentInfo');
    const updatePaymentBtn = document.getElementById('updatePaymentMethod');
    
    if (this.paymentMethods.length > 0) {
      const method = this.paymentMethods[0]; // Show primary payment method
      if (paymentInfo) {
        paymentInfo.innerHTML = `
          <div class="payment__card">
            <div class="card__info">
              <div class="card__brand">${method.brand}</div>
              <div class="card__number">•••• •••• •••• ${method.last4}</div>
              <div class="card__expiry">Expires ${method.exp_month}/${method.exp_year}</div>
            </div>
            <div class="card__status">
              <span class="status__indicator status__indicator--${method.status}"></span>
              ${method.status === 'active' ? 'Active' : 'Issue'}
            </div>
          </div>
        `;
      }
      if (updatePaymentBtn) updatePaymentBtn.style.display = 'inline-block';
    } else {
      // Show placeholder for no payment method
      if (updatePaymentBtn) updatePaymentBtn.style.display = 'none';
    }
  }

  updateBillingHistory() {
    const historyPlaceholder = document.getElementById('historyPlaceholder');
    const historyList = document.getElementById('historyList');

    if (this.billingHistory.length === 0) {
      if (historyPlaceholder) historyPlaceholder.style.display = 'block';
      if (historyList) historyList.style.display = 'none';
    } else {
      if (historyPlaceholder) historyPlaceholder.style.display = 'none';
      if (historyList) {
        historyList.style.display = 'block';
        historyList.innerHTML = this.billingHistory.map(invoice => `
          <div class="history__item">
            <div class="history__date">${new Date(invoice.date).toLocaleDateString()}</div>
            <div class="history__plan">${invoice.plan}</div>
            <div class="history__amount">$${invoice.amount}.00</div>
            <div class="history__status status__${invoice.status}">${invoice.status}</div>
            <div class="history__method">${invoice.method}</div>
            <button class="history__download btn btn--link">Download</button>
          </div>
        `).join('');
      }
    }
  }

  updatePlanButtons() {
    const user = authSystem.getCurrentUser();
    const basicPlan = document.getElementById('basicPlan');
    const premiumPlan = document.getElementById('premiumPlan');

    // Update button text based on current plan
    if (basicPlan) {
      const basicBtn = basicPlan.querySelector('.plan__button');
      if (user.subscriptionTier === 'basic') {
        basicBtn.textContent = 'Current Plan';
        basicBtn.disabled = true;
        basicBtn.className = 'plan__button btn btn--disabled';
      } else {
        basicBtn.textContent = user.subscriptionTier === 'demo' ? 'Upgrade' : 'Downgrade';
        basicBtn.disabled = false;
        basicBtn.className = 'plan__button btn btn--secondary';
      }
    }

    if (premiumPlan) {
      const premiumBtn = premiumPlan.querySelector('.plan__button');
      if (user.subscriptionTier === 'premium' || user.subscriptionTier === 'admin') {
        premiumBtn.textContent = 'Current Plan';
        premiumBtn.disabled = true;
        premiumBtn.className = 'plan__button btn btn--disabled';
      } else {
        premiumBtn.textContent = 'Upgrade';
        premiumBtn.disabled = false;
        premiumBtn.className = 'plan__button btn btn--primary';
      }
    }
  }

  checkForWarnings() {
    const user = authSystem.getCurrentUser();
    const warningCard = document.getElementById('warningCard');
    const warningTitle = document.getElementById('warningTitle');
    const warningMessage = document.getElementById('warningMessage');

    if (user.subscriptionStatus === 'past_due' || user.subscriptionStatus === 'expired') {
      if (warningCard) warningCard.style.display = 'block';
      if (warningTitle) warningTitle.textContent = 'Payment Failed';
      if (warningMessage) {
        warningMessage.textContent = 'Your last payment failed. Please update your payment method to reactivate your account.';
      }
    } else if (user.subscriptionTier === 'demo') {
      const now = new Date();
      const expiry = new Date(user.demoExpiry);
      const hoursLeft = Math.floor((expiry - now) / (1000 * 60 * 60));
      
      if (hoursLeft <= 24 && hoursLeft > 0) {
        if (warningCard) warningCard.style.display = 'block';
        if (warningTitle) warningTitle.textContent = 'Demo Expiring Soon';
        if (warningMessage) {
          warningMessage.textContent = `Your demo expires in ${hoursLeft} hours. Subscribe now to keep your data and continue using Claim Cipher.`;
        }
      }
    } else {
      if (warningCard) warningCard.style.display = 'none';
    }
  }

  selectPlan(planType) {
    const user = authSystem.getCurrentUser();
    
    if (user.subscriptionTier === planType) {
      this.showMessage('You are already on this plan.', 'info');
      return;
    }

    if (user.type === 'admin') {
      this.showMessage('Administrator accounts have unlimited access.', 'info');
      return;
    }

    this.currentPlan = planType;
    this.showSubscriptionModal(planType);
  }

  showSubscriptionModal(planType) {
    const modal = document.getElementById('subscriptionModal');
    const planSummary = document.getElementById('planSummary');
    
    const planInfo = {
      'basic': {
        name: 'Web Access',
        price: 30,
        features: ['Route Optimizer', 'Mileage Calculator', 'Basic Reporting', 'Email Support', 'Cloud Storage']
      },
      'premium': {
        name: 'Premium',
        price: 50,
        features: ['Everything in Web Access', 'Mobile App', 'AI-Powered Summaries', 'Advanced Analytics', 'Calendar Integration', 'Priority Support']
      }
    };

    const plan = planInfo[planType];
    if (planSummary && plan) {
      planSummary.innerHTML = `
        <div class="plan__modal-summary">
          <h3 class="plan__modal-name">${plan.name}</h3>
          <div class="plan__modal-price">$${plan.price}/month</div>
          <ul class="plan__modal-features">
            ${plan.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  hideSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    this.currentPlan = null;
  }

  confirmSubscription() {
    if (!this.currentPlan) return;

    const user = authSystem.getCurrentUser();
    
    // Simulate subscription change
    user.subscriptionTier = this.currentPlan;
    user.subscriptionStatus = 'active';
    user.demoExpiry = null; // Remove demo expiry
    
    // Add mock payment method if none exists
    if (this.paymentMethods.length === 0) {
      this.paymentMethods.push({
        id: 'pm_mock_' + Date.now(),
        brand: 'Visa',
        last4: '4242',
        exp_month: '12',
        exp_year: '2025',
        status: 'active'
      });
      user.paymentMethods = this.paymentMethods;
    }

    // Add to billing history
    this.billingHistory.unshift({
      id: 'inv_' + Date.now(),
      date: new Date().toISOString(),
      amount: this.currentPlan === 'premium' ? 50 : 30,
      status: 'paid',
      plan: this.currentPlan === 'premium' ? 'Premium' : 'Web Access',
      method: 'Visa •••• 4242'
    });
    user.billingHistory = this.billingHistory;

    // Save changes
    authSystem.saveUserState();
    authSystem.updateUI();

    // Update local UI
    this.updateUI();
    this.hideSubscriptionModal();

    // Show success message
    const planNames = { 'basic': 'Web Access', 'premium': 'Premium' };
    this.showMessage(`Successfully subscribed to ${planNames[this.currentPlan]}!`, 'success');
    
    this.currentPlan = null;
  }

  addPaymentMethod() {
    // In production, this would open Stripe payment method setup
    const confirmed = confirm('Add Payment Method\n\nIn production, this would open a secure Stripe payment form to add your credit card.\n\nFor this demo, would you like to add a mock payment method?');
    
    if (confirmed) {
      const user = authSystem.getCurrentUser();
      const mockPaymentMethod = {
        id: 'pm_mock_' + Date.now(),
        brand: 'Visa',
        last4: '4242',
        exp_month: '12',
        exp_year: '2025',
        status: 'active'
      };

      this.paymentMethods.push(mockPaymentMethod);
      user.paymentMethods = this.paymentMethods;
      authSystem.saveUserState();
      
      this.updateUI();
      this.showMessage('Payment method added successfully!', 'success');
    }
  }

  updatePaymentMethod() {
    // In production, this would open Stripe payment method update
    alert('Update Payment Method\n\nIn production, this would open the Stripe Customer Portal where you can:\n\n• Update your credit card\n• Change billing address\n• Download invoices\n• Update billing preferences\n\nThis is a mock for demo purposes.');
  }

  reactivateAccount() {
    const user = authSystem.getCurrentUser();
    
    if (user.subscriptionStatus === 'past_due' || user.subscriptionStatus === 'expired') {
      // Simulate reactivation
      user.subscriptionStatus = 'active';
      authSystem.saveUserState();
      authSystem.updateUI();
      
      this.updateUI();
      this.showMessage('Account reactivated successfully!', 'success');
    }
  }

  contactSales() {
    // In production, this would open a contact form or direct to sales
    const message = `Enterprise Sales Contact\n\nFor enterprise solutions and custom pricing, please contact:\n\n• Email: sales@claimcipher.com\n• Phone: 1-800-CIPHER-1\n• Schedule a demo: enterprise.claimcipher.com\n\nOur sales team can help with:\n• Volume discounts\n• Custom integrations\n• On-premise solutions\n• Dedicated support`;
    
    alert(message);
  }

  showMessage(message, type = 'info') {
    if (typeof authSystem !== 'undefined' && authSystem.showMessage) {
      authSystem.showMessage(message, type);
    } else {
      alert(message);
    }
  }
}

// Initialize billing system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const initBilling = () => {
    if (typeof authSystem !== 'undefined') {
      new BillingSystem();
    } else {
      setTimeout(initBilling, 100);
    }
  };
  initBilling();
});