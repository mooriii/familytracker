import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, AppState, AppStateStatus,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { locationService } from '../../services/location';

export default function ChildHomeScreen() {
  const { user, family, logout } = useAuthStore();
  const [isSharing, setIsSharing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startSharing = useCallback(async () => {
    const granted = await locationService.requestPermissions();
    if (!granted) {
      setPermissionDenied(true);
      Alert.alert(
        'Permission required',
        'FamilyTracker needs background location access to share your location. Please enable it in Settings.',
      );
      return;
    }
    await locationService.startTracking();
    await locationService.postCurrentLocation();
    setIsSharing(true);
    setLastSync(new Date());
  }, []);

  const stopSharing = useCallback(() => {
    Alert.alert(
      'Stop sharing?',
      'Your family will no longer be able to see your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await locationService.stopTracking();
            setIsSharing(false);
          },
        },
      ]
    );
  }, []);

  // Check tracking state on mount and app foreground
  useEffect(() => {
    const checkTracking = async () => {
      const tracking = await locationService.isTracking();
      setIsSharing(tracking);
    };

    checkTracking();
    startSharing(); // auto-start on first load

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkTracking();
    });

    return () => sub.remove();
  }, []);

  // Post location every 15s while app is in foreground
  useEffect(() => {
    if (!isSharing) return;

    const interval = setInterval(async () => {
      try {
        await locationService.postCurrentLocation();
        setLastSync(new Date());
      } catch {
        // background task will keep running even if foreground post fails
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isSharing]);

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const diff = Math.floor((Date.now() - lastSync.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}</Text>
          <Text style={styles.familyName}>{family?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Sharing status card */}
      <View style={[styles.statusCard, isSharing ? styles.statusActive : styles.statusInactive]}>
        <View style={[styles.statusDot, isSharing ? styles.dotActive : styles.dotInactive]} />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, isSharing ? styles.textActive : styles.textInactive]}>
            {isSharing ? 'Sharing your location' : 'Location sharing paused'}
          </Text>
          <Text style={styles.statusSub}>
            {isSharing ? `Last update: ${formatLastSync()}` : 'Your family cannot see you'}
          </Text>
        </View>
      </View>

      {/* Big icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{isSharing ? '📍' : '📵'}</Text>
        <Text style={styles.iconLabel}>
          {isSharing
            ? 'Your location is being shared with your family'
            : 'Tap below to start sharing your location'}
        </Text>
      </View>

      {permissionDenied && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Background location permission is required. Please enable it in your phone Settings → FamilyTracker → Location → Always.
          </Text>
        </View>
      )}

      {/* Toggle button */}
      <TouchableOpacity
        style={[styles.button, isSharing ? styles.buttonStop : styles.buttonStart]}
        onPress={isSharing ? stopSharing : startSharing}
      >
        <Text style={[styles.buttonText, isSharing && styles.buttonTextStop]}>
          {isSharing ? 'Pause Sharing' : 'Start Sharing'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24, paddingTop: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  familyName: { fontSize: 14, color: '#666', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#ef4444', fontSize: 14 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 16, marginBottom: 32,
    borderWidth: 1,
  },
  statusActive: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusInactive: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  dotActive: { backgroundColor: '#22c55e' },
  dotInactive: { backgroundColor: '#ef4444' },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 15, fontWeight: '600' },
  textActive: { color: '#15803d' },
  textInactive: { color: '#b91c1c' },
  statusSub: { fontSize: 12, color: '#666', marginTop: 2 },
  iconContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 80, marginBottom: 16 },
  iconLabel: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  warningCard: {
    backgroundColor: '#fff7ed', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#fed7aa', marginBottom: 16,
  },
  warningText: { fontSize: 13, color: '#9a3412', lineHeight: 20 },
  button: {
    padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 16,
  },
  buttonStart: { backgroundColor: '#4f46e5' },
  buttonStop: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ef4444' },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  buttonTextStop: { color: '#ef4444' },
});
