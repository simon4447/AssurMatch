import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
import { createSubscription, fetchOfferById, parseListField } from '../lib/insurance'

function SubscribeOfferContent() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { role, profile } = useUser()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    age: '',
    email: '',
    telephone: '',
    adresse: '',
  })

  useEffect(() => {
    const loadOffer = async () => {
      try {
        const data = await fetchOfferById(id)
        setOffer(data)
        setSelectedPaymentMethod(parseListField(data.payment_methods)[0] ?? '')
      } catch (error) {
        setFeedback(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (role === 'client' && profile) {
      setForm({
        nom: profile.nom ?? '',
        prenom: profile.prenom ?? '',
        age: profile.age ? String(profile.age) : '',
        email: '',
        telephone: profile.telephone ?? '',
        adresse: profile.location ?? '',
      })
    }

    if (id) {
      loadOffer()
    }
  }, [id, profile, role])

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handlePay = async () => {
    if (!profile?.id || !offer?.id) return

    if (
      !form.nom.trim() ||
      !form.prenom.trim() ||
      !form.email.trim() ||
      !form.telephone.trim() ||
      !form.adresse.trim() ||
      !selectedPaymentMethod
    ) {
      setFeedback('Veuillez renseigner toutes les informations obligatoires et choisir un mode de paiement.')
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const subscription = await createSubscription({
        clientId: profile.id,
        insuranceOfferId: offer.id,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        age: form.age.trim() ? Number(form.age) : null,
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        adresse: form.adresse.trim(),
        paymentMethod: selectedPaymentMethod,
        paidAmount: Number(offer.prix ?? 0),
      })

      router.replace({
        pathname: '/payment-receipt',
        params: {
          subscriptionId: subscription.id,
          receiptNumber: subscription.receipt_number,
          insuranceNumber: subscription.insurance_number,
          clientName: `${subscription.prenom} ${subscription.nom}`,
          amount: String(subscription.paid_amount),
          paymentMethod: subscription.payment_method,
          offerName: subscription.insurance_offer?.nom_assurance || '',
          companyName: subscription.insurance_offer?.company?.nom_compagnie || '',
          receiptMessage: subscription.receipt_message || '',
        },
      })
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setSaving(false)
    }
  }

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

  if (!offer) {
    return (
      <ThemedView safe style={styles.container}>
        <ThemedCard>
          <ThemedText>{feedback || "L'offre demandee est introuvable."}</ThemedText>
        </ThemedCard>
      </ThemedView>
    )
  }

  const paymentMethods = parseListField(offer.payment_methods)

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          Souscription
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {offer.nom_assurance || 'Assurance'}
        </ThemedText>

        <Spacer height={20} />

        <ThemedCard style={styles.card}>
          <ThemedText>Compagnie : {offer.company?.nom_compagnie || 'Inconnue'}</ThemedText>
          <ThemedText>Montant a payer : {offer.prix} FCFA</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Vos informations</ThemedText>
          <Spacer height={12} />
          <ThemedTextInput style={styles.input} placeholder="Nom" value={form.nom} onChangeText={(value) => handleChange('nom', value)} />
          <ThemedTextInput style={styles.input} placeholder="Prenom" value={form.prenom} onChangeText={(value) => handleChange('prenom', value)} />
          <ThemedTextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={form.age} onChangeText={(value) => handleChange('age', value)} />
          <ThemedTextInput style={styles.input} placeholder="Adresse email" keyboardType="email-address" value={form.email} onChangeText={(value) => handleChange('email', value)} />
          <ThemedTextInput style={styles.input} placeholder="Numero de telephone" value={form.telephone} onChangeText={(value) => handleChange('telephone', value)} />
          <ThemedTextInput style={[styles.input, styles.textArea]} placeholder="Adresse" multiline value={form.adresse} onChangeText={(value) => handleChange('adresse', value)} />
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Choisir un mode de paiement</ThemedText>
          <Spacer height={12} />
          {paymentMethods.map((method) => (
            <ThemedButton
              key={method}
              onPress={() => setSelectedPaymentMethod(method)}
              style={[
                styles.paymentButton,
                selectedPaymentMethod === method && styles.paymentButtonActive,
              ]}
            >
              <Text style={styles.buttonLabel}>{method}</Text>
            </ThemedButton>
          ))}
        </ThemedCard>

        {feedback && (
          <Text style={[styles.feedback, styles.feedbackError]}>
            {feedback}
          </Text>
        )}

        <Spacer height={16} />

        <ThemedButton onPress={handlePay} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>
            {saving ? 'Paiement en cours...' : 'Souscrire a cette assurance'}
          </Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function SubscribeOfferScreen() {
  return (
    <UserOnly>
      <SubscribeOfferContent />
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
  input: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  paymentButton: {
    width: '100%',
  },
  paymentButtonActive: {
    backgroundColor: '#4f3388',
  },
  feedback: {
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  feedbackError: {
    backgroundColor: '#f5c1c8',
    color: colors.warning,
  },
  fullButton: {
    width: '100%',
  },
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
})