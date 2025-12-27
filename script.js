// ============ CONFIGURATION ============
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx1izjHfotaZ3TYurkJ5zUb-c2oTPZWZ9daHnt3kNTTvMSWhEBUeghfaRtVClnjqce1/exec',
    SITE_NAME: 'Silas Enoku Portfolio',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production',
    CACHE_DURATION: 5 * 60 * 1000,
    ANALYTICS_ENABLED: true,
    DEBUG_MODE: true,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
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
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static createElement(tag, className, innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    static showNotification(message, type = 'info', duration = 3000) {
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
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        return CONFIG.ALLOWED_FILE_TYPES.includes(file.type) || 
               file.name.match(/\.(pdf|doc|docx|xls|xlsx|csv|jpg|jpeg|png|gif|webp|txt)$/i);
    }

    static isValidFileSize(file) {
        return file.size <= CONFIG.MAX_FILE_SIZE;
    }
}

// ============ API SERVICE ============
class PortfolioAPI {
    constructor() {
        this.baseUrl = CONFIG.GOOGLE_APPS_SCRIPT_URL;
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.isOnline = navigator.onLine;
        
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    handleOnline() {
        this.isOnline = true;
        Utils.showNotification('Back online. Syncing data...', 'success', 2000);
        this.logSystemEvent('INFO', 'network', 'handleOnline', 'Device is back online');
    }

    handleOffline() {
        this.isOnline = false;
        Utils.showNotification('You are offline. Some features may be limited.', 'warning', 3000);
        this.logSystemEvent('WARN', 'network', 'handleOffline', 'Device went offline');
    }

    async fetchData(action, params = {}, forceRefresh = false) {
        const cacheKey = `${action}_${JSON.stringify(params)}`;
        
        if (!forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                if (CONFIG.DEBUG_MODE) console.log(`[Cache Hit] ${action}`, cached.data);
                return cached.data;
            }
        }

        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        const requestPromise = this.makeRequest(action, params, cacheKey);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const data = await requestPromise;
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            return data;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    async makeRequest(action, params, cacheKey) {
        const startTime = Date.now();
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        try {
            this.logApiRequest({
                requestId,
                method: 'GET',
                endpoint: this.baseUrl,
                action,
                parameters: params,
                timestamp: new Date().toISOString()
            });

            const url = new URL(this.baseUrl);
            url.searchParams.append('action', action);
            
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                }
            });

            const responseTime = Date.now() - startTime;
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            this.logApiRequest({
                requestId,
                responseCode: response.status,
                responseTime,
                responseSize: JSON.stringify(data).length,
                error: false,
                cacheHit: false
            });

            return data;

        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.logApiRequest({
                requestId,
                responseCode: 0,
                responseTime,
                error: true,
                errorMessage: error.message
            });

            this.logSystemEvent('ERROR', 'api', 'makeRequest', `API request failed: ${error.message}`, {
                action,
                params,
                cacheKey,
                requestId
            });

            if (!this.isOnline) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    Utils.showNotification('Using cached data while offline', 'info', 2000);
                    return cached.data;
                }
            }

            throw error;
        }
    }

    async getProjects(category = null) {
        const params = category ? { category } : {};
        return this.fetchData('getProjects', params);
    }

    async getFeaturedProjects(limit = 6) {
        const data = await this.fetchData('getProjects');
        return data.data
            .filter(project => project.featured === true || project.featured === 'TRUE')
            .slice(0, limit);
    }

    async getTestimonials(featured = true) {
        const data = await this.fetchData('getTestimonials');
        let testimonials = data.data || [];
        
        if (featured) {
            testimonials = testimonials.filter(t => t.featured === true || t.featured === 'TRUE');
        }
        
        return testimonials;
    }

    async getSkills(category = null) {
        const data = await this.fetchData('getSkills');
        let skills = data.data || [];
        
        if (category) {
            skills = skills.filter(s => s.category === category);
        }
        
        return skills.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    async getAllData() {
        try {
            const [
                projects,
                testimonials
            ] = await Promise.all([
                this.getProjects(),
                this.getTestimonials()
            ]);
            
            return {
                projects,
                testimonials
            };
        } catch (error) {
            console.error('Error loading all data:', error);
            throw error;
        }
    }

    // ============ FIXED: Contact Form Submission with FILE UPLOAD ============
    async submitContact(formData) {
        const submissionId = 'contact_' + Date.now();
        
        this.logFormInteraction({
            formId: 'contact_form',
            formType: 'contact',
            submissionId,
            status: 'started',
            fieldsFilled: Object.keys(formData).filter(key => formData[key] && key !== 'attachments').length,
            fileCount: formData.attachments ? formData.attachments.length : 0
        });

        try {
            if (CONFIG.DEBUG_MODE) {
                console.log('=== SUBMITTING CONTACT FORM ===');
                console.log('Form data:', formData);
            }

            // Create FormData object for file upload
            const formParams = new FormData();
            
            // CRITICAL FIX: Add action parameter FIRST
            formParams.append('action', 'submitContact');
            
            // Add all form fields
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
                formData.attachments.forEach((file, index) => {
                    formParams.append('attachments', file, file.name);
                });
                if (CONFIG.DEBUG_MODE) {
                    console.log(`Added ${formData.attachments.length} files to form data`);
                }
            }
            
            // Add metadata
            const ipAddress = await this.getClientIP().catch(() => 'unknown');
            const userAgent = navigator.userAgent.substring(0, 500) || '';
            
            formParams.append('ip_address', ipAddress);
            formParams.append('user_agent', userAgent);
            formParams.append('created_at', this.getCurrentDateTime());

            if (CONFIG.DEBUG_MODE) {
                console.log('FormData entries:');
                for (let pair of formParams.entries()) {
                    console.log(`${pair[0]}:`, pair[0] === 'attachments' ? `File (${pair[1].name})` : pair[1]);
                }
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formParams
                // Don't set Content-Type - browser sets it with boundary
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (CONFIG.DEBUG_MODE) {
                console.log('=== Submission Response ===');
                console.log('Response:', result);
            }

            if (!result.success) {
                throw new Error(result.error || result.message || 'Submission failed');
            }

            this.logFormInteraction({
                formId: 'contact_form',
                formType: 'contact',
                submissionId,
                status: 'success',
                timeToComplete: Date.now() - window.formStartTime,
                fileCount: formData.attachments ? formData.attachments.length : 0
            });

            this.trackConversion('contact_form_submission', 'lead', {
                service: formData.service,
                budget: formData.budget,
                fileCount: formData.attachments ? formData.attachments.length : 0
            });

            return result;

        } catch (error) {
            this.logFormInteraction({
                formId: 'contact_form',
                formType: 'contact',
                submissionId,
                status: 'failed',
                errorMessage: error.message,
                fileCount: formData.attachments ? formData.attachments.length : 0
            });

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
            const ipServices = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
                'https://api.ip.sb/ip'
            ];
            
            for (const serviceUrl of ipServices) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    
                    const response = await fetch(serviceUrl, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        if (serviceUrl.includes('ip.sb')) {
                            const text = await response.text();
                            return text.trim();
                        } else {
                            const data = await response.json();
                            return data.ip || 'unknown';
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return 'ip-unavailable';
        } catch (error) {
            console.warn('Could not fetch IP:', error);
            return 'ip-fetch-error';
        }
    }

    async testFileUpload() {
        console.log('=== TEST: File Upload Test ===');
        
        const testContent = 'This is a test file for contact form submission.';
        const testBlob = new Blob([testContent], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test_file.txt', { type: 'text/plain' });
        
        const testData = {
            name: 'File Upload Test',
            email: 'test@example.com',
            phone: '1234567890',
            company: 'Test Company',
            subject: 'Testing File Upload',
            message: 'This is a test message with file upload',
            service: 'data-analysis',
            budget: '5000-10000',
            timeline: '2-weeks',
            urgency: 'high',
            attachments: [testFile]
        };
        
        console.log('Test data:', testData);
        
        try {
            const result = await this.submitContact(testData);
            console.log('Test submission result:', result);
            Utils.showNotification('File upload test submitted successfully!', 'success');
            return result;
        } catch (error) {
            console.error('File upload test failed:', error);
            Utils.showNotification('File upload test failed: ' + error.message, 'error');
            throw error;
        }
    }

    async subscribeNewsletter(email, name = '') {
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append('action', 'subscribeNewsletter');
            url.searchParams.append('email', email);
            url.searchParams.append('name', name);

            const response = await fetch(url, { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.trackConversion('newsletter_subscription', 'engagement');
            }

            return result;
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            throw error;
        }
    }

    async trackPageView(data) {
        if (!CONFIG.ANALYTICS_ENABLED) return;
        
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append('action', 'trackPageView');
            url.searchParams.append('data', JSON.stringify(data));
            
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                await fetch(url);
            }
        } catch (error) {
            if (CONFIG.DEBUG_MODE) console.error('Analytics error:', error);
        }
    }

    async trackInteraction(data) {
        if (!CONFIG.ANALYTICS_ENABLED) return;
        
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append('action', 'trackInteraction');
            url.searchParams.append('data', JSON.stringify(data));
            await fetch(url);
        } catch (error) {
            // Silent fail
        }
    }

    async trackConversion(goalName, goalType = 'engagement', metadata = {}) {
        if (!CONFIG.ANALYTICS_ENABLED) return;
        
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.append('action', 'trackConversion');
            url.searchParams.append('data', JSON.stringify({
                goalName,
                goalType,
                metadata,
                timestamp: new Date().toISOString()
            }));
            await fetch(url);
        } catch (error) {
            // Silent fail
        }
    }

    logSystemEvent(level, component, functionName, message, metadata = {}) {
        if (!CONFIG.DEBUG_MODE && level === 'DEBUG') return;
        
        const logData = {
            level,
            component,
            functionName,
            message,
            metadata: JSON.stringify(metadata),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        if (CONFIG.DEBUG_MODE) {
            const logMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
            console[logMethod](`[${level}] ${component}.${functionName}: ${message}`, metadata);
        }
    }

    logApiRequest(data) {
        if (!CONFIG.DEBUG_MODE && !CONFIG.ANALYTICS_ENABLED) return;
        
        if (CONFIG.DEBUG_MODE) {
            window.apiLogs = window.apiLogs || [];
            window.apiLogs.push({
                ...data,
                timestamp: new Date().toISOString()
            });
            
            if (window.apiLogs.length > 100) {
                window.apiLogs.shift();
            }
        }
    }

    logFormInteraction(data) {
        if (!CONFIG.ANALYTICS_ENABLED) return;
        
        const url = new URL(this.baseUrl);
        url.searchParams.append('action', 'logFormInteraction');
        url.searchParams.append('data', JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        }));
        
        fetch(url).catch(() => {});
    }

    clearCache() {
        this.cache.clear();
        Utils.showNotification('Cache cleared', 'success', 2000);
    }

    async healthCheck() {
        try {
            const startTime = Date.now();
            const response = await fetch(this.baseUrl + '?action=health');
            const responseTime = Date.now() - startTime;
            
            return {
                online: true,
                responseTime,
                status: response.status
            };
        } catch (error) {
            return {
                online: false,
                error: error.message
            };
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
        
        this.api.logSystemEvent('INFO', 'ui', 'init', 'Portfolio UI initialized successfully');
    }
    
    static initNavigation() {
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
    
    // ============ FIXED: Contact Form Initialization ============
    static initContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) {
            console.warn('Contact form not found');
            return;
        }
        
        window.formStartTime = Date.now();
        
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.btn-submit');
            const spinner = submitBtn.querySelector('.spinner');
            const originalText = submitBtn.querySelector('span').textContent;
            
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Sending...';
            if (spinner) spinner.classList.remove('d-none');
            
            try {
                const fileInput = document.getElementById('attachment');
                const files = fileInput ? Array.from(fileInput.files) : [];
                
                // Validate files
                for (const file of files) {
                    if (!Utils.isValidFileType(file)) {
                        Utils.showNotification(
                            `File type not allowed: ${file.name}. Please upload PDF, Word, Excel, CSV, images, or text files.`, 
                            'error'
                        );
                        submitBtn.disabled = false;
                        submitBtn.querySelector('span').textContent = originalText;
                        if (spinner) spinner.classList.add('d-none');
                        return;
                    }
                    
                    if (!Utils.isValidFileSize(file)) {
                        Utils.showNotification(
                            `File too large: ${file.name}. Maximum size is ${Utils.formatFileSize(CONFIG.MAX_FILE_SIZE)}.`, 
                            'error'
                        );
                        submitBtn.disabled = false;
                        submitBtn.querySelector('span').textContent = originalText;
                        if (spinner) spinner.classList.add('d-none');
                        return;
                    }
                }
                
                if (CONFIG.DEBUG_MODE) {
                    console.log('=== FORM SUBMISSION STARTED ===');
                    console.log('Files to upload:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
                }
                
                const formData = {
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
                
                // Validate required fields
                const requiredFields = ['name', 'email', 'subject', 'message', 'service'];
                const missingFields = requiredFields.filter(field => !formData[field]);
                
                if (missingFields.length > 0) {
                    Utils.showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span').textContent = originalText;
                    if (spinner) spinner.classList.add('d-none');
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (formData.email && !emailRegex.test(formData.email)) {
                    Utils.showNotification('Please enter a valid email address', 'error');
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span').textContent = originalText;
                    if (spinner) spinner.classList.add('d-none');
                    return;
                }
                
                console.log('Submitting form with files...');
                const result = await PortfolioUI.api.submitContact(formData);
                
                if (result.success) {
                    Utils.showNotification(
                        `Message sent successfully! ${files.length > 0 ? `${files.length} file(s) uploaded.` : ''}`, 
                        'success'
                    );
                    
                    contactForm.reset();
                    
                    const filePreview = document.getElementById('filePreview');
                    if (filePreview) filePreview.innerHTML = '';
                    
                    if (fileInput) fileInput.value = '';
                    
                    console.log('=== FORM SUBMISSION SUCCESSFUL ===');
                    
                } else {
                    throw new Error(result.message || result.error || 'Submission failed');
                }
            } catch (error) {
                Utils.showNotification(`Error: ${error.message}. Please try again.`, 'error');
                
                console.error('=== FORM SUBMISSION FAILED ===');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = originalText;
                if (spinner) spinner.classList.add('d-none');
            }
        });
        
        // File upload handler
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('attachment');
        const filePreview = document.getElementById('filePreview');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    this.handleFileSelection(fileInput.files);
                }
            });
            
            fileInput.addEventListener('change', () => {
                this.handleFileSelection(fileInput.files);
            });
        }
    }
    
    static handleFileSelection(files) {
        const filePreview = document.getElementById('filePreview');
        if (!filePreview) return;
        
        filePreview.innerHTML = '';
        
        Array.from(files).forEach((file, index) => {
            if (!Utils.isValidFileType(file)) {
                Utils.showNotification(`File type not allowed: ${file.name}`, 'error');
                return;
            }
            
            if (!Utils.isValidFileSize(file)) {
                Utils.showNotification(
                    `File too large: ${file.name} (max ${Utils.formatFileSize(CONFIG.MAX_FILE_SIZE)})`, 
                    'error'
                );
                return;
            }
            
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
                <button type="button" class="file-remove" onclick="PortfolioUI.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            filePreview.appendChild(fileItem);
        });
    }
    
    static removeFile(index) {
        const fileInput = document.getElementById('attachment');
        if (!fileInput) return;
        
        const dt = new DataTransfer();
        const files = Array.from(fileInput.files);
        
        files.forEach((file, i) => {
            if (i !== index) dt.items.add(file);
        });
        
        fileInput.files = dt.files;
        this.handleFileSelection(fileInput.files);
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const api = new PortfolioAPI();
        PortfolioUI.init(api);
        
        window.PortfolioAPI = api;
        window.PortfolioUI = PortfolioUI;
        
        window.testFileUpload = () => {
            console.log('=== Testing File Upload ===');
            api.testFileUpload().catch(console.error);
        };
        
        window.clearCache = () => {
            api.clearCache();
        };
        
        window.getApiLogs = () => {
            return window.apiLogs || [];
        };
        
        api.logSystemEvent('INFO', 'app', 'init', 'Portfolio application initialized successfully', {
            version: CONFIG.VERSION,
            environment: CONFIG.ENVIRONMENT
        });
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        Utils.showNotification('Failed to initialize application. Please refresh the page.', 'error');
    }
});

// ============ GLOBAL ERROR HANDLING ============
window.addEventListener('error', function(event) {
    console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============ CSS STYLES ============
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2563eb;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    max-width: 350px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.notification.show {
    transform: translateX(0);
}

.notification-success { background: #10b981; }
.notification-error { background: #ef4444; }
.notification-warning { background: #f59e0b; }
.notification-info { background: #3b82f6; }

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
    opacity: 0.8;
    transition: opacity 0.2s;
}

.notification-close:hover {
    opacity: 1;
}

.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f3f4f6;
    border-radius: 6px;
    margin-bottom: 8px;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.file-icon {
    color: #6b7280;
}

.file-details {
    flex: 1;
}

.file-name {
    font-size: 14px;
    font-weight: 500;
}

.file-size {
    font-size: 12px;
    color: #6b7280;
}

.file-remove {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 4px;
}

.upload-area.dragover {
    border-color: #2563eb;
    background: #f0f7ff;
}
`;

document.head.appendChild(style);
