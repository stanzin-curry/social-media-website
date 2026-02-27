import api from './axios.js';

export const notificationAPI = {
  getNotifications: async (options = {}) => {
    const { limit = 50, unreadOnly = false } = options;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};





