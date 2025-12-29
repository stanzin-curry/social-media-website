import api from './axios.js';

export const postAPI = {
  createPost: async (postData) => {
    const formData = new FormData();
    formData.append('caption', postData.caption);
    formData.append('platforms', JSON.stringify(postData.platforms));
    formData.append('scheduledDate', postData.scheduledDate);
    if (postData.scheduledTime) {
      formData.append('scheduledTime', postData.scheduledTime);
    }
    if (postData.media) {
      // If media is a File object, append it
      if (postData.media instanceof File) {
        formData.append('media', postData.media);
      } else {
        // If it's a URL string, we might need to fetch and convert it
        // For now, we'll handle this on the backend
        formData.append('mediaUrl', postData.media);
      }
    }

    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPosts: async (params = {}) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  getScheduledPosts: async () => {
    const response = await api.get('/posts/scheduled');
    return response.data;
  },

  getPublishedPosts: async () => {
    const response = await api.get('/posts/published');
    return response.data;
  },

  getPostById: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  updatePost: async (id, postData) => {
    const formData = new FormData();
    if (postData.caption) formData.append('caption', postData.caption);
    if (postData.platforms) formData.append('platforms', JSON.stringify(postData.platforms));
    if (postData.scheduledDate) formData.append('scheduledDate', postData.scheduledDate);
    if (postData.scheduledTime) formData.append('scheduledTime', postData.scheduledTime);
    if (postData.media instanceof File) {
      formData.append('media', postData.media);
    }

    const response = await api.put(`/posts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePost: async (id) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },
};

