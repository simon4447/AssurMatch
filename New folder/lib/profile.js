import { supabase } from './supabase'

export async function updateClientProfile(clientId, payload) {
  const { data, error } = await supabase
    .from('client')
    .update(payload)
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCompanyProfile(companyId, payload) {
  const { data, error } = await supabase
    .from('company')
    .update(payload)
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchLatestClientPreference(clientId) {
  const { data, error } = await supabase
    .from('client_preference')
    .select('*')
    .eq('client_id', clientId)
    .order('id', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] ?? null
}

export async function saveClientPreference({
  clientId,
  insuranceTypeId,
  budgetMax,
  niveauCouverture,
}) {
  const existing = await fetchLatestClientPreference(clientId)

  if (existing?.id) {
    const { data, error } = await supabase
      .from('client_preference')
      .update({
        insurance_type_id: insuranceTypeId,
        budget_max: budgetMax,
        niveau_couverture: niveauCouverture,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('client_preference')
    .insert({
      client_id: clientId,
      insurance_type_id: insuranceTypeId,
      budget_max: budgetMax,
      niveau_couverture: niveauCouverture,
    })
    .select()
    .single()

  if (error) throw error
  return data
}