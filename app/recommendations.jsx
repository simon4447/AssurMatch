import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedLoader from '../components/ThemedLoader'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'
import UserOnly from '../components/auth/UserOnly'
import { colors } from '../constants/colors'
import { useUser } from '../hooks/useUser'
import { fetchInsuranceTypes, fetchOfferRecommendations } from '../lib/insurance'
import { fetchLatestClientPreference } from '../lib/profile'

function RecommendationsContent() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { role, profile } = useUser()
  const [recommendations, setRecommendations] = useState([])
  const [typeName, setTypeName] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!profile?.id) return

      try {
        const [types, preference] = await Promise.all([
          fetchInsuranceTypes(),
          fetchLatestClientPreference(profile.id),
        ])

        const typeId = params.typeId ?? preference?.insurance_type_id ?? null
        const budget = params.budget ?? (preference?.budget_max ? String(preference.budget_max) : '')
        const coverage = params.coverage ?? preference?.niveau_couverture ?? ''
        const location = params.location ?? profile?.location ?? ''
        const priority = params.priority ?? 'equilibre'

        const topOffers = await fetchOfferRecommendations({
          insuranceTypeId: typeId,
          budgetMax: budget,
          preferredLocation: location,
          niveauCouverture: coverage,
          priority,
        })

        const selectedType = types.find((item) => item.id === typeId)
        setTypeName(selectedType?.nom ?? '')
        setRecommendations(topOffers)
      } catch (error) {
        setFeedback({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [params.budget, params.coverage, params.location, params.priority, params.typeId, profile?.id, profile?.location])

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
          Recommandations IA
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {typeName ? `Top 3 pour ${typeName}` : 'Top 3 selon votre profil'}
        </ThemedText>

        <Spacer height={20} />

        {feedback && (
          <Text style={[styles.feedback, styles.feedbackError]}>
            {feedback.message}
          </Text>
        )}

        {recommendations.map((offer, index) => (
          <ThemedCard key={offer.id} style={styles.card}>
            <ThemedText title style={styles.cardTitle}>
              #{index + 1} - {offer.nom_assurance || offer.insurance_type?.nom || 'Offre'}
            </ThemedText>
            <Spacer height={8} />
            <ThemedText>Compagnie : {offer.company?.nom_compagnie || 'Inconnue'}</ThemedText>
            <ThemedText>Localisation : {offer.company?.location || 'Non renseignee'}</ThemedText>
            <ThemedText>Tarif principal TTC : {offer.prix} FCFA</ThemedText>
            <ThemedText>Score de pertinence : {offer.score}/100</ThemedText>
            <Spacer height={8} />
            <ThemedText>{offer.description || 'Aucune description disponible.'}</ThemedText>
            <Spacer height={8} />
            <ThemedText title style={styles.reasonTitle}>
              Pourquoi cette recommandation ?
            </ThemedText>
            {offer.reasons.length ? (
              offer.reasons.map((reason, reasonIndex) => (
                <ThemedText key={`${offer.id}-${reasonIndex}`}>- {reason}</ThemedText>
              ))
            ) : (
              <ThemedText>- correspond globalement a votre besoin</ThemedText>
            )}
            
            <Spacer height={12} />
            <ThemedButton
              onPress={() => router.push({ pathname: '/offer-details', params: { id: offer.id } })}
              style={styles.fullButton}
            >
              <Text style={styles.buttonLabel}>Voir les details</Text>
            </ThemedButton>
          </ThemedCard>
        ))}

        {!recommendations.length && (
          <ThemedCard style={styles.card}>
            <ThemedText>
              Aucune recommandation pertinente n'a ete trouvee pour le moment. Essaie de modifier tes preferences.
            </ThemedText>
          </ThemedCard>
        )}

        <Spacer height={16} />

        <ThemedButton onPress={() => router.push('/assistant-ia')} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>Relancer l'assistant IA</Text>
        </ThemedButton>

        <ThemedButton onPress={() => router.push('/offers')} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>Voir toutes les offres</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function RecommendationsScreen() {
  return (
    <UserOnly>
      <RecommendationsContent />
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
  reasonTitle: {
    fontSize: 15,
  },
  fullButton: {
    width: '100%',
  },
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
})