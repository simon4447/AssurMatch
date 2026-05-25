import { Share, ScrollView, StyleSheet, Text } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import ThemedCard from '../components/ThemedCard'
import ThemedText from '../components/ThemedText'
import ThemedView from '../components/ThemedView'
import UserOnly from '../components/auth/UserOnly'
import { colors } from '../constants/colors'

function PaymentReceiptContent() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [feedback, setFeedback] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const receiptText = [
    'Recu de paiement AssurMatch',
    `Numero de recu : ${params.receiptNumber ?? ''}`,
    `Numero d'assurance : ${params.insuranceNumber ?? ''}`,
    `Client : ${params.clientName ?? ''}`,
    `Offre : ${params.offerName ?? ''}`,
    `Compagnie : ${params.companyName ?? ''}`,
    `Montant paye : ${params.amount ?? ''} FCFA`,
    `Mode de paiement : ${params.paymentMethod ?? ''}`,
    '',
    String(params.receiptMessage ?? ''),
  ].join('\n')
   const receiptHtml = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 32px;
            color: #201e2b;
          }
          .header {
            margin-bottom: 24px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 6px;
          }
          .subtitle {
            color: #625f72;
            font-size: 14px;
          }
          .card {
            border: 1px solid #d6d5e1;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            background: #f7f7fb;
          }
          .card-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 12px;
          }
          .line {
            margin-bottom: 8px;
            line-height: 1.5;
          }
          .footer {
            margin-top: 20px;
            color: #625f72;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Recu de paiement AssurMatch</div>
          <div class="subtitle">Paiement effectue avec succes</div>
        </div>

        <div class="card">
          <div class="card-title">Informations du recu</div>
          <div class="line"><strong>Numero de recu :</strong> ${params.receiptNumber ?? ''}</div>
          <div class="line"><strong>Numero d'assurance :</strong> ${params.insuranceNumber ?? ''}</div>
          <div class="line"><strong>Client :</strong> ${params.clientName ?? ''}</div>
          <div class="line"><strong>Offre :</strong> ${params.offerName ?? ''}</div>
          <div class="line"><strong>Compagnie :</strong> ${params.companyName ?? ''}</div>
          <div class="line"><strong>Montant paye :</strong> ${params.amount ?? ''} FCFA</div>
          <div class="line"><strong>Mode de paiement :</strong> ${params.paymentMethod ?? ''}</div>
        </div>

        <div class="card">
          <div class="card-title">Message</div>
          <div class="line">
            ${
              params.receiptMessage ||
              "Rdv a l'agence la plus proche pour complement d'information avec votre recu de paiement pour la finalisation de la souscription."
            }
          </div>
        </div>

        <div class="footer">
          Ce document peut etre presente a l'agence pour finaliser la souscription.
        </div>
      </body>
    </html>
  `

  const handleShare = async () => {
    await Share.share({
      message: receiptText,
    })
  }
  const handleExportPdf = async () => {
    setExportingPdf(true)
    setFeedback(null)

    try {
      const { uri } = await Print.printToFileAsync({
        html: receiptHtml,
        base64: false,
      })

      const sharingAvailable = await Sharing.isAvailableAsync()

      if (!sharingAvailable) {
        setFeedback(`PDF genere avec succes : ${uri}`)
        return
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Telecharger ou partager le recu PDF',
        UTI: 'com.adobe.pdf',
      })

      setFeedback('Le recu PDF a ete genere avec succes.')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setExportingPdf(false)
    }
  }

  return (

    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Spacer height={12} />
        <ThemedText title style={styles.title}>
          Recu de paiement
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Paiement effectue avec succes
        </ThemedText>

        <Spacer height={20} />

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Informations du recu</ThemedText>
          <Spacer height={12} />
          <ThemedText>Numero de recu : {params.receiptNumber}</ThemedText>
          <ThemedText>Numero d'assurance : {params.insuranceNumber}</ThemedText>
          <ThemedText>Client : {params.clientName}</ThemedText>
          <ThemedText>Offre : {params.offerName}</ThemedText>
          <ThemedText>Compagnie : {params.companyName}</ThemedText>
          <ThemedText>Montant paye : {params.amount} FCFA</ThemedText>
          <ThemedText>Mode de paiement : {params.paymentMethod}</ThemedText>
        </ThemedCard>

        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.cardTitle}>Message</ThemedText>
          <Spacer height={12} />
          <ThemedText>
            {params.receiptMessage ||
              "Rdv a l'agence la plus proche pour complement d'information avec votre recu de paiement pour la finalisation de la souscription."}
          </ThemedText>
        </ThemedCard>

        <Spacer height={16} />
             {feedback && (
          <Text
            style={[
              styles.feedback,
              feedback.toLowerCase().includes('succes') ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            {feedback}
          </Text>
        )}

        <ThemedButton onPress={handleExportPdf} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>
            {exportingPdf ? 'Generation du PDF...' : 'Telecharger le recu en PDF'}
          </Text>
          <Text style={styles.buttonLabel}>Partager le recu en texte</Text>
        </ThemedButton>

        <ThemedButton onPress={() => router.push('/offers')} style={styles.fullButton}>
          <Text style={styles.buttonLabel}>Retour aux offres</Text>
        </ThemedButton>
      </ScrollView>
    </ThemedView>
  )
}

export default function PaymentReceiptScreen() {
  return (
    <UserOnly>
      <PaymentReceiptContent />
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
   feedback: {
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
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