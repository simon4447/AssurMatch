import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import React, { useState } from 'react';
import { Link } from 'expo-router';
import { useUser } from '../../hooks/useUser';
import { colors } from '../../constants/colors';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import Spacer from '../../components/Spacer';
import ThemedTextInput from '../../components/ThemedTextInput';

const Register = () => {
  const [step, setStep] = useState(1) // étape 1: choix rôle, étape 2: infos
  const [role, setRole] = useState(null)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nomCompagnie, setNomCompagnie] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false)
  

  const { register } = useUser();

  const handleSubmit = async () => {
    setError(null);
    if (!role) {
      setError('Choisis d abord un type de compte');
      return;
    }
    if (!email || !password || !confirmPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    if (role === 'client' && (!nom.trim() || !prenom.trim())) {
      setError('Le nom et le prenom sont requis pour un client');
      return;
    }
    if (role === 'company' && !nomCompagnie.trim()) {
      setError("Le nom de la compagnie est requis");
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const extraData = role === 'client'
        ? { nom: nom.trim(), prenom: prenom.trim() }
        : { nom_compagnie: nomCompagnie.trim() }
      await register(email, password, role, extraData);
    } catch (error) {
      setError(error.message);
    }
  };

  // Étape 1 : Choix du rôle
  if (step === 1) return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText title style={styles.title}>Je suis...</ThemedText>
      <Spacer height={20} />
      <ThemedButton onPress={() => { setRole('client'); setStep(2) }}
        style={{ width: '80%' }}>
        <Text style={{ color: '#f2f2f2', textAlign: 'center' }}>👤 Un Client</Text>
      </ThemedButton>
      <ThemedButton onPress={() => { setRole('company'); setStep(2) }}
        style={{ width: '80%' }}>
        <Text style={{ color: '#f2f2f2', textAlign: 'center' }}>🏢 Une Compagnie d'assurance</Text>
      </ThemedButton>
      <Spacer />
      <Link href='/login'>
        <ThemedText style={{ textAlign: 'center' }}>Déjà un compte ? Se connecter</ThemedText>
      </Link>
    </ThemedView>
  )

  // Étape 2 : Infos du compte
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <Spacer />
        <ThemedText title style={styles.title}>
          {role === 'client' ? 'Créer mon compte client' : 'Créer mon compte compagnie'}
        </ThemedText>
        <Spacer height={20} />

        {role === 'client' && <>
          <ThemedTextInput style={styles.input} placeholder='Nom' onChangeText={setNom} value={nom} />
          <ThemedTextInput style={styles.input} placeholder='Prénom' onChangeText={setPrenom} value={prenom} />
        </>}

        {role === 'company' &&
          <ThemedTextInput style={styles.input} placeholder="Nom de la compagnie"
            onChangeText={setNomCompagnie} value={nomCompagnie} />
        }

        <ThemedTextInput style={styles.input} placeholder='Email'
          keyboardType='email-address' onChangeText={setEmail} value={email} />
        <ThemedTextInput style={styles.input} placeholder='Mot de passe'
          onChangeText={setPassword} value={password} secureTextEntry />
        <ThemedTextInput style={styles.input} placeholder='Confirmer le mot de passe'
          onChangeText={setConfirmPassword} value={confirmPassword} secureTextEntry />

        <ThemedButton onPress={handleSubmit} disabled={loading}  style={{ width: '80%' }}>
          <Text style={{ color: '#f2f2f2', textAlign: 'center' }}> {loading ? "Inscription en cours..." : "S'inscrire"}</Text>
        </ThemedButton>

        {error && <Text style={styles.error}>{error}</Text>}
        <Spacer />
        <Text onPress={() => setStep(1)}>
          <ThemedText>← Retour</ThemedText>
        </Text>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { textAlign: 'center', fontSize: 18, marginBottom: 10 },
  input: { width: '80%', marginBottom: 15 },
  error: {
    color: colors.warning, padding: 10, backgroundColor: '#f5c1c8',
    borderColor: colors.warning, borderWidth: 1, borderRadius: 6, marginHorizontal: 10,
  },
});