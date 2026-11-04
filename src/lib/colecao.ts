import { api, ErroApi } from './api'

/** Resultado da busca de perfumes (PerfumeResumoDTO). */
export type PerfumeResumo = { id: number; nome: string; marca: string }

/** Um perfume da coleção (ItemColecaoDTO). pendente = ainda em análise pelo admin. */
export type ItemColecao = PerfumeResumo & { pendente: boolean }

export const buscarPerfumes = (texto: string) =>
  api<PerfumeResumo[]>(`/perfumes?busca=${encodeURIComponent(texto)}`)

export const listarColecao = () => api<ItemColecao[]>('/colecao')

export const adicionarNaColecao = (perfumeId: number) =>
  api<ItemColecao>(`/colecao/${perfumeId}`, { method: 'POST' })

export const tirarDaColecao = (perfumeId: number) =>
  api<void>(`/colecao/${perfumeId}`, { method: 'DELETE' })

/** Perfume que não está no catálogo: entra como pendente e o admin classifica. */
export const sugerirPerfume = (nome: string, marca: string) =>
  api<PerfumeResumo>('/perfumes/pendentes', { method: 'POST', body: JSON.stringify({ nome, marca }) })

/** Traduz os erros da coleção para frases da tela. */
export function mensagemColecao(e: unknown) {
  if (e instanceof ErroApi) {
    if (e.status === 0) return 'Sem conexão com a odri. Tente de novo.'
    if (e.status === 403) return 'No plano grátis cabem até 8 perfumes.'
    if (e.status === 429) return 'Você já sugeriu 5 perfumes novos hoje. Amanhã libera de novo.'
  }
  return 'Algo deu errado. Tente de novo.'
}
