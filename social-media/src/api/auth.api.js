import api from './axios.js';

export const authAPI = {
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      // Call backend to invalidate session
      await api.post('/auth/logout');
    } catch (error) {
      // Even if the API call fails, we still want to remove the token
      console.error('Logout error:', error);
    } finally {
      // Always remove token from localStorage
      localStorage.removeItem('token');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

