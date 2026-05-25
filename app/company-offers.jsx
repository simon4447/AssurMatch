import { useEffect, useState } from 'react'
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
import {
  createInsuranceType,
  createOffer,
  deleteOffer,
  fetchCompanyOffers,
  fetchInsuranceTypes,
} from '../lib/insurance'
import { useUser } from '../hooks/useUser'

function CompanyOffersContent() {
  const router = useRouter()
  const { role, profile } = useUser()
  const [offers, setOffers] = useState([])
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [typeFeedback, setTypeFeedback] = useState(null)

  const [typeForm, setTypeForm] = useState({
    nom: '',
    description: '',
  })

  const [offerForm, setOfferForm] = useState({
    nomAssurance: '',
    prix: '',
    description: '',
    whoCanSubscribe: '',
    avantages: '',
    tarifsTtc: '',
    paymentMethods: '',
  })

  const loadData = async () => {
    if (!profile?.id) return

    try {
      const [offersData, typesData] = await Promise.all([
        fetchCompanyOffers(profile.id),
        fetchInsuranceTypes(),
      ])

      setOffers(offersData)
      setInsuranceTypes(typesData)
      if (!selectedTypeId && typesData[0]?.id) {
        setSelectedTypeId(typesData[0].id)
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile?.id])

  const handleOfferChange = (key, value) => {
    setOfferForm((current) => ({ ...current, [key]: value }))
  }

  const handleTypeChange = (key, value) => {
    setTypeForm((current) => ({ ...current, [key]: value }))
  }

  const handleCreateType = async () => {
    if (!typeForm.nom.trim()) {
      setTypeFeedback({ type: 'error', message: "Le nom du type d'assurance est requis." })
      return
    }

    setTypeFeedback(null)

    try {
      const createdType = await createInsuranceType({
        nom: typeForm.nom.trim(),
        description: typeForm.description.trim(),
      })

      setTypeForm({ nom: '', description: '' })
      setTypeFeedback({ type: 'success', message: "Type d'assurance ajoute avec succes." })
      await loadData()
      setSelectedTypeId(createdType.id)
    } catch (error) {
      setTypeFeedback({ type: 'error', message: error.message })
    }
  }

  const handleCreateOffer = async () => {
    if (!profile?.id) return

    if (!insuranceTypes.length) {
      setFeedback({
        type: 'error',
        message: "Aucun type d'assurance n'est disponible. Cree d'abord un type.",
      })
      return
    }

    if (
      !selectedTypeId ||
      !offerForm.nomAssurance.trim() ||
      !offerForm.prix.trim() ||
      !offerForm.description.trim() ||
      !offerForm.whoCanSubscribe.trim() ||
      !offerForm.avantages.trim() ||
      !offerForm.tarifsTtc.trim() ||
      !offerForm.paymentMethods.trim()
    ) {
      setFeedback({
        type: 'error',
        message:
          "Veuillez renseigner le type, le nom de l'assurance, la description, qui peut souscrire, les avantages, les tarifs TTC et les modes de paiement.",
      })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      await createOffer({
        companyId: profile.id,
        insuranceTypeId: selectedTypeId,
        nomAssurance: offerForm.nomAssurance.trim(),
        prix: Number(offerForm.prix),
        description: offerForm.description.trim(),
        whoCanSubscribe: offerForm.whoCanSubscribe.trim(),
        avantages: offerForm.avantages.trim(),
        tarifsTtc: offerForm.tarifsTtc.trim(),
        paymentMethods: offerForm.paymentMethods.trim(),
      })

      setOfferForm({
        nomAssurance: '',
        prix: '',
        description: '',
        whoCanSubscribe: '',
        avantages: '',
        tarifsTtc: '',
        paymentMethods: '',
      })
      setFeedback({ type: 'success', message: 'Offre ajoutee avec succes.' })
      await loadData()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOffer = async (offerId) => {
    setDeletingId(offerId)
    setFeedback(null)

    try {
      await deleteOffer(offerId)
      setFeedback({ type: 'success', message: 'Offre supprimee avec succes.' })
      await loadData()
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setDeletingId(null)
    }
  }

  if (role !== 'company') {
    return (
      <ThemedView safe style={styles.container}>
        <ThemedCard>
          <ThemedText>Cette page est reservee aux compagnies.</ThemedText>
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
          Mes offres
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Cree tes types d'assurance puis publie des offres completes
        </ThemedText>

        <Spacer height={20} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Creer un type d'assurance
          </ThemedText>
          <Spacer height={12} />
          <ThemedTextInput
            style={styles.input}
            placeholder="Nom du type d'assurance"
            value={typeForm.nom}
            onChangeText={(value) => handleTypeChange('nom', value)}
          />
          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description du type"
            multiline
            value={typeForm.description}
            onChangeText={(value) => handleTypeChange('description', value)}
          />

          {typeFeedback && (
            <Text
              style={[
                styles.feedback,
                typeFeedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
              ]}
            >
              {typeFeedback.message}
            </Text>
          )}

          <ThemedButton onPress={handleCreateType} style={styles.fullButton}>
            <Text style={styles.buttonLabel}>Ajouter ce type</Text>
          </ThemedButton>
        </ThemedCard>

        <Spacer height={16} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Nouvelle offre
          </ThemedText>

          <Spacer height={12} />

          {insuranceTypes.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          ) : (
            <Text style={styles.feedbackHint}>
              Aucun type d'assurance n'a ete trouve. Cree d'abord un type.
            </Text>
          )}

          <Spacer height={12} />

          <ThemedTextInput
            style={styles.input}
            placeholder="Nom de l'assurance"
            value={offerForm.nomAssurance}
            onChangeText={(value) => handleOfferChange('nomAssurance', value)}
          />

          <ThemedTextInput
            style={styles.input}
            placeholder="Tarif principal TTC"
            keyboardType="numeric"
            value={offerForm.prix}
            onChangeText={(value) => handleOfferChange('prix', value)}
          />

          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description de l'assurance"
            multiline
            value={offerForm.description}
            onChangeText={(value) => handleOfferChange('description', value)}
          />

          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Qui peut souscrire ?"
            multiline
            value={offerForm.whoCanSubscribe}
            onChangeText={(value) => handleOfferChange('whoCanSubscribe', value)}
          />

          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Les avantages de cette assurance"
            multiline
            value={offerForm.avantages}
            onChangeText={(value) => handleOfferChange('avantages', value)}
          />

          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Differents tarifs TTC (un par ligne ou separes par des virgules)"
            multiline
            value={offerForm.tarifsTtc}
            onChangeText={(value) => handleOfferChange('tarifsTtc', value)}
          />

          <ThemedTextInput
            style={[styles.input, styles.textArea]}
            placeholder="Comment souscrire / modes de paiement (Orange Money, Mobile Money, virement, agence...)"
            multiline
            value={offerForm.paymentMethods}
            onChangeText={(value) => handleOfferChange('paymentMethods', value)}
          />

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

          <ThemedButton onPress={handleCreateOffer} style={styles.fullButton}>
            <Text style={styles.buttonLabel}>
              {saving ? 'Enregistrement...' : "Publier l'offre"}
            </Text>
          </ThemedButton>
        </ThemedCard>

        <Spacer height={16} />

        <ThemedText title style={styles.sectionTitle}>
          Offres publiees
        </ThemedText>

        {offers.map((offer) => (
          <ThemedCard key={offer.id} style={styles.card}>
            <ThemedText title style={styles.cardTitle}>
              {offer.nom_assurance || 'Assurance sans nom'}
            </ThemedText>
            <Spacer height={8} />
            <ThemedText>Type : {offer.insurance_type?.nom || 'Type non defini'}</ThemedText>
            <ThemedText>Tarif principal TTC : {offer.prix} FCFA</ThemedText>
            <Spacer height={8} />
            <ThemedText>{offer.description || 'Sans description.'}</ThemedText>
            <Spacer height={8} />
            <ThemedText>Qui peut souscrire : {offer.who_can_subscribe || 'Non renseigne'}</ThemedText>
            <ThemedText>Avantages : {offer.avantages || 'Non renseignes'}</ThemedText>
            <ThemedText>Tarifs TTC : {offer.tarifs_ttc || 'Non renseignes'}</ThemedText>
            <ThemedText>Modes de paiement : {offer.payment_methods || 'Non renseignes'}</ThemedText>

            <ThemedButton
              onPress={() => handleDeleteOffer(offer.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.buttonLabel}>
                {deletingId === offer.id ? 'Suppression...' : 'Supprimer'}
              </Text>
            </ThemedButton>
          </ThemedCard>
        ))}

        {!offers.length && (
          <ThemedCard style={styles.card}>
            <ThemedText>Aucune offre n'a encore ete publiee.</ThemedText>
          </ThemedCard>
        )}

        <Spacer height={16} />

        <ThemedButton onPress={() => router.back()} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>Retour</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function CompanyOffersScreen() {
  return (
    <UserOnly>
      <CompanyOffersContent />
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
  sectionTitle: {
    fontSize: 18,
  },
  card: {
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 18,
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
  input: {
    marginBottom: 12,
  },
  feedbackHint: {
    marginBottom: 12,
    color: colors.warning,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
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
  feedbackSuccess: {
    backgroundColor: '#cdeccf',
    color: '#235c2b',
  },
  fullButton: {
    width: '100%',
  },
  deleteButton: {
    width: '100%',
    backgroundColor: colors.warning,
  },
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
})