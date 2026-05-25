import { supabase } from './supabase'

export function parseListField(value) {
  return String(value ?? '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildInsuranceNumber() {
  return `ASS-${Date.now()}`
}

function buildReceiptNumber() {
  return `REC-${Date.now()}`
}

export async function fetchInsuranceTypes() {
  const { data, error } = await supabase
    .from('insurance_type')
    .select('id, nom, description')
    .order('nom', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createInsuranceType({ nom, description }) {
  const { data, error } = await supabase
    .from('insurance_type')
    .insert({
      nom,
      description: description || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchAllOffers() {
  const { data, error } = await supabase
    .from('insurance_offer')
    .select(
      `
        id,
        nom_assurance,
        prix,
        description,
        who_can_subscribe,
        avantages,
        tarifs_ttc,
        payment_methods,
        company:company_id (
          id,
          nom_compagnie,
          location
        ),
        insurance_type:insurance_type_id (
          id,
          nom,
          description
        )
      `
    )
    .order('id', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchOfferById(offerId) {
  const { data, error } = await supabase
    .from('insurance_offer')
    .select(
      `
        id,
        nom_assurance,
        prix,
        description,
        who_can_subscribe,
        avantages,
        tarifs_ttc,
        payment_methods,
        company:company_id (
          id,
          nom_compagnie,
          location
        ),
        insurance_type:insurance_type_id (
          id,
          nom,
          description
        )
      `
    )
    .eq('id', offerId)
    .single()

  if (error) throw error
  return data
}

export async function fetchOfferRecommendations({
  insuranceTypeId,
  budgetMax,
  preferredLocation,
  niveauCouverture,
  priority,
}) {
  const offers = await fetchAllOffers()
  const numericBudget = budgetMax ? Number(budgetMax) : null
  const normalizedCoverage = (niveauCouverture ?? '').toLowerCase()
  const normalizedPriority = (priority ?? '').toLowerCase()
  const normalizedLocation = (preferredLocation ?? '').trim().toLowerCase()

  const scored = offers
    .filter((offer) => !insuranceTypeId || offer.insurance_type?.id === insuranceTypeId)
    .map((offer) => {
      let score = 0
      const reasons = []
      const price = Number(offer.prix ?? 0)
      const description = [
        offer.description,
        offer.avantages,
        offer.who_can_subscribe,
        offer.tarifs_ttc,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const companyLocation = (offer.company?.location ?? '').trim().toLowerCase()

      if (insuranceTypeId && offer.insurance_type?.id === insuranceTypeId) {
        score += 45
        reasons.push("correspond au type d'assurance recherche")
      }

      if (numericBudget) {
        if (price <= numericBudget) {
          score += 25
          reasons.push('respecte le budget indique')
        } else {
          const gap = price - numericBudget
          const penalty = Math.min(20, Math.round((gap / numericBudget) * 20))
          score -= penalty
          reasons.push('depasse partiellement le budget')
        }
      }

      if (normalizedLocation && companyLocation && companyLocation.includes(normalizedLocation)) {
        score += 10
        reasons.push('est disponible dans la localisation souhaitee')
      }

      if (normalizedCoverage) {
        if (description.includes(normalizedCoverage)) {
          score += 10
          reasons.push('mentionne un niveau de couverture proche de votre besoin')
        } else if (normalizedCoverage === 'premium') {
          score += 5
          reasons.push('peut convenir a une recherche de couverture etendue')
        }
      }

      if (normalizedPriority === 'economique') {
        if (numericBudget && price <= numericBudget * 0.8) {
          score += 10
          reasons.push('offre economique par rapport au budget')
        }
      }

      if (normalizedPriority === 'equilibre') {
        score += 7
        reasons.push('offre presentant un compromis simple entre budget et couverture')
      }

      if (normalizedPriority === 'protection') {
        if ((offer.avantages ?? '').length > 20) {
          score += 10
          reasons.push('met en avant plusieurs avantages de protection')
        }
      }

      return {
        ...offer,
        score: Math.max(0, Math.min(100, score)),
        reasons,
      }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 3)
}

export async function fetchCompanyOffers(companyId) {
  const { data, error } = await supabase
    .from('insurance_offer')
    .select(
      `
        id,
        nom_assurance,
        prix,
        description,
        who_can_subscribe,
        avantages,
        tarifs_ttc,
        payment_methods,
        insurance_type:insurance_type_id (
          id,
          nom,
          description
        )
      `
    )
    .eq('company_id', companyId)
    .order('id', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createOffer({
  companyId,
  insuranceTypeId,
  nomAssurance,
  prix,
  description,
  whoCanSubscribe,
  avantages,
  tarifsTtc,
  paymentMethods,
}) {
  const { data, error } = await supabase
    .from('insurance_offer')
    .insert({
      company_id: companyId,
      insurance_type_id: insuranceTypeId,
      nom_assurance: nomAssurance,
      prix,
      description,
      who_can_subscribe: whoCanSubscribe,
      avantages,
      tarifs_ttc: tarifsTtc,
      payment_methods: paymentMethods,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteOffer(offerId) {
  const { error } = await supabase.from('insurance_offer').delete().eq('id', offerId)
  if (error) throw error
}

export async function createSubscription({
  clientId,
  insuranceOfferId,
  nom,
  prenom,
  age,
  email,
  telephone,
  adresse,
  paymentMethod,
  paidAmount,
}) {
  const insuranceNumber = buildInsuranceNumber()
  const receiptNumber = buildReceiptNumber()
  const finalMessage =
    "Rdv a l'agence la plus proche pour complement d'information avec votre recu de paiement pour la finalisation de la souscription."

  const { data, error } = await supabase
    .from('insurance_subscription')
    .insert({
      client_id: clientId,
      insurance_offer_id: insuranceOfferId,
      nom,
      prenom,
      age,
      email,
      telephone,
      adresse,
      payment_method: paymentMethod,
      paid_amount: paidAmount,
      insurance_number: insuranceNumber,
      receipt_number: receiptNumber,
      receipt_message: finalMessage,
      status: 'paid',
    })
    .select(
      `
        id,
        nom,
        prenom,
        age,
        email,
        telephone,
        adresse,
        payment_method,
        paid_amount,
        insurance_number,
        receipt_number,
        receipt_message,
        created_at,
        insurance_offer:insurance_offer_id (
          id,
          nom_assurance,
          prix,
          company:company_id (
            id,
            nom_compagnie,
            location
          )
        )
      `
    )
    .single()

  if (error) throw error
  return data
}

export async function fetchClientSubscriptions(clientId) {
  const { data, error } = await supabase
    .from('insurance_subscription')
    .select(
      `
        id,
        payment_method,
        paid_amount,
        insurance_number,
        receipt_number,
        receipt_message,
        status,
        created_at,
        insurance_offer:insurance_offer_id (
          id,
          nom_assurance,
          prix,
          company:company_id (
            id,
            nom_compagnie,
            location
          ),
          insurance_type:insurance_type_id (
            id,
            nom
          )
        )
      `
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchCompanySubscriptions(companyId) {
  const { data, error } = await supabase
    .from('insurance_subscription')
    .select(
      `
        id,
        nom,
        prenom,
        email,
        telephone,
        adresse,
        payment_method,
        paid_amount,
        insurance_number,
        receipt_number,
        receipt_message,
        status,
        created_at,
        insurance_offer:insurance_offer_id (
          id,
          nom_assurance,
          prix,
          company_id,
          insurance_type:insurance_type_id (
            id,
            nom
          )
        )
      `
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).filter((item) => item.insurance_offer?.company_id === companyId)
}