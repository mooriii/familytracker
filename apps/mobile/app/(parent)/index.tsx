import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Modal, Pressable,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAuthStore } from '../../store/auth';
import { useFamilyStore, LiveChild } from '../../store/family';
import { socketService } from '../../services/socket';

const COLORS = ['#4f46e5', '#e11d48', '#16a34a', '#d97706', '#0891b2'];

function getColor(index: number): string {
  return COLORS[index % COLORS.length];
}

function formatLastSeen(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function BatteryBar({ pct }: { pct: number | null }) {
  if (pct === null) return <Text style={styles.sheetMeta}>Battery: unknown</Text>;
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.batteryRow}>
      <Text style={styles.sheetMeta}>Battery: {pct}%  </Text>
      <View style={styles.batteryTrack}>
        <View style={[styles.batteryFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function ParentHomeScreen() {
  const { user, family, logout } = useAuthStore();
  const { children, fetchLocations, updateChildLocation } = useFamilyStore();
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<LiveChild | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Load initial locations and connect socket
  useEffect(() => {
    fetchLocations();

    const init = async () => {
      const socket = await socketService.connect();
      socket.on('location:update', (data: {
        userId: string; lat: number; lng: number;
        accuracy: number; batteryPct: number; recordedAt: string;
      }) => {
        updateChildLocation(data.userId, {
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          batteryPct: data.batteryPct,
          recordedAt: data.recordedAt,
        });
      });
    };

    init();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const centerOn = useCallback((child: LiveChild) => {
    mapRef.current?.animateToRegion({
      latitude: child.lat,
      longitude: child.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 600);
  }, []);

  const openSheet = useCallback((child: LiveChild) => {
    setSelected(child);
    setSheetVisible(true);
  }, []);

  const initialRegion = children.length > 0
    ? {
        latitude: children[0].lat,
        longitude: children[0].lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 52.52,
        longitude: 13.405,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{family?.name ?? 'Family'}</Text>
          <Text style={styles.subtitle}>{children.length} member{children.length !== 1 ? 's' : ''} tracked</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {children.map((child, i) => (
          <Marker
            key={child.id}
            coordinate={{ latitude: child.lat, longitude: child.lng }}
            onPress={() => openSheet(child)}
          >
            <View style={[styles.markerBubble, { backgroundColor: getColor(i) }]}>
              <Text style={styles.markerText}>{child.name[0].toUpperCase()}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Child chips at bottom of map */}
      {children.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContainer}
        >
          {children.map((child, i) => (
            <TouchableOpacity
              key={child.id}
              style={[styles.chip, { borderColor: getColor(i) }]}
              onPress={() => { centerOn(child); openSheet(child); }}
            >
              <View style={[styles.chipDot, { backgroundColor: getColor(i) }]} />
              <Text style={styles.chipName}>{child.name}</Text>
              <Text style={styles.chipTime}>{formatLastSeen(child.recordedAt)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {children.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No children are sharing their location yet.</Text>
          <Text style={styles.emptyHint}>Share the invite code with them: {family?.inviteCode}</Text>
        </View>
      )}

      {/* Bottom sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {selected && (
              <>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetName}>{selected.name}</Text>
                <Text style={styles.sheetMeta}>Last seen: {formatLastSeen(selected.recordedAt)}</Text>
                <BatteryBar pct={selected.batteryPct} />
                <Text style={styles.sheetCoords}>
                  {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                </Text>
                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => { centerOn(selected); setSheetVisible(false); }}
                >
                  <Text style={styles.sheetBtnText}>Center on map</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  logoutText: { color: '#ef4444', fontSize: 14 },
  map: { flex: 1 },
  markerBubble: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  markerText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  chipScroll: { position: 'absolute', bottom: 24, left: 0, right: 0 },
  chipContainer: { paddingHorizontal: 16, gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 24, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  chipName: { fontWeight: '600', color: '#1a1a2e', marginRight: 6 },
  chipTime: { fontSize: 11, color: '#999' },
  emptyCard: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  emptyText: { fontSize: 15, color: '#333', fontWeight: '600', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: '#666' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetName: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  sheetMeta: { fontSize: 14, color: '#666', marginBottom: 6 },
  sheetCoords: { fontSize: 12, color: '#999', marginBottom: 20, fontFamily: 'monospace' },
  batteryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  batteryTrack: {
    flex: 1, height: 8, backgroundColor: '#e5e7eb',
    borderRadius: 4, overflow: 'hidden',
  },
  batteryFill: { height: '100%', borderRadius: 4 },
  sheetBtn: {
    backgroundColor: '#4f46e5', padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  sheetBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
