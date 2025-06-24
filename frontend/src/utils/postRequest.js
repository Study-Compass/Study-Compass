import axios from 'axios';

/**
 * Helper function to make HTTP requests using axios with automatic cookie handling.
 * 
 * @param {string} url - The endpoint URL to which the request is sent.
 * @param {object|FormData} body - The request payload (for POST requests).
 * @param {object} options - Additional axios options (optional).
 * @returns {Promise<object>} - The response data or an error message.
 */
const apiRequest = async (url, body = null, options = {}) => {
  try {
    const method = options.method || 'POST';
    
    const headers = {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    const config = {
      method,
      url,
      headers,
      withCredentials: true, // Enable cookie sending
      ...options,
    };

    // Add body for POST requests, params for GET requests
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && body) {
      config.data = body;
    } else if (method === 'GET' && options.params) {
      config.params = options.params;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Handle token expiration
    console.log('🔍 Error details:', error.response?.status, error.response?.data?.code);
    
    if (error.response?.status === 401) {
      console.log('🔄 Token expired or missing, attempting refresh...');
      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post('/refresh-token', {}, { withCredentials: true });
        console.log('✅ Token refresh successful:', refreshResponse.data);
        
        // Retry original request
        const retryConfig = {
          method: options.method || 'POST',
          url,
          headers: {
            ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
          },
          withCredentials: true,
          ...options,
        };

        if ((retryConfig.method === 'POST' || retryConfig.method === 'PUT' || retryConfig.method === 'PATCH') && body) {
          retryConfig.data = body;
        } else if (retryConfig.method === 'GET' && options.params) {
          retryConfig.params = options.params;
        }

        console.log('🔄 Retrying original request...');
        const retryResponse = await axios(retryConfig);
        console.log('✅ Retry successful');
        return retryResponse.data;
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        
        // Check if refresh token expired or is invalid
        if (refreshError.response?.data?.code === 'REFRESH_TOKEN_EXPIRED' || 
            refreshError.response?.data?.code === 'INVALID_REFRESH_TOKEN' ||
            refreshError.response?.data?.code === 'REFRESH_FAILED') {
          console.log('🚫 Refresh token expired or invalid, redirecting to login');
        //   window.location.href = '/login';
          return { error: 'Authentication required' };
        }
        
        // For other refresh errors, also redirect to login
        console.log('🚫 Refresh failed, redirecting to login');
        // window.location.href = '/login';
        return { error: 'Authentication required' };
      }
    }

    console.error('API request error:', error.message);

    if (error.response) {
      return { error: error.response.data.error };
    } else if (error.request) {
      return { error: 'No response received from server' };
    } else {
      return { error: error.message };
    }
  }
};

export default apiRequest;
