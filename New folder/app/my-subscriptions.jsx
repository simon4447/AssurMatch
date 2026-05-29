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
import { fetchClientSubscriptions } from '../lib/insurance'

function MySubscriptionsContent() {
  const router = useRouter()
  const { role, profile } = useUser()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return

      try {
        const data = await fetchClientSubscriptions(profile.id)
        setSubscriptions(data)
      } catch (error) {
        setFeedback(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile?.id])

  if (role !== 'client') {
    return (
      <ThemedView safe style={styles.container}>
        <ThemedCard>
          <ThemedText>Cette page est reservee aux clients.</ThemedText>
        </ThemedCard>
      </ThemedView>
    )
  }

  if (loading) {
    return <ThemedLoader />
  }

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          Mes souscriptions payees
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Historique de vos assurances souscrites
        </ThemedText>

        <Spacer height={20} />

        {feedback && <Text style={[styles.feedback, styles.feedbackError]}>{feedback}</Text>}

        {subscriptions.map((subscription) => (
          <ThemedCard key={subscription.id} style={styles.card}>
            <ThemedText title style={styles.cardTitle}>
              {subscription.insurance_offer?.nom_assurance || 'Assurance'}
            </ThemedText>
            <Spacer height={8} />
            <ThemedText>Type : {subscription.insurance_offer?.insurance_type?.nom || 'Non defini'}</ThemedText>
            <ThemedText>Compagnie : {subscription.insurance_offer?.company?.nom_compagnie || 'Inconnue'}</ThemedText>
            <ThemedText>Montant paye : {subscription.paid_amount} FCFA</ThemedText>
            <ThemedText>Mode de paiement : {subscription.payment_method}</ThemedText>
            <ThemedText>Numero d'assurance : {subscription.insurance_number}</ThemedText>
            <ThemedText>Numero de recu : {subscription.receipt_number}</ThemedText>
            <ThemedText>Statut : {subscription.status}</ThemedText>
            <ThemedText>
              Date : {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'Non definie'}
            </ThemedText>

            <Spacer height={12} />

            <ThemedButton
              onPress={() =>
                router.push({
                  pathname: '/payment-receipt',
                  params: {
                    subscriptionId: subscription.id,
                    receiptNumber: subscription.receipt_number,
                    insuranceNumber: subscription.insurance_number,
                    clientName: '',
                    amount: String(subscription.paid_amount),
                    paymentMethod: subscription.payment_method,
                    offerName: subscription.insurance_offer?.nom_assurance || '',
                    companyName: subscription.insurance_offer?.company?.nom_compagnie || '',
                    receiptMessage: subscription.receipt_message || '',
                  },
                })
              }
              style={styles.fullButton}
            >
              <Text style={styles.buttonLabel}>Voir le recu</Text>
            </ThemedButton>
          </ThemedCard>
        ))}

        {!subscriptions.length && (
          <ThemedCard style={styles.card}>
            <ThemedText>Vous n'avez encore aucune souscription payee.</ThemedText>
          </ThemedCard>
        )}
      </ScrollView>
    </ThemedView>
  )
}

export default function MySubscriptionsScreen() {
  return (
    <UserOnly>
      <MySubscriptionsContent />
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