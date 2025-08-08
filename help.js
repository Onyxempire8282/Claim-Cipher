// Help System
class HelpSystem {
  constructor() {
    this.init();
  }

  init() {
    this.createHelpButton();
    this.createHelpModal();
    this.setupEventListeners();
  }

  createHelpButton() {
    // Create floating help button
    const helpButton = document.createElement('div');
    helpButton.id = 'helpButton';
    helpButton.className = 'help-button';
    helpButton.innerHTML = '❓';
    helpButton.title = 'Get Help & Support';
    
    document.body.appendChild(helpButton);
  }

  createHelpModal() {
    const modalHTML = `
      <div id="helpModal" class="modal">
        <div class="modal-content modal-content--help">
          <div class="modal__header">
            <span class="close-button" id="closeHelp">&times;</span>
            <div class="help__branding">
              <h2 class="help__title">Help & Support</h2>
              <p class="help__tagline">Get the assistance you need</p>
            </div>
          </div>
          
          <div class="help__content">
            <!-- FAQ Section -->
            <div class="help__section">
              <h3 class="help__section-title">Frequently Asked Questions</h3>
              <div class="faq__list">
                <div class="faq__item">
                  <div class="faq__question">How do I optimize a route?</div>
                  <div class="faq__answer">
                    Enter your starting address and up to 10 stops in the Route Optimizer. 
                    Click "Optimize Route" to calculate the most efficient path and get mileage calculations.
                  </div>
                </div>
                
                <div class="faq__item">
                  <div class="faq__question">What's included in my subscription?</div>
                  <div class="faq__answer">
                    <strong>Web Access ($30/month):</strong> Route optimizer, mileage calculator, basic tools<br>
                    <strong>Premium ($50/month):</strong> Everything above plus mobile app, AI summaries, and priority support
                  </div>
                </div>
                
                <div class="faq__item">
                  <div class="faq__question">How does the 7-day demo work?</div>
                  <div class="faq__answer">
                    The demo gives you full access to all features for 7 days. After that, you'll need to subscribe to continue using Claim Cipher.
                  </div>
                </div>
                
                <div class="faq__item">
                  <div class="faq__question">Can I export my route data?</div>
                  <div class="faq__answer">
                    Yes! You can export your route history as CSV files for tax and billing purposes. 
                    Go to Settings to manage your data exports.
                  </div>
                </div>
                
                <div class="faq__item">
                  <div class="faq__question">How do I change my TPA firm settings?</div>
                  <div class="faq__answer">
                    Visit your Settings page and update your Firm Settings section. 
                    You can select from common TPA firms or add a custom one.
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Contact Section -->
            <div class="help__section">
              <h3 class="help__section-title">Contact Support</h3>
              <form id="contactForm" class="contact__form">
                <div class="form__group">
                  <label for="contactName" class="form__label">Your Name</label>
                  <input 
                    type="text" 
                    id="contactName" 
                    name="name" 
                    class="form__input" 
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div class="form__group">
                  <label for="contactEmail" class="form__label">Email Address</label>
                  <input 
                    type="email" 
                    id="contactEmail" 
                    name="email" 
                    class="form__input" 
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div class="form__group">
                  <label for="contactSubject" class="form__label">Subject</label>
                  <select id="contactSubject" name="subject" class="form__input form__select" required>
                    <option value="">Select a topic...</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="general">General Question</option>
                    <option value="bug">Report a Bug</option>
                  </select>
                </div>
                
                <div class="form__group">
                  <label for="contactMessage" class="form__label">Message</label>
                  <textarea 
                    id="contactMessage" 
                    name="message" 
                    class="form__input form__textarea" 
                    placeholder="Describe your question or issue..."
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <button type="submit" class="btn btn--primary btn--full">Send Message</button>
              </form>
            </div>
            
            <!-- AI Assistant Placeholder -->
            <div class="help__section">
              <h3 class="help__section-title">AI Assistant</h3>
              <div class="ai__placeholder">
                <div class="ai__icon">🤖</div>
                <div class="ai__content">
                  <h4 class="ai__title">Smart Help (Coming Soon)</h4>
                  <p class="ai__description">
                    Our AI assistant will provide instant answers to your questions about 
                    Claim Cipher features, billing, and technical issues.
                  </p>
                  <button class="btn btn--secondary" disabled>
                    Launch AI Assistant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  setupEventListeners() {
    // Help button click
    const helpButton = document.getElementById('helpButton');
    if (helpButton) {
      helpButton.addEventListener('click', () => this.showHelpModal());
    }

    // Close modal
    const closeHelp = document.getElementById('closeHelp');
    if (closeHelp) {
      closeHelp.addEventListener('click', () => this.hideHelpModal());
    }

    // Click outside modal to close
    const modal = document.getElementById('helpModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideHelpModal();
        }
      });
    }

    // FAQ toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('faq__question')) {
        this.toggleFAQ(e.target);
      }
    });

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideHelpModal();
      }
    });
  }

  showHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      
      // Auto-populate user info if logged in
      this.populateUserInfo();
    }
  }

  hideHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  populateUserInfo() {
    if (typeof authSystem !== 'undefined' && authSystem.getCurrentUser()) {
      const user = authSystem.getCurrentUser();
      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
    }
  }

  toggleFAQ(questionElement) {
    const faqItem = questionElement.closest('.faq__item');
    const answer = faqItem.querySelector('.faq__answer');
    const isActive = faqItem.classList.contains('faq__item--active');
    
    // Close all other FAQs
    document.querySelectorAll('.faq__item').forEach(item => {
      item.classList.remove('faq__item--active');
    });
    
    // Toggle current FAQ
    if (!isActive) {
      faqItem.classList.add('faq__item--active');
    }
  }

  handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, this would send to support@claimcipher.com
    console.log('Contact form submission:', contactData);
    
    // Show success message
    this.showMessage('Your message has been sent! We\'ll get back to you within 24 hours.', 'success');
    
    // Reset form
    e.target.reset();
    
    // Store in localStorage for now (in production, this would go to a support system)
    const supportTickets = JSON.parse(localStorage.getItem('claimCipher_supportTickets') || '[]');
    supportTickets.push(contactData);
    localStorage.setItem('claimCipher_supportTickets', JSON.stringify(supportTickets));
    
    // Close modal after a delay
    setTimeout(() => {
      this.hideHelpModal();
    }, 2000);
  }

  showMessage(message, type = 'info') {
    // Use the auth system's notification if available
    if (typeof authSystem !== 'undefined' && authSystem.showMessage) {
      authSystem.showMessage(message, type);
    } else {
      // Fallback notification
      alert(message);
    }
  }
}

// Initialize help system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HelpSystem();
});