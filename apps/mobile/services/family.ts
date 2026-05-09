import { api } from './api';

export interface ChildLocation {
  user: { id: string; name: string };
  location: {
    id: string;
    lat: number;
    lng: number;
    accuracy: number | null;
    batteryPct: number | null;
    recordedAt: string;
  } | null;
}

export const familyService = {
  async getAllLocations(): Promise<ChildLocation[]> {
    const res = await api.get('/location/family/all');
    return res.data.data;
  },
};
