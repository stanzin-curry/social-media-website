import api from './axios.js';

export const accountAPI = {
  getAccounts: async () => {
    const response = await api.get('/accounts');
    return response.data;
  },

  getAccountById: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  connectFacebook: async (oauthData) => {
    const response = await api.post('/accounts/facebook/connect', oauthData);
    return response.data;
  },

  connectInstagram: async (oauthData) => {
    const response = await api.post('/accounts/instagram/connect', oauthData);
    return response.data;
  },

  connectLinkedIn: async (oauthData) => {
    const response = await api.post('/accounts/linkedin/connect', oauthData);
    return response.data;
  },

  disconnectAccount: async (id) => {
    const response = await api.post(`/accounts/${id}/disconnect`);
    return response.data;
  },

  refreshAccountToken: async (id) => {
    const response = await api.post(`/accounts/${id}/refresh`);
    return response.data;
  },

  // Get OAuth URLs for connecting accounts
  getLinkedInAuthUrl: async () => {
    const response = await api.get('/auth/linkedin');
    return response.data;
  },

  getFacebookAuthUrl: async () => {
    const response = await api.get('/auth/facebook');
    return response.data;
  },

  getInstagramAuthUrl: async () => {
    const response = await api.get('/auth/instagram');
    return response.data;
  },

  getFacebookPages: async () => {
    const response = await api.get('/accounts/facebook/pages');
    return response.data;
  },
};

