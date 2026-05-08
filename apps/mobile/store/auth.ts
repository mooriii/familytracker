import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService, AuthUser, Family } from '../services/auth';
import { api } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  family: Family | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  register: (name: string, email: string, password: string, familyName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  join: (name: string, email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync('access_token', accessToken);
  await SecureStore.setItemAsync('refresh_token', refreshToken);
}

async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  family: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    try {
      const { user, family } = await authService.me();
      set({ user, family, isInitialized: true });
    } catch {
      await clearTokens();
      set({ isInitialized: true });
    }
  },

  register: async (name, email, password, familyName) => {
    set({ isLoading: true });
    try {
      const { accessToken, refreshToken, user, family } = await authService.register(
        name, email, password, familyName
      );
      await saveTokens(accessToken, refreshToken);
      set({ user, family: family ?? null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { accessToken, refreshToken, user } = await authService.login(email, password);
      await saveTokens(accessToken, refreshToken);
      const { family } = await authService.me();
      set({ user, family });
    } finally {
      set({ isLoading: false });
    }
  },

  join: async (name, email, password, inviteCode) => {
    set({ isLoading: true });
    try {
      const { accessToken, refreshToken, user, family } = await authService.join(
        name, email, password, inviteCode
      );
      await saveTokens(accessToken, refreshToken);
      set({ user, family: family ?? null });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await clearTokens();
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, family: null });
  },
}));
