import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

export function createApiClient(token?: string): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  
  return client;
}

export async function loginViaApi(email: string, password: string): Promise<{ token: string; user: any }> {
  const client = createApiClient();
  const response = await client.post('/auth/login', { email, password });
  return response.data;
}

export async function registerViaApi(user: {
  email: string;
  password: string;
  name: string;
  role?: string;
  userType?: string;
}): Promise<{ token: string; user: any }> {
  const client = createApiClient();
  const response = await client.post('/auth/register', {
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role || 'guest',
    user_type: user.userType || 'explorer',
  });
  return response.data;
}

export async function createTestTask(
  token: string,
  task: {
    title: string;
    description?: string;
    type: string;
    points: number;
    qr_code?: string;
    video_url?: string;
    quiz_questions?: any;
    photo_required?: boolean;
    active?: boolean;
  }
): Promise<any> {
  const client = createApiClient(token);
  const response = await client.post('/tasks', task);
  return response.data;
}

export async function createTestReward(
  token: string,
  reward: {
    title: string;
    description?: string;
    cost: number;
    type: string;
    active?: boolean;
  }
): Promise<any> {
  const client = createApiClient(token);
  const response = await client.post('/rewards', reward);
  return response.data;
}

export async function deleteTestTask(token: string, taskId: string): Promise<void> {
  const client = createApiClient(token);
  await client.delete(`/tasks/${taskId}`);
}

export async function deleteTestReward(token: string, rewardId: string): Promise<void> {
  const client = createApiClient(token);
  await client.delete(`/rewards/${rewardId}`);
}

export async function getUserTasks(token: string): Promise<any[]> {
  const client = createApiClient(token);
  const response = await client.get('/tasks');
  return response.data;
}

export async function completeTaskViaApi(
  token: string,
  taskId: string,
  data?: { quiz_answers?: any; photo_url?: string; qr_code?: string }
): Promise<any> {
  const client = createApiClient(token);
  const response = await client.post(`/tasks/${taskId}/complete`, data || {});
  return response.data;
}
