export function detectClientProfile({ profile, preference }) {
  const age = Number(profile?.age ?? 0)
  const situation = String(profile?.situation_personnelle ?? '').toLowerCase()
  const coverage = String(preference?.niveau_couverture ?? '').toLowerCase()
  const budget = Number(preference?.budget_max ?? 0)
  
  let label = 'Profil standard'
  const reasons = []

  if (age > 0 && age <= 25) {
    label = 'Jeune actif / etudiant'
    reasons.push('age plutot jeune')
  }

  if (situation.includes('famille') || situation.includes('marie') || situation.includes('enfant')) {
    label = 'Profil famille'
    reasons.push('situation personnelle orientee famille')
  }

  if (coverage.includes('premium')) {
    label = 'Profil protection renforcee'
    reasons.push('niveau de couverture eleve')
  }

  if (budget > 0 && budget < 15000) {
    reasons.push('budget sensible')
  }
 
  return {
    label,
    summary: reasons.length
      ? `${label} detecte a partir de ${reasons.join(', ')}.`
      : `${label} detecte a partir des informations disponibles.`,
  }
}

export function buildPreferenceConsistencyAlert({ profile, preference }) {
  const alerts = []
  const budget = Number(preference?.budget_max ?? 0)
  const coverage = String(preference?.niveau_couverture ?? '').toLowerCase()
  const location = String(profile?.location ?? '').trim()

  if (!location) {
    alerts.push("ajouter une localisation pour affiner les recommandations")
  }

  if (!budget) {
    alerts.push('indiquer un budget maximum pour mieux classer les offres')
  }

  if (coverage === 'premium' && budget > 0 && budget < 15000) {
    alerts.push("le budget parait bas pour une couverture premium")
  }

  if (!preference?.insurance_type_id) {
    alerts.push("choisir un type d'assurance principal")
  }

  return alerts
}

export function summarizeOffer(offer) {
  const company = offer.company?.nom_compagnie || 'une compagnie'
  const type = offer.insurance_type?.nom || 'une assurance'
  const target = offer.who_can_subscribe || 'un public large'
  return `${offer.nom_assurance || type} est une offre de ${company} destinee a ${target}, avec un tarif principal de ${offer.prix} FCFA.`
}

export function compareOffers(offers) {
  if (!offers.length) return []

  const sortedByPrice = [...offers].sort((a, b) => Number(a.prix ?? 0) - Number(b.prix ?? 0))
  const sortedByProtection = [...offers].sort(
    (a, b) => String(b.avantages ?? '').length - String(a.avantages ?? '').length
  )
  const sortedByScore = [...offers].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))

  return [
    `Meilleur prix : ${sortedByPrice[0]?.nom_assurance || 'offre'} a ${sortedByPrice[0]?.prix || 0} FCFA.`,
    `Meilleure adequation globale : ${sortedByScore[0]?.nom_assurance || 'offre'} avec un score de ${sortedByScore[0]?.score || 0}/100.`,
    `Protection la plus mise en avant : ${sortedByProtection[0]?.nom_assurance || 'offre'}.`,
  ]
}

export function buildCompanyOfferInsights({ offerForm, insuranceTypeName }) {
  const suggestions = []
  const warnings = []

  if (!offerForm.nomAssurance?.trim()) {
    warnings.push("ajouter un nom d'assurance clair")
  }

  if (String(offerForm.description ?? '').trim().length < 40) {
    suggestions.push('allonger la description pour mieux expliquer la valeur de votre offre')
  }

  if (String(offerForm.avantages ?? '').trim().length < 25) {
    suggestions.push('preciser davantage les avantages pour rassurer les clients')
  }

  if (!String(offerForm.paymentMethods ?? '').trim()) {
    warnings.push('indiquer au moins un mode de contact')
  }

  if (!String(offerForm.whoCanSubscribe ?? '').trim()) {
   warnings.push('preciser le public concerne')
  }

  if (insuranceTypeName) {
    suggestions.push(`mettre en avant les besoins specifiques lies au type ${insuranceTypeName}`)
  }

  return { suggestions, warnings }
}