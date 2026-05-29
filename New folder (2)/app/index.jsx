import { ScrollView, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'
import UserOnly from '../components/auth/UserOnly'
import { useUser } from '../hooks/useUser'

function HomeContent() {
  const router = useRouter()
  const { account, profile, role } = useUser()

  const displayName =
    role === 'client'
      ? [profile?.prenom, profile?.nom].filter(Boolean).join(' ')
      : role === 'company'
        ? profile?.nom_compagnie
        : account?.email

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={18} />
        <ThemedText title style={styles.title}>
          AssurMatch
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {displayName ? `Bienvenue, ${displayName}` : 'Bienvenue sur votre espace'}
        </ThemedText>

        <Spacer height={22} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Tableau de bord
          </ThemedText>
          <Spacer height={8} />
          <ThemedText>
            Retrouvez les offres, l'assistant IA, vos recommandations et vos conversations depuis la barre du bas.
          </ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Action principale
          </ThemedText>
          <Spacer height={12} />
          {role === 'company' ? (
            <ThemedButton onPress={() => router.push('/company-offers')} style={styles.fullButton}>
              <Text style={styles.buttonLabel}>Gerer mes offres</Text>
            </ThemedButton>
          ) : (
            <ThemedButton onPress={() => router.push('/offers')} style={styles.fullButton}>
              <Text style={styles.buttonLabel}>Voir les offres</Text>
            </ThemedButton>
          )}
          <ThemedButton onPress={() => router.push('/inbox')} style={styles.fullButton}>
            <Text style={styles.buttonLabel}>Ouvrir ma messagerie</Text>
          </ThemedButton>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Profil
          </ThemedText>
          <Spacer height={8} />
          <ThemedText>Role : {role === 'company' ? "Compagnie d'assurance" : 'Client'}</ThemedText>
          <ThemedText>Email : {account?.email || 'Non renseigne'}</ThemedText>
        </ThemedCard>
      </ScrollView>
    </ThemedView>
  )
}

export default function Home() {
  return (
    <UserOnly>
      <HomeContent />
    </UserOnly>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 110,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 18,
  },
  fullButton: {
    width: '100%',
  },
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
})