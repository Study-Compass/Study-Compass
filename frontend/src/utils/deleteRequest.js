import axios from 'axios';

/**
 * helper function to make DELETE requests using axios.
 * 
 * @param {string} url - The endpoint URL to which the POST request is sent.
 * @param {object|FormData} body - The request payload.
 * @param {object} options - Additional axios options (optional).
 * @returns {Promise<object>} - The response data or an error message.
 */
const postRequest = async (url, body, options = {}) => {
  try {
    const token = localStorage.getItem('token');

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    const response = await axios.delete(url, {
      headers,
      ...options,
    });

    return response.data;
  } catch (error) {
    console.error('POST request error:', error.message);

    if (error.response) {
      return { error: error.response.data.error };
    } else if (error.request) {
      return { error: 'No response received from server' };
    } else {
      return { error: error.message };
    }
  }
};

export default postRequest;
