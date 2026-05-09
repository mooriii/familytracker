import { create } from 'zustand';
import { familyService, ChildLocation } from '../services/family';

export interface LiveChild {
  id: string;
  name: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  batteryPct: number | null;
  recordedAt: string;
}

interface FamilyState {
  children: LiveChild[];
  isLoading: boolean;
  fetchLocations: () => Promise<void>;
  updateChildLocation: (userId: string, update: Partial<LiveChild>) => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  children: [],
  isLoading: false,

  fetchLocations: async () => {
    set({ isLoading: true });
    try {
      const data: ChildLocation[] = await familyService.getAllLocations();
      const children: LiveChild[] = data
        .filter((d) => d.location !== null)
        .map((d) => ({
          id: d.user.id,
          name: d.user.name,
          lat: d.location!.lat,
          lng: d.location!.lng,
          accuracy: d.location!.accuracy,
          batteryPct: d.location!.batteryPct,
          recordedAt: d.location!.recordedAt,
        }));
      set({ children });
    } finally {
      set({ isLoading: false });
    }
  },

  updateChildLocation: (userId, update) => {
    set((state) => ({
      children: state.children.map((c) =>
        c.id === userId ? { ...c, ...update } : c
      ),
    }));
  },
}));
