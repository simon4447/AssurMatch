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
import { useUser } from '../hooks/useUser'
import { fetchInsuranceTypes } from '../lib/insurance'
import { fetchLatestClientPreference, saveClientPreference, updateClientProfile } from '../lib/profile'

function AssistantIAContent() {
  const router = useRouter()
  const { role, profile, refreshProfile } = useUser()
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [step, setStep] = useState(1)
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [budgetMax, setBudgetMax] = useState('')
  const [niveauCouverture, setNiveauCouverture] = useState('')
  const [priority, setPriority] = useState('equilibre')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return

      try {
        const [typesData, preference] = await Promise.all([
          fetchInsuranceTypes(),
          fetchLatestClientPreference(profile.id),
        ])

        setInsuranceTypes(typesData)
        setSelectedTypeId(preference?.insurance_type_id ?? typesData[0]?.id ?? null)
        setBudgetMax(preference?.budget_max ? String(preference.budget_max) : '')
        setNiveauCouverture(preference?.niveau_couverture ?? '')
        setLocation(profile?.location ?? '')
      } catch (error) {
        setFeedback({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile?.id])

  const goToRecommendations = async () => {
    if (!profile?.id || !selectedTypeId) {
      setFeedback({ type: 'error', message: "Complete d'abord les informations essentielles." })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      await saveClientPreference({
        clientId: profile.id,
        insuranceTypeId: selectedTypeId,
        budgetMax: budgetMax.trim() ? Number(budgetMax) : null,
        niveauCouverture: niveauCouverture.trim() || null,
      })

      if (location.trim() && location.trim() !== (profile?.location ?? '')) {
        await updateClientProfile(profile.id, {
          location: location.trim(),
        })
        await refreshProfile()
      }

      router.push({
        pathname: '/recommendations',
        params: {
          typeId: selectedTypeId,
          budget: budgetMax,
          coverage: niveauCouverture,
          priority,
          location,
        },
      })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
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

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          Assistant IA
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Reponds a quelques questions pour obtenir des recommandations
        </ThemedText>

        <Spacer height={20} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Etape {step} / 4
          </ThemedText>
          <Spacer height={12} />

          {step === 1 && (
            <>
              <ThemedText>Quel type d'assurance recherches-tu ?</ThemedText>
              <Spacer height={12} />
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
                    <Text style={styles.buttonLabel}>{type.nom}</Text>
                  </ThemedButton>
                ))}
              </ScrollView>
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText>Quel est ton budget approximatif ?</ThemedText>
              <Spacer height={12} />
              <ThemedTextInput
                style={styles.input}
                placeholder="Budget maximum"
                keyboardType="numeric"
                value={budgetMax}
                onChangeText={setBudgetMax}
              />
            </>
          )}

          {step === 3 && (
            <>
              <ThemedText>Quel niveau de couverture souhaites-tu ?</ThemedText>
              <Spacer height={12} />
              <ThemedTextInput
                style={styles.input}
                placeholder="Basique, standard ou premium"
                value={niveauCouverture}
                onChangeText={setNiveauCouverture}
              />
              <ThemedText>Quelle localisation preferez-vous ?</ThemedText>
              <Spacer height={12} />
              <ThemedTextInput
                style={styles.input}
                placeholder="Ville ou zone geographique"
                value={location}
                onChangeText={setLocation}
              />
            </>
          )}

          {step === 4 && (
            <>
              <ThemedText>Quelle est ta priorite principale ?</ThemedText>
              <Spacer height={12} />
              {[
                { id: 'economique', label: 'Le prix le plus bas' },
                { id: 'equilibre', label: 'Un bon equilibre' },
                { id: 'protection', label: 'La meilleure protection possible' },
              ].map((item) => (
                <ThemedButton
                  key={item.id}
                  onPress={() => setPriority(item.id)}
                  style={[
                    styles.priorityButton,
                    priority === item.id && styles.filterButtonActive,
                  ]}
                >
                  <Text style={styles.buttonLabel}>{item.label}</Text>
                </ThemedButton>
              ))}
            </>
          )}

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

          <Spacer height={12} />

          {step > 1 && (
            <ThemedButton onPress={() => setStep((current) => current - 1)} style={styles.fullButton}>
              <Text style={styles.buttonLabel}>Retour</Text>
            </ThemedButton>
          )}

          {step < 4 ? (
            <ThemedButton onPress={() => setStep((current) => current + 1)} style={styles.fullButton}>
              <Text style={styles.buttonLabel}>Continuer</Text>
            </ThemedButton>
          ) : (
            <ThemedButton onPress={goToRecommendations} style={styles.fullButton}>
              <Text style={styles.buttonLabel}>
                {saving ? 'Analyse en cours...' : 'Voir mes recommandations'}
              </Text>
            </ThemedButton>
          )}
        </ThemedCard>
      </ScrollView>
    </ThemedView>
  )
}

export default function AssistantIAScreen() {
  return (
    <UserOnly>
      <AssistantIAContent />
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
  filterButton: {
    marginRight: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButtonActive: {
    backgroundColor: '#4f3388',
  },
  priorityButton: {
    width: '100%',
  },
  input: {
    marginBottom: 12,
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
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
  },
})