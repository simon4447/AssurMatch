import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { colors } from '../constants/colors'
import { useUser } from '../hooks/useUser'
import { fetchUnreadMessageCount } from '../lib/messages'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const clientTabItems = [
  {
    label: 'Accueil',
    route: '/',
    icon: 'home',
  },
  {
    label: 'Offres',
    route: '/offers',
    icon: 'briefcase-outline',
  },
  {
    label: 'Messagerie',
    route: '/inbox',
    icon: 'chatbubbles-outline',
    badge: true,
  },
  {
    label: 'Profil',
    route: '/profile',
    icon: 'person-circle-outline',
  },
]

const companyTabItems = [
  {
    label: 'Accueil',
    route: '/',
    icon: 'home',
  },
  {
    label: 'Mes offres',
    route: '/company-offers',
    icon: 'document-text-outline',
  },
  {
    label: 'Messagerie',
    route: '/inbox',
    icon: 'chatbubbles-outline',
    badge: true,
  },
  {
    label: 'Profil',
    route: '/profile',
    icon: 'person-circle-outline',
  },
]

const hiddenPaths = ['/login', '/register']
const insets = useSafeAreaInsets()

function isActive(pathname, route) {
  if (route === '/') {
    return pathname === '/'
  }

  return pathname === route || pathname.startsWith(`${route}/`)
}

export default function AppNavigationFrame({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, account, profile, role, logout } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const shouldShowNavigation = Boolean(user) && !hiddenPaths.includes(pathname)

  useEffect(() => {
    let mounted = true

    const loadUnreadCount = async () => {
      if (!account?.id || !shouldShowNavigation) {
        setUnreadCount(0)
        return
      }

      try {
        const count = await fetchUnreadMessageCount(account.id)
        if (mounted) {
          setUnreadCount(count)
        }
      } catch {
        if (mounted) {
          setUnreadCount(0)
        }
      }
    }

    loadUnreadCount()
    const timer = setInterval(loadUnreadCount, 12000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [account?.id, pathname, shouldShowNavigation])

  const displayName =
    role === 'client'
      ? [profile?.prenom, profile?.nom].filter(Boolean).join(' ') || account?.email
      : role === 'company'
        ? profile?.nom_compagnie || account?.email
        : account?.email

  const handleLogout = async () => {
    setDrawerOpen(false)
    await logout()
    router.replace('/login')
  }

  if (!shouldShowNavigation) {
    return children
  }

  return (
    
    <View style={styles.shell}>
      <View style={styles.page}>{children}</View>

    <Pressable style={styles.drawerButton} onPress={() => setDrawerOpen(true)}>
  <Ionicons
    name="menu"
    size={28}
    color="#fff"
  />
</Pressable>

      {drawerOpen && (
        <View style={styles.drawerLayer}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <Text style={styles.drawerTitle}>AssurMatch</Text>
            <Text style={styles.drawerSubtitle}>{displayName || 'Utilisateur'}</Text>

            <Pressable
                style={styles.drawerItem}
                onPress={() => {
                    setDrawerOpen(false)
                    router.push('/client-preferences')
                }}
                >
                <Ionicons
                    name="settings-outline"
                    size={22}
                    color={colors.light.title}
                />
                <Text style={styles.drawerItemText}>Préférences</Text>
                </Pressable>

                <Pressable
                style={styles.drawerItem}
                onPress={() => {
                    setDrawerOpen(false)
                    router.push('/assistant-ia')
                }}
                >
                <Ionicons
                    name="sparkles-outline"
                    size={22}
                    color={colors.light.title}
                />
                <Text style={styles.drawerItemText}>Assistant IA</Text>
                </Pressable>

                <Pressable
                style={styles.drawerItem}
                onPress={() => {
                    setDrawerOpen(false)
                    router.push('/recommendations')
                }}
                >
                <Ionicons
                    name="bulb-outline"
                    size={22}
                    color={colors.light.title}
                />
                <Text style={styles.drawerItemText}>Recommandations</Text>
                </Pressable>

            <Pressable style={[styles.drawerItem, styles.logoutItem]} onPress={handleLogout}>
              <Text style={[styles.drawerItemText, styles.logoutText]}>Se deconnecter</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.bottomNav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavContent}
        >
            {(role === 'company' ? companyTabItems : clientTabItems).map((item) => {
            const active = isActive(pathname, item.route)

            return (
              <Pressable
                key={item.route}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.tabIconWrap}>
                 <Ionicons
                    name={item.icon}
                    size={24}
                    color={
                        active
                        ? colors.light.iconColorFocused
                        : colors.light.iconColor
                    }
                    />
                  {item.badge && unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </View>
 
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingBottom: 78,
  },
  drawerButton: {
    position: 'absolute',
    top: insets.top + 10,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
  },
  drawerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 30, 43, 0.35)',
  },
  drawer: {
    width: 260,
    backgroundColor: colors.light.navBackground,
    paddingTop: 58,
    paddingHorizontal: 18,
    borderLeftWidth: 1,
    borderLeftColor: '#cbc8d8',
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.light.title,
  },
  drawerSubtitle: {
    marginTop: 6,
    marginBottom: 24,
    color: colors.light.text,
  },
 drawerItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#cbc8d8',
},
  drawerItemText: {
    fontSize: 16,
    color: colors.light.title,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: colors.warning,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: insets.bottom,
    backgroundColor: colors.light.navBackground,
    borderTopWidth: 1,
    borderTopColor: '#cbc8d8',
    paddingVertical: 8,
    zIndex: 15,
    elevation: 5,
  },
  bottomNavContent: {
    paddingHorizontal: 10,
  },
  tabItem: {
    width: 96,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabItemActive: {
    backgroundColor: '#d9d5e6',
  },
  tabIconWrap: {
    minHeight: 24,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    color: colors.light.iconColor,
    fontWeight: '800',
  },
  tabLabel: {
    marginTop: 2,
    color: colors.light.iconColor,
    fontSize: 11,
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.light.iconColorFocused,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
})