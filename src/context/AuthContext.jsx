import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(undefined) // undefined = ainda não sabemos
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null)
    })

    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => assinatura.subscription.unsubscribe()
  }, [])

  const entrar = async (email, senha) => {
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro(traduzirErro(error.message))
      return false
    }
    return true
  }

  const sair = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider
      value={{ usuario, carregandoSessao: usuario === undefined, entrar, sair, erro, setErro }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function traduzirErro(mensagem) {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (mensagem.includes('Email not confirmed')) return 'E-mail ainda não confirmado.'
  return 'Não foi possível entrar. Tente novamente.'
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
