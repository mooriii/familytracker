import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth';

export default function ChildHomeScreen() {
  const { user, family, logout } = useAuthStore();

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

      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Location sharing coming in Skill 6</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>📍</Text>
        <Text style={styles.placeholderTitle}>Background tracking</Text>
        <Text style={styles.placeholderSub}>Your location will be shared with your family automatically</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  familyName: { fontSize: 14, color: '#666', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#ef4444', fontSize: 14 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 24,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', marginRight: 10 },
  statusText: { fontSize: 14, color: '#15803d' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 64, marginBottom: 16 },
  placeholderTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#666', textAlign: 'center' },
});
