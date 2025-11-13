import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { UserRole, UserType } from '../constants/enums';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: apiBaseUrl,
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
  // User
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'stakeholder',
    userType: UserType = 'explorer'
  ) {
    const res = await apiClient.post('/auth/register', { email, password, name, role, userType });
    return res.data;
  },

  async getMe() {
    try {
      // Prefer /users/me if available
      const res = await apiClient.get('/users/me');
      return res.data;
    } catch (_) {
      // Fallback to /users/:id
      const current = useAuthStore.getState().user;
      if (!current) return null;
      const res = await apiClient.get(`/users/${current.id}`);
      return res.data;
    }
  },

  async refreshMe() {
    try {
      const data = await this.getMe();
      if (data) {
        const store = useAuthStore.getState();
        const nextUser = (data.user || data);
        if (nextUser) {
          // Replace entirely to ensure new reference and re-render
          store.setUser(nextUser as any);
        }
      }
    } catch (_) {}
  },

  // GDPR
  async deleteMyAccount(userId: string) {
    const res = await apiClient.delete(`/gdpr/delete/${userId}`);
    return res.data;
  },
  // Auth
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  async resendVerificationEmail() {
    const response = await apiClient.post('/auth/resend-verification');
    return response.data;
  },

  // Tasks
  async getTasks(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    includeAll?: boolean;
    includeInactive?: boolean;
  }) {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  async getTask(id: string) {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  async updateTask(id: string, payload: any) {
    const response = await apiClient.put(`/tasks/${id}`, payload);
    return response.data;
  },

  async bulkUpdateTasksStatus(ids: string[], active: boolean) {
    const response = await apiClient.post('/tasks/bulk/status', { ids, active });
    return response.data;
  },

  async bulkDeleteTasks(ids: string[]) {
    const response = await apiClient.post('/tasks/bulk/delete', { ids });
    return response.data;
  },

  async completeTask(taskId: string, data?: any) {
    const response = await apiClient.post(`/tasks/${taskId}/complete`, data);
    // Optimistically update user points if API returns points earned
    const pointsEarned = (response.data && (response.data.pointsEarned || response.data.points || 0)) || 0;
    if (pointsEarned) {
      try {
        useAuthStore.getState().incrementPoints(pointsEarned);
      } catch (_) {
        // noop if store not available in this context
      }
    }
    // Sync from server to update any other fields consistently
    await api.refreshMe();
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

  async redeemReward(rewardId: string, fallbackCost?: number) {
    const response = await apiClient.post(`/rewards/${rewardId}/redeem`);
    // Try to update points from server-provided user first
    try {
      const store = useAuthStore.getState();
      const serverUser = response.data && (response.data.user || response.data.currentUser);
      if (serverUser && typeof serverUser.points === 'number') {
        store.setUser(serverUser as any);
        // still refresh to align other fields
        await api.refreshMe();
        return response.data;
      }
    } catch (_) {
      // ignore
    }

    // Otherwise, optimistically deduct based on any cost fields we can detect
    const cost =
      (response.data && (
        response.data.pointsSpent ||
        response.data.points_spent ||
        response.data.pointsCost ||
        response.data.cost ||
        (response.data.reward && (response.data.reward.points_cost || response.data.reward.pointsCost))
      )) ||
      fallbackCost ||
      0;

    if (cost) {
      try {
        useAuthStore.getState().incrementPoints(-Number(cost));
      } catch (_) {
        // noop
      }
    }
    // Sync from server
    await api.refreshMe();
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

  // Admin - Tasks
  async createCustomTask(payload: any) {
    const response = await apiClient.post('/tasks', payload);
    return response.data;
  },

  async uploadTaskVideo(file: File) {
    const formData = new FormData();
    formData.append('video', file);
    const response = await apiClient.post('/tasks/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Admin - Rewards
  async getRewardTemplates(params?: { includeInactive?: boolean }) {
    const response = await apiClient.get('/rewards/templates', { params });
    return response.data;
  },

  async createRewardFromTemplate(templateId: string, overrides?: any) {
    const response = await apiClient.post('/rewards', { templateId, overrides });
    return response.data;
  },

  async createReward(payload: any) {
    const response = await apiClient.post('/rewards', payload);
    return response.data;
  },

  async updateReward(id: string, payload: any) {
    const response = await apiClient.put(`/rewards/${id}`, payload);
    return response.data;
  },

  async bulkUpdateRewardsStatus(ids: string[], active: boolean) {
    const response = await apiClient.post('/rewards/bulk/status', { ids, active });
    return response.data;
  },

  async bulkDeleteRewards(ids: string[]) {
    const response = await apiClient.post('/rewards/bulk/delete', { ids });
    return response.data;
  },

  // HotelKit
  async syncHotelKitTasks() {
    const response = await apiClient.post('/hotelkit/sync');
    return response.data;
  },
};
