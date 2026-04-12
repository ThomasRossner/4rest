import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { UserRole, UserType } from '../constants/enums';
import { resolveApiBaseUrl } from '../utils/resolveApiBaseUrl';

const apiBaseUrl = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
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
  // Remove Content-Type header for FormData - axios will set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export const api = {
  // User
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'guest',
    userType: UserType = 'explorer',
    teamRegistrationToken?: string,
    contestRegistrationToken?: string,
    preferredLanguage?: 'de' | 'en',
    acceptPrivacy?: boolean
  ) {
    const res = await apiClient.post('/auth/register', {
      email,
      password,
      name,
      role,
      userType,
      teamRegistrationToken,
      contestRegistrationToken,
      preferredLanguage,
      acceptPrivacy: acceptPrivacy === true,
    });
    return res.data;
  },

  async updateUserProfile(userId: string, data: { name?: string; preferredLanguage?: 'de' | 'en' }) {
    const res = await apiClient.put(`/users/${userId}/profile`, data);
    return res.data;
  },

  async updateMyPlayerProfile(data: {
    status?: 'skipped' | 'completed';
    dyadScales?: number[];
    dyadAnswers?: number[];
    profileDisplayName?: string | null;
  }) {
    const res = await apiClient.patch('/users/me/player-profile', data);
    return res.data;
  },

  async getOnboardingConfig() {
    const res = await apiClient.get('/onboarding/config');
    return res.data;
  },

  async putAdminOnboardingConfig(body: unknown) {
    const res = await apiClient.put('/admin/onboarding/config', body);
    return res.data;
  },

  async uploadOnboardingBackground(file: File) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await apiClient.post('/admin/onboarding/upload-background', fd);
    return res.data as { url: string };
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
  async getConsent(): Promise<{
    analytics: boolean;
    marketing: boolean;
    dataProcessing: boolean;
  }> {
    const res = await apiClient.get<{ consent: { analytics: boolean; marketing: boolean; dataProcessing: boolean } }>(
      '/gdpr/consent'
    );
    return res.data.consent;
  },

  async updateConsent(consent: { analytics: boolean; marketing: boolean; dataProcessing: boolean }) {
    const res = await apiClient.post('/gdpr/consent', consent);
    return res.data;
  },

  async deleteMyAccount(userId: string) {
    const res = await apiClient.delete(`/gdpr/delete/${userId}`);
    return res.data;
  },

  // User Management (Admin only)
  async listUsers(filters?: { role?: string; active?: boolean; search?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.active !== undefined) params.append('active', String(filters.active));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));
    const queryString = params.toString();
    const url = `/users${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  async getUserDetails(userId: string) {
    const res = await apiClient.get(`/users/${userId}`);
    return res.data;
  },

  async updateUserRole(userId: string, role: UserRole) {
    const res = await apiClient.put(`/users/${userId}/role`, { role });
    return res.data;
  },

  async updateUserPoints(userId: string, points: number) {
    const res = await apiClient.put(`/users/${userId}/points`, { points });
    return res.data;
  },

  async toggleUserActive(userId: string) {
    const res = await apiClient.post(`/users/${userId}/toggle-active`);
    return res.data;
  },

  async resetUserPassword(userId: string) {
    const response = await apiClient.post(`/users/${userId}/reset-password`);
    return response.data;
  },

  async setUserPassword(userId: string, password: string) {
    try {
      const response = await apiClient.post(`/users/${userId}/set-password`, { password });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  async deleteUser(userId: string, hardDelete: boolean = false) {
    const res = await apiClient.delete(`/users/${userId}${hardDelete ? '?hard=true' : ''}`);
    return res.data;
  },

  async getUserStatistics(userId: string) {
    const res = await apiClient.get(`/users/${userId}/statistics`);
    return res.data;
  },

  async createUserByAdmin(email: string, role: UserRole, name?: string) {
    const res = await apiClient.post('/users', { email, role, name });
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
    // Convert boolean to string 'true'/'false' for query params
    const queryParams: any = { ...params };
    if (queryParams.includeAll !== undefined) {
      queryParams.includeAll = String(queryParams.includeAll);
    }
    if (queryParams.includeInactive !== undefined) {
      queryParams.includeInactive = String(queryParams.includeInactive);
    }
    const response = await apiClient.get('/tasks', { params: queryParams });
    return response.data;
  },

  async getTask(id: string) {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  /** Alle Aufgaben mit „ohne Login“ (allow_public_completion), für Gast-Startseite. */
  async listPublicGuestTasks(lang?: 'de' | 'en') {
    const response = await apiClient.get('/tasks/public', {
      params: lang ? { lang } : undefined,
    });
    return response.data as {
      id: string;
      title: string;
      description: string | null;
      type: string;
      points: number;
      thumbnail_url: string | null;
    }[];
  },

  /** Öffentliche Aufgabe (Cookie Gast-Session); Task mit allow_public_completion. */
  async getPublicTask(id: string, lang?: 'de' | 'en') {
    const response = await apiClient.get(`/tasks/public/${id}`, {
      params: lang ? { lang } : undefined,
    });
    return response.data;
  },

  async completePublicTask(taskId: string, data?: Record<string, unknown>) {
    const response = await apiClient.post(`/tasks/public/${taskId}/complete`, data);
    return response.data as { success: boolean };
  },

  /** Nach OAuth: ausstehende Gast-Aufgaben mit Account verbinden (Cookie + JWT). */
  async mergeGuestSession() {
    const response = await apiClient.post('/auth/merge-guest-session', {});
    return response.data as { merged: number; alreadyHad: number };
  },

  async getTaskQrCode(taskId: string) {
    const response = await apiClient.get(`/tasks/${taskId}/qr-code`);
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

  async getQuizQuestionLocks(taskId: string) {
    const response = await apiClient.get(`/tasks/${taskId}/quiz/locks`);
    return response.data as {
      locks: Array<{ questionIndex: number; lockedUntil: string }>;
    };
  },

  async submitQuizAnswer(taskId: string, questionIndex: number, answerId: string) {
    const response = await apiClient.post(`/tasks/${taskId}/quiz/answer`, {
      questionIndex,
      answerId,
    });
    return response.data as { status: 'correct' | 'wrong' | 'locked'; lockedUntil?: string };
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

  // Photo Task Verification
  async approvePhotoTask(userTaskId: string) {
    const response = await apiClient.post('/tasks/approve-photo', { userTaskId });
    return response.data;
  },

  async rejectPhotoTask(userTaskId: string, reason?: string) {
    const response = await apiClient.post('/tasks/reject-photo', { userTaskId, rejectionReason: reason });
    return response.data;
  },

  async getPendingPhotoTasks() {
    const response = await apiClient.get('/tasks/pending-photos');
    return response.data;
  },

  async getGalleryImages(filters?: { userId?: string; taskId?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));
    const queryString = params.toString();
    const url = `/tasks/gallery${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // User Progress
  async getUserProgress(userId: string) {
    const response = await apiClient.get(`/users/${userId}/progress`);
    return response.data;
  },

  async getUserTimeline(userId: string) {
    const response = await apiClient.get(`/users/${userId}/timeline`);
    return response.data;
  },

  async getTeamRanking(teamId: string) {
    const response = await apiClient.get(`/teams/${teamId}/ranking`);
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

  async redeemReward(rewardId: string, fallbackCost?: number, useTeamPoints?: boolean) {
    const response = await apiClient.post(`/rewards/${rewardId}/redeem`, { useTeamPoints });
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

  async getRewardInfoFromQr(qrToken: string) {
    const response = await apiClient.post('/rewards/get-reward-info', { qrToken });
    return response.data;
  },

  async getRedemptionStatus(qrToken: string) {
    const response = await apiClient.get('/rewards/redemption-status', { params: { qrToken } });
    return response.data;
  },

  async generatePointsBonusQr(
    pointsAmount: number,
    forestCategory: 'kommunikation' | 'mensch' | 'natur' | 'ressourcen'
  ) {
    const response = await apiClient.post('/rewards/points-bonus/generate', {
      pointsAmount,
      forestCategory,
    });
    return response.data;
  },

  async redeemPointsBonusQr(qrToken: string) {
    try {
      const response = await apiClient.post('/rewards/points-bonus/redeem', { qrToken });
      // Update user points from response
      if (response.data?.newPointsBalance !== undefined) {
        try {
          await this.refreshMe();
        } catch (error) {
          const store = useAuthStore.getState();
          const currentUser = store.user;
          if (currentUser) {
            store.setUser({ ...currentUser, points: response.data.newPointsBalance });
          }
          console.warn('[API] refreshMe after bonus redeem failed; points only updated:', error);
        }
      }
      return response.data;
    } catch (error: any) {
      // Re-throw axios errors so they can be handled by the caller
      throw error;
    }
  },

  async redeemRewardQrCode(qrToken: string) {
    const response = await apiClient.post('/rewards/redeem-qr', { qrToken });
    return response.data;
  },

  // Statistics
  async getStatistics(params?: { startDate?: string; endDate?: string; useCache?: boolean }) {
    const response = await apiClient.get('/statistics', { params });
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
      // Don't set Content-Type manually - axios will set it automatically with boundary for FormData
      timeout: 300000, // 5 minutes timeout for large video uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    });
    return response.data;
  },

  async uploadTaskThumbnail(file: File) {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const response = await apiClient.post('/tasks/upload/thumbnail', formData, {
      // Don't set Content-Type manually - axios will set it automatically with boundary for FormData
    });
    return response.data;
  },

  // Admin - Rewards
  async getRewardTemplates(params?: { includeInactive?: boolean }) {
    // Convert boolean to string 'true'/'false' for query params
    const queryParams: any = {};
    if (params?.includeInactive !== undefined) {
      queryParams.includeInactive = String(params.includeInactive);
    }
    const response = await apiClient.get('/rewards/templates', { params: queryParams });
    return response.data;
  },

  async uploadRewardThumbnail(file: File) {
    const formData = new FormData();
    formData.append('thumbnail', file);
    const response = await apiClient.post('/rewards/upload/thumbnail', formData, {
      // Don't set Content-Type manually - axios will set it automatically with boundary for FormData
    });
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

  // User QR Codes
  async getUserQrCode() {
    const response = await apiClient.get('/user/qr-code');
    return response.data;
  },

  async scanUserQrCode(qrToken: string) {
    const response = await apiClient.post('/user/qr-code/scan', { qrToken });
    return response.data;
  },

  // Teams
  async createTeam(teamName?: string) {
    const response = await apiClient.post('/teams/create', { teamName });
    return response.data;
  },

  async joinTeam(teamQrToken: string) {
    const response = await apiClient.post('/teams/join', { teamQrToken });
    return response.data;
  },

  async getUserTeams() {
    const response = await apiClient.get('/teams');
    return response.data;
  },

  async getTeamDetails(teamId: string) {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data;
  },

  async contributePointsToTeam(teamId: string, points: number) {
    const response = await apiClient.post(`/teams/${teamId}/contribute`, { points });
    // Update user points after contribution
    await api.refreshMe();
    return response.data;
  },

  async redeemRewardWithTeamPoints(teamId: string, rewardId: string) {
    const response = await apiClient.post(`/teams/${teamId}/redeem`, { rewardId });
    return response.data;
  },

  async leaveTeam(teamId: string) {
    const response = await apiClient.post(`/teams/${teamId}/leave`);
    // Update user points after leaving (contributed points are returned)
    await api.refreshMe();
    return response.data;
  },

  async dissolveTeam(teamId: string) {
    const response = await apiClient.delete(`/teams/${teamId}`);
    // Update user points after dissolution (points are distributed)
    await api.refreshMe();
    return response.data;
  },

  async getTeamQrCode(teamId: string) {
    const response = await apiClient.get(`/teams/${teamId}/qr-code`);
    return response.data;
  },

  async getUserActiveTeam() {
    const response = await apiClient.get('/teams/active');
    return response.data;
  },

  async getTeamTotalPoints(teamId: string) {
    const response = await apiClient.get(`/teams/${teamId}/total-points`);
    return response.data;
  },

  // Team Admin
  async getAllTeams(options?: { includeInactive?: boolean }) {
    const params = new URLSearchParams();
    if (options?.includeInactive) {
      params.append('includeInactive', 'true');
    }
    const queryString = params.toString();
    const url = `/teams/all${queryString ? `?${queryString}` : ''}`;
    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  async updateTeam(teamId: string, data: { name?: string | null; active?: boolean }) {
    const response = await apiClient.put(`/teams/${teamId}`, data);
    return response.data;
  },

  async enableTeamRegistration(teamId: string, enabled: boolean) {
    const response = await apiClient.post(`/teams/${teamId}/registration/enable`, { enabled });
    return response.data;
  },

  async getTeamRegistrationQrCode(teamId: string) {
    const response = await apiClient.get(`/teams/${teamId}/registration-qr-code`);
    return response.data;
  },

  async bulkUpdateTeamsStatus(teamIds: string[], active: boolean) {
    const response = await apiClient.post('/teams/bulk/status', { teamIds, active });
    return response.data;
  },

  async bulkDeleteTeams(teamIds: string[]) {
    const response = await apiClient.post('/teams/bulk/delete', { teamIds });
    return response.data;
  },

  async getTeamMembers(teamId: string) {
    const response = await apiClient.get(`/teams/${teamId}/members`);
    return response.data;
  },

  async addTeamMembers(teamId: string, userIds: string[]) {
    const response = await apiClient.post(`/teams/${teamId}/members/add`, { userIds });
    return response.data;
  },

  async removeTeamMembers(teamId: string, userIds: string[]) {
    const response = await apiClient.post(`/teams/${teamId}/members/remove`, { userIds });
    return response.data;
  },

  // Contests
  async createContest(startDate: string, endDate: string, contestName?: string, rewards?: { reward_first_place?: number; reward_second_place?: number; reward_third_place?: number }, participantIds?: string[]) {
    const response = await apiClient.post('/contests/create', { startDate, endDate, contestName, rewards, participantIds });
    return response.data;
  },

  async joinContest(contestQrToken: string) {
    const response = await apiClient.post('/contests/join', { contestQrToken });
    return response.data;
  },

  async getUserContests() {
    const response = await apiClient.get('/contests');
    return response.data;
  },

  async getAllUserContests() {
    const response = await apiClient.get('/contests/all');
    return response.data;
  },

  async getEmployeeContests() {
    const response = await apiClient.get('/contests/employee');
    return response.data;
  },

  async getContestDetails(contestId: string) {
    const response = await apiClient.get(`/contests/${contestId}`);
    return response.data;
  },

  async getContestRanking(contestId: string) {
    const response = await apiClient.get(`/contests/${contestId}/ranking`);
    return response.data;
  },

  async dissolveContest(contestId: string) {
    const response = await apiClient.delete(`/contests/${contestId}`);
    return response.data;
  },

  async leaveContest(contestId: string) {
    const response = await apiClient.post(`/contests/${contestId}/leave`);
    return response.data;
  },

  async getContestQrCode(contestId: string) {
    const response = await apiClient.get(`/contests/${contestId}/qr-code`);
    return response.data;
  },

  // Contest Admin
  async getAllContests(options?: { includeInactive?: boolean }) {
    const params = new URLSearchParams();
    if (options?.includeInactive) {
      params.append('includeInactive', 'true');
    }
    const queryString = params.toString();
    const url = `/contests/admin/all${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  async updateContest(contestId: string, data: { name?: string | null; active?: boolean; endDate?: string }) {
    const response = await apiClient.put(`/contests/${contestId}`, data);
    return response.data;
  },

  async enableContestRegistration(contestId: string, enabled: boolean) {
    const response = await apiClient.post(`/contests/${contestId}/registration/enable`, { enabled });
    return response.data;
  },

  async getContestRegistrationQrCode(contestId: string) {
    const response = await apiClient.get(`/contests/${contestId}/registration-qr-code`);
    return response.data;
  },

  async bulkUpdateContestsStatus(contestIds: string[], active: boolean) {
    const response = await apiClient.post('/contests/bulk/status', { contestIds, active });
    return response.data;
  },

  async bulkDeleteContests(contestIds: string[]) {
    const response = await apiClient.post('/contests/bulk/delete', { contestIds });
    return response.data;
  },

  async getContestParticipants(contestId: string) {
    const response = await apiClient.get(`/contests/${contestId}/participants`);
    return response.data;
  },

  async addContestParticipants(contestId: string, userIds: string[]) {
    const response = await apiClient.post(`/contests/${contestId}/participants/add`, { userIds });
    return response.data;
  },

  async removeContestParticipants(contestId: string, userIds: string[]) {
    const response = await apiClient.post(`/contests/${contestId}/participants/remove`, { userIds });
    return response.data;
  },

  // Messages (Mailbox)
  async getMessages(includeRead: boolean = false) {
    const response = await apiClient.get('/messages', { params: { includeRead: String(includeRead) } });
    return response.data;
  },

  async getUnreadMessageCount() {
    const response = await apiClient.get('/messages/unread-count');
    return response.data.count || 0;
  },

  async markMessageAsRead(messageId: string) {
    const response = await apiClient.post(`/messages/${messageId}/read`);
    return response.data;
  },

  async markAllMessagesAsRead() {
    const response = await apiClient.post('/messages/read-all');
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};
