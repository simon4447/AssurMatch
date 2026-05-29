import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppNavigationFrame from '../components/AppNavigationFrame'
import { AuthProvider } from '../hooks/useUser'

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <AuthProvider>
        <AppNavigationFrame>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </AppNavigationFrame>
      </AuthProvider>
    </SafeAreaView>
  )
}