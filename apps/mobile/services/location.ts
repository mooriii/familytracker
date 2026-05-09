import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Called by TaskManager when a background location arrives
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];
  if (!location) return;

  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return;

    const batteryLevel = await Battery.getBatteryLevelAsync();

    await api.post(
      '/location',
      {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
        batteryPct: Math.round(batteryLevel * 100),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error('Failed to post background location:', err);
  }
});

export const locationService = {
  async requestPermissions(): Promise<boolean> {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return false;

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    return bgStatus === 'granted';
  },

  async startTracking(): Promise<void> {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isRunning) return;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000,       // 15s when active
      distanceInterval: 10,      // or every 10 metres
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'FamilyTracker',
        notificationBody: 'Sharing your location with your family',
        notificationColor: '#4f46e5',
      },
    });
  },

  async stopTracking(): Promise<void> {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  },

  async isTracking(): Promise<boolean> {
    return Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  },

  // One-shot foreground location post (used when app is active)
  async postCurrentLocation(): Promise<void> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return;

    const batteryLevel = await Battery.getBatteryLevelAsync();

    await api.post('/location', {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy,
      batteryPct: Math.round(batteryLevel * 100),
    });
  },
};
