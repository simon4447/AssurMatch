import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import UserOnly from '../components/auth/UserOnly'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedText from '../components/ThemedText'
import ThemedTextInput from '../components/ThemedTextInput'
import ThemedView from '../components/ThemedView'
import { colors } from '../constants/colors'
import { useUser } from '../hooks/useUser'
import { updateClientProfile, updateCompanyProfile } from '../lib/profile'

function ProfileContent() {
  const router = useRouter()
  const { user, profile, role, logout, refreshProfile } = useUser()
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)

  const [clientForm, setClientForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    age: '',
    location: '',
    situation_personnelle: '',
  })

  const [companyForm, setCompanyForm] = useState({
    nom_compagnie: '',
    location: '',
  })

  useEffect(() => {
    if (role === 'client' && profile) {
      setClientForm({
        nom: profile.nom ?? '',
        prenom: profile.prenom ?? '',
        telephone: profile.telephone ?? '',
        age: profile.age ? String(profile.age) : '',
        location: profile.location ?? '',
        situation_personnelle: profile.situation_personnelle ?? '',
      })
    }

    if (role === 'company' && profile) {
      setCompanyForm({
        nom_compagnie: profile.nom_compagnie ?? '',
        location: profile.location ?? '',
      })
    }
  }, [profile, role])

  const displayName =
    role === 'client'
      ? [profile?.prenom, profile?.nom].filter(Boolean).join(' ')
      : role === 'company'
        ? profile?.nom_compagnie
        : null

  const roleLabel =
    role === 'client'
      ? 'Client'
      : role === 'company'
        ? "Compagnie d'assurance"
        : 'Role introuvable'

  const handleClientChange = (key, value) => {
    setClientForm((current) => ({ ...current, [key]: value }))
  }

  const handleCompanyChange = (key, value) => {
    setCompanyForm((current) => ({ ...current, [key]: value }))
  }

  const handleSaveProfile = async () => {
    if (!profile?.id) return

    setSaving(true)
    setFeedback(null)

    try {
      if (role === 'client') {
        await updateClientProfile(profile.id, {
          nom: clientForm.nom.trim(),
          prenom: clientForm.prenom.trim(),
          telephone: clientForm.telephone.trim() || null,
          age: clientForm.age.trim() ? Number(clientForm.age) : null,
          location: clientForm.location.trim() || null,
          situation_personnelle: clientForm.situation_personnelle.trim() || null,
        })
      }

      if (role === 'company') {
        await updateCompanyProfile(profile.id, {
          nom_compagnie: companyForm.nom_compagnie.trim(),
          location: companyForm.location.trim() || null,
        })
      }

      await refreshProfile()
      setFeedback({ type: 'success', message: 'Profil mis a jour avec succes.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={20} />
        <ThemedText title style={styles.title}>
          AssurMatch
        </ThemedText>
        <ThemedText style={styles.subtitle}>Espace connecte</ThemedText>

        <Spacer height={24} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Profil
          </ThemedText>
          <Spacer height={12} />
          <ThemedText>Role : {roleLabel}</ThemedText>
          <ThemedText>Nom : {displayName || 'A completer'}</ThemedText>
          <ThemedText>Email : {user?.email || 'Non renseigne'}</ThemedText>
        </ThemedCard>

        <Spacer height={16} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Completer mon profil
          </ThemedText>
          <Spacer height={12} />

          {role === 'client' ? (
            <>
              <ThemedTextInput
                style={styles.input}
                placeholder="Nom"
                value={clientForm.nom}
                onChangeText={(value) => handleClientChange('nom', value)}
              />
              <ThemedTextInput
                style={styles.input}
                placeholder="Prenom"
                value={clientForm.prenom}
                onChangeText={(value) => handleClientChange('prenom', value)}
              />
              <ThemedTextInput
                style={styles.input}
                placeholder="Telephone"
                value={clientForm.telephone}
                onChangeText={(value) => handleClientChange('telephone', value)}
              />
              <ThemedTextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                value={clientForm.age}
                onChangeText={(value) => handleClientChange('age', value)}
              />
              <ThemedTextInput
                style={styles.input}
                placeholder="Localisation"
                value={clientForm.location}
                onChangeText={(value) => handleClientChange('location', value)}
              />
              <ThemedTextInput
                style={[styles.input, styles.textArea]}
                placeholder="Situation personnelle"
                multiline
                value={clientForm.situation_personnelle}
                onChangeText={(value) => handleClientChange('situation_personnelle', value)}
              />
            </>
          ) : role === 'company' ? (
            <>
              <ThemedTextInput
                style={styles.input}
                placeholder="Nom de la compagnie"
                value={companyForm.nom_compagnie}
                onChangeText={(value) => handleCompanyChange('nom_compagnie', value)}
              />
              <ThemedTextInput
                style={styles.input}
                placeholder="Zone couverte / localisation"
                value={companyForm.location}
                onChangeText={(value) => handleCompanyChange('location', value)}
              />
            </>
          ) : (
            <ThemedText>Le type de compte n'a pas encore pu etre determine.</ThemedText>
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

          <ThemedButton onPress={handleSaveProfile} style={styles.fullButton}>
            <Text style={styles.buttonLabel}>
              {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            </Text>
          </ThemedButton>
        </ThemedCard>

        <Spacer height={16} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>
            Actions rapides
          </ThemedText>
          <Spacer height={12} />

          {role === 'client' ? (
            <>
              <ThemedButton onPress={() => router.push('/offers')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Voir les offres</Text>
              </ThemedButton>
              <ThemedButton onPress={() => router.push('/client-preferences')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Mes preferences</Text>
              </ThemedButton>
              <ThemedButton onPress={() => router.push('/assistant-ia')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Assistant IA</Text>
              </ThemedButton>
              <ThemedButton onPress={() => router.push('/recommendations')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Mes recommandations</Text>
              </ThemedButton>

                            <ThemedButton onPress={() => router.push('/inbox')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Ma messagerie</Text>
              </ThemedButton>

              <ThemedButton onPress={() => router.push('/my-subscriptions')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Mes souscriptions payees</Text>
              </ThemedButton>
            </>
          ) : role === 'company' ? (
            <>
              <ThemedButton onPress={() => router.push('/company-offers')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Gerer mes offres</Text>
              </ThemedButton>

                            <ThemedButton onPress={() => router.push('/inbox')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Ma messagerie</Text>
              </ThemedButton>
              
               <ThemedButton onPress={() => router.push('/company-subscriptions')} style={styles.fullButton}>
                <Text style={styles.buttonLabel}>Souscriptions recues</Text>
              </ThemedButton>
            </>
          ) : (
            <ThemedText>Le type de compte n'a pas encore pu etre determine.</ThemedText>
          )}
        </ThemedCard>

        <Spacer height={24} />

        <ThemedButton onPress={logout} style={styles.logoutButton}>
          <Text style={styles.buttonLabel}>Se deconnecter</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function ProfileScreen() {
  return (
    <UserOnly>
      <ProfileContent />
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
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    width: '100%',
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
  logoutButton: {
    width: '100%',
  },
  buttonLabel: {
    color: '#f2f2f2',
    textAlign: 'center',
    fontSize: 16,
  },
})