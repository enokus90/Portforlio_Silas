// ============ CONFIGURATION ============
const CONFIG = {
    // ⚠️ UPDATE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyLOEQ-RO7xEvcfwxdQ4rbjAh9CEmyHFbyA1jmnSocYo1vksJP44uklxSc3GZ0GqUNm5Q/exec',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain'
    ]
};

// ============ UTILITY FUNCTIONS ============
class Utils {
    static showNotification(message, type = 'info', duration = 5000) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
        
        return notification;
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static isValidFileType(file) {
        if (CONFIG.ALLOWED_FILE_TYPES.length === 0) return true;
        
        // Check MIME type
        if (CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) return true;
        
        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'];
        return allowedExtensions.includes(extension);
    }

    static isValidFileSize(file) {
        return file.size <= CONFIG.MAX_FILE_SIZE;
    }
}

// ============ API SERVICE ============
class PortfolioAPI {
    constructor() {
        this.baseUrl = CONFIG.GOOGLE_APPS_SCRIPT_URL;
    }

    async submitContact(formData) {
        try {
            // Create FormData object for file upload
            const formParams = new FormData();
            
            // Add action parameter
            formParams.append('action', 'submitContact');
            
            // Add all form fields with correct mapping
            formParams.append('name', formData.name || '');
            formParams.append('email', formData.email || '');
            formParams.append('phone', formData.phone || '');
            formParams.append('company', formData.company || '');
            formParams.append('subject', formData.subject || '');
            formParams.append('message', formData.message || '');
            formParams.append('service_interested', formData.service || '');
            formParams.append('budget_range', formData.budget || '');
            formParams.append('timeline', formData.timeline || '');
            formParams.append('urgency', formData.urgency || '');
            
            // Add files if present
            if (formData.attachments && formData.attachments.length > 0) {
                formData.attachments.forEach((file) => {
                    formParams.append('attachments', file, file.name);
                });
            }
            
            // Add metadata
            const ipAddress = await this.getClientIP().catch(() => 'unknown');
            const userAgent = navigator.userAgent.substring(0, 500) || '';
            
            formParams.append('ip_address', ipAddress);
            formParams.append('user_agent', userAgent);
            formParams.append('created_at', this.getCurrentDateTime());

            // Show sending notification
            const sendingNotification = Utils.showNotification('Sending your message...', 'info', 0);
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formParams
            });

            if (sendingNotification) {
                sendingNotification.classList.remove('show');
                setTimeout(() => sendingNotification.remove(), 300);
            }

            if (!response.ok) {
                throw new Error(`Unable to send message. Please try again.`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message || 'Submission failed');
            }

            return result;

        } catch (error) {
            console.error('Form submission error:', error);
            throw error;
        }
    }

    getCurrentDateTime() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            
            if (response.ok) {
                const data = await response.json();
                return data.ip || 'unknown';
            }
            
            return 'ip-unavailable';
        } catch (error) {
            return 'ip-fetch-error';
        }
    }
}

// ============ PORTFOLIO UI MANAGER ============
class PortfolioUI {
    static api = null;
    
    static init(apiInstance) {
        this.api = apiInstance;
        
        this.initNavigation();
        this.initContactForm();
        this.initFileUpload();
    }
    
    static initNavigation() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    static initContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) {
            console.warn('Contact form not found');
            return;
        }
        
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.btn-submit');
            const spinner = submitBtn.querySelector('.spinner');
            const originalText = submitBtn.querySelector('span').textContent;
            const originalIcon = submitBtn.querySelector('i').className;
            
            // Update button state
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Sending...';
            submitBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
            if (spinner) spinner.classList.remove('d-none');
            
            try {
                // Get form data
                const formData = this.getFormData();
                
                // Validate form
                const validation = this.validateForm(formData);
                if (!validation.isValid) {
                    Utils.showNotification(validation.message, 'error');
                    
                    // Highlight error fields
                    validation.errors.forEach(field => {
                        const input = document.getElementById(field);
                        if (input) {
                            input.classList.add('error');
                            setTimeout(() => input.classList.remove('error'), 3000);
                        }
                    });
                    
                    throw new Error('Form validation failed');
                }
                
                // Validate files
                const fileValidation = this.validateFiles(formData.attachments);
                if (!fileValidation.isValid) {
                    Utils.showNotification(fileValidation.message, 'error');
                    throw new Error('File validation failed');
                }
                
                // Submit form
                const result = await this.api.submitContact(formData);
                
                if (result.success) {
                    // Success
                    Utils.showNotification(
                        `Message sent successfully! ${formData.attachments.length > 0 ? `${formData.attachments.length} file(s) uploaded.` : ''}`, 
                        'success', 
                        5000
                    );
                    
                    // Reset form
                    contactForm.reset();
                    
                    // Clear file preview
                    const filePreview = document.getElementById('filePreview');
                    if (filePreview) filePreview.innerHTML = '';
                    
                    // Clear file input
                    const fileInput = document.getElementById('attachment');
                    if (fileInput) fileInput.value = '';
                    
                } else {
                    throw new Error(result.error || result.message || 'Submission failed');
                }
                
            } catch (error) {
                Utils.showNotification(
                    `Error: ${error.message}. Please try again or contact me directly.`, 
                    'error', 
                    5000
                );
                
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = originalText;
                submitBtn.querySelector('i').className = originalIcon;
                if (spinner) spinner.classList.add('d-none');
            }
        });
    }
    
    static getFormData() {
        const fileInput = document.getElementById('attachment');
        const files = fileInput ? Array.from(fileInput.files) : [];
        
        return {
            name: document.getElementById('name')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            phone: document.getElementById('phone')?.value.trim() || '',
            company: document.getElementById('company')?.value.trim() || '',
            subject: document.getElementById('subject')?.value.trim() || '',
            message: document.getElementById('message')?.value.trim() || '',
            service: document.getElementById('service')?.value || '',
            budget: document.getElementById('budget')?.value || '',
            timeline: document.getElementById('timeline')?.value || '',
            urgency: document.getElementById('urgency')?.value || '',
            attachments: files
        };
    }
    
    static validateForm(formData) {
        const errors = [];
        let message = '';
        
        // Required fields
        const requiredFields = ['name', 'email', 'subject', 'message', 'service'];
        requiredFields.forEach(field => {
            if (!formData[field]) {
                errors.push(field);
            }
        });
        
        // Email format
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.push('email');
                message = 'Please enter a valid email address';
            }
        }
        
        if (errors.length > 0 && !message) {
            message = `Please fill in all required fields: ${errors.map(f => f.replace(/_/g, ' ')).join(', ')}`;
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            message: message
        };
    }
    
    static validateFiles(files) {
        if (!files || files.length === 0) {
            return { isValid: true, message: '' };
        }
        
        const invalidFiles = [];
        
        for (const file of files) {
            // Check file type
            if (!Utils.isValidFileType(file)) {
                invalidFiles.push({
                    name: file.name,
                    reason: 'File type not allowed'
                });
            }
            
            // Check file size
            if (!Utils.isValidFileSize(file)) {
                invalidFiles.push({
                    name: file.name,
                    reason: `File too large (max ${Utils.formatFileSize(CONFIG.MAX_FILE_SIZE)})`
                });
            }
        }
        
        if (invalidFiles.length > 0) {
            const message = `Invalid files:\n${invalidFiles.map(f => `• ${f.name}: ${f.reason}`).join('\n')}`;
            return { isValid: false, message: message };
        }
        
        return { isValid: true, message: '' };
    }
    
    static initFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('attachment');
        const filePreview = document.getElementById('filePreview');
        
        if (!uploadArea || !fileInput || !filePreview) {
            return;
        }
        
        // Click to browse
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop handlers
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                this.handleFileSelection(fileInput.files);
            }
        });
        
        // File input change
        fileInput.addEventListener('change', () => {
            this.handleFileSelection(fileInput.files);
        });
    }
    
    static handleFileSelection(files) {
        const filePreview = document.getElementById('filePreview');
        if (!filePreview) return;
        
        // Clear previous preview
        filePreview.innerHTML = '';
        
        // Show each file
        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${Utils.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="file-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            filePreview.appendChild(fileItem);
        });
        
        // Add remove handlers
        filePreview.querySelectorAll('.file-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                this.removeFile(index);
            });
        });
    }
    
    static removeFile(index) {
        const fileInput = document.getElementById('attachment');
        if (!fileInput) return;
        
        const dt = new DataTransfer();
        const files = Array.from(fileInput.files);
        
        files.forEach((file, i) => {
            if (i !== index) {
                dt.items.add(file);
            }
        });
        
        fileInput.files = dt.files;
        this.handleFileSelection(fileInput.files);
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize API
        const api = new PortfolioAPI();
        
        // Initialize UI
        PortfolioUI.init(api);
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        Utils.showNotification(
            'Failed to initialize application. Please refresh the page.', 
            'error'
        );
    }
});

// ============ CSS STYLES ============
const style = document.createElement('style');
style.textContent = `
/* Notifications */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2563eb;
    color: white;
    padding: 16px 20px;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    z-index: 99999;
    max-width: 400px;
    transform: translateX(400px) scale(0.95);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
}

.notification.show {
    transform: translateX(0) scale(1);
}

.notification-success { 
    background: #10b981;
    border-left: 4px solid #059669;
}
.notification-error { 
    background: #ef4444;
    border-left: 4px solid #dc2626;
}
.notification-warning { 
    background: #f59e0b;
    border-left: 4px solid #d97706;
}
.notification-info { 
    background: #3b82f6;
    border-left: 4px solid #2563eb;
}

.notification-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    margin-right: 10px;
}

.notification-content i {
    font-size: 18px;
    margin-top: 2px;
    flex-shrink: 0;
}

.notification-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    flex-shrink: 0;
}

.notification-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* File Upload Styles */
.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s;
}

.file-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
}

.file-icon {
    color: #64748b;
    font-size: 18px;
    flex-shrink: 0;
}

.file-details {
    flex: 1;
    min-width: 0;
}

.file-name {
    font-size: 14px;
    font-weight: 500;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file-size {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
}

.file-remove {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 6px;
    border-radius: 4px;
    transition: background 0.2s;
    flex-shrink: 0;
}

.file-remove:hover {
    background: #fee2e2;
}

/* Upload Area */
.upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: #f8fafc;
    margin-top: 8px;
}

.upload-area:hover {
    border-color: #3b82f6;
    background: #f0f7ff;
}

.upload-area.dragover {
    border-color: #2563eb;
    background: #e0f2fe;
    transform: scale(1.02);
}

.upload-area i {
    font-size: 48px;
    color: #94a3b8;
    margin-bottom: 16px;
}

.upload-area p {
    color: #64748b;
    margin: 0;
    line-height: 1.6;
}

.upload-area .browse-link {
    color: #2563eb;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
}

.upload-hint {
    font-size: 13px;
    color: #94a3b8;
    margin-top: 8px !important;
}

/* Form Error States */
.form-group input.error,
.form-group textarea.error,
.form-group select.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
`;

document.head.appendChild(style);
