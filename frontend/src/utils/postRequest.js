import axios from 'axios';

/**
 * helper function to make POST requests using axios.
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
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };
    console.log(headers);
    const response = await axios.post(url, body, {
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
