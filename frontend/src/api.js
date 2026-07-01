import axios from 'axios';

const api = axios.create({
  // Dynamically switch between Nginx relative paths in production and localhost in development
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'https://securevault-i2bo.onrender.com', 
  withCredentials: true
});

// Helper function to manually dig the CSRF token out of the browser's cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// REQUEST INTERCEPTOR: Force the CSRF token to bypass Axios cross-origin limits
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrf_access_token');
  if (csrfToken) {
    config.headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// RESPONSE INTERCEPTOR: Catch 401s and safely redirect
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    sessionStorage.removeItem('masterPassword');
    
    // Circuit Breaker: Only redirect if NOT on login/register pages
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
