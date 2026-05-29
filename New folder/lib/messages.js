import { supabase } from './supabase'

function buildThreadKey(message, currentAccountId) {
  const otherId =
    message.sender_id === currentAccountId ? message.receiver_id : message.sender_id
  return `${message.insurance_offer_id}-${otherId}`
}

export async function fetchUserThreads(currentAccountId) {
  const { data, error } = await supabase
    .from('message')
    .select(
      `
        id,
        sender_id,
        receiver_id,
        insurance_offer_id,
        contenu,
        lu,
        created_at,
        sender:sender_id (
          id,
          email,
          role
        ),
        receiver:receiver_id (
          id,
          email,
          role
        ),
        offer:insurance_offer_id (
          id,
          nom_assurance,
          company:company_id (
            id,
            nom_compagnie,
            account_id
          )
        )
      `
    )
    .or(`sender_id.eq.${currentAccountId},receiver_id.eq.${currentAccountId}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  const map = new Map()
  ;(data ?? []).forEach((message) => {
    const key = buildThreadKey(message, currentAccountId)
    if (!map.has(key)) {
      const otherParty =
        message.sender_id === currentAccountId ? message.receiver : message.sender
          const otherAccountId =
        message.sender_id === currentAccountId ? message.receiver_id : message.sender_id

      map.set(key, {
        key,
        offer: message.offer,
        otherParty,
        otherAccountId,
        lastMessage: message,
      })
    }
  })

  return Array.from(map.values())
}

export async function fetchConversationMessages({ currentAccountId, otherAccountId, offerId }) {
  const { data, error } = await supabase
    .from('message')
    .select(
      `
        id,
        sender_id,
        receiver_id,
        insurance_offer_id,
        contenu,
        lu,
        created_at,
        sender:sender_id (
          id,
          email,
          role
        ),
        receiver:receiver_id (
          id,
          email,
          role
        )
      `
    )
    .eq('insurance_offer_id', offerId)
    .or(
      `and(sender_id.eq.${currentAccountId},receiver_id.eq.${otherAccountId}),and(sender_id.eq.${otherAccountId},receiver_id.eq.${currentAccountId})`
    )
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function sendMessage({
  senderId,
  receiverId,
  offerId,
  contenu,
}) {
  const { data, error } = await supabase
    .from('message')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      insurance_offer_id: offerId,
      contenu,
      lu: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}