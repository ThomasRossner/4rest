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

  async requestLoginCode(email: string) {
    const response = await apiClient.post('/auth/request-login-code', { email });
    return response.data;
  },

  async loginWithCode(email: string, code: string) {
    const response = await apiClient.post('/auth/login-with-code', { email, code });
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
    const apiStartTime = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/9643f323-e171-4f32-ae8e-60028fa34a14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:106',message:'getTasks API call started',data:{params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const response = await apiClient.get('/tasks', { params });
    const apiEndTime = Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/9643f323-e171-4f32-ae8e-60028fa34a14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:113',message:'getTasks API call completed',data:{duration:apiEndTime-apiStartTime,tasksCount:response.data?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

  async getForestStats() {
    const response = await apiClient.get('/forest/stats');
    return response.data;
  },

  async validateAndFixForest(options: { dryRun?: boolean; forceGeometry?: boolean; userFilter?: string }) {
    const response = await apiClient.post('/forest/validate-fix', options);
    return response.data;
  },

  async getValidationJobStatus(jobId: string) {
    const response = await apiClient.get(`/forest/validate-fix/${jobId}`);
    return response.data;
  },

  async visitForest() {
    const response = await apiClient.post('/forest/visit');
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
    // Don't deduct points yet - they will be deducted when QR code is verified
    // Just return the redemption data with QR token
    return response.data;
  },

  async verifyQrCode(qrToken: string) {
    const response = await apiClient.post('/rewards/verify-qr', { qrToken });
    // Update user points from response
    if (response.data?.user?.points !== undefined) {
      const store = useAuthStore.getState();
      const currentUser = store.user;
      if (currentUser) {
        store.setUser({ ...currentUser, points: response.data.user.points });
      }
    }
    return response.data;
  },

  async generatePointsBonusQr(pointsAmount: number) {
    const response = await apiClient.post('/rewards/points-bonus/generate', { pointsAmount });
    return response.data;
  },

  async redeemPointsBonusQr(qrToken: string) {
    const response = await apiClient.post('/rewards/points-bonus/redeem', { qrToken });
    // Update user points from response
    if (response.data?.newPointsBalance !== undefined) {
      try {
        const store = useAuthStore.getState();
        const currentUser = store.user;
        if (currentUser) {
          store.setUser({ ...currentUser, points: response.data.newPointsBalance });
        }
      } catch (error) {
        // Silently fail if store update fails - points are already updated on server
        console.warn('Failed to update user points in store:', error);
      }
    }
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

  // Locations
  async getLocations(params?: { includeInactive?: boolean }) {
    const response = await apiClient.get('/locations', { params });
    return response.data;
  },

  async createLocation(payload: any) {
    const response = await apiClient.post('/locations', payload);
    return response.data;
  },

  async updateLocation(id: string, payload: any) {
    const response = await apiClient.put(`/locations/${id}`, payload);
    return response.data;
  },

  async geocodeAddress(address: string) {
    const response = await apiClient.post('/locations/geocode', { address });
    return response.data;
  },

  async reverseGeocode(latitude: number, longitude: number) {
    const response = await apiClient.post('/locations/reverse-geocode', { latitude, longitude });
    return response.data;
  },

  async bulkUpdateLocationsStatus(ids: string[], active: boolean) {
    const response = await apiClient.post('/locations/bulk/status', { ids, active });
    return response.data;
  },

  async bulkDeleteLocations(ids: string[]) {
    const response = await apiClient.post('/locations/bulk/delete', { ids });
    return response.data;
  },

  async deleteLocation(id: string) {
    const response = await apiClient.delete(`/locations/${id}`);
    return response.data;
  },

  // Survey Analytics
  async getSurveyAnalytics(taskId?: string) {
    const params = taskId ? { taskId } : {};
    const response = await apiClient.get('/admin/surveys/analytics', { params });
    return response.data;
  },

  // Debug Tools (Admin only)
  async createBulkTasks(userEmail: string, count?: number) {
    const response = await apiClient.post('/admin/debug/create-tasks', { userEmail, count });
    return response.data;
  },

  async completeBulkTasks(userEmail: string, count?: number) {
    const response = await apiClient.post('/admin/debug/complete-tasks', { userEmail, count });
    return response.data;
  },

  async deleteUserData(userEmail: string, taskCount: number, pointsToRemove: number) {
    const response = await apiClient.post('/admin/debug/delete-user-data', {
      userEmail,
      taskCount,
      pointsToRemove,
    });
    return response.data;
  },

  async createSurveyWithParticipants(surveyData: any, participantCount: number) {
    const response = await apiClient.post('/admin/debug/create-survey', {
      surveyData,
      participantCount,
    });
    return response.data;
  },

  async simulateTimeActivity(userEmail: string, taskCount: number, startDate: string, endDate: string, distribution?: 'uniform' | 'random') {
    const response = await apiClient.post('/admin/debug/simulate-time-activity', {
      userEmail,
      taskCount,
      startDate,
      endDate,
      distribution: distribution || 'uniform',
    });
    return response.data;
  },

  async simulateRewardRedemption(userEmail: string, rewardId?: string, autoVerify?: boolean) {
    const response = await apiClient.post('/admin/debug/simulate-reward-redemption', {
      userEmail,
      rewardId,
      autoVerify: autoVerify || false,
    });
    return response.data;
  },

  async resetUserData(userEmail: string, resetOptions: { tasks?: boolean; trees?: boolean; points?: boolean; redemptions?: boolean }) {
    const response = await apiClient.post('/admin/debug/reset-user-data', {
      userEmail,
      resetOptions,
    });
    return response.data;
  },

  async generateStatisticsData(
    startDate: string,
    endDate: string,
    targetUserCount: number,
    tasksPerUserMin?: number,
    tasksPerUserMax?: number,
    co2PerTaskMin?: number,
    co2PerTaskMax?: number
  ) {
    const response = await apiClient.post('/admin/debug/generate-statistics-data', {
      startDate,
      endDate,
      targetUserCount,
      tasksPerUserMin,
      tasksPerUserMax,
      co2PerTaskMin,
      co2PerTaskMax,
    });
    return response.data;
  },

  async simulateForestVisits(userEmail: string, days: number) {
    const response = await apiClient.post('/admin/debug/simulate-forest-visits', { userEmail, days });
    return response.data;
  },

  async recalculateTreeSizes(userEmail: string) {
    const response = await apiClient.post('/admin/debug/recalculate-tree-sizes', { userEmail });
    return response.data;
  },

  async getDebugLogs(params?: { limit?: number; level?: 'info' | 'warn' | 'error'; operation?: string }) {
    const response = await apiClient.get('/admin/debug/logs', { params });
    return response.data;
  },

  async clearDebugLogs() {
    const response = await apiClient.delete('/admin/debug/logs');
    return response.data;
  },

  // Parameters
  async getTaskParameters(type?: string) {
    const response = await apiClient.get('/admin/parameters/tasks', { params: type ? { type } : {} });
    return response.data;
  },

  async createTaskParameter(parameterType: string, value: string, displayOrder?: number, weight?: number) {
    const response = await apiClient.post('/admin/parameters/tasks', { parameter_type: parameterType, value, display_order: displayOrder || 0, weight: weight ?? displayOrder ?? 0 });
    return response.data;
  },

  async updateTaskParameter(id: string, payload: { value?: string; display_order?: number; weight?: number; active?: boolean }) {
    const response = await apiClient.put(`/admin/parameters/tasks/${id}`, payload);
    return response.data;
  },

  async deleteTaskParameter(id: string) {
    const response = await apiClient.delete(`/admin/parameters/tasks/${id}`);
    return response.data;
  },

  async getRewardParameters(type?: string) {
    const response = await apiClient.get('/admin/parameters/rewards', { params: type ? { type } : {} });
    return response.data;
  },

  async createRewardParameter(parameterType: string, value: string, displayOrder?: number, weight?: number) {
    const response = await apiClient.post('/admin/parameters/rewards', { parameter_type: parameterType, value, display_order: displayOrder || 0, weight: weight ?? displayOrder ?? 0 });
    return response.data;
  },

  async updateRewardParameter(id: string, payload: { value?: string; display_order?: number; weight?: number; active?: boolean }) {
    const response = await apiClient.put(`/admin/parameters/rewards/${id}`, payload);
    return response.data;
  },

  async deleteRewardParameter(id: string) {
    const response = await apiClient.delete(`/admin/parameters/rewards/${id}`);
    return response.data;
  },

  // System Config
  async getSystemConfigs() {
    const response = await apiClient.get('/admin/system-config');
    return response.data;
  },

  async getSystemConfig(key: string) {
    const response = await apiClient.get(`/admin/system-config/${key}`);
    return response.data;
  },

  async setSystemConfig(key: string, value: string, description?: string) {
    const response = await apiClient.put(`/admin/system-config/${key}`, { value, description });
    return response.data;
  },

  async getPointsCalculationFactor() {
    const response = await apiClient.get('/admin/system-config/points-calculation-factor');
    return response.data;
  },

  async getRewardCostCalculationFactor() {
    const response = await apiClient.get('/admin/system-config/reward-cost-calculation-factor');
    return response.data;
  },
};
