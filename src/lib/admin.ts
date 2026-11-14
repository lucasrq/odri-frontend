import { api, ErroApi } from './api'
import type { FaixaPreco, Genero, LojaParceira } from './loja'

/** Perfume com tudo, só pro admin (PerfumeAdminDTO do back-end). */
export type PerfumeAdmin = {
  id: number
  nome: string
  marca: string
  familia: string | null
  intensidade: string | null
  clima: string | null
  genero: Genero | null
  faixa: FaixaPreco | null
  loja: LojaParceira | null
  link: string | null
  status: 'PENDENTE' | 'APROVADO'
  criadoEm: string
}

/** O que o admin salva. link "" = tira da Loja; campo ausente = não mexe. */
export type Classificacao = {
  familia: string
  intensidade: string
  clima: string
  genero?: Genero
  faixa?: FaixaPreco
  loja?: LojaParceira
  link?: string
}

export const NOME_CLIMA: Record<string, string> = { CALOR: 'Calor', FRIO: 'Frio', TODOS: 'Qualquer clima' }

/** Só o admin recebe 200 em /admin/**; o resto recebe 403. */
export async function ehAdmin() {
  try {
    await api('/admin/pendentes')
    return true
  } catch (e) {
    if (e instanceof ErroApi && (e.status === 403 || e.status === 401)) return false
    throw e
  }
}

export const listarPendentes = () => api<PerfumeAdmin[]>('/admin/pendentes')

export const listarCatalogoAdmin = (busca: string) =>
  api<PerfumeAdmin[]>(`/admin/perfumes?busca=${encodeURIComponent(busca.trim())}`)

export const salvarPerfume = (id: number, dados: Classificacao) =>
  api<PerfumeAdmin>(`/admin/perfumes/${id}`, { method: 'PATCH', body: JSON.stringify(dados) })

export const recusarPerfume = (id: number) => api<void>(`/admin/perfumes/${id}`, { method: 'DELETE' })
