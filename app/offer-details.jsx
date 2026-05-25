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
import { fetchOfferById, parseListField } from '../lib/insurance'

function OfferDetailsContent() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { role } = useUser()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const loadOffer = async () => {
      try {
        const data = await fetchOfferById(id)
        setOffer(data)
      } catch (error) {
        setFeedback(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadOffer()
    }
  }, [id])

  if (loading) {
    return <ThemedLoader />
  }

  if (!offer) {
    return (
      <ThemedView safe style={styles.container}>
        <ThemedCard>
          <ThemedText>{feedback || "L'offre demandee est introuvable."}</ThemedText>
        </ThemedCard>
      </ThemedView>
    )
  }

  const tariffs = parseListField(offer.tarifs_ttc)
  const paymentMethods = parseListField(offer.payment_methods)

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          {offer.nom_assurance || 'Detail de l assurance'}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {offer.company?.nom_compagnie || 'Compagnie non renseignee'}
        </ThemedText>

        <Spacer height={20} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Informations generales</ThemedText>
          <Spacer height={8} />
          <ThemedText>Type : {offer.insurance_type?.nom || 'Non defini'}</ThemedText>
          <ThemedText>Tarif principal TTC : {offer.prix} FCFA</ThemedText>
          <ThemedText>Localisation : {offer.company?.location || 'Non renseignee'}</ThemedText>
          <Spacer height={8} />
          <ThemedText>{offer.description || 'Aucune description disponible.'}</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Qui peut souscrire ?</ThemedText>
          <Spacer height={8} />
          <ThemedText>{offer.who_can_subscribe || 'Non precise'}</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Avantages</ThemedText>
          <Spacer height={8} />
          <ThemedText>{offer.avantages || 'Non renseignes'}</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Tarifs TTC</ThemedText>
          <Spacer height={8} />
          {tariffs.length ? (
            tariffs.map((item, index) => <ThemedText key={`${offer.id}-tariff-${index}`}>- {item}</ThemedText>)
          ) : (
            <ThemedText>{offer.tarifs_ttc || 'Non renseignes'}</ThemedText>
          )}
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Comment souscrire ?</ThemedText>
          <Spacer height={8} />
          {paymentMethods.length ? (
            paymentMethods.map((item, index) => (
              <ThemedText key={`${offer.id}-payment-${index}`}>- {item}</ThemedText>
            ))
          ) : (
            <ThemedText>{offer.payment_methods || 'Non renseigne'}</ThemedText>
          )}
        </ThemedCard>

        <Spacer height={16} />

        {role === 'client' ? (
          <ThemedButton
            onPress={() => router.push({ pathname: '/subscribe-offer', params: { id: offer.id } })}
            style={styles.fullButton}
          >
            <Text style={styles.buttonLabel}>Souscrire a cette assurance</Text>
          </ThemedButton>
        ) : (
          <ThemedCard style={styles.card}>
            <ThemedText>Connecte-toi avec un compte client pour souscrire a cette assurance.</ThemedText>
          </ThemedCard>
        )}

        <ThemedButton onPress={() => router.back()} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>Retour</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function OfferDetailsScreen() {
  return (
    <UserOnly>
      <OfferDetailsContent />
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