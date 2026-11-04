import { supabase } from './supabase'

// Endereço do nosso back-end (Spring). Local: http://localhost:8080.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/** Erro com o código HTTP, para a tela decidir o que fazer (ex.: 404 = sem cadastro). */
export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem)
  }
}

/**
 * Chama o back-end levando a "pulseira" (token do Supabase) no cabeçalho.
 * status 0 = não conseguiu nem falar com o servidor (desligado ou sem internet).
 */
export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  let resposta: Response
  try {
    resposta = await fetch(BASE + caminho, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    })
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor')
  }

  if (!resposta.ok) throw new ErroApi(resposta.status, `Erro ${resposta.status} em ${caminho}`)
  if (resposta.status === 204) return undefined as T
  return resposta.json() as Promise<T>
}
