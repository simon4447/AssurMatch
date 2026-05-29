import { supabase } from './supabase'

function buildThreadKey(message, currentAccountId) {
  const otherId =
    message.sender_id === currentAccountId ? message.receiver_id : message.sender_id
  return `${message.insurance_offer_id}-${otherId}`
}

function formatIdentity({ account, client, company }) {
  if (company?.nom_compagnie) {
    return {
      role: 'company',
      label: company.nom_compagnie,
      detail: account?.email ?? null,
    }
  }

  const clientName = [client?.prenom, client?.nom].filter(Boolean).join(' ').trim()
  if (clientName) {
    return {
      role: 'client',
      label: clientName,
      detail: account?.email ?? null,
    }
  }

  return {
    role: account?.role ?? null,
    label: account?.email ?? 'Utilisateur',
    detail: null,
  }
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
        offerId: message.insurance_offer_id,
        otherParty,
        otherAccountId,
        lastMessage: message,
      })
    }
  })

  const threads = Array.from(map.values())

  return Promise.all(
    threads.map(async (thread) => {
      try {
        const otherIdentity = await fetchAccountIdentity(thread.otherAccountId)
        return {
          ...thread,
          otherIdentity,
        }
      } catch {
        return thread
      }
    })
  )
}

export async function fetchUnreadMessageCount(accountId) {
  if (!accountId) {
    return 0
  }

  const { count, error } = await supabase
    .from('message')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', accountId)
    .eq('lu', false)

  if (error) throw error
  return count ?? 0
}

export async function fetchAccountIdentity(accountId) {
  if (!accountId) {
    return null
  }

  const { data: account, error: accountError } = await supabase
    .from('account')
    .select('id, email, role')
    .eq('id', accountId)
    .maybeSingle()

  if (accountError) throw accountError

  const { data: company } = await supabase
    .from('company')
    .select('id, nom_compagnie, location')
    .eq('account_id', accountId)
    .maybeSingle()

  const { data: client } = await supabase
    .from('client')
    .select('id, nom, prenom, telephone, location')
    .eq('account_id', accountId)
    .maybeSingle()

  return {
    account,
    client,
    company,
    ...formatIdentity({ account, client, company }),
  }
}

export async function resolveConversationParticipant({ currentAccountId, offerId }) {
  if (!currentAccountId || !offerId) {
    return null
  }

  const { data, error } = await supabase
    .from('message')
    .select('sender_id, receiver_id')
    .eq('insurance_offer_id', offerId)
    .or(`sender_id.eq.${currentAccountId},receiver_id.eq.${currentAccountId}`)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error

  const message = data?.[0]
  if (!message) {
    return null
  }

  return message.sender_id === currentAccountId
    ? message.receiver_id
    : message.sender_id
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

export async function markConversationMessagesAsRead({ currentAccountId, otherAccountId, offerId }) {
  if (!currentAccountId || !otherAccountId || !offerId) {
    return
  }

  const { error } = await supabase
    .from('message')
    .update({ lu: true })
    .eq('insurance_offer_id', offerId)
    .eq('sender_id', otherAccountId)
    .eq('receiver_id', currentAccountId)
    .eq('lu', false)

  if (error) throw error
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