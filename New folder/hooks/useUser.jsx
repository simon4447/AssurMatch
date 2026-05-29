import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

async function ensureUserRecords(sessionUser) {
  if (!sessionUser) return

  const metadata = sessionUser.user_metadata ?? {}
  const metadataRole = metadata.role ?? null

  const { data: accountRow, error: accountError } = await supabase
    .from('account')
    .select('id, role')
    .eq('id', sessionUser.id)
    .maybeSingle()

  if (accountError) throw accountError

  if (!accountRow && metadataRole) {
    const { error: accountInsertError } = await supabase.from('account').insert({
      id: sessionUser.id,
      email: sessionUser.email,
      role: metadataRole,
    })

    if (accountInsertError) throw accountInsertError
  }

  const effectiveRole = accountRow?.role ?? metadataRole

  if (effectiveRole === 'client') {
    const { data: clientRow, error: clientError } = await supabase
      .from('client')
      .select('id')
      .eq('account_id', sessionUser.id)
      .maybeSingle()

    if (clientError) throw clientError

    if (!clientRow) {
      const { error: clientInsertError } = await supabase.from('client').insert({
        account_id: sessionUser.id,
        nom: metadata.nom ?? '',
        prenom: metadata.prenom ?? '',
        telephone: metadata.telephone ?? null,
        age: metadata.age ?? null,
        location: metadata.location ?? null,
      })

      if (clientInsertError) throw clientInsertError
    }
  }

  if (effectiveRole === 'company') {
    const { data: companyRow, error: companyError } = await supabase
      .from('company')
      .select('id')
      .eq('account_id', sessionUser.id)
      .maybeSingle()

    if (companyError) throw companyError

    if (!companyRow) {
      const { error: companyInsertError } = await supabase.from('company').insert({
        account_id: sessionUser.id,
        nom_compagnie: metadata.nom_compagnie ?? '',
        location: metadata.location ?? null,
      })

      if (companyInsertError) throw companyInsertError
    }
  }
}

async function fetchProfileForUser(userId) {
    const { data: accountRow, error: accountError } = await supabase
    .from('account')
    .select('id, email, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (accountError) throw accountError

  const accountRole = accountRow?.role ?? null

  if (accountRole === 'client') {
    const { data: clientProfile, error: clientError } = await supabase
      .from('client')
      .select('*')
      .eq('account_id', userId)
      .maybeSingle()

    if (clientError) throw clientError

    return {
      account: accountRow,
      role: 'client',
      profile: clientProfile,
    }
  }

  if (accountRole === 'company') {
    const { data: companyProfile, error: companyError } = await supabase
      .from('company')
      .select('*')
      .eq('account_id', userId)
      .maybeSingle()

    if (companyError) throw companyError

    return {
      account: accountRow,
      role: 'company',
      profile: companyProfile,
    }
  }

  const { data: clientProfile, error: clientError } = await supabase
    .from('client')
    .select('*')
    .eq('account_id', userId)
    .maybeSingle()

  if (clientError) throw clientError
  if (clientProfile) {
      return {
      account: accountRow,
      role: 'client',
      profile: clientProfile,
    }
  }

  const { data: companyProfile, error: companyError } = await supabase
    .from('company')
    .select('*')
    .eq('account_id', userId)
    .maybeSingle()

  if (companyError) throw companyError
  if (companyProfile) {
     return {
      account: accountRow,
      role: 'company',
      profile: companyProfile,
    }
  }

    return {
    account: accountRow,
    role: accountRole,
    profile: null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const syncUserState = async (sessionUser) => {
    setUser(sessionUser ?? null)

    if (!sessionUser) {
      setAccount(null)
      setProfile(null)
      setRole(null)
      setAuthChecked(true)
      return
    }

    try {
      await ensureUserRecords(sessionUser)
      const {
        account: nextAccount,
        role: nextRole,
        profile: nextProfile,
      } = await fetchProfileForUser(sessionUser.id)

      setAccount(nextAccount)
      setRole(nextRole)
      setProfile(nextProfile)
    } catch (error) {
      console.warn('Impossible de charger le profil utilisateur :', error.message)
      setAccount(null)
      setRole(null)
      setProfile(null)
    }

    setAuthChecked(true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await syncUserState(session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncUserState(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const register = async (email, password, role, extraData) => {
    if (!role) {
      throw new Error("Veuillez choisir un type de compte avant l'inscription.")
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          nom: extraData.nom ?? null,
          prenom: extraData.prenom ?? null,
          nom_compagnie: extraData.nom_compagnie ?? null,
          telephone: extraData.telephone ?? null,
          age: extraData.age ?? null,
          location: extraData.location ?? null,
        },
      },
    })
    if (error) throw error

    const userId = data.user.id
    if (!userId) {
      throw new Error("Le compte a ete cree, mais l'identifiant utilisateur est introuvable.")
    }

   /**  const { error: accountError } = await supabase
    .from('account')
    .insert({
      id: userId,
      email,
      role,
    })
       await ensureUserRecords(data.user)
    if (accountError) throw accountError
**/
  await ensureUserRecords(data.user)


    await syncUserState(data.user)
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (!user) return
     const {
      account: nextAccount,
      role: nextRole,
      profile: nextProfile,
    } = await fetchProfileForUser(user.id)

    setAccount(nextAccount)
    setRole(nextRole)
    setProfile(nextProfile)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        profile,
        role,
        authChecked,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useUser must be used inside AuthProvider')
  }

  return context
}