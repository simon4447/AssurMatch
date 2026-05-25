import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import ThemedLoader from '../components/ThemedLoader'
import { useUser } from '../hooks/useUser'

const Home = () => {
  const router = useRouter()
  const { user, authChecked } = useUser()

  useEffect(() => {
    if (!authChecked) return
    router.replace(user ? '/profile' : '/login')
  }, [authChecked, router, user])

  return <ThemedLoader />
}

export default Home