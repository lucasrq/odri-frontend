import { api, ErroApi } from './api'
import { supabase } from './supabase'

/** Que perfume a pessoa usa. Decide o gênero das dicas e o filtro inicial da Loja. */
export type Preferencia = 'MASCULINO' | 'FEMININO' | 'OS_DOIS'

export const PREFERENCIAS: [Preferencia, string][] = [
  ['MASCULINO', 'Masculino'], ['FEMININO', 'Feminino'], ['OS_DOIS', 'Os dois'],
]

/** O que GET /clientes/eu devolve (ClienteDTO do back-end). */
export type Cliente = {
  id: string
  nome: string
  plus: boolean
  cidade: string | null
  preferencia: Preferencia | null // null = conta antiga que ainda não respondeu
}

/**
 * Marca (neste aparelho) que a pessoa já passou pela tela "Começar".
 * Assim, coleção vazia depois disso mostra o painel vazio, e não o passo a passo de novo.
 */
const chaveComecou = (id: string) => `odri-comecou-${id}`

export function jaComecou(id: string) {
  try {
    return localStorage.getItem(chaveComecou(id)) === '1'
  } catch {
    return false
  }
}

export function marcarComecou(id: string) {
  try {
    localStorage.setItem(chaveComecou(id), '1')
  } catch {
    // aba anônima: no pior caso, mostra o passo a passo de novo
  }
}

/** PUT /clientes/eu/nome: muda o nome e devolve o cliente atualizado. */
export function mudarNome(nome: string) {
  return api<Cliente>('/clientes/eu/nome', { method: 'PUT', body: JSON.stringify({ nome }) })
}

/** PUT /clientes/eu/preferencia: masculino, feminino ou os dois. */
export function mudarPreferencia(preferencia: Preferencia) {
  return api<Cliente>('/clientes/eu/preferencia', { method: 'PUT', body: JSON.stringify({ preferencia }) })
}

/**
 * LGPD: apaga a conta e tudo da pessoa (DELETE /clientes/eu).
 * Depois limpa o que ficou neste aparelho. O signOut é "local" porque o login
 * já não existe mais no Supabase (o "global" daria erro).
 */
export async function apagarConta(id: string) {
  await api<void>('/clientes/eu', { method: 'DELETE' })
  try {
    localStorage.removeItem(chaveComecou(id))
  } catch {
    // aba anônima: nada guardado
  }
  await supabase.auth.signOut({ scope: 'local' })
}

/**
 * Depois do login: busca o perfil no nosso back-end.
 * Na primeira vez ele não existe (404), então cria com o nome e o aceite
 * que a pessoa preencheu na tela Criar conta (guardados na conta do Supabase).
 */
export async function garantirCadastro(): Promise<Cliente> {
  try {
    return await api<Cliente>('/clientes/eu')
  } catch (e) {
    if (!(e instanceof ErroApi) || e.status !== 404) throw e
  }

  const { data } = await supabase.auth.getUser()
  const dados = data.user?.user_metadata ?? {}
  const email = data.user?.email ?? ''

  return api<Cliente>('/clientes', {
    method: 'POST',
    body: JSON.stringify({
      nome: (dados.nome as string | undefined)?.trim() || email.split('@')[0],
      aceitouTermos: dados.aceitou_termos === true,
      preferencia: PREFERENCIAS.some(([v]) => v === dados.preferencia) ? dados.preferencia : null,
    }),
  })
}
