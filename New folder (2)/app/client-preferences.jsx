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
import { fetchLatestClientPreference, saveClientPreference } from '../lib/profile'

function ClientPreferencesContent() {
  const router = useRouter()
  const { role, profile } = useUser()
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [budgetMax, setBudgetMax] = useState('')
  const [niveauCouverture, setNiveauCouverture] = useState('')
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
      } catch (error) {
        setFeedback({ type: 'error', message: error.message })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile?.id])

  const handleSave = async () => {
    if (!profile?.id) return
    if (!selectedTypeId) {
      setFeedback({ type: 'error', message: "Choisis d'abord un type d'assurance." })
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

      setFeedback({ type: 'success', message: 'Preferences enregistrees avec succes.' })
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
          Mes preferences
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Definis ton besoin principal pour affiner les recommandations
        </ThemedText>

        <Spacer height={20} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Type d'assurance
          </ThemedText>
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

          <Spacer height={12} />

          <ThemedTextInput
            style={styles.input}
            placeholder="Budget maximum"
            keyboardType="numeric"
            value={budgetMax}
            onChangeText={setBudgetMax}
          />

          <ThemedTextInput
            style={styles.input}
            placeholder="Niveau de couverture souhaite (basique, standard, premium)"
            value={niveauCouverture}
            onChangeText={setNiveauCouverture}
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

          <ThemedButton onPress={handleSave} style={styles.fullButton}>
            <Text style={styles.buttonLabel}>
              {saving ? 'Enregistrement...' : 'Enregistrer mes preferences'}
            </Text>
          </ThemedButton>
        </ThemedCard>

        <Spacer height={16} />

        <ThemedButton onPress={() => router.push('/assistant-ia')} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>Continuer avec l'assistant IA</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function ClientPreferencesScreen() {
  return (
    <UserOnly>
      <ClientPreferencesContent />
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