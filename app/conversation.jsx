import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedLoader from '../components/ThemedLoader'
import ThemedText from '../components/ThemedText'
import ThemedTextInput from '../components/ThemedTextInput'
import ThemedView from '../components/ThemedView'
import UserOnly from '../components/auth/UserOnly'
import { colors } from '../constants/colors'
import { useUser } from '../hooks/useUser'
import {
  fetchAccountIdentity,
  fetchConversationMessages,
  markConversationMessagesAsRead,
  resolveConversationParticipant,
  sendMessage,
} from '../lib/messages'

function normalizeRouteParam(value) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function ConversationContent() {
  const { account } = useUser()
    const params = useLocalSearchParams()
  const offerId = normalizeRouteParam(params.offerId)
  const otherAccountId = normalizeRouteParam(params.otherAccountId)
  const title = normalizeRouteParam(params.title)
  const [resolvedOtherAccountId, setResolvedOtherAccountId] = useState(otherAccountId)
  const [participantIdentity, setParticipantIdentity] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [messageText, setMessageText] = useState('')

  const loadMessages = async () => {
    if (!account?.id) {
      return
    }

    if (!offerId) {
      setFeedback("Impossible d'ouvrir cette conversation : offre introuvable.")
      setLoading(false)
      return
    }

    try {
     setLoading(true)
           setFeedback(null)

      let participantId = otherAccountId
      if (!participantId) {
        participantId = await resolveConversationParticipant({
          currentAccountId: account.id,
          offerId,
        })
        setResolvedOtherAccountId(participantId)
      }

      if (!participantId) {
        setFeedback("Impossible d'ouvrir cette conversation : interlocuteur introuvable.")
        setParticipantIdentity(null)
        setMessages([])
        return
      }

       setResolvedOtherAccountId(participantId)

      try {
        const identity = await fetchAccountIdentity(participantId)
        setParticipantIdentity(identity)
      } catch {
        setParticipantIdentity({
          role: null,
          label: 'Utilisateur',
          detail: null,
        })
      }

      const data = await fetchConversationMessages({
        currentAccountId: account.id,
        otherAccountId: participantId,
        offerId,
      })
      setMessages(data)
       await markConversationMessagesAsRead({
        currentAccountId: account.id,
        otherAccountId: participantId,
        offerId,
      })
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
        if (!account?.id) {
      return
    }

    setResolvedOtherAccountId(otherAccountId)
    setParticipantIdentity(null)
    loadMessages()
  }, [account?.id, otherAccountId, offerId])

  const handleSend = async () => {
       const receiverId = otherAccountId || resolvedOtherAccountId

    if (!messageText.trim()) {
      setFeedback('Veuillez ecrire un message avant de l envoyer.')
      return
    }

        if (!account?.id || !receiverId || !offerId) {
      setFeedback("Impossible d'envoyer le message : conversation incomplete.")
      return
    }

    setSending(true)
    setFeedback(null)

    try {
      await sendMessage({
        senderId: account.id,
        receiverId,
        offerId,
        contenu: messageText.trim(),
      })

      setMessageText('')
      await loadMessages()
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <ThemedLoader />
  }

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          {title || 'Conversation'}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Discussion a propos de cette offre
        </ThemedText>

        <Spacer height={20} />

      {participantIdentity && (
          <ThemedCard style={styles.identityCard}>
            <ThemedText title style={styles.identityTitle}>
              {participantIdentity.role === 'company'
                ? 'Compagnie'
                : participantIdentity.role === 'client'
                  ? 'Client'
                  : 'Interlocuteur'}
              {' : '}
              {participantIdentity.label}
            </ThemedText>
            {participantIdentity.detail && participantIdentity.detail !== participantIdentity.label && (
              <ThemedText>Email : {participantIdentity.detail}</ThemedText>
            )}
          </ThemedCard>
        )}

        {feedback && <Text style={[styles.feedback, styles.feedbackError]}>{feedback}</Text>}

        {messages.map((message) => {
          const mine = message.sender_id === account?.id

          return (
            <ThemedCard
              key={message.id}
              style={[styles.card, mine ? styles.myMessage : styles.otherMessage]}
            >
              <ThemedText>{message.contenu}</ThemedText>
              <Spacer height={6} />
              <ThemedText>
                {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
              </ThemedText>
            </ThemedCard>
          )
        })}

        {!messages.length && (
          <ThemedCard style={styles.card}>
            <ThemedText>Aucun message pour le moment. Lance la discussion.</ThemedText>
          </ThemedCard>
        )}

        <Spacer height={16} />

        <ThemedTextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ecrire votre message"
          multiline
          value={messageText}
          onChangeText={setMessageText}
        />

        <ThemedButton onPress={handleSend} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>
            {sending ? 'Envoi...' : 'Envoyer'}
          </Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function ConversationScreen() {
  return (
    <UserOnly>
      <ConversationContent />
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
  identityCard: {
    marginBottom: 4,
  },
  identityTitle: {
    fontSize: 18,
  },
  myMessage: {
    alignSelf: 'flex-end',
    width: '90%',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    width: '90%',
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fullButton: {
    width: '100%',
  },
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
})