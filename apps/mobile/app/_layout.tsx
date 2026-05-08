import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/auth';

function NavigationGuard() {
  const { user, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inParentGroup = segments[0] === '(parent)';
    const inChildGroup = segments[0] === '(child)';

    if (!user) {
      // Not logged in — go to welcome screen
      if (inParentGroup || inChildGroup) {
        router.replace('/');
      }
      return;
    }

    // Logged in — redirect to the right home screen
    if (user.role === 'PARENT' && !inParentGroup) {
      router.replace('/(parent)');
    } else if (user.role === 'CHILD' && !inChildGroup) {
      router.replace('/(child)');
    }
  }, [user, isInitialized, segments]);

  return null;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(child)" />
      </Stack>
    </>
  );
}
