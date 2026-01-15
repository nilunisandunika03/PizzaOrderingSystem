import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// CSRF Token Management
let csrfToken = null;

/**
 * Initialize CSRF token by fetching from backend
 * Should be called on app startup
 */
export const initializeCSRF = async () => {
    try {
        const response = await api.get('/csrf-token');
        csrfToken = response.data.csrfToken;
        console.log('[CSRF] Token initialized successfully');
        return csrfToken;
    } catch (error) {
        console.error('[CSRF] Failed to fetch token:', error);
        return null;
    }
};

/**
 * Get current CSRF token
 */
export const getCSRFToken = () => csrfToken;

// Request Interceptor: Add CSRF token to all state-changing requests
api.interceptors.request.use(
    config => {
        // Add CSRF token to POST, PUT, DELETE requests
        if (['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            } else {
                console.warn('[CSRF] Token not available for request:', config.url);
            }
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle CSRF token errors
api.interceptors.response.use(
    response => response,
    async error => {
        // Handle CSRF token validation failures
        if (error.response?.status === 403 && 
            error.response?.data?.errorCode === 'CSRF_VALIDATION_FAILED') {
            console.warn('[CSRF] Token validation failed, refreshing token...');
            
            // Refresh CSRF token
            await initializeCSRF();
            
            // Retry the original request with new token
            if (csrfToken) {
                error.config.headers['X-CSRF-Token'] = csrfToken;
                return api.request(error.config);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
