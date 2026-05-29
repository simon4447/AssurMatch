import { Stack } from 'expo-router'
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigationFrame from '../components/AppNavigationFrame'
import { AuthProvider } from '../hooks/useUser'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigationFrame>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </AppNavigationFrame>
      </AuthProvider>
    </SafeAreaProvider>
  )
}