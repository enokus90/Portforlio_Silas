// ============ CONFIGURATION ============
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx1izjHfotaZ3TYurkJ5zUb-c2oTPZWZ9daHnt3kNTTvMSWhEBUeghfaRtVClnjqce1/exec',
    SITE_NAME: 'Silas Enoku Portfolio',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    ANALYTICS_ENABLED: true,
    DEBUG_MODE: true,
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
               file.name.match(/\.(pdf|doc|docx|xls|xlsx|csv|jpg|jpeg|png|gif|txt)$/i);
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
        window.addEventListener('online', () => this.retryFailedRequests());
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

            if (CONFIG.API_KEY) {
                url.searchParams.append('apiKey', CONFIG.API_KEY);
            }

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

    // Data retrieval methods
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

    async getExperience() {
        const data = await this.fetchData('getExperience');
        return (data.data || []).sort((a, b) => {
            const dateA = new Date(a.start_date || 0);
            const dateB = new Date(b.start_date || 0);
            return dateB - dateA;
        });
    }

    async getEducation() {
        const data = await this.fetchData('getEducation');
        return (data.data || []).sort((a, b) => {
            const dateA = new Date(a.start_date || 0);
            const dateB = new Date(b.start_date || 0);
            return dateB - dateA;
        });
    }

    async getCertifications() {
        const data = await this.fetchData('getCertifications');
        return (data.data || []).sort((a, b) => {
            const dateA = new Date(a.issue_date || 0);
            const dateB = new Date(b.issue_date || 0);
            return dateB - dateA;
        });
    }

    async getBlogPosts(limit = 3, featured = false) {
        const data = await this.fetchData('getBlogPosts');
        let posts = data.data || [];
        
        if (featured) {
            posts = posts.filter(post => post.featured === true || post.featured === 'TRUE');
        }
        
        posts = posts.sort((a, b) => {
            const dateA = new Date(a.publish_date || 0);
            const dateB = new Date(b.publish_date || 0);
            return dateB - dateA;
        });
        
        return posts.slice(0, limit);
    }

    async getServices() {
        const data = await this.fetchData('getServices');
        return (data.data || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    async getAllData() {
        try {
            const [
                projects,
                testimonials,
                skills,
                experience,
                education,
                certifications,
                blogPosts,
                services
            ] = await Promise.all([
                this.getProjects(),
                this.getTestimonials(),
                this.getSkills(),
                this.getExperience(),
                this.getEducation(),
                this.getCertifications(),
                this.getBlogPosts(6, true),
                this.getServices()
            ]);
            
            return {
                projects,
                testimonials,
                skills,
                experience,
                education,
                certifications,
                blogPosts,
                services
            };
        } catch (error) {
            console.error('Error loading all data:', error);
            throw error;
        }
    }

    // ============ UPDATED: Contact Form Submission with FILE UPLOAD ============
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
                    formParams.append('attachments', file);
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
            formParams.append('action', 'submitContact');

            if (CONFIG.DEBUG_MODE) {
                console.log('FormData entries:');
                for (let pair of formParams.entries()) {
                    console.log(`${pair[0]}:`, pair[0] === 'attachments' ? `File (${pair[1].name})` : pair[1]);
                }
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formParams
                // Don't set Content-Type header - browser will set it with boundary
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

    // Helper method to get current date/time in exact format for Google Sheets
    getCurrentDateTime() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Format: MM/DD/YYYY HH:MM:SS
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }

    // Async method to get client IP with multiple fallbacks
    async getClientIP() {
        try {
            // Multiple fallback IP services
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
                    // Try next service
                    continue;
                }
            }
            
            // If all services fail
            return 'ip-unavailable';
        } catch (error) {
            console.warn('Could not fetch IP:', error);
            return 'ip-fetch-error';
        }
    }

    // Debug method to test file upload
    async testFileUpload() {
        console.log('=== TEST: File Upload Test ===');
        
        // Create a test file blob
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
            timeline: '2 weeks',
            urgency: 'high',
            attachments: [testFile]
        };
        
        console.log('Test data:', testData);
        
        try {
            const result = await this.submitContact(testData);
            console.log('Test submission result:', result);
            Utils.showNotification('File upload test submitted!', 'success');
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

    // Analytics tracking methods
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
            // Silent fail for analytics
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
            // Silent fail for analytics
        }
    }

    // Logging methods
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
        
        fetch(url).catch(() => {
            // Silent fail for form logging
        });
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        Utils.showNotification('Cache cleared', 'success', 2000);
    }

    async retryFailedRequests() {
        // Implement retry logic for failed requests if needed
    }

    // Health check
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

// ============ UI COMPONENTS ============
class UIComponents {
    static createProjectCard(project) {
        const categories = project.category ? project.category.split(',').map(cat => cat.trim()) : [];
        const technologies = project.technologies ? project.technologies.split(',').map(tech => tech.trim()) : [];
        
        return `
            <div class="portfolio-item" data-category="${categories.join(' ')}">
                <div class="portfolio-card">
                    <div class="portfolio-image">
                        <img src="${project.featured_image || 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Project'}" 
                             alt="${project.title}">
                        <div class="portfolio-overlay">
                            <div class="overlay-content">
                                <h3>${project.title}</h3>
                                <p>${project.subtitle || ''}</p>
                            </div>
                        </div>
                    </div>
                    <div class="portfolio-content">
                        <div class="portfolio-category">
                            ${categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                        </div>
                        <h3 class="portfolio-title">${project.title}</h3>
                        <p class="portfolio-description">
                            ${(project.description || '').substring(0, 150)}...
                        </p>
                        <div class="portfolio-stats">
                            ${project.outcomes ? project.outcomes.split(',').map(outcome => `
                                <div class="stat">
                                    <i class="fas fa-chart-line"></i>
                                    <span>${outcome.trim()}</span>
                                </div>
                            `).join('') : ''}
                        </div>
                        <div class="portfolio-tech">
                            ${technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                        <button class="portfolio-btn" onclick="PortfolioUI.showProjectModal('${project.id}')">
                            <span>View Details</span>
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    static createTestimonialCard(testimonial, index) {
        return `
            <div class="testimonial-slide ${index === 0 ? 'active' : ''}">
                <div class="testimonial-card">
                    <div class="testimonial-rating">
                        ${'<i class="fas fa-star"></i>'.repeat(testimonial.rating || 5)}
                    </div>
                    <div class="testimonial-content">
                        <p>"${testimonial.testimonial}"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-image">
                            <img src="${testimonial.client_image || 'https://i.pravatar.cc/150?img=' + index}" 
                                 alt="${testimonial.client_name}">
                        </div>
                        <div class="author-info">
                            <h4>${testimonial.client_name}</h4>
                            <p>${testimonial.client_title}, ${testimonial.client_company}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static createSkillBar(skill) {
        const proficiency = skill.proficiency || 0;
        const level = skill.proficiency_label || 
                     proficiency >= 90 ? 'Expert' : 
                     proficiency >= 75 ? 'Advanced' : 
                     proficiency >= 60 ? 'Intermediate' : 'Beginner';
        
        return `
            <div class="skill-bar-item">
                <div class="skill-info">
                    <span class="skill-name">${skill.skill_name}</span>
                    <span class="skill-percent">${proficiency}%</span>
                </div>
                <div class="skill-progress">
                    <div class="progress-bar" data-width="${proficiency}">
                        <div class="progress-fill"></div>
                    </div>
                </div>
                <div class="skill-meta">
                    <span class="skill-level">${level}</span>
                    <span class="skill-exp">${skill.years_experience || 0}+ years</span>
                </div>
            </div>
        `;
    }

    static createServiceCard(service, index) {
        const features = service.features ? service.features.split(',').map(f => f.trim()) : [];
        
        return `
            <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="service-card">
                    <div class="service-icon">
                        <i class="${service.icon_class || 'fas fa-cogs'}"></i>
                    </div>
                    <h3 class="service-title">${service.name}</h3>
                    <p class="service-description">
                        ${service.description}
                    </p>
                    <ul class="service-features">
                        ${features.slice(0, 5).map(feature => `
                            <li><i class="fas fa-check"></i> ${feature}</li>
                        `).join('')}
                    </ul>
                    <div class="service-meta">
                        <span class="service-duration"><i class="fas fa-clock"></i> ${service.duration || 'Custom'}</span>
                        <span class="service-price">${service.starting_price ? `From $${service.starting_price}` : 'Custom Quote'}</span>
                    </div>
                    <button class="service-btn" onclick="PortfolioUI.showServiceModal('${service.id}')">
                        <span>Learn More</span>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    static createBlogCard(post) {
        const readTime = post.read_time || '5 min read';
        const category = post.category || 'General';
        const excerpt = post.excerpt || (post.content ? post.content.substring(0, 120) + '...' : '');
        
        return `
            <div class="col-lg-4 col-md-6" data-aos="fade-up">
                <div class="blog-card">
                    <div class="blog-image">
                        <img src="${post.featured_image || 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Blog'}" 
                             alt="${post.title}">
                        <div class="blog-category">${category}</div>
                        <div class="blog-read-time">${readTime}</div>
                    </div>
                    <div class="blog-content">
                        <div class="blog-date">
                            <i class="far fa-calendar"></i>
                            <span>${Utils.formatDate(post.publish_date)}</span>
                        </div>
                        <h3 class="blog-title">${post.title}</h3>
                        <p class="blog-excerpt">${excerpt}</p>
                        <a href="#" class="blog-link" onclick="PortfolioUI.showBlogModal('${post.id}')">
                            <span>Read Article</span>
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

// ============ PORTFOLIO UI MANAGER ============
class PortfolioUI {
    static api = null;
    
    static init(apiInstance) {
        this.api = apiInstance;
        
        this.initNavigation();
        this.initThemeToggle();
        this.initScrollSpy();
        this.initBackToTop();
        this.initLoadingScreen();
        this.initTypingEffect();
        this.initAnimatedCounters();
        this.initPortfolioFilter();
        this.initTestimonialSlider();
        this.initContactForm();
        this.initNewsletterForm();
        
        this.loadInitialData();
        this.trackPageView();
        
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
                    
                    const navbarCollapse = document.querySelector('.navbar-collapse.show');
                    if (navbarCollapse) {
                        const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                        bsCollapse.hide();
                    }
                    
                    PortfolioUI.trackNavigationClick(targetId);
                }
            });
        });
        
        window.addEventListener('scroll', Utils.throttle(() => {
            const navbar = document.getElementById('mainNav');
            if (window.scrollY > 100) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        }, 100));
    }
    
    static initThemeToggle() {
        const themeSwitch = document.getElementById('themeSwitch');
        if (!themeSwitch) return;
        
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-theme');
            themeSwitch.checked = true;
        }
        
        themeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
            
            PortfolioUI.api.trackInteraction({
                elementType: 'switch',
                elementId: 'themeSwitch',
                action: 'toggle',
                value: this.checked ? 'dark' : 'light'
            });
        });
    }
    
    static initScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        window.addEventListener('scroll', Utils.throttle(() => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.clientHeight;
                if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }, 100));
    }
    
    static initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;
        
        window.addEventListener('scroll', Utils.throttle(() => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }, 100));
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            PortfolioUI.api.trackInteraction({
                elementType: 'button',
                elementId: 'backToTop',
                action: 'click',
                value: 'Back to top'
            });
        });
    }
    
    static initLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        let progress = 0;
        const progressBar = loadingScreen.querySelector('.progress-fill');
        const progressPercent = loadingScreen.querySelector('.progress-percentage');
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) progress = 100;
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 500);
            }
        }, 100);
    }
    
    static initTypingEffect() {
        const typingText = document.getElementById('typingText');
        if (!typingText) return;
        
        const texts = [
            'Senior Data Analyst',
            'Business Intelligence Expert',
            'Data Visualization Specialist',
            'Predictive Analytics Consultant',
            'Business Strategy Advisor'
        ];
        
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;
        
        function type() {
            const currentText = texts[textIndex];
            
            if (isDeleting) {
                typingText.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                typingText.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }
            
            if (!isDeleting && charIndex === currentText.length) {
                isDeleting = true;
                typingSpeed = 1000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typingSpeed = 500;
            }
            
            setTimeout(type, typingSpeed);
        }
        
        setTimeout(type, 1000);
    }
    
    static initAnimatedCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count'));
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;
                    
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.textContent = Math.floor(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target;
                        }
                    };
                    
                    updateCounter();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    static initPortfolioFilter() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                
                portfolioItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category').includes(filterValue)) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
                
                PortfolioUI.api.trackInteraction({
                    elementType: 'button',
                    elementId: 'portfolioFilter',
                    action: 'click',
                    value: filterValue
                });
            });
        });
    }
    
    static initTestimonialSlider() {
        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.slider-dots .dot');
        const prevBtn = document.querySelector('.slider-prev');
        const nextBtn = document.querySelector('.slider-next');
        
        if (!slides.length) return;
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
        }
        
        function nextSlide() {
            showSlide((currentSlide + 1) % totalSlides);
        }
        
        function prevSlide() {
            showSlide((currentSlide - 1 + totalSlides) % totalSlides);
        }
        
        let slideInterval = setInterval(nextSlide, 5000);
        
        function resetInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetInterval();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                resetInterval();
            });
        }
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                resetInterval();
            });
        });
        
        const sliderContainer = document.querySelector('.testimonials-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => {
                clearInterval(slideInterval);
            });
            
            sliderContainer.addEventListener('mouseleave', () => {
                slideInterval = setInterval(nextSlide, 5000);
            });
        }
        
        showSlide(0);
    }
    
    // ============ UPDATED: Contact Form with File Upload ============
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
                // Validate files before proceeding
                const fileInput = document.getElementById('attachment');
                const files = fileInput ? Array.from(fileInput.files) : [];
                
                // Validate each file
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
                
                // Prepare form data object
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
                
                // Submit the form
                console.log('Submitting form with files...');
                const result = await PortfolioUI.api.submitContact(formData);
                
                if (result.success) {
                    Utils.showNotification(
                        `Message sent successfully! ${files.length > 0 ? `${files.length} file(s) uploaded.` : ''}`, 
                        'success'
                    );
                    
                    // Reset form
                    contactForm.reset();
                    
                    // Clear file preview
                    const filePreview = document.getElementById('filePreview');
                    if (filePreview) filePreview.innerHTML = '';
                    
                    // Clear file input
                    if (fileInput) fileInput.value = '';
                    
                    // Show success modal
                    const successModal = document.getElementById('successModal');
                    if (successModal) {
                        const modal = new bootstrap.Modal(successModal);
                        modal.show();
                    }
                    
                    console.log('=== FORM SUBMISSION SUCCESSFUL ===');
                    
                } else {
                    throw new Error(result.message || result.error || 'Submission failed');
                }
            } catch (error) {
                Utils.showNotification(`Error: ${error.message}. Please try again.`, 'error');
                
                console.error('=== FORM SUBMISSION FAILED ===');
                console.error('Error:', error);
                
                // Log the error for debugging
                if (window.PortfolioAPI) {
                    window.PortfolioAPI.logSystemEvent('ERROR', 'contact', 'submit', 
                        `Contact form submission failed: ${error.message}`);
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = originalText;
                if (spinner) spinner.classList.add('d-none');
            }
        });
        
        // Form validation
        const inputs = contactForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
        
        // Initialize file upload
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
            // Validate file
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
    
    static validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }
        
        return isValid;
    }
    
    static showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        field.classList.add('error');
        field.parentNode.appendChild(errorElement);
    }
    
    static clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    static initNewsletterForm() {
        const newsletterForm = document.querySelector('.newsletter-form');
        if (!newsletterForm) return;
        
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const button = newsletterForm.querySelector('button');
            const originalHTML = button.innerHTML;
            
            const email = emailInput.value.trim();
            
            if (!email) {
                Utils.showNotification('Please enter your email address', 'error');
                return;
            }
            
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                const result = await PortfolioUI.api.subscribeNewsletter(email);
                
                if (result.success) {
                    Utils.showNotification('Successfully subscribed to newsletter!', 'success');
                    emailInput.value = '';
                } else {
                    Utils.showNotification(result.message || 'Subscription failed', 'error');
                }
            } catch (error) {
                Utils.showNotification('Error subscribing to newsletter', 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = originalHTML;
            }
        });
    }
    
    static async loadInitialData() {
        try {
            this.showSectionLoading('portfolio', 'Loading projects...');
            this.showSectionLoading('testimonials', 'Loading testimonials...');
            this.showSectionLoading('skills', 'Loading skills...');
            
            const data = await PortfolioUI.api.getAllData();
            
            this.updatePortfolio(data.projects);
            this.updateTestimonials(data.testimonials);
            this.updateSkills(data.skills);
            this.updateExperience(data.experience);
            this.updateEducation(data.education);
            this.updateCertifications(data.certifications);
            this.updateBlogPosts(data.blogPosts);
            this.updateServices(data.services);
            
            this.hideAllLoading();
            
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 1000,
                    once: true,
                    offset: 100
                });
            }
            
            PortfolioUI.api.logSystemEvent('INFO', 'ui', 'loadInitialData', 'All data loaded successfully', {
                projectsCount: data.projects.length,
                testimonialsCount: data.testimonials.length,
                skillsCount: data.skills.length
            });
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            
            Utils.showNotification('Error loading data. Please refresh the page.', 'error');
            
            this.hideAllLoading();
            
            PortfolioUI.api.logSystemEvent('ERROR', 'ui', 'loadInitialData', `Failed to load initial data: ${error.message}`);
        }
    }
    
    static showSectionLoading(sectionId, message) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        let loadingElement = section.querySelector('.section-loading');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.className = 'section-loading';
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <p>${message}</p>
            `;
            section.appendChild(loadingElement);
        }
    }
    
    static hideAllLoading() {
        document.querySelectorAll('.section-loading').forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        });
    }
    
    static updatePortfolio(projects) {
        const portfolioGrid = document.getElementById('portfolioGrid');
        if (!portfolioGrid) return;
        
        portfolioGrid.innerHTML = '';
        
        projects.slice(0, 6).forEach((project, index) => {
            portfolioGrid.innerHTML += UIComponents.createProjectCard(project);
        });
        
        this.initPortfolioFilter();
    }
    
    static updateTestimonials(testimonials) {
        const sliderContainer = document.querySelector('.slider-container');
        if (!sliderContainer) return;
        
        sliderContainer.innerHTML = '';
        
        testimonials.slice(0, 5).forEach((testimonial, index) => {
            sliderContainer.innerHTML += UIComponents.createTestimonialCard(testimonial, index);
        });
        
        this.initTestimonialSlider();
    }
    
    static updateSkills(skills) {
        const skillBars = document.querySelector('.skill-bars');
        if (!skillBars) return;
        
        skillBars.innerHTML = '';
        
        skills.slice(0, 6).forEach(skill => {
            skillBars.innerHTML += UIComponents.createSkillBar(skill);
        });
        
        setTimeout(() => {
            document.querySelectorAll('.progress-bar').forEach(bar => {
                const width = bar.getAttribute('data-width');
                if (width) {
                    bar.style.width = `${width}%`;
                }
            });
        }, 500);
    }
    
    static updateExperience(experience) {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;
        
        timeline.innerHTML = '';
        
        experience.forEach(exp => {
            const startYear = new Date(exp.start_date).getFullYear();
            const endYear = exp.current ? 'Present' : new Date(exp.end_date).getFullYear();
            
            timeline.innerHTML += `
                <div class="timeline-item" data-aos="fade-up">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <h3 class="timeline-title">${exp.job_title}</h3>
                            <span class="timeline-period">${startYear} - ${endYear}</span>
                        </div>
                        <div class="timeline-company">${exp.company}</div>
                        <p class="timeline-description">${exp.description}</p>
                    </div>
                </div>
            `;
        });
    }
    
    static updateEducation(education) {
        const educationTimeline = document.querySelector('.education-timeline');
        if (!educationTimeline) return;
        
        educationTimeline.innerHTML = '';
        
        education.forEach(edu => {
            const startYear = new Date(edu.start_date).getFullYear();
            const endYear = new Date(edu.end_date).getFullYear();
            
            educationTimeline.innerHTML += `
                <div class="education-item">
                    <div class="education-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="education-content">
                        <h4>${edu.degree}</h4>
                        <div class="education-meta">
                            <span class="institution">${edu.institution}</span>
                            <span class="period">${startYear} - ${endYear}</span>
                        </div>
                        <p class="education-desc">${edu.description}</p>
                    </div>
                </div>
            `;
        });
    }
    
    static updateCertifications(certifications) {
        const certsGrid = document.querySelector('.certifications-grid');
        if (!certsGrid) return;
        
        certsGrid.innerHTML = '';
        
        certifications.forEach(cert => {
            const issueYear = new Date(cert.issue_date).getFullYear();
            
            certsGrid.innerHTML += `
                <div class="cert-card">
                    <div class="cert-icon">
                        <i class="fas fa-award"></i>
                    </div>
                    <div class="cert-content">
                        <h4>${cert.name}</h4>
                        <p>${cert.issuer}</p>
                        <span class="cert-date">${issueYear}</span>
                    </div>
                </div>
            `;
        });
    }
    
    static updateBlogPosts(posts) {
        const blogGrid = document.querySelector('.blog-grid .row');
        if (!blogGrid) return;
        
        blogGrid.innerHTML = '';
        
        posts.forEach(post => {
            blogGrid.innerHTML += UIComponents.createBlogCard(post);
        });
    }
    
    static updateServices(services) {
        const servicesGrid = document.querySelector('.services-grid .row');
        if (!servicesGrid) return;
        
        servicesGrid.innerHTML = '';
        
        services.forEach((service, index) => {
            servicesGrid.innerHTML += UIComponents.createServiceCard(service, index);
        });
    }
    
    static async showProjectModal(projectId) {
        try {
            const projects = await PortfolioUI.api.getProjects();
            const project = projects.find(p => p.id === projectId);
            
            if (!project) {
                Utils.showNotification('Project not found', 'error');
                return;
            }
            
            const modalContent = `
                <div class="project-modal-content">
                    <div class="project-hero">
                        <img src="${project.featured_image || 'https://via.placeholder.com/1200x600'}" 
                             alt="${project.title}">
                    </div>
                    <div class="project-details">
                        <h2>${project.title}</h2>
                        <p class="project-subtitle">${project.subtitle || ''}</p>
                        
                        <div class="project-meta">
                            ${project.client ? `<div class="meta-item"><i class="fas fa-building"></i> ${project.client}</div>` : ''}
                            ${project.duration ? `<div class="meta-item"><i class="fas fa-clock"></i> ${project.duration}</div>` : ''}
                            ${project.budget_range ? `<div class="meta-item"><i class="fas fa-dollar-sign"></i> ${project.budget_range}</div>` : ''}
                        </div>
                        
                        <div class="project-description">
                            <h3>Overview</h3>
                            <p>${project.description || ''}</p>
                        </div>
                        
                        ${project.challenges ? `
                        <div class="project-challenges">
                            <h3>Challenges</h3>
                            <p>${project.challenges}</p>
                        </div>
                        ` : ''}
                        
                        ${project.solutions ? `
                        <div class="project-solutions">
                            <h3>Solutions</h3>
                            <p>${project.solutions}</p>
                        </div>
                        ` : ''}
                        
                        ${project.technologies ? `
                        <div class="project-technologies">
                            <h3>Technologies Used</h3>
                            <div class="tech-tags">
                                ${project.technologies.split(',').map(tech => `
                                    <span class="tech-tag">${tech.trim()}</span>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${project.outcomes ? `
                        <div class="project-outcomes">
                            <h3>Results & Outcomes</h3>
                            <ul>
                                ${project.outcomes.split(',').map(outcome => `
                                    <li><i class="fas fa-check-circle"></i> ${outcome.trim()}</li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.getElementById('projectModalTitle').textContent = project.title;
            document.getElementById('projectModalBody').innerHTML = modalContent;
            
            const modal = new bootstrap.Modal(document.getElementById('projectModal'));
            modal.show();
            
            PortfolioUI.api.trackInteraction({
                elementType: 'modal',
                elementId: 'projectModal',
                action: 'open',
                value: project.title
            });
            
        } catch (error) {
            console.error('Error showing project modal:', error);
            Utils.showNotification('Error loading project details', 'error');
        }
    }
    
    static async showServiceModal(serviceId) {
        try {
            const services = await PortfolioUI.api.getServices();
            const service = services.find(s => s.id === serviceId);
            
            if (!service) {
                Utils.showNotification('Service not found', 'error');
                return;
            }
            
            const features = service.features ? service.features.split(',').map(f => f.trim()) : [];
            
            const modalContent = `
                <div class="service-modal-content">
                    <div class="service-header">
                        <div class="service-icon-large">
                            <i class="${service.icon_class || 'fas fa-cogs'}"></i>
                        </div>
                        <h2>${service.name}</h2>
                    </div>
                    
                    <div class="service-description-detailed">
                        <p>${service.description}</p>
                    </div>
                    
                    <div class="service-features-detailed">
                        <h3>What's Included</h3>
                        <ul>
                            ${features.map(feature => `
                                <li><i class="fas fa-check"></i> ${feature}</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="service-pricing">
                        <h3>Pricing & Timeline</h3>
                        <div class="pricing-details">
                            <div class="pricing-item">
                                <i class="fas fa-clock"></i>
                                <div>
                                    <strong>Duration</strong>
                                    <p>${service.duration || 'Custom timeline based on project scope'}</p>
                                </div>
                            </div>
                            <div class="pricing-item">
                                <i class="fas fa-dollar-sign"></i>
                                <div>
                                    <strong>Investment</strong>
                                    <p>${service.starting_price ? `Starting from $${service.starting_price}` : 'Custom quote based on requirements'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="service-cta">
                        <p>Ready to get started with ${service.name}?</p>
                        <button class="btn btn-primary" onclick="PortfolioUI.scrollToContact('${service.name}')">
                            <i class="fas fa-paper-plane"></i>
                            Request a Quote
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('serviceModalTitle').textContent = service.name;
            document.getElementById('serviceModalBody').innerHTML = modalContent;
            
            const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
            modal.show();
            
            PortfolioUI.api.trackInteraction({
                elementType: 'modal',
                elementId: 'serviceModal',
                action: 'open',
                value: service.name
            });
            
        } catch (error) {
            console.error('Error showing service modal:', error);
            Utils.showNotification('Error loading service details', 'error');
        }
    }
    
    static scrollToContact(service = '') {
        const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
        if (modal) modal.hide();
        
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            window.scrollTo({
                top: contactSection.offsetTop - 80,
                behavior: 'smooth'
            });
            
            if (service) {
                const serviceSelect = document.getElementById('service');
                if (serviceSelect) {
                    const option = Array.from(serviceSelect.options).find(opt => 
                        opt.text.toLowerCase().includes(service.toLowerCase())
                    );
                    if (option) {
                        serviceSelect.value = option.value;
                    }
                }
            }
        }
    }
    
    static trackPageView() {
        if (!PortfolioUI.api || !CONFIG.ANALYTICS_ENABLED) return;
        
        const pageData = {
            pageUrl: window.location.href,
            pageTitle: document.title,
            pagePath: window.location.pathname + window.location.hash,
            referrer: document.referrer || '',
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            userAgent: navigator.userAgent,
            loadTime: window.performance.timing ? 
                window.performance.timing.loadEventEnd - window.performance.timing.navigationStart : 0
        };
        
        PortfolioUI.api.trackPageView(pageData);
    }
    
    static trackNavigationClick(targetId) {
        if (!PortfolioUI.api) return;
        
        PortfolioUI.api.trackInteraction({
            elementType: 'nav-link',
            elementId: 'navigation',
            action: 'click',
            value: targetId
        });
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const api = new PortfolioAPI();
        PortfolioUI.init(api);
        
        // Expose objects globally for debugging
        window.PortfolioAPI = api;
        window.PortfolioUI = PortfolioUI;
        
        // Add debug/test functions
        window.testContactForm = () => {
            console.log('=== Testing Contact Form ===');
            api.testContactSubmission().catch(console.error);
        };
        
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
            environment: CONFIG.ENVIRONMENT,
            analyticsEnabled: CONFIG.ANALYTICS_ENABLED,
            debugMode: CONFIG.DEBUG_MODE
        });
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        Utils.showNotification('Failed to initialize application. Please refresh the page.', 'error');
    }
});

// ============ GLOBAL ERROR HANDLING ============
window.addEventListener('error', function(event) {
    const errorDetails = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.toString() : 'Unknown error'
    };
    
    console.error('Global error:', errorDetails);
    
    if (window.PortfolioAPI) {
        window.PortfolioAPI.logSystemEvent('ERROR', 'global', 'error', 'Uncaught error occurred', errorDetails);
    }
});

window.addEventListener('unhandledrejection', function(event) {
    const errorDetails = {
        reason: event.reason ? event.reason.toString() : 'Unknown rejection',
        promise: event.promise
    };
    
    console.error('Unhandled promise rejection:', errorDetails);
    
    if (window.PortfolioAPI) {
        window.PortfolioAPI.logSystemEvent('ERROR', 'global', 'unhandledrejection', 'Unhandled promise rejection', errorDetails);
    }
});

// ============ CSS STYLES FOR NOTIFICATIONS ============
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

.notification-success {
    background: #10b981;
}

.notification-error {
    background: #ef4444;
}

.notification-warning {
    background: #f59e0b;
}

.notification-info {
    background: #3b82f6;
}

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

.field-error {
    color: #ef4444;
    font-size: 12px;
    margin-top: 5px;
}

input.error,
textarea.error,
select.error {
    border-color: #ef4444 !important;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.dark-theme .file-item {
    background: #374151;
}

.dark-theme .upload-area.dragover {
    background: #1f2937;
}

.file-validation-error {
    color: #ef4444;
    font-size: 12px;
    margin-top: 5px;
}
`;

document.head.appendChild(style);
