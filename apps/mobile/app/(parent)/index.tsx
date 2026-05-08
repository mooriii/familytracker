import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/auth';

export default function ParentHomeScreen() {
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

      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🗺️</Text>
        <Text style={styles.placeholderTitle}>Map coming in Skill 7</Text>
        <Text style={styles.placeholderSub}>Your children's live locations will appear here</Text>
      </View>

      {family?.inviteCode && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>Family invite code</Text>
          <Text style={styles.inviteCode}>{family.inviteCode}</Text>
          <Text style={styles.inviteHint}>Share this with your children to let them join</Text>
        </View>
      )}
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
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 64, marginBottom: 16 },
  placeholderTitle: { fontSize: 20, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#666', textAlign: 'center' },
  inviteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inviteLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  inviteCode: { fontSize: 28, fontWeight: 'bold', color: '#4f46e5', letterSpacing: 4 },
  inviteHint: { fontSize: 12, color: '#999', marginTop: 6, textAlign: 'center' },
});
