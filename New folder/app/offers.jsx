import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedLoader from '../components/ThemedLoader'
import ThemedText from '../components/ThemedText'
import ThemedTextInput from '../components/ThemedTextInput'
import ThemedView from '../components/ThemedView'
import UserOnly from '../components/auth/UserOnly'
import { colors } from '../constants/colors'
import { fetchAllOffers, fetchInsuranceTypes } from '../lib/insurance'
import { useUser } from '../hooks/useUser'

function OffersContent() {
  const router = useRouter()
  const { role, account } = useUser()
  const [offers, setOffers] = useState([])
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [offersData, typesData] = await Promise.all([
          fetchAllOffers(),
          fetchInsuranceTypes(),
        ])

        setOffers(offersData)
        setInsuranceTypes(typesData)
      } catch (error) {
        setFeedback({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return offers.filter((offer) => {
      const matchesType = !selectedTypeId || offer.insurance_type?.id === selectedTypeId
      const haystack = [
        offer.nom_assurance,
        offer.description,
        offer.company?.nom_compagnie,
        offer.insurance_type?.nom,
        offer.company?.location,
        offer.avantages,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      return matchesType && matchesSearch
    })
  }, [offers, search, selectedTypeId])

  if (loading) {
    return <ThemedLoader />
  }

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          Offres d'assurance
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Recherche, detail et souscription directe
        </ThemedText>

        <Spacer height={20} />

        <ThemedTextInput
          placeholder="Rechercher une assurance, une compagnie ou une ville"
          value={search}
          onChangeText={setSearch}
        />

        <Spacer height={12} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedButton
            onPress={() => setSelectedTypeId(null)}
            style={[styles.filterButton, !selectedTypeId && styles.filterButtonActive]}
          >
            <Text style={styles.filterButtonLabel}>Toutes</Text>
          </ThemedButton>

          {insuranceTypes.map((type) => (
            <ThemedButton
              key={type.id}
              onPress={() => setSelectedTypeId(type.id)}
              style={[
                styles.filterButton,
                selectedTypeId === type.id && styles.filterButtonActive,
              ]}
            >
              <Text style={styles.filterButtonLabel}>{type.nom}</Text>
            </ThemedButton>
          ))}
        </ScrollView>

        <Spacer height={12} />

        {feedback && (
          <Text
            style={[
              styles.feedback,
              feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
            ]}
          >
            {feedback.message}
          </Text>
        )}

        <Spacer height={8} />

        {filteredOffers.map((offer) => (
          <ThemedCard key={offer.id} style={styles.card}>
            <ThemedText title style={styles.cardTitle}>
              {offer.nom_assurance || 'Assurance sans nom'}
            </ThemedText>
            <Spacer height={8} />
            <ThemedText>Type : {offer.insurance_type?.nom || 'Type non defini'}</ThemedText>
            <ThemedText>Compagnie : {offer.company?.nom_compagnie || 'Inconnue'}</ThemedText>
            <ThemedText>Localisation : {offer.company?.location || 'Non renseignee'}</ThemedText>
            <ThemedText>Tarif principal TTC : {offer.prix} FCFA</ThemedText>
            <Spacer height={8} />
            <ThemedText>{offer.description || 'Aucune description disponible.'}</ThemedText>

            <Spacer height={12} />
            <ThemedButton
              onPress={() => router.push({ pathname: '/offer-details', params: { id: offer.id } })}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonLabel}>Voir les details</Text>
            </ThemedButton>

            {role === 'client' && account?.id && offer.company?.account_id && (
              <ThemedButton
                onPress={() =>
                  router.push({
                    pathname: '/conversation',
                    params: {
                      offerId: offer.id,
                      otherAccountId: offer.company.account_id,
                      title: offer.nom_assurance || 'Conversation',
                    },
                  })
                }
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonLabel}>Discuter avec la compagnie</Text>
              </ThemedButton>
            )}
          </ThemedCard>
        ))}

        {!filteredOffers.length && (
          <ThemedCard style={styles.card}>
            <ThemedText>Aucune offre ne correspond a la recherche actuelle.</ThemedText>
          </ThemedCard>
        )}

        <Spacer height={16} />

        <ThemedButton onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.actionButtonLabel}>Retour</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function OffersScreen() {
  return (
    <UserOnly>
      <OffersContent />
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
  filterButton: {
    marginRight: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButtonActive: {
    backgroundColor: '#4f3388',
  },
  filterButtonLabel: {
    color: '#f2f2f2',
  },
  feedback: {
    padding: 12,
    borderRadius: 6,
  },
  feedbackError: {
    backgroundColor: '#f5c1c8',
    color: colors.warning,
  },
  feedbackSuccess: {
    backgroundColor: '#cdeccf',
    color: '#235c2b',
  },
  card: {
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 18,
  },
  actionButton: {
    width: '100%',
  },
  actionButtonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
  },
})