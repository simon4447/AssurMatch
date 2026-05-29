import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedLoader from '../components/ThemedLoader'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'
import UserOnly from '../components/auth/UserOnly'
import { colors } from '../constants/colors'
import { useUser } from '../hooks/useUser'
import { fetchUserThreads } from '../lib/messages'

function InboxContent() {
  const router = useRouter()
  const { account } = useUser()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const loadThreads = async () => {
      if (!account?.id) return

      try {
        const data = await fetchUserThreads(account.id)
        setThreads(data)
      } catch (error) {
        setFeedback(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [account?.id])

  if (loading) {
    return <ThemedLoader />
  }

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          Messagerie
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Echanges entre clients et compagnies
        </ThemedText>

        <Spacer height={20} />

        {feedback && <Text style={[styles.feedback, styles.feedbackError]}>{feedback}</Text>}

        {threads.map((thread) => (
          <ThemedCard key={thread.key} style={styles.card}>
            <ThemedText title style={styles.cardTitle}>
              {thread.offer?.nom_assurance || 'Conversation'}
            </ThemedText>
            <Spacer height={8} />
            <ThemedText>
              Interlocuteur : {thread.otherParty?.email || thread.otherAccountId || 'Utilisateur'}
            </ThemedText>
            <ThemedText>Dernier message : {thread.lastMessage?.contenu || ''}</ThemedText>
            <ThemedText>
              Date : {thread.lastMessage?.created_at ? new Date(thread.lastMessage.created_at).toLocaleDateString() : 'Non definie'}
            </ThemedText>

            <Spacer height={12} />

            <ThemedButton
              onPress={() =>
                router.push({
                  pathname: '/conversation',
                  params: {
                    otherAccountId: thread.otherParty?.id || thread.otherAccountId,
                    otherAccountId: thread.otherParty?.id,
                    title: thread.offer?.nom_assurance || 'Conversation',
                  },
                })
              }
              style={styles.fullButton}
            >
              <Text style={styles.buttonLabel}>Ouvrir la conversation</Text>
            </ThemedButton>
          </ThemedCard>
        ))}

        {!threads.length && (
          <ThemedCard style={styles.card}>
            <ThemedText>Aucune conversation disponible pour le moment.</ThemedText>
          </ThemedCard>
        )}
      </ScrollView>
    </ThemedView>
  )
}

export default function InboxScreen() {
  return (
    <UserOnly>
      <InboxContent />
    </UserOnly>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  feedback: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  feedbackError: {
    backgroundColor: '#f5c1c8',
    color: colors.warning,
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