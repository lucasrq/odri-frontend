import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Os valores vêm do .env.local (fora do Git). Na Vercel, ficam em Settings → Environment Variables.
const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !chave) {
  throw new Error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local')
}

// Conexão única com o Supabase (login, sessão e token) usada no app todo.
export const supabase = createClient(url, chave, {
  auth: {
    persistSession: true, // continua logado depois de fechar a aba
    autoRefreshToken: true, // renova o token antes de vencer
    detectSessionInUrl: true, // lê o link de confirmação de e-mail e o de nova senha
  },
})

/**
 * true se tem alguém logado neste navegador (a sessão fica guardada).
 * A página inicial usa pra trocar "Entrar / Começar grátis" por "Abrir o app".
 */
export function useLogado() {
  const [logado, setLogado] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => setLogado(!!sessao))
    return () => data.subscription.unsubscribe()
  }, [])
  return logado
}
