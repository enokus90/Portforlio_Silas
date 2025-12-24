// ============ EXTENDED CONFIGURATION ============
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx1izjHfotaZ3TYurkJ5zUb-c2oTPZWZ9daHnt3kNTTvMSWhEBUeghfaRtVClnjqce1/exec',
    SITE_NAME: 'Silas Enoku Portfolio',
    VERSION: '2.1.0',
    ENVIRONMENT: 'production',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    ANALYTICS_ENABLED: true,
    DEBUG_MODE: false,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_TOTAL_FILE_SIZE: 20 * 1024 * 1024, // 20MB total
    MAX_FILES_COUNT: 5,
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
        'image/svg+xml',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ],
    API_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    LAZY_LOAD_THRESHOLD: 0.1,
    ANIMATION_DURATION: 1000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    PERFORMANCE_MONITORING: true,
    SEO_OPTIMIZED: true,
    PWA_ENABLED: true,
    OFFLINE_SUPPORT: true,
    THEMES: ['light', 'dark', 'auto'],
    DEFAULT_THEME: 'auto',
    LANGUAGE: 'en',
    AVAILABLE_LANGUAGES: ['en', 'es', 'fr'],
    DATE_FORMAT: 'en-US',
    CURRENCY: 'USD',
    TIMEZONE: 'UTC',
    MAPS_API_KEY: '',
    RECAPTCHA_SITE_KEY: '',
    SOCIAL_LINKS: {
        linkedin: 'https://linkedin.com/in/silasenoku',
        github: 'https://github.com/silasenoku',
        twitter: 'https://twitter.com/silasenoku',
        email: 'silas@example.com'
    },
    CONTACT_INFO: {
        phone: '+1 (555) 123-4567',
        address: 'San Francisco, CA',
        workingHours: 'Mon-Fri, 9AM-6PM PST'
    },
    SEO_META: {
        title: 'Silas Enoku | Senior Data Analyst & Business Intelligence Expert',
        description: 'Data-driven solutions for business growth. Specializing in data analysis, business intelligence, and predictive analytics.',
        keywords: 'data analyst, business intelligence, data visualization, predictive analytics, data science',
        author: 'Silas Enoku',
        robots: 'index, follow',
        ogImage: 'https://via.placeholder.com/1200x630/2563eb/ffffff?text=Silas+Enoku',
        ogType: 'website',
        twitterCard: 'summary_large_image'
    },
    PERFORMANCE_TARGETS: {
        FCP: 1000, // First Contentful Paint
        LCP: 2500, // Largest Contentful Paint
        FID: 100, // First Input Delay
        CLS: 0.1 // Cumulative Layout Shift
    }
};

// ============ PERFORMANCE MONITOR ============
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.startTime = performance.now();
        this.performanceEntries = [];
        
        if ('PerformanceObserver' in window) {
            this.initPerformanceObservers();
        }
    }
    
    initPerformanceObservers() {
        // Observe Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.set('LCP', lastEntry.startTime);
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}
        
        // Observe First Input Delay
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.set('FID', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) {}
        
        // Observe Cumulative Layout Shift
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.set('CLS', clsValue);
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}
    }
    
    mark(name) {
        performance.mark(name);
        return performance.now();
    }
    
    measure(name, startMark, endMark) {
        performance.measure(name, startMark, endMark);
        const measures = performance.getEntriesByName(name);
        return measures.length > 0 ? measures[0].duration : 0;
    }
    
    getMetrics() {
        return {
            loadTime: performance.now() - this.startTime,
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize
            } : null,
            timing: performance.timing ? {
                domLoading: performance.timing.domLoading - performance.timing.navigationStart,
                domInteractive: performance.timing.domInteractive - performance.timing.navigationStart,
                domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                complete: performance.timing.loadEventEnd - performance.timing.navigationStart
            } : null,
            metrics: Object.fromEntries(this.metrics)
        };
    }
    
    logPerformance() {
        if (CONFIG.PERFORMANCE_MONITORING && CONFIG.DEBUG_MODE) {
            const metrics = this.getMetrics();
            console.group('Performance Metrics');
            console.table(metrics.metrics);
            console.groupEnd();
        }
    }
}

// ============ STATE MANAGEMENT ============
class AppState {
    constructor() {
        this.state = {
            theme: localStorage.getItem('theme') || CONFIG.DEFAULT_THEME,
            language: localStorage.getItem('language') || CONFIG.LANGUAGE,
            userPreferences: JSON.parse(localStorage.getItem('userPreferences') || '{}'),
            session: {
                startTime: Date.now(),
                pageViews: 0,
                interactions: 0
            },
            navigation: {
                currentPage: window.location.pathname,
                previousPage: document.referrer,
                scrollPosition: 0
            },
            ui: {
                sidebarOpen: false,
                modalOpen: false,
                loading: false,
                notifications: []
            },
            data: {
                loaded: false,
                lastUpdated: null,
                cacheSize: 0
            },
            form: {
                lastSubmission: null,
                submissionsCount: 0
            }
        };
        
        this.subscribers = new Map();
        this.stateId = 0;
    }
    
    get(key, defaultValue = null) {
        return this.state[key] !== undefined ? this.state[key] : defaultValue;
    }
    
    set(key, value, notify = true) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        if (notify && JSON.stringify(oldValue) !== JSON.stringify(value)) {
            this.notify(key, value, oldValue);
        }
        
        // Persist certain states to localStorage
        if (['theme', 'language', 'userPreferences'].includes(key)) {
            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
        
        return this.stateId++;
    }
    
    update(key, updater, notify = true) {
        const oldValue = this.state[key];
        const newValue = typeof updater === 'function' ? updater(oldValue) : { ...oldValue, ...updater };
        return this.set(key, newValue, notify);
    }
    
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const subscribers = this.subscribers.get(key);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }
    
    notify(key, newValue, oldValue) {
        const subscribers = this.subscribers.get(key);
        if (subscribers) {
            subscribers.forEach(callback => callback(newValue, oldValue, key));
        }
    }
    
    reset() {
        const oldState = { ...this.state };
        this.state = {
            theme: CONFIG.DEFAULT_THEME,
            language: CONFIG.LANGUAGE,
            userPreferences: {},
            session: {
                startTime: Date.now(),
                pageViews: 0,
                interactions: 0
            },
            navigation: {
                currentPage: window.location.pathname,
                previousPage: document.referrer,
                scrollPosition: 0
            },
            ui: {
                sidebarOpen: false,
                modalOpen: false,
                loading: false,
                notifications: []
            },
            data: {
                loaded: false,
                lastUpdated: null,
                cacheSize: 0
            },
            form: {
                lastSubmission: null,
                submissionsCount: 0
            }
        };
        
        // Notify all subscribers
        Object.keys(oldState).forEach(key => {
            this.notify(key, this.state[key], oldState[key]);
        });
        
        return this.stateId++;
    }
    
    export() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    import(state) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...state };
        
        Object.keys(state).forEach(key => {
            this.notify(key, this.state[key], oldState[key]);
        });
        
        return this.stateId++;
    }
}

// ============ INTERNATIONALIZATION ============
class I18n {
    constructor() {
        this.translations = {
            en: {
                // Navigation
                'nav.home': 'Home',
                'nav.about': 'About',
                'nav.portfolio': 'Portfolio',
                'nav.services': 'Services',
                'nav.testimonials': 'Testimonials',
                'nav.blog': 'Blog',
                'nav.contact': 'Contact',
                
                // Hero Section
                'hero.title': 'Silas Enoku',
                'hero.subtitle': 'Senior Data Analyst & Business Intelligence Expert',
                'hero.description': 'Transforming raw data into actionable insights for business growth and strategic decision-making.',
                'hero.cta.primary': 'View My Work',
                'hero.cta.secondary': 'Contact Me',
                
                // Contact Form
                'contact.title': 'Get In Touch',
                'contact.subtitle': 'Ready to transform your data into insights? Let\'s talk.',
                'form.name': 'Full Name',
                'form.email': 'Email Address',
                'form.phone': 'Phone Number',
                'form.company': 'Company',
                'form.subject': 'Subject',
                'form.message': 'Message',
                'form.service': 'Service Interested In',
                'form.budget': 'Budget Range',
                'form.timeline': 'Project Timeline',
                'form.urgency': 'Urgency Level',
                'form.attachments': 'Attach Files',
                'form.upload.hint': 'Drag & drop files here or click to browse',
                'form.upload.limit': 'Max 10MB per file, up to 5 files total',
                'form.submit': 'Send Message',
                'form.success': 'Message sent successfully!',
                'form.error': 'Please fix the errors and try again.',
                
                // Services
                'services.title': 'My Services',
                'services.subtitle': 'Comprehensive data solutions for your business needs',
                
                // Portfolio
                'portfolio.title': 'Featured Projects',
                'portfolio.subtitle': 'A showcase of my recent work and solutions',
                'filter.all': 'All Projects',
                'filter.data': 'Data Analysis',
                'filter.bi': 'Business Intelligence',
                'filter.visualization': 'Data Visualization',
                'filter.predictive': 'Predictive Analytics',
                
                // Testimonials
                'testimonials.title': 'Client Testimonials',
                'testimonials.subtitle': 'What clients say about working with me',
                
                // Skills
                'skills.title': 'Technical Skills',
                'skills.subtitle': 'Expertise across the data analytics spectrum',
                
                // Common
                'common.loading': 'Loading...',
                'common.error': 'An error occurred',
                'common.success': 'Success',
                'common.learnMore': 'Learn More',
                'common.viewDetails': 'View Details',
                'common.readMore': 'Read More',
                'common.close': 'Close',
                'common.back': 'Back',
                'common.next': 'Next',
                'common.previous': 'Previous',
                'common.download': 'Download',
                'common.share': 'Share',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
                'common.confirm': 'Confirm',
                'common.delete': 'Delete',
                'common.edit': 'Edit',
                'common.view': 'View',
                'common.search': 'Search',
                'common.filter': 'Filter',
                'common.sort': 'Sort',
                'common.refresh': 'Refresh',
                'common.clear': 'Clear'
            },
            es: {
                'nav.home': 'Inicio',
                'form.name': 'Nombre Completo',
                'form.submit': 'Enviar Mensaje'
            },
            fr: {
                'nav.home': 'Accueil',
                'form.name': 'Nom Complet',
                'form.submit': 'Envoyer le Message'
            }
        };
        
        this.currentLang = CONFIG.LANGUAGE;
        this.fallbackLang = 'en';
    }
    
    t(key, params = {}) {
        let translation = this.translations[this.currentLang]?.[key] || 
                         this.translations[this.fallbackLang]?.[key] || 
                         key;
        
        // Replace parameters
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
        });
        
        return translation;
    }
    
    setLanguage(lang) {
        if (CONFIG.AVAILABLE_LANGUAGES.includes(lang)) {
            this.currentLang = lang;
            document.documentElement.lang = lang;
            this.dispatchLanguageChange();
            return true;
        }
        return false;
    }
    
    dispatchLanguageChange() {
        window.dispatchEvent(new CustomEvent('languageChange', {
            detail: { language: this.currentLang }
        }));
    }
    
    getLanguage() {
        return this.currentLang;
    }
    
    formatNumber(num) {
        return new Intl.NumberFormat(this.currentLang).format(num);
    }
    
    formatDate(date) {
        return new Date(date).toLocaleDateString(this.currentLang, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatCurrency(amount, currency = CONFIG.CURRENCY) {
        return new Intl.NumberFormat(this.currentLang, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
}

// ============ ADVANCED UTILITY FUNCTIONS ============
class AdvancedUtils {
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    static mergeDeep(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.mergeDeep(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }
    
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
    
    static debounceAdvanced(func, wait, options = {}) {
        let timeout;
        let lastArgs;
        let lastThis;
        let result;
        let lastCallTime;
        let lastInvokeTime = 0;
        
        const leading = !!options.leading;
        const trailing = 'trailing' in options ? !!options.trailing : true;
        const maxWait = options.maxWait;
        const maxing = !!maxWait;
        
        function invokeFunc(time) {
            const args = lastArgs;
            const thisArg = lastThis;
            
            lastArgs = lastThis = undefined;
            lastInvokeTime = time;
            result = func.apply(thisArg, args);
            return result;
        }
        
        function startTimer(pendingFunc, wait) {
            clearTimeout(timeout);
            timeout = setTimeout(pendingFunc, wait);
        }
        
        function trailingEdge(time) {
            timeout = undefined;
            
            if (trailing && lastArgs) {
                return invokeFunc(time);
            }
            lastArgs = lastThis = undefined;
            return result;
        }
        
        function remainingWait(time) {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;
            const timeWaiting = wait - timeSinceLastCall;
            
            return maxing
                ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
                : timeWaiting;
        }
        
        function timerExpired() {
            const time = Date.now();
            if (shouldInvoke(time)) {
                return trailingEdge(time);
            }
            startTimer(timerExpired, remainingWait(time));
        }
        
        function shouldInvoke(time) {
            const timeSinceLastCall = time - lastCallTime;
            const timeSinceLastInvoke = time - lastInvokeTime;
            
            return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
                    (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
        }
        
        function debounced(...args) {
            const time = Date.now();
            const isInvoking = shouldInvoke(time);
            
            lastArgs = args;
            lastThis = this;
            lastCallTime = time;
            
            if (isInvoking) {
                if (timeout === undefined) {
                    return leading ? invokeFunc(lastCallTime) : result;
                }
                if (maxing) {
                    clearTimeout(timeout);
                    timeout = setTimeout(timerExpired, wait);
                    return invokeFunc(lastCallTime);
                }
            }
            if (timeout === undefined) {
                startTimer(timerExpired, wait);
            }
            return result;
        }
        
        debounced.cancel = function() {
            clearTimeout(timeout);
            lastInvokeTime = 0;
            lastArgs = lastCallTime = lastThis = timeout = undefined;
        };
        
        debounced.flush = function() {
            return timeout === undefined ? result : trailingEdge(Date.now());
        };
        
        debounced.pending = function() {
            return timeout !== undefined;
        };
        
        return debounced;
    }
    
    static memoize(func, resolver) {
        if (typeof func !== 'function' || (resolver != null && typeof resolver !== 'function')) {
            throw new TypeError('Expected a function');
        }
        
        const memoized = function(...args) {
            const key = resolver ? resolver.apply(this, args) : args[0];
            const cache = memoized.cache;
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const result = func.apply(this, args);
            memoized.cache = cache.set(key, result) || cache;
            return result;
        };
        
        memoized.cache = new Map();
        return memoized;
    }
    
    static createQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                searchParams.append(key, params[key]);
            }
        });
        return searchParams.toString();
    }
    
    static parseQueryString(queryString) {
        const params = {};
        new URLSearchParams(queryString).forEach((value, key) => {
            params[key] = value;
        });
        return params;
    }
    
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'unknown';
        let version = '';
        let os = 'unknown';
        
        // Detect browser
        if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Chrome')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Edge')) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+)/)?.[1] || '';
        } else if (ua.includes('MSIE') || ua.includes('Trident/')) {
            browser = 'IE';
            version = ua.match(/(MSIE |rv:)(\d+)/)?.[2] || '';
        }
        
        // Detect OS
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
        
        return { browser, version, os, userAgent: ua };
    }
    
    static getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }
    
    static getScreenInfo() {
        return {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation?.type || 'landscape-primary',
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        };
    }
    
    static async getLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                }),
                error => reject(error),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }
    
    static async getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            online: navigator.onLine,
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 0,
            rtt: connection?.rtt || 0,
            saveData: connection?.saveData || false,
            type: connection?.type || 'unknown'
        };
    }
    
    static createDataURL(data, type = 'image/png') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(new Blob([data], { type }));
        });
    }
    
    static downloadFile(data, filename, type = 'application/octet-stream') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    static copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.top = '0';
                textArea.style.left = '0';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    successful ? resolve() : reject(new Error('Copy failed'));
                } catch (err) {
                    document.body.removeChild(textArea);
                    reject(err);
                }
            }
        });
    }
    
    static shareContent(data) {
        if (navigator.share) {
            return navigator.share(data);
        } else {
            // Fallback for browsers without Web Share API
            const text = `${data.title || ''}\n${data.text || ''}\n${data.url || ''}`;
            return this.copyToClipboard(text)
                .then(() => Utils.showNotification('Link copied to clipboard', 'success'));
        }
    }
    
    static validateForm(formData, rules) {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];
            
            if (fieldRules.required && (!value || value.trim() === '')) {
                errors[field] = fieldRules.requiredMessage || `${field} is required`;
                return;
            }
            
            if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.patternMessage || `${field} is invalid`;
                return;
            }
            
            if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = fieldRules.minLengthMessage || `${field} must be at least ${fieldRules.minLength} characters`;
                return;
            }
            
            if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = fieldRules.maxLengthMessage || `${field} must be at most ${fieldRules.maxLength} characters`;
                return;
            }
            
            if (value && fieldRules.custom) {
                const customError = fieldRules.custom(value, formData);
                if (customError) {
                    errors[field] = customError;
                }
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    static createPagination(totalItems, currentPage = 1, pageSize = 10) {
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        
        let pages = [];
        if (totalPages <= 7) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            if (currentPage <= 4) {
                pages = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (currentPage >= totalPages - 3) {
                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }
        
        return {
            currentPage,
            totalPages,
            pageSize,
            totalItems,
            startIndex,
            endIndex,
            hasPrevious: currentPage > 1,
            hasNext: currentPage < totalPages,
            pages
        };
    }
    
    static sortArray(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aValue = key ? a[key] : a;
            const bValue = key ? b[key] : b;
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return order === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            return order === 'asc' 
                ? (aValue > bValue ? 1 : -1)
                : (aValue < bValue ? 1 : -1);
        });
    }
    
    static filterArray(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (filterValue === undefined || filterValue === null) return true;
                if (itemValue === undefined || itemValue === null) return false;
                
                if (typeof filterValue === 'string') {
                    return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                }
                
                if (typeof filterValue === 'number') {
                    return itemValue === filterValue;
                }
                
                if (Array.isArray(filterValue)) {
                    return filterValue.includes(itemValue);
                }
                
                if (typeof filterValue === 'function') {
                    return filterValue(itemValue);
                }
                
                return itemValue === filterValue;
            });
        });
    }
    
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const groupKey = item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }
    
    static chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static flattenArray(array) {
        return array.reduce((flat, item) => {
            return flat.concat(Array.isArray(item) ? this.flattenArray(item) : item);
        }, []);
    }
    
    static uniqueArray(array, key) {
        if (!key) {
            return [...new Set(array)];
        }
        
        const seen = new Set();
        return array.filter(item => {
            const keyValue = item[key];
            if (seen.has(keyValue)) {
                return false;
            }
            seen.add(keyValue);
            return true;
        });
    }
    
    static calculateStatistics(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }
        
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        const sorted = [...data].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            count: data.length,
            sum,
            mean,
            median,
            min: Math.min(...data),
            max: Math.max(...data),
            range: Math.max(...data) - Math.min(...data),
            variance,
            stdDev,
            q1: sorted[Math.floor(sorted.length * 0.25)],
            q3: sorted[Math.floor(sorted.length * 0.75)]
        };
    }
}

// ============ ENHANCED ERROR HANDLER ============
class EnhancedErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.listeners = new Map();
    }
    
    handle(error, context = '', metadata = {}) {
        const errorId = AdvancedUtils.generateUUID();
        const timestamp = new Date().toISOString();
        
        const errorData = {
            id: errorId,
            timestamp,
            context,
            name: error.name,
            message: error.message,
            stack: error.stack,
            metadata: { ...metadata },
            url: window.location.href,
            userAgent: navigator.userAgent,
            browserInfo: AdvancedUtils.getBrowserInfo(),
            deviceType: AdvancedUtils.getDeviceType(),
            networkInfo: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        // Store error
        this.errors.push(errorData);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Log to console
        if (CONFIG.DEBUG_MODE) {
            console.groupCollapsed(`[${errorId}] ${context}: ${error.message}`);
            console.error('Error details:', errorData);
            console.groupEnd();
        }
        
        // Store in localStorage for debugging
        if (CONFIG.DEBUG_MODE) {
            try {
                const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
                storedErrors.push(errorData);
                if (storedErrors.length > 50) storedErrors.shift();
                localStorage.setItem('app_errors', JSON.stringify(storedErrors));
            } catch (e) {}
        }
        
        // Notify listeners
        this.notifyListeners('error', errorData);
        
        // Show user notification for certain errors
        this.showUserNotification(error, context);
        
        // Send to analytics if enabled
        if (CONFIG.ANALYTICS_ENABLED) {
            this.sendToAnalytics(errorData);
        }
        
        return errorData;
    }
    
    addListener(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);
        
        return () => {
            const listeners = this.listeners.get(type);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(type);
                }
            }
        };
    }
    
    notifyListeners(type, data) {
        const listeners = this.listeners.get(type);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    
    showUserNotification(error, context) {
        let message = 'An unexpected error occurred';
        let type = 'error';
        let duration = 5000;
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
            message = 'Request timed out. Please try again.';
        } else if (context.includes('contact')) {
            message = 'Unable to submit form. Please try again or contact directly.';
        } else if (error.message.includes('offline')) {
            message = 'You appear to be offline. Some features may not work.';
            type = 'warning';
        }
        
        Utils.showNotification(message, type, duration);
    }
    
    sendToAnalytics(errorData) {
        // Implementation for sending errors to analytics service
        if (window.PortfolioAPI) {
            window.PortfolioAPI.trackInteraction({
                elementType: 'error',
                elementId: 'error_handler',
                action: 'error_occurred',
                value: errorData.context,
                metadata: {
                    errorId: errorData.id,
                    errorMessage: errorData.message
                }
            });
        }
    }
    
    getErrors() {
        return [...this.errors];
    }
    
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('app_errors');
    }
    
    getErrorById(id) {
        return this.errors.find(error => error.id === id);
    }
    
    getErrorsByContext(context) {
        return this.errors.filter(error => error.context.includes(context));
    }
    
    createErrorReport() {
        return {
            timestamp: new Date().toISOString(),
            errorCount: this.errors.length,
            recentErrors: this.errors.slice(-10),
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: AdvancedUtils.getScreenInfo(),
                device: AdvancedUtils.getDeviceType()
            },
            appInfo: {
                version: CONFIG.VERSION,
                environment: CONFIG.ENVIRONMENT
            }
        };
    }
}

// ============ ENHANCED CACHE MANAGER ============
class EnhancedCacheManager {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            size: 0
        };
        
        this.initStorage();
    }
    
    initStorage() {
        // Try to load from localStorage for persistence
        try {
            const storedCache = localStorage.getItem('app_cache');
            if (storedCache) {
                const parsed = JSON.parse(storedCache);
                Object.keys(parsed).forEach(key => {
                    const item = parsed[key];
                    if (Date.now() - item.timestamp < CONFIG.CACHE_DURATION) {
                        this.cache.set(key, item);
                    }
                });
                this.updateStats();
            }
        } catch (e) {
            console.warn('Failed to load cache from localStorage:', e);
        }
        
        // Periodically clean expired items
        setInterval(() => this.cleanExpired(), 60000); // Every minute
        
        // Save to localStorage periodically
        setInterval(() => this.persistToStorage(), 30000); // Every 30 seconds
    }
    
    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.stats.misses++;
            return null;
        }
        
        if (Date.now() - cached.timestamp > CONFIG.CACHE_DURATION) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        return cached.data;
    }
    
    set(key, data, metadata = {}) {
        const cacheItem = {
            data,
            timestamp: Date.now(),
            metadata: {
                size: JSON.stringify(data).length,
                ...metadata
            }
        };
        
        this.cache.set(key, cacheItem);
        this.stats.sets++;
        this.updateStats();
        
        return cacheItem;
    }
    
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
            this.updateStats();
        }
        return deleted;
    }
    
    clear() {
        this.cache.clear();
        this.pendingRequests.clear();
        this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 };
        localStorage.removeItem('app_cache');
    }
    
    has(key) {
        return this.cache.has(key);
    }
    
    keys() {
        return Array.from(this.cache.keys());
    }
    
    values() {
        return Array.from(this.cache.values()).map(item => item.data);
    }
    
    entries() {
        return Array.from(this.cache.entries()).map(([key, item]) => [key, item.data]);
    }
    
    size() {
        return this.cache.size;
    }
    
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > CONFIG.CACHE_DURATION) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0 && CONFIG.DEBUG_MODE) {
            console.log(`Cleaned ${cleaned} expired cache items`);
        }
        
        return cleaned;
    }
    
    persistToStorage() {
        try {
            const cacheObj = {};
            this.cache.forEach((value, key) => {
                cacheObj[key] = value;
            });
            localStorage.setItem('app_cache', JSON.stringify(cacheObj));
        } catch (e) {
            console.warn('Failed to persist cache:', e);
        }
    }
    
    updateStats() {
        let size = 0;
        this.cache.forEach(item => {
            size += item.metadata.size || 0;
        });
        this.stats.size = size;
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    getCacheInfo() {
        const now = Date.now();
        const items = [];
        
        this.cache.forEach((item, key) => {
            items.push({
                key,
                age: now - item.timestamp,
                size: item.metadata.size || 0,
                expiresIn: CONFIG.CACHE_DURATION - (now - item.timestamp)
            });
        });
        
        return {
            totalItems: this.cache.size,
            totalSize: this.stats.size,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            items
        };
    }
    
    setPendingRequest(key, promise) {
        this.pendingRequests.set(key, promise);
        promise.finally(() => {
            this.pendingRequests.delete(key);
        });
    }
    
    getPendingRequest(key) {
        return this.pendingRequests.get(key);
    }
    
    hasPendingRequest(key) {
        return this.pendingRequests.has(key);
    }
    
    clearPendingRequests() {
        this.pendingRequests.clear();
    }
}

// ============ ENHANCED API SERVICE ============
class EnhancedPortfolioAPI {
    constructor() {
        this.baseUrl = CONFIG.GOOGLE_APPS_SCRIPT_URL;
        this.cache = new EnhancedCacheManager();
        this.isOnline = navigator.onLine;
        this.retryCounts = new Map();
        this.queue = [];
        this.processingQueue = false;
        this.requestInterceptor = null;
        this.responseInterceptor = null;
        
        this.initEventListeners();
        this.initQueueProcessor();
    }
    
    initEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            }
        });
        
        // Before page unload
        window.addEventListener('beforeunload', () => {
            this.flushQueue();
        });
    }
    
    initQueueProcessor() {
        // Process queue every second
        setInterval(() => this.processQueue(), 1000);
    }
    
    handleOnline() {
        this.isOnline = true;
        Utils.showNotification('Back online. Syncing data...', 'success', 2000);
        this.logSystemEvent('INFO', 'network', 'handleOnline', 'Device is back online');
        this.processQueue(); // Process any queued requests
    }
    
    handleOffline() {
        this.isOnline = false;
        Utils.showNotification('You are offline. Some features may be limited.', 'warning', 3000);
        this.logSystemEvent('WARN', 'network', 'handleOffline', 'Device went offline');
    }
    
    handlePageVisible() {
        // Refresh data when page becomes visible again
        if (this.isOnline) {
            this.logSystemEvent('INFO', 'app', 'pageVisible', 'Page became visible, refreshing stale data');
            // Could implement a background refresh here
        }
    }
    
    async fetchData(action, params = {}, options = {}) {
        const {
            forceRefresh = false,
            priority = 'normal',
            timeout = CONFIG.API_TIMEOUT,
            retry = true
        } = options;
        
        const cacheKey = `${action}_${AdvancedUtils.createQueryString(params)}`;
        
        // Return cached data if available and not forcing refresh
        if (!forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                if (CONFIG.DEBUG_MODE) console.log(`[Cache Hit] ${action}`);
                return cached;
            }
        }
        
        // Return pending request if exists
        if (this.cache.hasPendingRequest(cacheKey)) {
            return this.cache.getPendingRequest(cacheKey);
        }
        
        // Create request function
        const request = async () => {
            try {
                const data = await this.makeRequestWithRetry(action, params, cacheKey, timeout);
                this.cache.set(cacheKey, data, { action, params });
                return data;
            } catch (error) {
                // If offline and we have cached data, return it
                if (!this.isOnline) {
                    const cached = this.cache.get(cacheKey);
                    if (cached) {
                        Utils.showNotification('Using cached data while offline', 'info', 2000);
                        return cached;
                    }
                }
                throw error;
            }
        };
        
        // Queue or execute immediately based on priority and online status
        if (!this.isOnline || priority === 'low') {
            return this.queueRequest(request, cacheKey, priority);
        }
        
        const requestPromise = request();
        this.cache.setPendingRequest(cacheKey, requestPromise);
        return requestPromise;
    }
    
    queueRequest(request, cacheKey, priority = 'normal') {
        return new Promise((resolve, reject) => {
            const queueItem = {
                request,
                cacheKey,
                priority,
                resolve,
                reject,
                timestamp: Date.now(),
                attempts: 0
            };
            
            this.queue.push(queueItem);
            this.sortQueue();
            
            // Process queue if online
            if (this.isOnline) {
                this.processQueue();
            }
        });
    }
    
    sortQueue() {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        this.queue.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.timestamp - b.timestamp;
        });
    }
    
    async processQueue() {
        if (this.processingQueue || !this.isOnline || this.queue.length === 0) {
            return;
        }
        
        this.processingQueue = true;
        
        while (this.queue.length > 0 && this.isOnline) {
            const item = this.queue.shift();
            
            try {
                const result = await item.request();
                item.resolve(result);
            } catch (error) {
                item.attempts++;
                
                // Retry if under limit
                if (item.attempts < CONFIG.RETRY_ATTEMPTS && this.shouldRetry(error)) {
                    this.queue.push(item);
                    await Utils.sleep(CONFIG.RETRY_DELAY * item.attempts);
                } else {
                    item.reject(error);
                }
            }
            
            // Small delay between requests
            await Utils.sleep(100);
        }
        
        this.processingQueue = false;
    }
    
    flushQueue() {
        // Process all queued requests immediately
        return this.processQueue();
    }
    
    async makeRequestWithRetry(action, params, cacheKey, timeout, attempt = 1) {
        try {
            return await this.makeRequest(action, params, cacheKey, timeout);
        } catch (error) {
            if (attempt < CONFIG.RETRY_ATTEMPTS && this.shouldRetry(error)) {
                await Utils.sleep(CONFIG.RETRY_DELAY * attempt);
                return this.makeRequestWithRetry(action, params, cacheKey, timeout, attempt + 1);
            }
            throw error;
        }
    }
    
    shouldRetry(error) {
        const retryableErrors = [
            'network',
            'timeout',
            'Failed to fetch',
            'NetworkError',
            'TypeError'
        ];
        
        return retryableErrors.some(keyword => 
            error.message.includes(keyword)
        ) || error.message.includes('5'); // 5xx errors
    }
    
    async makeRequest(action, params, cacheKey, timeout) {
        const startTime = Date.now();
        const requestId = AdvancedUtils.generateUUID();
        
        try {
            // Apply request interceptor if set
            let processedParams = params;
            if (this.requestInterceptor) {
                processedParams = await this.requestInterceptor({ action, params, requestId });
            }
            
            this.logApiRequest({
                requestId,
                method: 'GET',
                endpoint: this.baseUrl,
                action,
                parameters: processedParams,
                timestamp: new Date().toISOString()
            });
            
            const url = new URL(this.baseUrl);
            url.searchParams.append('action', action);
            
            Object.keys(processedParams).forEach(key => {
                if (processedParams[key] !== undefined && processedParams[key] !== null) {
                    url.searchParams.append(key, String(processedParams[key]));
                }
            });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                    'X-Client-Version': CONFIG.VERSION
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const responseTime = Date.now() - startTime;
            
            // Apply response interceptor if set
            let processedData = data;
            if (this.responseInterceptor) {
                processedData = await this.responseInterceptor({ 
                    action, 
                    params: processedParams, 
                    data, 
                    responseTime, 
                    requestId 
                });
            }
            
            this.logApiRequest({
                requestId,
                responseCode: response.status,
                responseTime,
                responseSize: JSON.stringify(data).length,
                error: false,
                cacheHit: false
            });
            
            return processedData;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.logApiRequest({
                requestId,
                responseCode: 0,
                responseTime,
                error: true,
                errorMessage: error.message
            });
            
            const errorHandler = window.ErrorHandler || EnhancedErrorHandler;
            errorHandler.handle(error, 'API.makeRequest', {
                action,
                params,
                cacheKey,
                requestId,
                timeout
            });
            
            throw error;
        }
    }
    
    // Enhanced data retrieval methods with pagination support
    async getProjects(category = null, page = 1, pageSize = 10) {
        const params = category ? { category } : {};
        const data = await this.fetchData('getProjects', params);
        const projects = Array.isArray(data.data) ? data.data : [];
        
        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginated = projects.slice(startIndex, endIndex);
        
        return {
            data: paginated,
            pagination: AdvancedUtils.createPagination(projects.length, page, pageSize),
            total: projects.length
        };
    }
    
    async searchProjects(query, filters = {}) {
        const data = await this.fetchData('getProjects');
        let projects = Array.isArray(data.data) ? data.data : [];
        
        // Apply search query
        if (query) {
            const lowerQuery = query.toLowerCase();
            projects = projects.filter(project => 
                project.title?.toLowerCase().includes(lowerQuery) ||
                project.description?.toLowerCase().includes(lowerQuery) ||
                project.technologies?.toLowerCase().includes(lowerQuery)
            );
        }
        
        // Apply filters
        projects = AdvancedUtils.filterArray(projects, filters);
        
        return projects;
    }
    
    async getFeaturedProjects(limit = 6) {
        const projects = await this.getProjects();
        const featured = projects.data
            .filter(project => project.featured === true || project.featured === 'TRUE')
            .slice(0, limit);
        
        return featured;
    }
    
    async getTestimonials(featured = true, sortBy = 'date', sortOrder = 'desc') {
        const data = await this.fetchData('getTestimonials');
        let testimonials = Array.isArray(data.data) ? data.data : [];
        
        if (featured) {
            testimonials = testimonials.filter(t => t.featured === true || t.featured === 'TRUE');
        }
        
        // Sort testimonials
        testimonials = AdvancedUtils.sortArray(testimonials, sortBy, sortOrder);
        
        return testimonials;
    }
    
    async getSkills(category = null, level = null) {
        const data = await this.fetchData('getSkills');
        let skills = Array.isArray(data.data) ? data.data : [];
        
        if (category) {
            skills = skills.filter(s => s.category === category);
        }
        
        if (level) {
            skills = skills.filter(s => s.proficiency_label === level);
        }
        
        return skills.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    
    async getExperience(sortBy = 'start_date', sortOrder = 'desc') {
        const data = await this.fetchData('getExperience');
        const experience = Array.isArray(data.data) ? data.data : [];
        
        return AdvancedUtils.sortArray(experience, sortBy, sortOrder);
    }
    
    async getEducation(sortBy = 'start_date', sortOrder = 'desc') {
        const data = await this.fetchData('getEducation');
        const education = Array.isArray(data.data) ? data.data : [];
        
        return AdvancedUtils.sortArray(education, sortBy, sortOrder);
    }
    
    async getCertifications(sortBy = 'issue_date', sortOrder = 'desc') {
        const data = await this.fetchData('getCertifications');
        const certifications = Array.isArray(data.data) ? data.data : [];
        
        return AdvancedUtils.sortArray(certifications, sortBy, sortOrder);
    }
    
    async getBlogPosts(limit = 3, featured = false, category = null) {
        const data = await this.fetchData('getBlogPosts');
        let posts = Array.isArray(data.data) ? data.data : [];
        
        if (featured) {
            posts = posts.filter(post => post.featured === true || post.featured === 'TRUE');
        }
        
        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        
        posts = AdvancedUtils.sortArray(posts, 'publish_date', 'desc');
        
        return posts.slice(0, limit);
    }
    
    async getServices(category = null) {
        const data = await this.fetchData('getServices');
        let services = Array.isArray(data.data) ? data.data : [];
        
        if (category) {
            services = services.filter(s => s.category === category);
        }
        
        return services.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    
    async getAllData(options = {}) {
        const {
            forceRefresh = false,
            priority = 'normal'
        } = options;
        
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
            ] = await Promise.allSettled([
                this.getProjects(null, 1, 6),
                this.getTestimonials(true),
                this.getSkills(),
                this.getExperience(),
                this.getEducation(),
                this.getCertifications(),
                this.getBlogPosts(3, true),
                this.getServices()
            ]);
            
            return {
                projects: projects.status === 'fulfilled' ? projects.value.data : [],
                testimonials: testimonials.status === 'fulfilled' ? testimonials.value : [],
                skills: skills.status === 'fulfilled' ? skills.value : [],
                experience: experience.status === 'fulfilled' ? experience.value : [],
                education: education.status === 'fulfilled' ? education.value : [],
                certifications: certifications.status === 'fulfilled' ? certifications.value : [],
                blogPosts: blogPosts.status === 'fulfilled' ? blogPosts.value : [],
                services: services.status === 'fulfilled' ? services.value : [],
                metadata: {
                    timestamp: new Date().toISOString(),
                    cacheInfo: this.cache.getCacheInfo()
                }
            };
        } catch (error) {
            const errorHandler = window.ErrorHandler || EnhancedErrorHandler;
            errorHandler.handle(error, 'PortfolioAPI.getAllData');
            throw error;
        }
    }
    
    // Form submission methods remain intact as requested
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
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formParams,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
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
            
            const errorHandler = window.ErrorHandler || EnhancedErrorHandler;
            errorHandler.handle(error, 'PortfolioAPI.submitContact', {
                formData: Object.keys(formData).filter(key => key !== 'attachments')
            });
            
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
            return 'ip-fetch-error';
        }
    }
    
    // Analytics and logging methods
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
            // Silent fail for analytics
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
            timestamp: new Date().toISOString(),
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
    
    clearCache() {
        this.cache.clear();
        Utils.showNotification('Cache cleared successfully', 'success', 2000);
    }
    
    async healthCheck() {
        try {
            const startTime = Date.now();
            const response = await fetch(this.baseUrl + '?action=health');
            const responseTime = Date.now() - startTime;
            
            return {
                online: true,
                responseTime,
                status: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                online: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // Advanced features
    setRequestInterceptor(interceptor) {
        this.requestInterceptor = interceptor;
    }
    
    setResponseInterceptor(interceptor) {
        this.responseInterceptor = interceptor;
    }
    
    async prefetchData(actions) {
        const promises = actions.map(action => 
            this.fetchData(action, {}, { priority: 'low' })
        );
        
        return Promise.allSettled(promises);
    }
    
    async syncData() {
        // Force refresh all data
        const data = await this.getAllData({ forceRefresh: true });
        return data;
    }
    
    getCacheStatistics() {
        return this.cache.getStats();
    }
    
    getQueueStatus() {
        return {
            queued: this.queue.length,
            processing: this.processingQueue,
            pendingRequests: this.cache.pendingRequests.size
        };
    }
}

// ============ ADVANCED UI COMPONENTS ============
class AdvancedUIComponents {
    static createProjectCard(project, options = {}) {
        const {
            showCategory = true,
            showDescription = true,
            showStats = true,
            showTechnologies = true,
            compact = false
        } = options;
        
        const categories = project.category ? project.category.split(',').map(cat => cat.trim()) : [];
        const technologies = project.technologies ? project.technologies.split(',').map(tech => tech.trim()) : [];
        
        const cardClass = compact ? 'portfolio-item compact' : 'portfolio-item';
        
        return `
            <div class="${cardClass}" data-category="${categories.join(' ')}" data-id="${project.id}">
                <div class="portfolio-card">
                    <div class="portfolio-image">
                        <img src="${project.featured_image || 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Project'}" 
                             alt="${project.title}"
                             loading="lazy"
                             data-src="${project.featured_image}">
                        <div class="portfolio-overlay">
                            <div class="overlay-content">
                                <h3>${project.title}</h3>
                                <p>${project.subtitle || ''}</p>
                            </div>
                        </div>
                    </div>
                    <div class="portfolio-content">
                        ${showCategory && categories.length > 0 ? `
                            <div class="portfolio-category">
                                ${categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        <h3 class="portfolio-title">${project.title}</h3>
                        
                        ${showDescription && project.description ? `
                            <p class="portfolio-description">
                                ${project.description.substring(0, compact ? 100 : 150)}...
                            </p>
                        ` : ''}
                        
                        ${showStats && project.outcomes ? `
                            <div class="portfolio-stats">
                                ${project.outcomes.split(',').slice(0, 3).map(outcome => `
                                    <div class="stat">
                                        <i class="fas fa-chart-line"></i>
                                        <span>${outcome.trim()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${showTechnologies && technologies.length > 0 ? `
                            <div class="portfolio-tech">
                                ${technologies.slice(0, compact ? 3 : 5).map(tech => `
                                    <span class="tech-tag">${tech}</span>
                                `).join('')}
                                ${technologies.length > (compact ? 3 : 5) ? `
                                    <span class="tech-tag-more">+${technologies.length - (compact ? 3 : 5)}</span>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        <div class="portfolio-actions">
                            <button class="portfolio-btn view-details" onclick="PortfolioUI.showProjectModal('${project.id}')">
                                <span>View Details</span>
                                <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="portfolio-btn-icon share" onclick="AdvancedUIComponents.shareProject('${project.id}')" title="Share">
                                <i class="fas fa-share-alt"></i>
                            </button>
                            <button class="portfolio-btn-icon bookmark" onclick="AdvancedUIComponents.bookmarkProject('${project.id}')" title="Bookmark">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    static createTestimonialCard(testimonial, index, options = {}) {
        const {
            showRating = true,
            showCompany = true,
            showImage = true,
            compact = false
        } = options;
        
        return `
            <div class="testimonial-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="testimonial-card">
                    ${showRating && testimonial.rating ? `
                        <div class="testimonial-rating">
                            ${'<i class="fas fa-star"></i>'.repeat(Math.min(testimonial.rating || 5, 5))}
                        </div>
                    ` : ''}
                    
                    <div class="testimonial-content">
                        <p>"${testimonial.testimonial}"</p>
                    </div>
                    
                    <div class="testimonial-author">
                        ${showImage ? `
                            <div class="author-image">
                                <img src="${testimonial.client_image || 'https://i.pravatar.cc/150?img=' + index}" 
                                     alt="${testimonial.client_name}"
                                     loading="lazy">
                            </div>
                        ` : ''}
                        
                        <div class="author-info">
                            <h4>${testimonial.client_name}</h4>
                            <p>${testimonial.client_title}${showCompany && testimonial.client_company ? ', ' + testimonial.client_company : ''}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    static createSkillBar(skill, options = {}) {
        const {
            showLevel = true,
            showExperience = true,
            animated = true,
            showDescription = false
        } = options;
        
        const proficiency = skill.proficiency || 0;
        const level = skill.proficiency_label || 
                     proficiency >= 90 ? 'Expert' : 
                     proficiency >= 75 ? 'Advanced' : 
                     proficiency >= 60 ? 'Intermediate' : 'Beginner';
        
        const animationClass = animated ? 'animated' : '';
        
        return `
            <div class="skill-bar-item" data-skill="${skill.skill_name}">
                <div class="skill-header">
                    <div class="skill-info">
                        <span class="skill-name">${skill.skill_name}</span>
                        ${skill.icon ? `<i class="${skill.icon}"></i>` : ''}
                    </div>
                    <div class="skill-meta">
                        ${showLevel ? `<span class="skill-level">${level}</span>` : ''}
                        ${showExperience && skill.years_experience ? `
                            <span class="skill-exp">${skill.years_experience}+ years</span>
                        ` : ''}
                        <span class="skill-percent">${proficiency}%</span>
                    </div>
                </div>
                
                <div class="skill-progress">
                    <div class="progress-bar" data-width="${proficiency}">
                        <div class="progress-fill ${animationClass}"></div>
                    </div>
                </div>
                
                ${showDescription && skill.description ? `
                    <div class="skill-description">
                        <p>${skill.description}</p>
                    </div>
                ` : ''}
                
                <div class="skill-footer">
                    <div class="skill-tags">
                        ${skill.tags ? skill.tags.split(',').map(tag => `
                            <span class="skill-tag">${tag.trim()}</span>
                        `).join('') : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    static createServiceCard(service, index, options = {}) {
        const {
            showFeatures = true,
            showPricing = true,
            showDuration = true,
            compact = false
        } = options;
        
        const features = service.features ? service.features.split(',').map(f => f.trim()) : [];
        
        const animationDelay = index * 100;
        
        return `
            <div class="col-lg-4 col-md-6 service-item" 
                 data-aos="fade-up" 
                 data-aos-delay="${animationDelay}"
                 data-service="${service.id}">
                <div class="service-card ${compact ? 'compact' : ''}">
                    <div class="service-icon">
                        <i class="${service.icon_class || 'fas fa-cogs'}"></i>
                    </div>
                    
                    <h3 class="service-title">${service.name}</h3>
                    
                    <p class="service-description">
                        ${service.description}
                    </p>
                    
                    ${showFeatures && features.length > 0 ? `
                        <ul class="service-features">
                            ${features.slice(0, compact ? 3 : 5).map(feature => `
                                <li><i class="fas fa-check"></i> ${feature}</li>
                            `).join('')}
                            ${features.length > (compact ? 3 : 5) ? `
                                <li class="feature-more">+${features.length - (compact ? 3 : 5)} more features</li>
                            ` : ''}
                        </ul>
                    ` : ''}
                    
                    ${(showPricing || showDuration) ? `
                        <div class="service-meta">
                            ${showDuration && service.duration ? `
                                <span class="service-duration">
                                    <i class="fas fa-clock"></i> ${service.duration}
                                </span>
                            ` : ''}
                            ${showPricing && service.starting_price ? `
                                <span class="service-price">
                                    <i class="fas fa-dollar-sign"></i> From $${service.starting_price}
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="service-actions">
                        <button class="service-btn primary" onclick="PortfolioUI.showServiceModal('${service.id}')">
                            <span>Learn More</span>
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="service-btn secondary" onclick="PortfolioUI.scrollToContact('${service.name}')">
                            <span>Get Quote</span>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    static createBlogCard(post, options = {}) {
        const {
            showCategory = true,
            showReadTime = true,
            showDate = true,
            showExcerpt = true,
            compact = false
        } = options;
        
        const readTime = post.read_time || '5 min read';
        const category = post.category || 'General';
        const excerpt = post.excerpt || (post.content ? post.content.substring(0, compact ? 80 : 120) + '...' : '');
        
        return `
            <div class="col-lg-4 col-md-6 blog-item" data-blog="${post.id}">
                <div class="blog-card ${compact ? 'compact' : ''}">
                    <div class="blog-image">
                        <img src="${post.featured_image || 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Blog'}" 
                             alt="${post.title}"
                             loading="lazy">
                        <div class="blog-overlay">
                            ${showCategory ? `<div class="blog-category">${category}</div>` : ''}
                            ${showReadTime ? `<div class="blog-read-time">${readTime}</div>` : ''}
                        </div>
                    </div>
                    <div class="blog-content">
                        ${showDate && post.publish_date ? `
                            <div class="blog-date">
                                <i class="far fa-calendar"></i>
                                <span>${Utils.formatDate(post.publish_date)}</span>
                            </div>
                        ` : ''}
                        
                        <h3 class="blog-title">${post.title}</h3>
                        
                        ${showExcerpt && excerpt ? `
                            <p class="blog-excerpt">${excerpt}</p>
                        ` : ''}
                        
                        <div class="blog-actions">
                            <a href="#" class="blog-link" onclick="PortfolioUI.showBlogModal('${post.id}')">
                                <span>Read Article</span>
                                <i class="fas fa-arrow-right"></i>
                            </a>
                            <button class="blog-action-btn share" onclick="AdvancedUIComponents.shareBlog('${post.id}')" title="Share">
                                <i class="fas fa-share-alt"></i>
                            </button>
                            <button class="blog-action-btn bookmark" onclick="AdvancedUIComponents.bookmarkBlog('${post.id}')" title="Bookmark">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                        
                        ${post.author || post.tags ? `
                            <div class="blog-footer">
                                ${post.author ? `
                                    <div class="blog-author">
                                        <i class="fas fa-user"></i>
                                        <span>${post.author}</span>
                                    </div>
                                ` : ''}
                                ${post.tags ? `
                                    <div class="blog-tags">
                                        ${post.tags.split(',').slice(0, 2).map(tag => `
                                            <span class="blog-tag">${tag.trim()}</span>
                                        `).join('')}
                                        ${post.tags.split(',').length > 2 ? `
                                            <span class="blog-tag-more">+${post.tags.split(',').length - 2}</span>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    static createModal(options = {}) {
        const {
            id = 'customModal',
            title = '',
            content = '',
            size = 'modal-lg',
            showClose = true,
            showFooter = false,
            footerContent = '',
            backdrop = true,
            keyboard = true,
            focus = true
        } = options;
        
        const modalId = id || 'modal_' + AdvancedUtils.generateUUID();
        
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" 
                 aria-labelledby="${modalId}Label" aria-hidden="true"
                 data-bs-backdrop="${backdrop ? 'true' : 'static'}" 
                 data-bs-keyboard="${keyboard}">
                <div class="modal-dialog ${size}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}Label">${title}</h5>
                            ${showClose ? `
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            ` : ''}
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        ${showFooter ? `
                            <div class="modal-footer">
                                ${footerContent}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Initialize and return modal instance
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: backdrop ? true : 'static',
            keyboard: keyboard,
            focus: focus
        });
        
        return {
            element: modalElement,
            instance: modal,
            show: () => modal.show(),
            hide: () => modal.hide(),
            dispose: () => {
                modal.dispose();
                modalElement.remove();
            }
        };
    }
    
    static createNotification(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            position = 'top-right',
            showClose = true,
            actions = [],
            icon = null
        } = options;
        
        const notificationId = 'notification_' + AdvancedUtils.generateUUID();
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const notificationIcon = icon || `fas fa-${icons[type] || 'info-circle'}`;
        
        const notificationHTML = `
            <div id="${notificationId}" class="notification notification-${type} notification-${position}">
                <div class="notification-content">
                    <div class="notification-icon">
                        <i class="${notificationIcon}"></i>
                    </div>
                    <div class="notification-body">
                        ${title ? `<div class="notification-title">${title}</div>` : ''}
                        <div class="notification-message">${message}</div>
                    </div>
                </div>
                <div class="notification-actions">
                    ${actions.map(action => `
                        <button class="notification-action" onclick="${action.onclick}">
                            ${action.label}
                        </button>
                    `).join('')}
                    ${showClose ? `
                        <button class="notification-close" onclick="document.getElementById('${notificationId}').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add notification to document
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
        
        const notification = document.getElementById(notificationId);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
        }
        
        return {
            element: notification,
            remove: () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        };
    }
    
    static createLoadingOverlay(options = {}) {
        const {
            id = 'loadingOverlay',
            message = 'Loading...',
            spinner = true,
            opacity = 0.8,
            zIndex = 9999
        } = options;
        
        const overlayId = id || 'loading_' + AdvancedUtils.generateUUID();
        
        const overlayHTML = `
            <div id="${overlayId}" class="loading-overlay" style="opacity: ${opacity}; z-index: ${zIndex};">
                <div class="loading-content">
                    ${spinner ? '<div class="loading-spinner"></div>' : ''}
                    ${message ? `<div class="loading-message">${message}</div>` : ''}
                </div>
            </div>
        `;
        
        // Remove existing overlay if present
        const existingOverlay = document.getElementById(overlayId);
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Add overlay to document
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        
        return {
            element: document.getElementById(overlayId),
            show: () => {
                const element = document.getElementById(overlayId);
                if (element) element.style.display = 'flex';
            },
            hide: () => {
                const element = document.getElementById(overlayId);
                if (element) {
                    element.style.opacity = '0';
                    setTimeout(() => {
                        if (element.parentNode) {
                            element.remove();
                        }
                    }, 300);
                }
            },
            remove: () => {
                const element = document.getElementById(overlayId);
                if (element && element.parentNode) {
                    element.remove();
                }
            }
        };
    }
    
    static createPagination(paginationData, options = {}) {
        const {
            onPageChange = null,
            showInfo = true,
            showSizeSelector = false,
            pageSizes = [10, 25, 50, 100]
        } = options;
        
        const { currentPage, totalPages, pageSize, totalItems, pages } = paginationData;
        
        const paginationId = 'pagination_' + AdvancedUtils.generateUUID();
        
        const paginationHTML = `
            <div id="${paginationId}" class="custom-pagination">
                ${showInfo ? `
                    <div class="pagination-info">
                        Showing ${paginationData.startIndex + 1} to ${Math.min(paginationData.endIndex, totalItems)} 
                        of ${totalItems} items
                    </div>
                ` : ''}
                
                <div class="pagination-controls">
                    <button class="pagination-btn ${!paginationData.hasPrevious ? 'disabled' : ''}" 
                            ${paginationData.hasPrevious ? `onclick="${onPageChange ? onPageChange(currentPage - 1) : ''}"` : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <div class="pagination-pages">
                        ${pages.map(page => {
                            if (page === '...') {
                                return '<span class="pagination-ellipsis">...</span>';
                            }
                            const isActive = page === currentPage;
                            return `
                                <button class="pagination-page ${isActive ? 'active' : ''}" 
                                        ${!isActive ? `onclick="${onPageChange ? onPageChange(page) : ''}"` : ''}>
                                    ${page}
                                </button>
                            `;
                        }).join('')}
                    </div>
                    
                    <button class="pagination-btn ${!paginationData.hasNext ? 'disabled' : ''}" 
                            ${paginationData.hasNext ? `onclick="${onPageChange ? onPageChange(currentPage + 1) : ''}"` : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                ${showSizeSelector ? `
                    <div class="pagination-size">
                        <select class="page-size-selector" onchange="${onPageChange ? `onPageChange(1, this.value)` : ''}">
                            ${pageSizes.map(size => `
                                <option value="${size}" ${size === pageSize ? 'selected' : ''}>
                                    ${size} per page
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
        `;
        
        return paginationHTML;
    }
    
    static createSearchBar(options = {}) {
        const {
            id = 'searchBar',
            placeholder = 'Search...',
            onSearch = null,
            onClear = null,
            debounceDelay = 300,
            showClearButton = true,
            showSearchButton = true
        } = options;
        
        const searchId = id || 'search_' + AdvancedUtils.generateUUID();
        
        const searchHTML = `
            <div id="${searchId}" class="custom-search-bar">
                <div class="search-input-wrapper">
                    <i class="search-icon fas fa-search"></i>
                    <input type="text" 
                           class="search-input" 
                           placeholder="${placeholder}"
                           aria-label="Search">
                    ${showClearButton ? `
                        <button class="search-clear" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
                ${showSearchButton ? `
                    <button class="search-button">
                        <i class="fas fa-search"></i>
                        <span>Search</span>
                    </button>
                ` : ''}
            </div>
        `;
        
        return {
            html: searchHTML,
            initialize: (container) => {
                const element = container.querySelector(`#${searchId}`);
                if (!element) return null;
                
                const input = element.querySelector('.search-input');
                const clearBtn = element.querySelector('.search-clear');
                const searchBtn = element.querySelector('.search-button');
                
                const debouncedSearch = AdvancedUtils.debounceAdvanced((value) => {
                    if (onSearch) onSearch(value);
                }, debounceDelay);
                
                input.addEventListener('input', (e) => {
                    const value = e.target.value.trim();
                    
                    if (clearBtn) {
                        clearBtn.style.display = value ? 'flex' : 'none';
                    }
                    
                    debouncedSearch(value);
                });
                
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        input.value = '';
                        input.focus();
                        clearBtn.style.display = 'none';
                        if (onClear) onClear();
                        if (onSearch) onSearch('');
                    });
                }
                
                if (searchBtn) {
                    searchBtn.addEventListener('click', () => {
                        if (onSearch) onSearch(input.value.trim());
                    });
                }
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && onSearch) {
                        onSearch(input.value.trim());
                    }
                });
                
                return {
                    element,
                    input,
                    clear: () => {
                        input.value = '';
                        if (clearBtn) clearBtn.style.display = 'none';
                        if (onClear) onClear();
                    },
                    focus: () => input.focus(),
                    setValue: (value) => {
                        input.value = value;
                        if (clearBtn) {
                            clearBtn.style.display = value ? 'flex' : 'none';
                        }
                    }
                };
            }
        };
    }
    
    static createFilterPanel(options = {}) {
        const {
            id = 'filterPanel',
            filters = [],
            onFilterChange = null,
            onReset = null
        } = options;
        
        const panelId = id || 'filter_' + AdvancedUtils.generateUUID();
        
        const filterHTML = `
            <div id="${panelId}" class="custom-filter-panel">
                <div class="filter-header">
                    <h4>Filters</h4>
                    <button class="filter-reset" onclick="${onReset ? onReset : ''}">
                        Reset All
                    </button>
                </div>
                <div class="filter-body">
                    ${filters.map((filter, index) => `
                        <div class="filter-group">
                            <label class="filter-label">${filter.label}</label>
                            ${filter.type === 'select' ? `
                                <select class="filter-select" 
                                        data-filter="${filter.key}"
                                        onchange="${onFilterChange ? `onFilterChange('${filter.key}', this.value)` : ''}">
                                    <option value="">All</option>
                                    ${filter.options.map(option => `
                                        <option value="${option.value}">${option.label}</option>
                                    `).join('')}
                                </select>
                            ` : filter.type === 'checkbox' ? `
                                <div class="filter-checkboxes">
                                    ${filter.options.map(option => `
                                        <label class="filter-checkbox">
                                            <input type="checkbox" 
                                                   value="${option.value}"
                                                   data-filter="${filter.key}"
                                                   onchange="${onFilterChange ? `onFilterChange('${filter.key}', this.checked ? this.value : '')` : ''}">
                                            <span>${option.label}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            ` : filter.type === 'range' ? `
                                <div class="filter-range">
                                    <input type="range" 
                                           min="${filter.min}" 
                                           max="${filter.max}" 
                                           step="${filter.step || 1}"
                                           value="${filter.default || filter.min}"
                                           data-filter="${filter.key}"
                                           oninput="${onFilterChange ? `onFilterChange('${filter.key}', this.value)` : ''}">
                                    <span class="filter-range-value">${filter.default || filter.min}</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return filterHTML;
    }
    
    static createAccordion(items, options = {}) {
        const {
            id = 'accordion',
            multiple = false,
            defaultOpen = []
        } = options;
        
        const accordionId = id || 'accordion_' + AdvancedUtils.generateUUID();
        
        const accordionHTML = `
            <div id="${accordionId}" class="custom-accordion">
                ${items.map((item, index) => `
                    <div class="accordion-item ${defaultOpen.includes(index) ? 'open' : ''}">
                        <button class="accordion-header" 
                                onclick="AdvancedUIComponents.toggleAccordion('${accordionId}', ${index}, ${multiple})">
                            <span class="accordion-title">${item.title}</span>
                            <i class="accordion-icon fas fa-chevron-down"></i>
                        </button>
                        <div class="accordion-content" style="${defaultOpen.includes(index) ? '' : 'display: none;'}">
                            ${item.content}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        return accordionHTML;
    }
    
    static toggleAccordion(accordionId, index, multiple = false) {
        const accordion = document.getElementById(accordionId);
        if (!accordion) return;
        
        const item = accordion.children[index];
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');
        
        const isOpen = content.style.display !== 'none';
        
        if (!multiple) {
            // Close all other items
            Array.from(accordion.children).forEach((otherItem, otherIndex) => {
                if (otherIndex !== index) {
                    const otherContent = otherItem.querySelector('.accordion-content');
                    const otherIcon = otherItem.querySelector('.accordion-icon');
                    otherContent.style.display = 'none';
                    otherItem.classList.remove('open');
                    otherIcon.classList.remove('fa-chevron-up');
                    otherIcon.classList.add('fa-chevron-down');
                }
            });
        }
        
        if (isOpen) {
            content.style.display = 'none';
            item.classList.remove('open');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            content.style.display = 'block';
            item.classList.add('open');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }
    
    static createTabs(tabs, options = {}) {
        const {
            id = 'tabs',
            defaultTab = 0,
            vertical = false
        } = options;
        
        const tabsId = id || 'tabs_' + AdvancedUtils.generateUUID();
        const verticalClass = vertical ? 'vertical-tabs' : '';
        
        const tabsHTML = `
            <div id="${tabsId}" class="custom-tabs ${verticalClass}">
                <div class="tabs-header">
                    ${tabs.map((tab, index) => `
                        <button class="tab-button ${index === defaultTab ? 'active' : ''}" 
                                data-tab="${index}"
                                onclick="AdvancedUIComponents.switchTab('${tabsId}', ${index})">
                            ${tab.icon ? `<i class="${tab.icon}"></i>` : ''}
                            <span>${tab.title}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="tabs-content">
                    ${tabs.map((tab, index) => `
                        <div class="tab-pane ${index === defaultTab ? 'active' : ''}" data-tab="${index}">
                            ${tab.content}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return tabsHTML;
    }
    
    static switchTab(tabsId, tabIndex) {
        const tabs = document.getElementById(tabsId);
        if (!tabs) return;
        
        // Update buttons
        tabs.querySelectorAll('.tab-button').forEach((button, index) => {
            if (index === tabIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update panes
        tabs.querySelectorAll('.tab-pane').forEach((pane, index) => {
            if (index === tabIndex) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }
    
    static createCarousel(items, options = {}) {
        const {
            id = 'carousel',
            autoplay = true,
            interval = 5000,
            controls = true,
            indicators = true,
            fade = false
        } = options;
        
        const carouselId = id || 'carousel_' + AdvancedUtils.generateUUID();
        const fadeClass = fade ? 'carousel-fade' : '';
        
        const carouselHTML = `
            <div id="${carouselId}" class="custom-carousel ${fadeClass}" 
                 data-bs-ride="${autoplay ? 'carousel' : 'false'}">
                ${indicators && items.length > 1 ? `
                    <div class="carousel-indicators">
                        ${items.map((_, index) => `
                            <button type="button" 
                                    data-bs-target="#${carouselId}" 
                                    data-bs-slide-to="${index}"
                                    ${index === 0 ? 'class="active" aria-current="true"' : ''}
                                    aria-label="Slide ${index + 1}"></button>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="carousel-inner">
                    ${items.map((item, index) => `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            ${item}
                        </div>
                    `).join('')}
                </div>
                
                ${controls && items.length > 1 ? `
                    <button class="carousel-control-prev" 
                            type="button" 
                            data-bs-target="#${carouselId}" 
                            data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" 
                            type="button" 
                            data-bs-target="#${carouselId}" 
                            data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Next</span>
                    </button>
                ` : ''}
            </div>
        `;
        
        return carouselHTML;
    }
    
    static createTimeline(items, options = {}) {
        const {
            id = 'timeline',
            alternate = true,
            showDates = true,
            showIcons = true
        } = options;
        
        const timelineId = id || 'timeline_' + AdvancedUtils.generateUUID();
        const alternateClass = alternate ? 'alternate' : '';
        
        const timelineHTML = `
            <div id="${timelineId}" class="custom-timeline ${alternateClass}">
                ${items.map((item, index) => `
                    <div class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}">
                        <div class="timeline-marker">
                            ${showIcons && item.icon ? `
                                <i class="${item.icon}"></i>
                            ` : '<div class="timeline-dot"></div>'}
                        </div>
                        <div class="timeline-content">
                            ${showDates && item.date ? `
                                <div class="timeline-date">${item.date}</div>
                            ` : ''}
                            <div class="timeline-title">${item.title}</div>
                            <div class="timeline-description">${item.description}</div>
                            ${item.details ? `
                                <div class="timeline-details">${item.details}</div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        return timelineHTML;
    }
    
    static createStatsCards(stats, options = {}) {
        const {
            id = 'statsCards',
            columns = 4,
            animated = true,
            showIcons = true,
            showTrend = true
        } = options;
        
        const statsId = id || 'stats_' + AdvancedUtils.generateUUID();
        const colClass = `col-md-${12 / Math.min(columns, 4)}`;
        
        const statsHTML = `
            <div id="${statsId}" class="row stats-cards">
                ${stats.map((stat, index) => `
                    <div class="${colClass} stats-item" data-aos="fade-up" data-aos-delay="${index * 100}">
                        <div class="stats-card">
                            <div class="stats-header">
                                ${showIcons && stat.icon ? `
                                    <div class="stats-icon">
                                        <i class="${stat.icon}"></i>
                                    </div>
                                ` : ''}
                                <div class="stats-info">
                                    <div class="stats-value" data-count="${stat.value}">
                                        ${animated ? '0' : stat.value}${stat.suffix || ''}
                                    </div>
                                    <div class="stats-label">${stat.label}</div>
                                </div>
                            </div>
                            ${showTrend && stat.trend ? `
                                <div class="stats-trend ${stat.trend > 0 ? 'positive' : 'negative'}">
                                    <i class="fas fa-arrow-${stat.trend > 0 ? 'up' : 'down'}"></i>
                                    <span>${Math.abs(stat.trend)}%</span>
                                </div>
                            ` : ''}
                            ${stat.description ? `
                                <div class="stats-description">${stat.description}</div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        return statsHTML;
    }
    
    static shareProject(projectId) {
        const project = {}; // Would get from data
        const shareData = {
            title: project.title || 'Check out this project',
            text: project.description || 'Amazing project worth seeing',
            url: window.location.href + '#project-' + projectId
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            AdvancedUtils.copyToClipboard(shareData.url)
                .then(() => {
                    AdvancedUIComponents.createNotification({
                        type: 'success',
                        message: 'Project link copied to clipboard!'
                    });
                });
        }
    }
    
    static bookmarkProject(projectId) {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        if (!bookmarks.includes(projectId)) {
            bookmarks.push(projectId);
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            AdvancedUIComponents.createNotification({
                type: 'success',
                message: 'Project bookmarked!'
            });
        } else {
            AdvancedUIComponents.createNotification({
                type: 'info',
                message: 'Project already bookmarked'
            });
        }
    }
    
    static shareBlog(postId) {
        // Similar implementation to shareProject
        const shareData = {
            title: 'Check out this blog post',
            url: window.location.href + '#blog-' + postId
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            AdvancedUtils.copyToClipboard(shareData.url)
                .then(() => {
                    AdvancedUIComponents.createNotification({
                        type: 'success',
                        message: 'Blog post link copied to clipboard!'
                    });
                });
        }
    }
    
    static bookmarkBlog(postId) {
        const bookmarks = JSON.parse(localStorage.getItem('blog_bookmarks') || '[]');
        if (!bookmarks.includes(postId)) {
            bookmarks.push(postId);
            localStorage.setItem('blog_bookmarks', JSON.stringify(bookmarks));
            AdvancedUIComponents.createNotification({
                type: 'success',
                message: 'Blog post bookmarked!'
            });
        } else {
            AdvancedUIComponents.createNotification({
                type: 'info',
                message: 'Blog post already bookmarked'
            });
        }
    }
}

// ============ ENHANCED PORTFOLIO UI MANAGER ============
class EnhancedPortfolioUI {
    static api = null;
    static i18n = null;
    static appState = null;
    static performanceMonitor = null;
    static observers = [];
    static eventListeners = new Map();
    
    static init(apiInstance, options = {}) {
        try {
            // Initialize core components
            this.api = apiInstance;
            this.i18n = new I18n();
            this.appState = new AppState();
            this.performanceMonitor = new PerformanceMonitor();
            
            // Initialize error handler
            this.errorHandler = new EnhancedErrorHandler();
            
            // Setup global error listener
            this.errorHandler.addListener('error', (errorData) => {
                this.handleGlobalError(errorData);
            });
            
            // Initialize core features
            this.initCoreFeatures();
            this.initEventSystem();
            this.initIntersectionObservers();
            this.initPerformanceMonitoring();
            
            // Initialize UI components
            this.initThemeSystem();
            this.initNavigation();
            this.initScrollManagement();
            this.initLoadingSystem();
            this.initUIComponents();
            this.initForms();
            
            // Load initial data
            this.loadInitialData();
            
            // Setup analytics
            this.setupAnalytics();
            
            // Setup offline support
            this.setupOfflineSupport();
            
            // Log initialization
            this.api.logSystemEvent('INFO', 'ui', 'init', 'Enhanced Portfolio UI initialized successfully', {
                version: CONFIG.VERSION,
                environment: CONFIG.ENVIRONMENT,
                features: ['i18n', 'state-management', 'performance-monitoring', 'error-handling']
            });
            
            // Expose for debugging
            if (CONFIG.DEBUG_MODE) {
                this.exposeDebugTools();
            }
            
            // Performance logging
            setTimeout(() => {
                this.performanceMonitor.logPerformance();
            }, 3000);
            
        } catch (error) {
            this.errorHandler.handle(error, 'EnhancedPortfolioUI.init');
            Utils.showNotification('Failed to initialize application. Please refresh the page.', 'error');
        }
    }
    
    static initCoreFeatures() {
        // Set document language
        document.documentElement.lang = this.i18n.getLanguage();
        
        // Set theme
        this.applyTheme(this.appState.get('theme'));
        
        // Add meta tags for SEO
        this.setupSEO();
        
        // Setup viewport
        this.setupViewport();
        
        // Setup PWA features
        if (CONFIG.PWA_ENABLED) {
            this.setupPWA();
        }
    }
    
    static initEventSystem() {
        // Create custom events for app communication
        this.eventListeners.set('themeChange', new Set());
        this.eventListeners.set('languageChange', new Set());
        this.eventListeners.set('dataLoaded', new Set());
        this.eventListeners.set('formSubmitted', new Set());
        
        // Listen to system events
        window.addEventListener('languageChange', (e) => {
            this.handleLanguageChange(e.detail.language);
        });
        
        window.addEventListener('themeChange', (e) => {
            this.handleThemeChange(e.detail.theme);
        });
    }
    
    static initIntersectionObservers() {
        // Lazy loading observer
        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                    }
                    this.lazyLoadObserver.unobserve(img);
                }
            });
        }, { threshold: CONFIG.LAZY_LOAD_THRESHOLD });
        
        // Animation observer
        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    this.animationObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        this.observers.push(this.lazyLoadObserver, this.animationObserver);
    }
    
    static initPerformanceMonitoring() {
        // Monitor performance metrics
        if (CONFIG.PERFORMANCE_MONITORING) {
            // Log performance after page load
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const metrics = this.performanceMonitor.getMetrics();
                    this.api.logSystemEvent('INFO', 'performance', 'pageLoad', 'Page performance metrics', metrics);
                }, 1000);
            });
            
            // Monitor long tasks
            if ('PerformanceObserver' in window) {
                try {
                    const longTaskObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) { // Tasks longer than 50ms
                                this.api.logSystemEvent('WARN', 'performance', 'longTask', 
                                    `Long task detected: ${entry.duration}ms`, {
                                        name: entry.name,
                                        startTime: entry.startTime
                                    });
                            }
                        }
                    });
                    longTaskObserver.observe({ entryTypes: ['longtask'] });
                    this.observers.push(longTaskObserver);
                } catch (e) {}
            }
        }
    }
    
    static initThemeSystem() {
        // Listen for theme changes
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) {
            themeSwitch.addEventListener('change', (e) => {
                const isDark = e.target.checked;
                const theme = isDark ? 'dark' : 'light';
                this.appState.set('theme', theme);
                this.applyTheme(theme);
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('themeChange', {
                    detail: { theme }
                }));
            });
        }
        
        // Watch for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (this.appState.get('theme') === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    static applyTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme switch if exists
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) {
            themeSwitch.checked = theme === 'dark';
        }
    }
    
    static handleThemeChange(theme) {
        this.applyTheme(theme);
        this.api.trackInteraction({
            elementType: 'theme',
            action: 'change',
            value: theme
        });
    }
    
    static handleLanguageChange(language) {
        // Update all translatable elements
        document.documentElement.lang = language;
        this.updateTranslations();
        
        this.api.trackInteraction({
            elementType: 'language',
            action: 'change',
            value: language
        });
    }
    
    static updateTranslations() {
        // This would update all text elements with translations
        // For now, we'll just update a few key elements
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = this.i18n.t(key);
            }
        });
    }
    
    static initNavigation() {
        // Enhanced navigation with smooth scrolling and history
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link || link.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href');
            this.scrollToSection(targetId);
            
            // Update navigation state
            this.appState.update('navigation', state => ({
                ...state,
                currentPage: targetId
            }));
        });
        
        // Update active nav item on scroll
        window.addEventListener('scroll', Utils.throttle(() => {
            this.updateActiveNavigation();
        }, CONFIG.THROTTLE_DELAY));
        
        // Mobile navigation toggle
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler) {
            navbarToggler.addEventListener('click', () => {
                this.appState.update('ui', state => ({
                    ...state,
                    sidebarOpen: !state.sidebarOpen
                }));
            });
        }
    }
    
    static scrollToSection(sectionId, offset = 80) {
        const targetElement = document.querySelector(sectionId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - offset,
                behavior: 'smooth'
            });
            
            // Update URL hash without scrolling
            history.pushState(null, null, sectionId);
            
            // Close mobile navbar if open
            const navbarCollapse = document.querySelector('.navbar-collapse.show');
            if (navbarCollapse) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) bsCollapse.hide();
            }
            
            this.trackNavigation(sectionId);
        }
    }
    
    static updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    static initScrollManagement() {
        // Back to top button
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            window.addEventListener('scroll', Utils.throttle(() => {
                backToTopBtn.classList.toggle('show', window.scrollY > 300);
            }, CONFIG.THROTTLE_DELAY));
            
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.trackInteraction('backToTop');
            });
        }
        
        // Save scroll position
        window.addEventListener('scroll', Utils.throttle(() => {
            this.appState.update('navigation', state => ({
                ...state,
                scrollPosition: window.scrollY
            }));
        }, 1000));
        
        // Restore scroll position on page load
        const savedScroll = this.appState.get('navigation').scrollPosition;
        if (savedScroll > 0) {
            setTimeout(() => {
                window.scrollTo(0, savedScroll);
            }, 100);
        }
    }
    
    static initLoadingSystem() {
        // Enhanced loading screen with progress
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        let progress = 0;
        const progressBar = loadingScreen.querySelector('.progress-fill');
        const progressPercent = loadingScreen.querySelector('.progress-percentage');
        
        const updateProgress = (value) => {
            progress = Math.min(progress + value, 100);
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
            
            if (progress >= 100) {
                setTimeout(() => {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 500);
            }
        };
        
        // Simulate loading progress
        const interval = setInterval(() => {
            const increment = 5 + Math.random() * 15;
            updateProgress(increment);
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 100);
        
        // Real loading progress based on actual loading
        window.addEventListener('load', () => {
            updateProgress(30); // Page loaded
        });
    }
    
    static initUIComponents() {
        // Initialize typing effect
        this.initTypingEffect();
        
        // Initialize animated counters
        this.initAnimatedCounters();
        
        // Initialize portfolio filtering
        this.initPortfolioFilter();
        
        // Initialize testimonial slider
        this.initTestimonialSlider();
        
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize popovers
        this.initPopovers();
        
        // Initialize AOS animations
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: CONFIG.ANIMATION_DURATION,
                once: true,
                offset: 100,
                disable: window.innerWidth < 768
            });
        }
    }
    
    static initTypingEffect() {
        const typingText = document.getElementById('typingText');
        if (!typingText) return;
        
        const texts = [
            'Senior Data Analyst',
            'Business Intelligence Expert',
            'Data Visualization Specialist',
            'Predictive Analytics Consultant',
            'Business Strategy Advisor',
            'Machine Learning Practitioner',
            'Data Storytelling Expert',
            'Statistical Analysis Specialist'
        ];
        
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;
        
        const type = () => {
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
        };
        
        setTimeout(type, 1000);
    }
    
    static initAnimatedCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count')) || 0;
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
        this.observers.push(observer);
    }
    
    static initPortfolioFilter() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        const searchInput = document.querySelector('.portfolio-search');
        
        if (filterButtons.length === 0) return;
        
        const filterProjects = (filterValue, searchQuery = '') => {
            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                const title = item.querySelector('.portfolio-title')?.textContent || '';
                const description = item.querySelector('.portfolio-description')?.textContent || '';
                const technologies = item.getAttribute('data-technologies') || '';
                
                // Apply search filter
                const matchesSearch = !searchQuery || 
                    title.toLowerCase().includes(searchQuery) ||
                    description.toLowerCase().includes(searchQuery) ||
                    technologies.toLowerCase().includes(searchQuery);
                
                // Apply category filter
                const matchesCategory = filterValue === 'all' || 
                    category.includes(filterValue);
                
                if (matchesSearch && matchesCategory) {
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
            
            // Update active filter button
            filterButtons.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === filterValue);
            });
            
            // Track interaction
            this.api.trackInteraction({
                elementType: 'portfolioFilter',
                action: 'filter',
                value: filterValue,
                searchQuery: searchQuery
            });
        };
        
        // Category filter
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filterValue = this.getAttribute('data-filter');
                const searchQuery = searchInput?.value.toLowerCase() || '';
                filterProjects(filterValue, searchQuery);
            });
        });
        
        // Search filter
        if (searchInput) {
            const debouncedSearch = Utils.debounce((e) => {
                const searchQuery = e.target.value.toLowerCase();
                const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
                filterProjects(activeFilter, searchQuery);
            }, 300);
            
            searchInput.addEventListener('input', debouncedSearch);
        }
        
        // Initialize with default filter
        const defaultFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
        filterProjects(defaultFilter);
    }
    
    static initTestimonialSlider() {
        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.slider-dots .dot');
        const prevBtn = document.querySelector('.slider-prev');
        const nextBtn = document.querySelector('.slider-next');
        
        if (!slides.length) return;
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        let slideInterval;
        
        const showSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
            
            // Update aria attributes
            slides.forEach((slide, i) => {
                slide.setAttribute('aria-hidden', i !== index ? 'true' : 'false');
            });
            dots.forEach((dot, i) => {
                dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });
        };
        
        const nextSlide = () => {
            showSlide((currentSlide + 1) % totalSlides);
        };
        
        const prevSlide = () => {
            showSlide((currentSlide - 1 + totalSlides) % totalSlides);
        };
        
        const startAutoSlide = () => {
            stopAutoSlide();
            slideInterval = setInterval(nextSlide, 5000);
        };
        
        const stopAutoSlide = () => {
            if (slideInterval) {
                clearInterval(slideInterval);
            }
        };
        
        const resetAutoSlide = () => {
            stopAutoSlide();
            startAutoSlide();
        };
        
        // Initialize
        showSlide(0);
        startAutoSlide();
        
        // Event listeners
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetAutoSlide();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                resetAutoSlide();
            });
        }
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                resetAutoSlide();
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                resetAutoSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                resetAutoSlide();
            }
        });
        
        // Pause on hover
        const sliderContainer = document.querySelector('.testimonials-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', stopAutoSlide);
            sliderContainer.addEventListener('mouseleave', startAutoSlide);
            sliderContainer.addEventListener('focusin', stopAutoSlide);
            sliderContainer.addEventListener('focusout', startAutoSlide);
        }
    }
    
    static initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                trigger: 'hover focus'
            });
        });
    }
    
    static initPopovers() {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
    
    static initForms() {
        this.initContactForm();
        this.initNewsletterForm();
        this.initSearchForms();
    }
    
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
            const originalText = submitBtn.querySelector('span')?.textContent || 'Send Message';
            
            // Disable and show loading state
            submitBtn.disabled = true;
            if (submitBtn.querySelector('span')) {
                submitBtn.querySelector('span').textContent = 'Sending...';
            }
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
                const result = await this.api.submitContact(formData);
                
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
                    
                    // Update app state
                    this.appState.update('form', state => ({
                        ...state,
                        lastSubmission: new Date().toISOString(),
                        submissionsCount: state.submissionsCount + 1
                    }));
                    
                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('formSubmitted', {
                        detail: { formId: 'contact_form', data: formData }
                    }));
                    
                    console.log('=== FORM SUBMISSION SUCCESSFUL ===');
                    
                } else {
                    throw new Error(result.message || result.error || 'Submission failed');
                }
            } catch (error) {
                Utils.showNotification(`Error: ${error.message}. Please try again.`, 'error');
                
                console.error('=== FORM SUBMISSION FAILED ===');
                console.error('Error:', error);
                
                // Log the error for debugging
                this.api.logSystemEvent('ERROR', 'contact', 'submit', 
                    `Contact form submission failed: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                if (submitBtn.querySelector('span')) {
                    submitBtn.querySelector('span').textContent = originalText;
                }
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
        this.initFileUpload();
    }
    
    static initFileUpload() {
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
        
        let totalSize = 0;
        const validFiles = [];
        
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
            
            totalSize += file.size;
            if (totalSize > CONFIG.MAX_TOTAL_FILE_SIZE) {
                Utils.showNotification(
                    `Total file size exceeds ${Utils.formatFileSize(CONFIG.MAX_TOTAL_FILE_SIZE)} limit`, 
                    'error'
                );
                return;
            }
            
            if (validFiles.length >= CONFIG.MAX_FILES_COUNT) {
                Utils.showNotification(`Maximum ${CONFIG.MAX_FILES_COUNT} files allowed`, 'error');
                return;
            }
            
            validFiles.push(file);
            
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
                <button type="button" class="file-remove" onclick="PortfolioUI.removeFile(${index})" aria-label="Remove file">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            filePreview.appendChild(fileItem);
        });
        
        // Update file input with valid files only
        const dt = new DataTransfer();
        validFiles.forEach(file => dt.items.add(file));
        const fileInput = document.getElementById('attachment');
        if (fileInput) {
            fileInput.files = dt.files;
        }
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
                const result = await this.api.subscribeNewsletter(email);
                
                if (result.success) {
                    Utils.showNotification('Successfully subscribed to newsletter!', 'success');
                    emailInput.value = '';
                    
                    // Track conversion
                    this.api.trackConversion('newsletter_subscription', 'engagement');
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
    
    static initSearchForms() {
        // Initialize any search forms in the application
        const searchForms = document.querySelectorAll('form[role="search"]');
        searchForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('input[type="search"]');
                if (input) {
                    this.performSearch(input.value);
                }
            });
        });
    }
    
    static performSearch(query) {
        if (!query.trim()) return;
        
        this.api.trackInteraction({
            elementType: 'search',
            action: 'search',
            value: query
        });
        
        // Implement search functionality
        console.log('Searching for:', query);
        
        // Could implement client-side search or redirect to search results
    }
    
    static async loadInitialData() {
        try {
            this.showLoadingStates();
            
            const data = await this.api.getAllData();
            
            this.updateAllSections(data);
            this.initDynamicComponents();
            this.hideAllLoading();
            
            // Update app state
            this.appState.update('data', state => ({
                ...state,
                loaded: true,
                lastUpdated: new Date().toISOString(),
                cacheSize: this.api.cache.getStats().size
            }));
            
            // Dispatch data loaded event
            window.dispatchEvent(new CustomEvent('dataLoaded', {
                detail: { data }
            }));
            
            // Lazy load images
            this.initLazyLoading();
            
        } catch (error) {
            this.errorHandler.handle(error, 'loadInitialData');
            this.hideAllLoading();
            
            // Show error state
            this.showErrorState();
        }
    }
    
    static showLoadingStates() {
        // Show loading indicators for each section
        const sections = ['portfolio', 'testimonials', 'skills', 'services', 'blog'];
        sections.forEach(sectionId => {
            this.showSectionLoading(sectionId, 'Loading...');
        });
        
        // Show global loading if needed
        this.showGlobalLoading();
    }
    
    static showGlobalLoading() {
        const existing = document.getElementById('globalLoading');
        if (existing) existing.remove();
        
        const loading = document.createElement('div');
        loading.id = 'globalLoading';
        loading.className = 'global-loading';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>Loading portfolio data...</p>
            </div>
        `;
        
        document.body.appendChild(loading);
    }
    
    static hideGlobalLoading() {
        const loading = document.getElementById('globalLoading');
        if (loading) {
            loading.remove();
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
        
        this.hideGlobalLoading();
    }
    
    static showErrorState() {
        // Show error message in main content area
        const mainContent = document.querySelector('main');
        if (mainContent) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-state';
            errorElement.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to Load Data</h3>
                    <p>There was an error loading the portfolio data. Please try refreshing the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Refresh Page
                    </button>
                </div>
            `;
            mainContent.appendChild(errorElement);
        }
    }
    
    static updateAllSections(data) {
        this.updateSection('portfolio', data.projects, this.updatePortfolio);
        this.updateSection('testimonials', data.testimonials, this.updateTestimonials);
        this.updateSection('skills', data.skills, this.updateSkills);
        this.updateSection('experience', data.experience, this.updateExperience);
        this.updateSection('education', data.education, this.updateEducation);
        this.updateSection('certifications', data.certifications, this.updateCertifications);
        this.updateSection('blog', data.blogPosts, this.updateBlogPosts);
        this.updateSection('services', data.services, this.updateServices);
    }
    
    static updateSection(sectionId, data, updateFunction) {
        const section = document.getElementById(sectionId);
        if (section && data && data.length > 0) {
            updateFunction.call(this, data);
        } else if (section && (!data || data.length === 0)) {
            // Show empty state
            this.showEmptyState(section);
        }
    }
    
    static showEmptyState(section) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-content">
                <i class="fas fa-inbox"></i>
                <h4>No Data Available</h4>
                <p>There's no data to display in this section.</p>
            </div>
        `;
        section.appendChild(emptyState);
    }
    
    static updatePortfolio(projects) {
        const portfolioGrid = document.getElementById('portfolioGrid');
        if (!portfolioGrid) return;
        
        portfolioGrid.innerHTML = '';
        
        projects.forEach((project, index) => {
            const card = AdvancedUIComponents.createProjectCard(project, {
                compact: window.innerWidth < 768
            });
            portfolioGrid.innerHTML += card;
        });
        
        // Reinitialize filtering
        this.initPortfolioFilter();
        
        // Setup lazy loading for images
        this.setupLazyLoadImages(portfolioGrid);
    }
    
    static updateTestimonials(testimonials) {
        const sliderContainer = document.querySelector('.slider-container');
        if (!sliderContainer) return;
        
        sliderContainer.innerHTML = '';
        
        testimonials.slice(0, 5).forEach((testimonial, index) => {
            sliderContainer.innerHTML += AdvancedUIComponents.createTestimonialCard(testimonial, index);
        });
        
        // Reinitialize slider
        this.initTestimonialSlider();
    }
    
    static updateSkills(skills) {
        const skillBars = document.querySelector('.skill-bars');
        if (!skillBars) return;
        
        skillBars.innerHTML = '';
        
        skills.slice(0, 8).forEach(skill => {
            skillBars.innerHTML += AdvancedUIComponents.createSkillBar(skill, {
                animated: true,
                showDescription: true
            });
        });
        
        // Animate skill bars
        setTimeout(() => {
            document.querySelectorAll('.progress-bar[data-width]').forEach(bar => {
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
        
        experience.forEach((exp, index) => {
            const startYear = new Date(exp.start_date).getFullYear();
            const endYear = exp.current ? 'Present' : new Date(exp.end_date).getFullYear();
            
            timeline.innerHTML += `
                <div class="timeline-item" data-aos="fade-up" data-aos-delay="${index * 50}">
                    <div class="timeline-marker">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <h3 class="timeline-title">${exp.job_title}</h3>
                            <span class="timeline-period">${startYear} - ${endYear}</span>
                        </div>
                        <div class="timeline-company">${exp.company}</div>
                        <p class="timeline-description">${exp.description}</p>
                        ${exp.technologies ? `
                            <div class="timeline-technologies">
                                ${exp.technologies.split(',').map(tech => `
                                    <span class="tech-tag">${tech.trim()}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    static updateEducation(education) {
        const educationTimeline = document.querySelector('.education-timeline');
        if (!educationTimeline) return;
        
        educationTimeline.innerHTML = '';
        
        education.forEach((edu, index) => {
            const startYear = new Date(edu.start_date).getFullYear();
            const endYear = new Date(edu.end_date).getFullYear();
            
            educationTimeline.innerHTML += `
                <div class="education-item" data-aos="fade-up" data-aos-delay="${index * 50}">
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
                        ${edu.gpa || edu.honors ? `
                            <div class="education-achievements">
                                ${edu.gpa ? `<span class="achievement">GPA: ${edu.gpa}</span>` : ''}
                                ${edu.honors ? `<span class="achievement">${edu.honors}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    static updateCertifications(certifications) {
        const certsGrid = document.querySelector('.certifications-grid');
        if (!certsGrid) return;
        
        certsGrid.innerHTML = '';
        
        certifications.forEach((cert, index) => {
            const issueYear = new Date(cert.issue_date).getFullYear();
            const expiryYear = cert.expiry_date ? new Date(cert.expiry_date).getFullYear() : null;
            
            certsGrid.innerHTML += `
                <div class="cert-card" data-aos="fade-up" data-aos-delay="${index * 50}">
                    <div class="cert-icon">
                        <i class="fas fa-award"></i>
                    </div>
                    <div class="cert-content">
                        <h4>${cert.name}</h4>
                        <p class="cert-issuer">${cert.issuer}</p>
                        <div class="cert-dates">
                            <span class="cert-date">Issued: ${issueYear}</span>
                            ${expiryYear ? `<span class="cert-expiry">Expires: ${expiryYear}</span>` : ''}
                        </div>
                        ${cert.credential_id ? `
                            <div class="credential-id">ID: ${cert.credential_id}</div>
                        ` : ''}
                        ${cert.verification_url ? `
                            <a href="${cert.verification_url}" class="cert-verify" target="_blank" rel="noopener">
                                <i class="fas fa-external-link-alt"></i> Verify
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    static updateBlogPosts(posts) {
        const blogGrid = document.querySelector('.blog-grid .row');
        if (!blogGrid) return;
        
        blogGrid.innerHTML = '';
        
        posts.forEach((post, index) => {
            blogGrid.innerHTML += AdvancedUIComponents.createBlogCard(post, {
                compact: window.innerWidth < 768
            });
        });
    }
    
    static updateServices(services) {
        const servicesGrid = document.querySelector('.services-grid .row');
        if (!servicesGrid) return;
        
        servicesGrid.innerHTML = '';
        
        services.forEach((service, index) => {
            servicesGrid.innerHTML += AdvancedUIComponents.createServiceCard(service, index, {
                compact: window.innerWidth < 768
            });
        });
    }
    
    static initDynamicComponents() {
        // Initialize any dynamic components that need data
        this.initStatsCounters();
        this.initInteractiveElements();
    }
    
    static initStatsCounters() {
        // Counters for stats like projects completed, clients served, etc.
        const stats = [
            { element: '#projectsCount', value: 24, label: 'Projects Completed' },
            { element: '#clientsCount', value: 18, label: 'Happy Clients' },
            { element: '#experienceCount', value: 5, label: 'Years Experience' },
            { element: '#certificationsCount', value: 8, label: 'Certifications' }
        ];
        
        stats.forEach(stat => {
            const element = document.querySelector(stat.element);
            if (element) {
                this.animateCounter(element, stat.value);
            }
        });
    }
    
    static animateCounter(element, targetValue) {
        const duration = 2000;
        const increment = targetValue / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < targetValue) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue;
            }
        };
        
        updateCounter();
    }
    
    static initInteractiveElements() {
        // Add hover effects, click handlers, etc.
        document.querySelectorAll('.interactive-element').forEach(element => {
            element.addEventListener('click', () => {
                this.handleInteractiveClick(element);
            });
        });
    }
    
    static handleInteractiveClick(element) {
        const action = element.getAttribute('data-action');
        const value = element.getAttribute('data-value');
        
        switch (action) {
            case 'show-modal':
                this.showCustomModal(value);
                break;
            case 'toggle-content':
                this.toggleContent(element);
                break;
            case 'copy-text':
                this.copyText(element);
                break;
            default:
                console.log('Interactive click:', action, value);
        }
    }
    
    static showCustomModal(contentId) {
        const content = document.getElementById(contentId);
        if (content) {
            const modal = AdvancedUIComponents.createModal({
                title: content.getAttribute('data-title') || 'Details',
                content: content.innerHTML,
                size: 'modal-lg'
            });
            modal.show();
        }
    }
    
    static toggleContent(element) {
        const targetId = element.getAttribute('data-target');
        const target = document.querySelector(targetId);
        if (target) {
            target.classList.toggle('show');
        }
    }
    
    static copyText(element) {
        const text = element.getAttribute('data-text') || element.textContent;
        AdvancedUtils.copyToClipboard(text)
            .then(() => {
                AdvancedUIComponents.createNotification({
                    type: 'success',
                    message: 'Copied to clipboard!'
                });
            })
            .catch(() => {
                AdvancedUIComponents.createNotification({
                    type: 'error',
                    message: 'Failed to copy'
                });
            });
    }
    
    static initLazyLoading() {
        // Setup lazy loading for images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.lazyLoadObserver.observe(img);
        });
        
        // Setup lazy loading for components
        const lazyComponents = document.querySelectorAll('[data-lazy-load]');
        lazyComponents.forEach(component => {
            this.animationObserver.observe(component);
        });
    }
    
    static setupLazyLoadImages(container) {
        const images = container.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.lazyLoadObserver.observe(img);
        });
    }
    
    static setupSEO() {
        // Set meta tags
        document.title = CONFIG.SEO_META.title;
        
        const metaTags = {
            'description': CONFIG.SEO_META.description,
            'keywords': CONFIG.SEO_META.keywords,
            'author': CONFIG.SEO_META.author,
            'robots': CONFIG.SEO_META.robots,
            'og:title': CONFIG.SEO_META.title,
            'og:description': CONFIG.SEO_META.description,
            'og:image': CONFIG.SEO_META.ogImage,
            'og:type': CONFIG.SEO_META.ogType,
            'twitter:card': CONFIG.SEO_META.twitterCard,
            'twitter:title': CONFIG.SEO_META.title,
            'twitter:description': CONFIG.SEO_META.description,
            'twitter:image': CONFIG.SEO_META.ogImage
        };
        
        Object.entries(metaTags).forEach(([name, content]) => {
            let meta = document.querySelector(`meta[name="${name}"]`) || 
                      document.querySelector(`meta[property="${name}"]`);
            
            if (!meta) {
                meta = document.createElement('meta');
                if (name.startsWith('og:') || name.startsWith('twitter:')) {
                    meta.setAttribute('property', name);
                } else {
                    meta.setAttribute('name', name);
                }
                document.head.appendChild(meta);
            }
            
            meta.setAttribute('content', content);
        });
        
        // Add structured data
        this.addStructuredData();
    }
    
    static addStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Silas Enoku",
            "jobTitle": "Senior Data Analyst & Business Intelligence Expert",
            "description": CONFIG.SEO_META.description,
            "url": window.location.origin,
            "sameAs": Object.values(CONFIG.SOCIAL_LINKS)
        };
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }
    
    static setupViewport() {
        // Ensure viewport is set correctly
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover';
            document.head.appendChild(viewport);
        }
    }
    
    static setupPWA() {
        // PWA setup
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        console.log('ServiceWorker registration successful:', registration.scope);
                    },
                    (error) => {
                        console.log('ServiceWorker registration failed:', error);
                    }
                );
            });
        }
        
        // Add to home screen prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallPrompt();
        });
    }
    
    static showInstallPrompt() {
        const installButton = document.createElement('button');
        installButton.id = 'installButton';
        installButton.className = 'install-prompt';
        installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            padding: 10px 20px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        `;
        
        installButton.addEventListener('click', async () => {
            if (!window.deferredPrompt) return;
            
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            window.deferredPrompt = null;
            installButton.remove();
        });
        
        document.body.appendChild(installButton);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installButton.parentNode) {
                installButton.remove();
            }
        }, 10000);
    }
    
    static setupAnalytics() {
        // Track page views
        this.trackPageView();
        
        // Track user interactions
        this.setupInteractionTracking();
        
        // Track performance
        this.setupPerformanceTracking();
    }
    
    static trackPageView() {
        if (!this.api || !CONFIG.ANALYTICS_ENABLED) return;
        
        const pageData = {
            pageUrl: window.location.href,
            pageTitle: document.title,
            pagePath: window.location.pathname + window.location.hash,
            referrer: document.referrer || '',
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            userAgent: navigator.userAgent.substring(0, 500),
            loadTime: window.performance.timing ? 
                window.performance.timing.loadEventEnd - window.performance.timing.navigationStart : 0,
            deviceType: AdvancedUtils.getDeviceType(),
            browserInfo: AdvancedUtils.getBrowserInfo()
        };
        
        this.api.trackPageView(pageData);
        
        // Update app state
        this.appState.update('session', state => ({
            ...state,
            pageViews: state.pageViews + 1
        }));
    }
    
    static setupInteractionTracking() {
        // Track clicks on important elements
        const trackableSelectors = [
            'a[href^="#"]',
            '.btn-primary',
            '.portfolio-btn',
            '.service-btn',
            '.blog-link',
            '.filter-btn',
            '.nav-link'
        ];
        
        document.addEventListener('click', (e) => {
            const element = e.target.closest(trackableSelectors.join(','));
            if (element && this.api) {
                const elementType = element.tagName.toLowerCase();
                const elementId = element.id || element.className || element.textContent.substring(0, 50);
                const action = 'click';
                
                this.api.trackInteraction({
                    elementType,
                    elementId,
                    action,
                    value: element.textContent.substring(0, 100)
                });
                
                // Update app state
                this.appState.update('session', state => ({
                    ...state,
                    interactions: state.interactions + 1
                }));
            }
        });
    }
    
    static setupPerformanceTracking() {
        if (!CONFIG.PERFORMANCE_MONITORING) return;
        
        // Report performance metrics periodically
        setInterval(() => {
            const metrics = this.performanceMonitor.getMetrics();
            if (this.api) {
                this.api.logSystemEvent('INFO', 'performance', 'metrics', 'Performance metrics', metrics);
            }
        }, 60000); // Every minute
    }
    
    static setupOfflineSupport() {
        if (!CONFIG.OFFLINE_SUPPORT) return;
        
        // Cache critical assets
        this.cacheCriticalAssets();
        
        // Setup offline detection
        this.setupOfflineDetection();
        
        // Setup background sync (if supported)
        this.setupBackgroundSync();
    }
    
    static cacheCriticalAssets() {
        // Cache critical CSS, JS, and images
        const criticalAssets = [
            '/css/main.css',
            '/js/main.js',
            '/images/logo.png',
            '/images/favicon.ico'
        ];
        
        if ('caches' in window) {
            caches.open('portfolio-critical').then(cache => {
                cache.addAll(criticalAssets);
            });
        }
    }
    
    static setupOfflineDetection() {
        // Already handled by API class, but we can add UI enhancements
        window.addEventListener('online', () => {
            AdvancedUIComponents.createNotification({
                type: 'success',
                message: 'You are back online. Syncing data...',
                duration: 3000
            });
        });
        
        window.addEventListener('offline', () => {
            AdvancedUIComponents.createNotification({
                type: 'warning',
                message: 'You are offline. Some features may be limited.',
                duration: 5000
            });
        });
    }
    
    static setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            // Register background sync for form submissions
            navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('submit-forms');
            });
        }
    }
    
    static trackNavigation(targetId) {
        if (this.api) {
            this.api.trackInteraction({
                elementType: 'navigation',
                elementId: 'section-link',
                action: 'click',
                value: targetId
            });
        }
    }
    
    static trackInteraction(elementId) {
        if (this.api) {
            this.api.trackInteraction({
                elementType: 'button',
                elementId: elementId,
                action: 'click',
                value: 'clicked'
            });
        }
    }
    
    static handleGlobalError(errorData) {
        // Log to console in debug mode
        if (CONFIG.DEBUG_MODE) {
            console.error('Global error:', errorData);
        }
        
        // Update error state in UI if needed
        if (errorData.context.includes('critical')) {
            this.showErrorState();
        }
    }
    
    static exposeDebugTools() {
        window.debug = {
            // API tools
            api: this.api,
            
            // State tools
            state: this.appState,
            getState: () => this.appState.export(),
            setState: (state) => this.appState.import(state),
            resetState: () => this.appState.reset(),
            
            // Cache tools
            clearCache: () => this.api.clearCache(),
            cacheStats: () => this.api.getCacheStatistics(),
            
            // Performance tools
            performance: this.performanceMonitor,
            getMetrics: () => this.performanceMonitor.getMetrics(),
            
            // Error tools
            errors: this.errorHandler,
            getErrors: () => this.errorHandler.getErrors(),
            clearErrors: () => this.errorHandler.clearErrors(),
            
            // UI tools
            ui: this,
            refreshData: () => this.loadInitialData(),
            
            // Utility tools
            utils: AdvancedUtils,
            createNotification: (options) => AdvancedUIComponents.createNotification(options),
            createModal: (options) => AdvancedUIComponents.createModal(options),
            
            // Test tools
            testForm: () => {
                const testData = {
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '1234567890',
                    company: 'Test Company',
                    subject: 'Test Message',
                    message: 'This is a test message from debug tools.',
                    service: 'data-analysis',
                    budget: '5000-10000',
                    timeline: '2 weeks',
                    urgency: 'medium'
                };
                
                console.log('Test form data:', testData);
                return testData;
            }
        };
        
        console.log('Debug tools available at window.debug');
    }
    
    // Modal methods remain similar
    static async showProjectModal(projectId) {
        try {
            const projects = await this.api.getProjects();
            const project = projects.data.find(p => p.id === projectId);
            
            if (!project) {
                Utils.showNotification('Project not found', 'error');
                return;
            }
            
            const modalContent = AdvancedUIComponents.createModal({
                title: project.title,
                content: this.createProjectModalContent(project),
                size: 'modal-xl',
                showFooter: true,
                footerContent: `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="PortfolioUI.scrollToContact('${project.title}')">
                        <i class="fas fa-paper-plane"></i> Discuss Project
                    </button>
                `
            });
            
            modalContent.show();
            
            this.api.trackInteraction({
                elementType: 'modal',
                elementId: 'projectModal',
                action: 'open',
                value: project.title
            });
            
        } catch (error) {
            this.errorHandler.handle(error, 'showProjectModal');
            Utils.showNotification('Error loading project details', 'error');
        }
    }
    
    static createProjectModalContent(project) {
        const categories = project.category ? project.category.split(',').map(cat => cat.trim()) : [];
        const technologies = project.technologies ? project.technologies.split(',').map(tech => tech.trim()) : [];
        const outcomes = project.outcomes ? project.outcomes.split(',').map(outcome => outcome.trim()) : [];
        
        return `
            <div class="project-modal-content">
                <div class="project-hero">
                    <img src="${project.featured_image || 'https://via.placeholder.com/1200x600'}" 
                         alt="${project.title}"
                         class="img-fluid rounded">
                </div>
                
                <div class="project-details mt-4">
                    <div class="row">
                        <div class="col-lg-8">
                            <h2 class="mb-3">${project.title}</h2>
                            <p class="lead">${project.subtitle || ''}</p>
                            
                            <div class="project-description mb-4">
                                <h4>Overview</h4>
                                <p>${project.description || ''}</p>
                            </div>
                            
                            ${project.challenges ? `
                            <div class="project-challenges mb-4">
                                <h4>Challenges</h4>
                                <p>${project.challenges}</p>
                            </div>
                            ` : ''}
                            
                            ${project.solutions ? `
                            <div class="project-solutions mb-4">
                                <h4>Solutions</h4>
                                <p>${project.solutions}</p>
                            </div>
                            ` : ''}
                            
                            ${outcomes.length > 0 ? `
                            <div class="project-outcomes mb-4">
                                <h4>Results & Outcomes</h4>
                                <ul class="list-unstyled">
                                    ${outcomes.map(outcome => `
                                        <li class="mb-2">
                                            <i class="fas fa-check-circle text-success me-2"></i>
                                            ${outcome}
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="col-lg-4">
                            <div class="project-sidebar">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">Project Details</h5>
                                        
                                        <div class="project-meta mb-3">
                                            ${project.client ? `
                                                <div class="meta-item mb-2">
                                                    <i class="fas fa-building me-2"></i>
                                                    <strong>Client:</strong> ${project.client}
                                                </div>
                                            ` : ''}
                                            
                                            ${project.duration ? `
                                                <div class="meta-item mb-2">
                                                    <i class="fas fa-clock me-2"></i>
                                                    <strong>Duration:</strong> ${project.duration}
                                                </div>
                                            ` : ''}
                                            
                                            ${project.budget_range ? `
                                                <div class="meta-item mb-2">
                                                    <i class="fas fa-dollar-sign me-2"></i>
                                                    <strong>Budget:</strong> ${project.budget_range}
                                                </div>
                                            ` : ''}
                                            
                                            ${project.status ? `
                                                <div class="meta-item mb-2">
                                                    <i class="fas fa-check-circle me-2"></i>
                                                    <strong>Status:</strong> ${project.status}
                                                </div>
                                            ` : ''}
                                        </div>
                                        
                                        <div class="project-categories mb-3">
                                            <h6>Categories</h6>
                                            <div class="d-flex flex-wrap gap-2">
                                                ${categories.map(cat => `
                                                    <span class="badge bg-primary">${cat}</span>
                                                `).join('')}
                                            </div>
                                        </div>
                                        
                                        ${technologies.length > 0 ? `
                                            <div class="project-technologies">
                                                <h6>Technologies Used</h6>
                                                <div class="d-flex flex-wrap gap-2">
                                                    ${technologies.map(tech => `
                                                        <span class="badge bg-secondary">${tech}</span>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                ${project.live_url || project.github_url ? `
                                    <div class="card mt-3">
                                        <div class="card-body">
                                            <h5 class="card-title">Links</h5>
                                            <div class="d-flex gap-2">
                                                ${project.live_url ? `
                                                    <a href="${project.live_url}" 
                                                       class="btn btn-outline-primary btn-sm" 
                                                       target="_blank" rel="noopener">
                                                        <i class="fas fa-external-link-alt me-1"></i> Live Demo
                                                    </a>
                                                ` : ''}
                                                
                                                ${project.github_url ? `
                                                    <a href="${project.github_url}" 
                                                       class="btn btn-outline-dark btn-sm" 
                                                       target="_blank" rel="noopener">
                                                        <i class="fab fa-github me-1"></i> View Code
                                                    </a>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    static async showServiceModal(serviceId) {
        try {
            const services = await this.api.getServices();
            const service = services.find(s => s.id === serviceId);
            
            if (!service) {
                Utils.showNotification('Service not found', 'error');
                return;
            }
            
            const modalContent = AdvancedUIComponents.createModal({
                title: service.name,
                content: this.createServiceModalContent(service),
                size: 'modal-lg',
                showFooter: true,
                footerContent: `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="PortfolioUI.scrollToContact('${service.name}')">
                        <i class="fas fa-paper-plane"></i> Get Started
                    </button>
                `
            });
            
            modalContent.show();
            
            this.api.trackInteraction({
                elementType: 'modal',
                elementId: 'serviceModal',
                action: 'open',
                value: service.name
            });
            
        } catch (error) {
            this.errorHandler.handle(error, 'showServiceModal');
            Utils.showNotification('Error loading service details', 'error');
        }
    }
    
    static createServiceModalContent(service) {
        const features = service.features ? service.features.split(',').map(f => f.trim()) : [];
        
        return `
            <div class="service-modal-content">
                <div class="service-header text-center mb-4">
                    <div class="service-icon-large mb-3">
                        <i class="${service.icon_class || 'fas fa-cogs'} fa-3x"></i>
                    </div>
                    <h2>${service.name}</h2>
                    <p class="lead">${service.tagline || ''}</p>
                </div>
                
                <div class="service-description-detailed mb-4">
                    <h4>Overview</h4>
                    <p>${service.description}</p>
                </div>
                
                ${features.length > 0 ? `
                    <div class="service-features-detailed mb-4">
                        <h4>What's Included</h4>
                        <ul class="list-unstyled">
                            ${features.map(feature => `
                                <li class="mb-2">
                                    <i class="fas fa-check text-success me-2"></i>
                                    ${feature}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="service-pricing mb-4">
                            <h4>Pricing & Timeline</h4>
                            <div class="pricing-details">
                                <div class="pricing-item mb-3">
                                    <i class="fas fa-clock fa-2x text-primary me-3"></i>
                                    <div>
                                        <strong>Duration</strong>
                                        <p class="mb-0">${service.duration || 'Custom timeline based on project scope'}</p>
                                    </div>
                                </div>
                                <div class="pricing-item">
                                    <i class="fas fa-dollar-sign fa-2x text-primary me-3"></i>
                                    <div>
                                        <strong>Investment</strong>
                                        <p class="mb-0">${service.starting_price ? `Starting from $${service.starting_price}` : 'Custom quote based on requirements'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="service-benefits mb-4">
                            <h4>Benefits</h4>
                            <ul class="list-unstyled">
                                ${service.benefits ? service.benefits.split(',').map(benefit => `
                                    <li class="mb-2">
                                        <i class="fas fa-star text-warning me-2"></i>
                                        ${benefit.trim()}
                                    </li>
                                `).join('') : `
                                    <li class="mb-2">
                                        <i class="fas fa-star text-warning me-2"></i>
                                        Professional quality work
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-star text-warning me-2"></i>
                                        Timely delivery
                                    </li>
                                    <li class="mb-2">
                                        <i class="fas fa-star text-warning me-2"></i>
                                        Ongoing support
                                    </li>
                                `}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="service-cta text-center mt-4 p-4 bg-light rounded">
                    <h4 class="mb-3">Ready to get started with ${service.name}?</h4>
                    <p class="mb-4">Let's discuss how I can help you achieve your goals.</p>
                    <button class="btn btn-primary btn-lg" onclick="PortfolioUI.scrollToContact('${service.name}')">
                        <i class="fas fa-paper-plane me-2"></i>
                        Request a Free Consultation
                    </button>
                </div>
            </div>
        `;
    }
    
    static scrollToContact(service = '') {
        // Close any open modals
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
        
        // Scroll to contact section
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            window.scrollTo({
                top: contactSection.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Pre-fill service field if provided
            if (service) {
                setTimeout(() => {
                    const serviceSelect = document.getElementById('service');
                    if (serviceSelect) {
                        // Try to find matching option
                        const options = Array.from(serviceSelect.options);
                        const matchingOption = options.find(opt => 
                            opt.text.toLowerCase().includes(service.toLowerCase())
                        );
                        if (matchingOption) {
                            serviceSelect.value = matchingOption.value;
                        }
                    }
                }, 500);
            }
        }
    }
}

// ============ EXTENDED INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize performance monitor
        const performanceMonitor = new PerformanceMonitor();
        
        // Initialize API with enhanced features
        const api = new EnhancedPortfolioAPI();
        
        // Initialize enhanced UI
        EnhancedPortfolioUI.init(api, {
            performanceMonitor: performanceMonitor
        });
        
        // Expose objects globally for debugging
        if (CONFIG.DEBUG_MODE) {
            window.PortfolioAPI = api;
            window.PortfolioUI = EnhancedPortfolioUI;
            window.AdvancedUtils = AdvancedUtils;
            window.AdvancedUIComponents = AdvancedUIComponents;
            window.PerformanceMonitor = performanceMonitor;
            
            console.log('=== DEBUG MODE ENABLED ===');
            console.log('Version:', CONFIG.VERSION);
            console.log('Environment:', CONFIG.ENVIRONMENT);
            console.log('Debug tools available at window.debug');
        }
        
        // Log initialization
        api.logSystemEvent('INFO', 'app', 'DOMContentLoaded', 'Portfolio application fully loaded', {
            version: CONFIG.VERSION,
            environment: CONFIG.ENVIRONMENT,
            debugMode: CONFIG.DEBUG_MODE,
            analyticsEnabled: CONFIG.ANALYTICS_ENABLED,
            performanceMonitoring: CONFIG.PERFORMANCE_MONITORING,
            offlineSupport: CONFIG.OFFLINE_SUPPORT
        });
        
        // Check health
        setTimeout(async () => {
            const health = await api.healthCheck();
            if (health.online) {
                console.log('API Health:', health);
            } else {
                console.warn('API is offline:', health.error);
            }
        }, 2000);
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        Utils.showNotification('Failed to initialize application. Please refresh the page.', 'error');
        
        // Fallback to basic initialization if enhanced fails
        try {
            const api = new PortfolioAPI();
            PortfolioUI.init(api);
        } catch (fallbackError) {
            console.error('Fallback initialization also failed:', fallbackError);
        }
    }
});

// ============ EXTENDED GLOBAL ERROR HANDLING ============
window.addEventListener('error', function(event) {
    const errorDetails = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.toString() : 'Unknown error',
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    
    console.error('Global error:', errorDetails);
    
    if (window.ErrorHandler) {
        window.ErrorHandler.handle(event.error, 'global.error', errorDetails);
    } else if (window.PortfolioAPI) {
        window.PortfolioAPI.logSystemEvent('ERROR', 'global', 'error', 'Uncaught error occurred', errorDetails);
    }
});

window.addEventListener('unhandledrejection', function(event) {
    const errorDetails = {
        reason: event.reason ? event.reason.toString() : 'Unknown rejection',
        promise: event.promise,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    
    console.error('Unhandled promise rejection:', errorDetails);
    
    if (window.ErrorHandler) {
        window.ErrorHandler.handle(event.reason, 'global.unhandledrejection', errorDetails);
    } else if (window.PortfolioAPI) {
        window.PortfolioAPI.logSystemEvent('ERROR', 'global', 'unhandledrejection', 
            'Unhandled promise rejection', errorDetails);
    }
});

// ============ EXTENDED CSS STYLES ============
const extendedStyles = document.createElement('style');
extendedStyles.textContent = `
/* Extended Notification Styles */
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

.notification-top-right {
    top: 20px;
    right: 20px;
    left: auto;
}

.notification-top-left {
    top: 20px;
    left: 20px;
    right: auto;
}

.notification-bottom-right {
    bottom: 20px;
    right: 20px;
    top: auto;
}

.notification-bottom-left {
    bottom: 20px;
    left: 20px;
    top: auto;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.notification-icon {
    font-size: 1.2em;
}

.notification-body {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    margin-bottom: 4px;
}

.notification-message {
    font-size: 0.9em;
    opacity: 0.9;
}

.notification-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 10px;
}

.notification-action {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    transition: background 0.2s;
}

.notification-action:hover {
    background: rgba(255, 255, 255, 0.3);
}

.notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    opacity: 0.8;
    transition: opacity 0.2s;
}

.notification-close:hover {
    opacity: 1;
}

/* Loading Overlay */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity 0.3s;
}

.loading-content {
    text-align: center;
    color: white;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

.loading-message {
    font-size: 1.1em;
    margin-top: 10px;
}

.global-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    backdrop-filter: blur(3px);
}

.section-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    transition: opacity 0.3s;
}

.section-loading .loading-spinner {
    width: 40px;
    height: 40px;
    border-width: 2px;
    margin-bottom: 10px;
}

/* Error States */
.error-state {
    padding: 60px 20px;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
}

.error-content {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.error-content i {
    font-size: 48px;
    color: #ef4444;
    margin-bottom: 20px;
}

.error-content h3 {
    margin-bottom: 10px;
    color: #1f2937;
}

.error-content p {
    color: #6b7280;
    margin-bottom: 25px;
    line-height: 1.6;
}

.error-content .btn {
    padding: 10px 25px;
    font-weight: 500;
}

/* Empty States */
.empty-state {
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
}

.empty-content {
    max-width: 400px;
    margin: 0 auto;
}

.empty-content i {
    font-size: 48px;
    color: #d1d5db;
    margin-bottom: 20px;
}

.empty-content h4 {
    margin-bottom: 10px;
    color: #4b5563;
}

.empty-content p {
    margin-bottom: 0;
}

/* File Upload Styles */
.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    background: #f3f4f6;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: background 0.2s;
}

.file-item:hover {
    background: #e5e7eb;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.file-icon {
    color: #6b7280;
    font-size: 1.2em;
}

.file-details {
    flex: 1;
    min-width: 0;
}

.file-name {
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1f2937;
}

.file-size {
    font-size: 12px;
    color: #6b7280;
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
}

.file-remove:hover {
    background: rgba(239, 68, 68, 0.1);
}

.upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: #f9fafb;
}

.upload-area:hover {
    border-color: #2563eb;
    background: #f0f7ff;
}

.upload-area.dragover {
    border-color: #2563eb;
    background: #f0f7ff;
    transform: scale(1.02);
}

.upload-hint {
    color: #6b7280;
    font-size: 0.9em;
    margin-top: 8px;
}

/* Field Validation */
.field-error {
    color: #ef4444;
    font-size: 12px;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.field-error::before {
    content: '⚠';
}

input.error,
textarea.error,
select.error {
    border-color: #ef4444 !important;
    background-color: #fef2f2;
}

input.error:focus,
textarea.error:focus,
select.error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Form Validation */
.form-validation {
    margin-top: 5px;
}

.form-validation.error {
    color: #ef4444;
    font-size: 12px;
}

.form-validation.success {
    color: #10b981;
    font-size: 12px;
}

/* Dark Theme Support */
[data-theme="dark"] .notification {
    background: #374151;
}

[data-theme="dark"] .notification-success {
    background: #065f46;
}

[data-theme="dark"] .notification-error {
    background: #7f1d1d;
}

[data-theme="dark"] .notification-warning {
    background: #92400e;
}

[data-theme="dark"] .notification-info {
    background: #1e40af;
}

[data-theme="dark"] .loading-overlay {
    background: rgba(0, 0, 0, 0.9);
}

[data-theme="dark"] .section-loading {
    background: rgba(0, 0, 0, 0.8);
}

[data-theme="dark"] .global-loading {
    background: rgba(0, 0, 0, 0.8);
}

[data-theme="dark"] .error-content {
    background: #1f2937;
    color: #f3f4f6;
}

[data-theme="dark"] .error-content h3 {
    color: #f3f4f6;
}

[data-theme="dark"] .error-content p {
    color: #d1d5db;
}

[data-theme="dark"] .file-item {
    background: #374151;
}

[data-theme="dark"] .file-item:hover {
    background: #4b5563;
}

[data-theme="dark"] .file-name {
    color: #f3f4f6;
}

[data-theme="dark"] .file-size {
    color: #9ca3af;
}

[data-theme="dark"] .upload-area {
    background: #1f2937;
    border-color: #4b5563;
}

[data-theme="dark"] .upload-area:hover {
    background: #374151;
    border-color: #2563eb;
}

[data-theme="dark"] .upload-area.dragover {
    background: #374151;
    border-color: #2563eb;
}

[data-theme="dark"] input.error,
[data-theme="dark"] textarea.error,
[data-theme="dark"] select.error {
    background-color: #7f1d1d;
    border-color: #ef4444;
}

/* Animations */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

@keyframes slideOutRight {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
}

@keyframes slideInUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

@keyframes slideOutDown {
    from { transform: translateY(0); }
    to { transform: translateY(100%); }
}

/* Progress Bar Animations */
.progress-fill.animated {
    transition: width 1.5s ease-in-out;
}

/* Counter Animation */
@keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.stat-number {
    animation: countUp 0.5s ease-out;
}

/* Hover Effects */
.portfolio-item {
    transition: all 0.3s ease;
}

.portfolio-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.service-card {
    transition: all 0.3s ease;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.blog-card {
    transition: all 0.3s ease;
}

.blog-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .notification {
        max-width: calc(100% - 40px);
        left: 20px;
        right: 20px;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
    }
    
    .upload-area {
        padding: 30px 15px;
    }
    
    .file-item {
        padding: 8px 12px;
    }
    
    .portfolio-item:hover {
        transform: none;
    }
}

@media (max-width: 576px) {
    .notification {
        padding: 12px 16px;
    }
    
    .notification-actions {
        flex-direction: column;
        gap: 4px;
    }
    
    .error-content {
        padding: 30px 20px;
    }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
    .notification,
    .loading-overlay,
    .section-loading,
    .portfolio-item,
    .service-card,
    .blog-card,
    .progress-fill,
    .stat-number {
        transition: none !important;
        animation: none !important;
    }
}

/* Focus Styles for Accessibility */
button:focus,
input:focus,
textarea:focus,
select:focus,
a:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
}

button:focus:not(:focus-visible),
input:focus:not(:focus-visible),
textarea:focus:not(:focus-visible),
select:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
    outline: none;
}

/* Print Styles */
@media print {
    .notification,
    .loading-overlay,
    .global-loading,
    .section-loading,
    .upload-area,
    .file-remove {
        display: none !important;
    }
    
    .portfolio-item,
    .service-card,
    .blog-card {
        break-inside: avoid;
        box-shadow: none !important;
        transform: none !important;
    }
}
`;

document.head.appendChild(extendedStyles);

// ============ SERVICE WORKER REGISTRATION ============
if ('serviceWorker' in navigator && CONFIG.PWA_ENABLED) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    });
}

// ============ INSTALL PROMPT ============
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt after 5 seconds
    setTimeout(() => {
        if (deferredPrompt) {
            EnhancedPortfolioUI.showInstallPrompt();
        }
    }, 5000);
});

// ============ OFFLINE DETECTION ENHANCEMENT ============
if (CONFIG.OFFLINE_SUPPORT) {
    window.addEventListener('online', () => {
        // Sync data when coming back online
        if (window.PortfolioAPI) {
            window.PortfolioAPI.syncData().catch(console.error);
        }
    });
}

// ============ VISIBILITY CHANGE HANDLER ============
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Page became visible again
        if (window.PortfolioUI) {
            // Refresh data if stale
            const lastUpdate = window.PortfolioUI.appState?.get('data').lastUpdated;
            if (lastUpdate) {
                const minutesSinceUpdate = (Date.now() - new Date(lastUpdate)) / (1000 * 60);
                if (minutesSinceUpdate > 5) {
                    window.PortfolioUI.loadInitialData().catch(console.error);
                }
            }
        }
    }
});

// ============ NETWORK STATUS MONITOR ============
if ('connection' in navigator) {
    const connection = navigator.connection;
    if (connection) {
        connection.addEventListener('change', () => {
            const networkInfo = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
            
            if (window.PortfolioAPI) {
                window.PortfolioAPI.logSystemEvent('INFO', 'network', 'connectionChange', 
                    'Network connection changed', networkInfo);
            }
        });
    }
}

console.log('Enhanced Portfolio System Loaded - Version', CONFIG.VERSION);
