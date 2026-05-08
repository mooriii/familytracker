import { api } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'PARENT' | 'CHILD';
}

export interface Family {
  id: string;
  name: string;
  inviteCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  family?: Family;
}

export const authService = {
  async register(name: string, email: string, password: string, familyName: string): Promise<AuthResponse> {
    const res = await api.post('/auth/register', { name, email, password, familyName });
    return res.data.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data;
  },

  async join(name: string, email: string, password: string, inviteCode: string): Promise<AuthResponse> {
    const res = await api.post('/auth/join', { name, email, password, inviteCode });
    return res.data.data;
  },

  async me(): Promise<{ user: AuthUser; family: Family | null }> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async refreshInvite(): Promise<string> {
    const res = await api.post('/auth/invite');
    return res.data.data.inviteCode;
  },
};
