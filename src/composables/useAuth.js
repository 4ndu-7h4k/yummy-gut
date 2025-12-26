import { ref, computed } from 'vue'
import { supabase } from '@/config/supabase'
import { useRouter } from 'vue-router'

const user = ref(null)
const loading = ref(true)

// Initialize auth state
export const initAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
  } catch (error) {
    console.error('Error initializing auth:', error)
    user.value = null
  } finally {
    loading.value = false
  }
}

// Set up auth state listener
export const setupAuthListener = (router) => {
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
    
    if (event === 'SIGNED_OUT' && router) {
      router.push('/login')
    }
  })
}

export function useAuth() {
  const router = useRouter()

  // Sign in with email/password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    user.value = data.user
    return data
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    user.value = null
    router.push('/login')
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value)

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    signIn,
    signOut,
  }
}

