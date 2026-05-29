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
import { useUser } from '../hooks/useUser'
import { fetchOfferById, parseListField } from '../lib/insurance'
import { summarizeOffer } from '../lib/ai'

function OfferDetailsContent() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { role, account } = useUser()
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
  const contactMethods = parseListField(offer.payment_methods)

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
          <ThemedText title style={styles.cardTitle}>Resume IA de l'offre</ThemedText>
          <Spacer height={8} />
          <ThemedText>{summarizeOffer(offer)}</ThemedText>
        </ThemedCard>

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
          <ThemedText title style={styles.cardTitle}>Public concerne</ThemedText>
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
          <ThemedText title style={styles.cardTitle}>Modes de contact proposes</ThemedText>
          <Spacer height={8} />
            {contactMethods.length ? (
            contactMethods.map((item, index) => (
              <ThemedText key={`${offer.id}-contact-${index}`}>- {item}</ThemedText>
            ))
          ) : (
            <ThemedText>{offer.payment_methods || 'Non renseigne'}</ThemedText>
          )}
        </ThemedCard>

        <Spacer height={16} />

        {role === 'client' && account?.id && offer.company?.account_id ? (
          <>
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
              style={styles.fullButton}
            >
              <Text style={styles.buttonLabel}>Discuter avec la compagnie</Text>
            </ThemedButton>

          </>
        ) : (
          <ThemedCard style={styles.card}>
            <ThemedText>Connecte-toi avec un compte client pour discuter avec la compagnie.</ThemedText>
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