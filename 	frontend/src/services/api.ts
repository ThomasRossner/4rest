import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // Tasks
  async getTasks(params?: { limit?: number; offset?: number; type?: string }) {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  async getTask(id: string) {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  async completeTask(taskId: string, data?: any) {
    const response = await apiClient.post(`/tasks/${taskId}/complete`, data);
    return response.data;
  },

  // User Progress
  async getUserProgress(userId: string) {
    const response = await apiClient.get(`/users/${userId}/progress`);
    return response.data;
  },

  // Forest
  async getForest() {
    const response = await apiClient.get('/forest');
    return response.data;
  },

  async getUserForest(userId: string) {
    const response = await apiClient.get(`/forest/users/${userId}`);
    return response.data;
  },

  // Rewards
  async getRewards() {
    const response = await apiClient.get('/rewards');
    return response.data;
  },

  async redeemReward(rewardId: string) {
    const response = await apiClient.post(`/rewards/${rewardId}/redeem`);
    return response.data;
  },

  // Statistics
  async getStatistics(params?: { startDate?: string; endDate?: string; useCache?: boolean }) {
    const response = await apiClient.get('/statistics', { params });
    return response.data;
  },

  async getUserStatistics(userId: string) {
    const response = await apiClient.get(`/statistics/users/${userId}`);
    return response.data;
  },

  // HotelKit
  async syncHotelKitTasks() {
    const response = await apiClient.post('/hotelkit/sync');
    return response.data;
  },
};
