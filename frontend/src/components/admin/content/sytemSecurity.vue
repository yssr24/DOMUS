<!-- filepath: c:\Users\VIVOBOOK\OneDrive - Mindoro State University\Desktop\github\DOMUS\frontend\src\components\admin\content\sytemSecurity.vue -->
<template>
  <div class="system-security">
    <header class="security-header">
      <div class="header-content">
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          System Security
        </h1>
        <p>Configure security settings and policies for your DOMUS system</p>
      </div>
      <div class="last-updated">
        <span>Last updated: {{ lastUpdated }}</span>
      </div>
    </header>

    <!-- Confirmation Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="cancelToggle">
      <div class="modal">
        <div class="modal-icon" :class="pendingToggle?.newValue ? 'enable' : 'disable'">
          <svg v-if="pendingToggle?.newValue" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h2>{{ pendingToggle?.newValue ? 'Enable' : 'Disable' }} {{ pendingToggle?.label }}?</h2>
        <p>{{ pendingToggle?.confirmMessage }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelToggle">Cancel</button>
          <button class="btn-confirm" :class="pendingToggle?.newValue ? 'enable' : 'disable'" @click="confirmToggle">
            {{ pendingToggle?.newValue ? 'Yes, Enable' : 'Yes, Disable' }}
          </button>
        </div>
      </div>
    </div>

    <div class="security-content">
      <!-- Authentication Section -->
      <section class="security-section">
        <div class="section-header">
          <div class="section-icon auth">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>Authentication & Access</h2>
            <p>Control how users authenticate and access the system</p>
          </div>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Two-Factor Authentication (2FA)</h3>
              <p>Require users to verify their identity using a second factor like SMS or authenticator app</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.twoFactorAuth" @change="handleToggle('twoFactorAuth', $event, 'Two-Factor Authentication', 'This will require all users to set up 2FA on their next login. Users without 2FA will not be able to access the system.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Enforce Strong Passwords</h3>
              <p>Require passwords to contain uppercase, lowercase, numbers, and special characters (min 12 chars)</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.strongPasswords" @change="handleToggle('strongPasswords', $event, 'Strong Password Policy', 'Users will be required to update weak passwords on their next login.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Password Expiry (90 Days)</h3>
              <p>Force users to change their passwords every 90 days for enhanced security</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.passwordExpiry" @change="handleToggle('passwordExpiry', $event, 'Password Expiry', 'Users will be prompted to change their password every 90 days.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Single Session Login</h3>
              <p>Allow only one active session per user account at a time</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.singleSession" @change="handleToggle('singleSession', $event, 'Single Session Login', 'Existing sessions will be terminated when a user logs in from a new device.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Account Lockout (5 Failed Attempts)</h3>
              <p>Automatically lock accounts after 5 consecutive failed login attempts</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.accountLockout" @change="handleToggle('accountLockout', $event, 'Account Lockout', 'Accounts will be locked for 30 minutes after 5 failed login attempts.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Email Verification Required</h3>
              <p>Require email verification before allowing new users to access the system</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.emailVerification" @change="handleToggle('emailVerification', $event, 'Email Verification', 'New users must verify their email address before accessing the system.')">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Session Management Section -->
      <section class="security-section">
        <div class="section-header">
          <div class="section-icon session">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>Session Management</h2>
            <p>Configure session timeouts and activity monitoring</p>
          </div>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Auto Logout on Inactivity (15 mins)</h3>
              <p>Automatically log out users after 15 minutes of inactivity</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.autoLogout" @change="handleToggle('autoLogout', $event, 'Auto Logout', 'Users will be automatically logged out after 15 minutes of inactivity.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Session Timeout Warning</h3>
              <p>Show a warning 2 minutes before session expires with option to extend</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.sessionWarning" @change="handleToggle('sessionWarning', $event, 'Session Warning', 'Users will see a warning before their session expires.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Remember Device (30 Days)</h3>
              <p>Allow users to stay logged in on trusted devices for up to 30 days</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.rememberDevice" @change="handleToggle('rememberDevice', $event, 'Remember Device', 'Users can choose to stay logged in on trusted devices.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Force Re-authentication for Sensitive Actions</h3>
              <p>Require password confirmation for critical actions like changing email or password</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.forceReauth" @change="handleToggle('forceReauth', $event, 'Force Re-authentication', 'Users must re-enter their password for sensitive operations.')">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Data Protection Section -->
      <section class="security-section">
        <div class="section-header">
          <div class="section-icon data">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>Data Protection</h2>
            <p>Secure data storage and transmission settings</p>
          </div>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Encrypt Files at Rest</h3>
              <p>Encrypt all uploaded files and documents stored in the system</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.encryptFiles" @change="handleToggle('encryptFiles', $event, 'File Encryption', 'All files will be encrypted. This may slightly impact upload/download speeds.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Secure File Downloads</h3>
              <p>Generate time-limited download links that expire after 1 hour</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.secureDownloads" @change="handleToggle('secureDownloads', $event, 'Secure Downloads', 'Download links will expire after 1 hour and cannot be shared.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Data Backup Encryption</h3>
              <p>Encrypt all automated backups with AES-256 encryption</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.backupEncryption" @change="handleToggle('backupEncryption', $event, 'Backup Encryption', 'All system backups will be encrypted with AES-256.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Prevent Data Export</h3>
              <p>Disable bulk data export functionality for non-admin users</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.preventExport" @change="handleToggle('preventExport', $event, 'Prevent Data Export', 'Only administrators will be able to export data from the system.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Watermark Downloaded Files</h3>
              <p>Add user information watermark to downloaded documents for tracking</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.watermarkFiles" @change="handleToggle('watermarkFiles', $event, 'File Watermarking', 'Downloaded documents will include a watermark with user information.')">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Audit & Monitoring Section -->
      <section class="security-section">
        <div class="section-header">
          <div class="section-icon audit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>Audit & Monitoring</h2>
            <p>Track system activities and security events</p>
          </div>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Login Activity Logging</h3>
              <p>Record all login attempts including IP address, device, and location</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.loginLogging" @change="handleToggle('loginLogging', $event, 'Login Logging', 'All login activities will be recorded for security auditing.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>File Access Logging</h3>
              <p>Track who views, downloads, or modifies files in the system</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.fileAccessLogging" @change="handleToggle('fileAccessLogging', $event, 'File Access Logging', 'All file access will be logged for compliance and security.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Admin Action Logging</h3>
              <p>Record all administrative actions for accountability</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.adminLogging" @change="handleToggle('adminLogging', $event, 'Admin Action Logging', 'All administrative actions will be recorded with timestamps.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Security Alert Notifications</h3>
              <p>Send email alerts to admins for suspicious activities</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.securityAlerts" @change="handleToggle('securityAlerts', $event, 'Security Alerts', 'Administrators will receive email alerts for suspicious activities.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Failed Login Alerts</h3>
              <p>Notify users via email when failed login attempts occur on their account</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.failedLoginAlerts" @change="handleToggle('failedLoginAlerts', $event, 'Failed Login Alerts', 'Users will be notified of failed login attempts on their account.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Audit Log Retention (1 Year)</h3>
              <p>Keep audit logs for 1 year before automatic deletion</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.logRetention" @change="handleToggle('logRetention', $event, 'Log Retention', 'Audit logs will be retained for 1 year for compliance purposes.')">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Network & API Security Section -->
      <section class="security-section">
        <div class="section-header">
          <div class="section-icon network">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
              <line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>Network & API Security</h2>
            <p>Protect against network attacks and API abuse</p>
          </div>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Rate Limiting</h3>
              <p>Limit API requests to 100 per minute per user to prevent abuse</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.rateLimiting" @change="handleToggle('rateLimiting', $event, 'Rate Limiting', 'Users will be limited to 100 API requests per minute.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>IP Whitelist Mode</h3>
              <p>Only allow access from pre-approved IP addresses</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.ipWhitelist" @change="handleToggle('ipWhitelist', $event, 'IP Whitelist', 'WARNING: Only whitelisted IP addresses will be able to access the system. Make sure your IP is added first.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Block Suspicious IPs</h3>
              <p>Automatically block IP addresses with suspicious behavior patterns</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.blockSuspiciousIPs" @change="handleToggle('blockSuspiciousIPs', $event, 'Block Suspicious IPs', 'IP addresses showing suspicious behavior will be automatically blocked.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>CORS Strict Mode</h3>
              <p>Only allow requests from authorized domains</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.corsStrict" @change="handleToggle('corsStrict', $event, 'CORS Strict Mode', 'Only requests from authorized domains will be accepted.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>API Key Required</h3>
              <p>Require API key authentication for all external API calls</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.apiKeyRequired" @change="handleToggle('apiKeyRequired', $event, 'API Key Required', 'All external API calls must include a valid API key.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>DDoS Protection</h3>
              <p>Enable advanced DDoS protection and traffic filtering</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.ddosProtection" @change="handleToggle('ddosProtection', $event, 'DDoS Protection', 'Advanced DDoS protection will be enabled to filter malicious traffic.')">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Privacy & Compliance Section -->
      <section class="security-section">
        <div class="section-header">
          <div class="section-icon privacy">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </div>
          <div class="section-info">
            <h2>Privacy & Compliance</h2>
            <p>Data privacy settings and regulatory compliance</p>
          </div>
        </div>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>Cookie Consent Banner</h3>
              <p>Show cookie consent banner to comply with GDPR and privacy regulations</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.cookieConsent" @change="handleToggle('cookieConsent', $event, 'Cookie Consent', 'A cookie consent banner will be shown to all visitors.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Data Anonymization</h3>
              <p>Anonymize personal data in reports and analytics</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.dataAnonymization" @change="handleToggle('dataAnonymization', $event, 'Data Anonymization', 'Personal data will be anonymized in reports and analytics.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Right to be Forgotten</h3>
              <p>Allow users to request complete deletion of their data</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.rightToForget" @change="handleToggle('rightToForget', $event, 'Right to be Forgotten', 'Users will be able to request complete deletion of their personal data.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Privacy Policy Acceptance</h3>
              <p>Require users to accept privacy policy before using the system</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.privacyAcceptance" @change="handleToggle('privacyAcceptance', $event, 'Privacy Policy Acceptance', 'Users must accept the privacy policy before accessing the system.')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3>Terms of Service Agreement</h3>
              <p>Require users to agree to terms of service on signup</p>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="settings.tosAgreement" @change="handleToggle('tosAgreement', $event, 'Terms of Service', 'Users must agree to terms of service during registration.')">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </section>
    </div>

    <!-- Save Notification -->
    <transition name="slide-up">
      <div v-if="showSaveNotification" class="save-notification">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span>Settings saved successfully</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const showModal = ref(false)
const showSaveNotification = ref(false)
const pendingToggle = ref(null)
const lastUpdated = ref(new Date().toLocaleDateString('en-US', { 
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
}))

const settings = reactive({
  // Authentication & Access
  twoFactorAuth: false,
  strongPasswords: true,
  passwordExpiry: false,
  singleSession: false,
  accountLockout: true,
  emailVerification: true,
  
  // Session Management
  autoLogout: true,
  sessionWarning: true,
  rememberDevice: true,
  forceReauth: true,
  
  // Data Protection
  encryptFiles: true,
  secureDownloads: true,
  backupEncryption: true,
  preventExport: false,
  watermarkFiles: false,
  
  // Audit & Monitoring
  loginLogging: true,
  fileAccessLogging: true,
  adminLogging: true,
  securityAlerts: true,
  failedLoginAlerts: true,
  logRetention: true,
  
  // Network & API Security
  rateLimiting: true,
  ipWhitelist: false,
  blockSuspiciousIPs: true,
  corsStrict: true,
  apiKeyRequired: false,
  ddosProtection: true,
  
  // Privacy & Compliance
  cookieConsent: true,
  dataAnonymization: false,
  rightToForget: true,
  privacyAcceptance: true,
  tosAgreement: true
})

function handleToggle(key, event, label, confirmMessage) {
  const newValue = event.target.checked
  // Revert the checkbox immediately - we'll set it properly after confirmation
  event.target.checked = settings[key]
  
  pendingToggle.value = {
    key,
    newValue,
    label,
    confirmMessage
  }
  showModal.value = true
}

function confirmToggle() {
  if (pendingToggle.value) {
    settings[pendingToggle.value.key] = pendingToggle.value.newValue
    lastUpdated.value = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
    
    // Show save notification
    showSaveNotification.value = true
    setTimeout(() => {
      showSaveNotification.value = false
    }, 3000)
  }
  closeModal()
}

function cancelToggle() {
  closeModal()
}

function closeModal() {
  showModal.value = false
  pendingToggle.value = null
}
</script>

<style scoped>
.system-security {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.security-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 1.75rem;
  color: #213547;
}

.header-content h1 svg {
  color: #1976d2;
}

.header-content p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.last-updated {
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.modal-icon.enable {
  background: #e8f5e9;
  color: #2e7d32;
}

.modal-icon.disable {
  background: #fff3e0;
  color: #e65100;
}

.modal h2 {
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  color: #213547;
}

.modal p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-actions button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  color: #666;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-confirm {
  border: none;
  color: #fff;
}

.btn-confirm.enable {
  background: #2e7d32;
}

.btn-confirm.enable:hover {
  background: #1b5e20;
}

.btn-confirm.disable {
  background: #e65100;
}

.btn-confirm.disable:hover {
  background: #bf360c;
}

/* Security Content */
.security-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.security-section {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon.auth {
  background: #e3f2fd;
  color: #1976d2;
}

.section-icon.session {
  background: #fff3e0;
  color: #f57c00;
}

.section-icon.data {
  background: #e8f5e9;
  color: #388e3c;
}

.section-icon.audit {
  background: #f3e5f5;
  color: #7b1fa2;
}

.section-icon.network {
  background: #e0f2f1;
  color: #00796b;
}

.section-icon.privacy {
  background: #fce4ec;
  color: #c2185b;
}

.section-info h2 {
  margin: 0 0 4px 0;
  font-size: 1.15rem;
  color: #213547;
}

.section-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  transition: background 0.2s;
}

.setting-item:hover {
  background: #f9f9f9;
}

.setting-info {
  flex: 1;
  padding-right: 20px;
}

.setting-info h3 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: #213547;
  font-weight: 600;
}

.setting-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #888;
  line-height: 1.4;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background: linear-gradient(135deg, #1976d2, #42a5f5);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

input:focus + .slider {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
}

/* Save Notification */
.save-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #2e7d32;
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(46, 125, 50, 0.4);
  z-index: 1000;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .system-security {
    padding: 16px;
  }

  .security-header {
    flex-direction: column;
    gap: 16px;
  }

  .last-updated {
    align-self: flex-start;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-info {
    padding-right: 0;
  }

  .modal {
    padding: 24px;
    margin: 16px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>